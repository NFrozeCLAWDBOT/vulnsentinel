import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME;
const NVD_API_KEY = process.env.NVD_API_KEY || "";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, headers = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 503 || res.status === 429) {
        console.log(`Rate limited (${res.status}), waiting 10s...`);
        await sleep(10000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Fetch error (attempt ${i + 1}): ${err.message}, retrying...`);
      await sleep(5000);
    }
  }
}

async function fetchKevData() {
  console.log("Fetching CISA KEV catalog...");
  const data = await fetchWithRetry(
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
  );
  const kevMap = new Map();
  for (const vuln of data.vulnerabilities || []) {
    kevMap.set(vuln.cveID, {
      kevDateAdded: vuln.dateAdded || null,
      kevDueDate: vuln.dueDate || null,
      knownRansomware: vuln.knownRansomwareCampaignUse || "Unknown",
    });
  }
  console.log(`KEV catalog loaded: ${kevMap.size} entries`);
  return kevMap;
}

function extractCvss(metrics) {
  const v31 = metrics?.cvssMetricV31?.[0]?.cvssData;
  if (v31) return { score: v31.baseScore || 0, severity: v31.baseSeverity || "NONE" };
  const v30 = metrics?.cvssMetricV30?.[0]?.cvssData;
  if (v30) return { score: v30.baseScore || 0, severity: v30.baseSeverity || "NONE" };
  const v2 = metrics?.cvssMetricV2?.[0]?.cvssData;
  if (v2) {
    const score = v2.baseScore || 0;
    let severity = "NONE";
    if (score >= 9.0) severity = "CRITICAL";
    else if (score >= 7.0) severity = "HIGH";
    else if (score >= 4.0) severity = "MEDIUM";
    else if (score > 0) severity = "LOW";
    return { score, severity };
  }
  return { score: 0, severity: "NONE" };
}

function extractCwe(weaknesses) {
  if (!weaknesses?.length) return { cweId: "NVD-CWE-noinfo", cweName: "Insufficient Information" };
  const desc = weaknesses[0]?.description;
  if (!desc?.length) return { cweId: "NVD-CWE-noinfo", cweName: "Insufficient Information" };
  return { cweId: desc[0].value || "NVD-CWE-noinfo", cweName: "" };
}

function extractVendorProduct(configurations, cpe) {
  // Try CPE match from configurations
  if (configurations?.length) {
    for (const config of configurations) {
      for (const node of config.nodes || []) {
        for (const match of node.cpeMatch || []) {
          if (match.criteria) {
            const parts = match.criteria.split(":");
            if (parts.length >= 5) {
              return {
                vendor: parts[3]?.replace(/_/g, " ") || "unknown",
                product: parts[4]?.replace(/_/g, " ") || "unknown",
              };
            }
          }
        }
      }
    }
  }
  return { vendor: "unknown", product: "unknown" };
}

function buildCveItem(cve, kevMap) {
  const cveId = cve.id;
  const { score, severity } = extractCvss(cve.metrics);
  const { cweId, cweName } = extractCwe(cve.weaknesses);
  const { vendor, product } = extractVendorProduct(cve.configurations);
  const kevData = kevMap.get(cveId);
  const descriptions = cve.descriptions || [];
  const enDesc = descriptions.find((d) => d.lang === "en")?.value || "";
  const refs = (cve.references || []).map((r) => r.url).filter(Boolean);

  return {
    cveId,
    vendor,
    product,
    cweId,
    cweName,
    cvssScore: score,
    cvssSeverity: severity,
    isKev: kevData ? "TRUE" : "FALSE",
    kevDateAdded: kevData?.kevDateAdded || "N/A",
    kevDueDate: kevData?.kevDueDate || null,
    knownRansomware: kevData?.knownRansomware || "Unknown",
    description: enDesc.substring(0, 2000),
    publishedDate: cve.published || "",
    lastModifiedDate: cve.lastModified || "",
    references: refs.slice(0, 10),
  };
}

async function batchWriteItems(items) {
  const BATCH_SIZE = 25;
  let written = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const requestItems = batch.map((item) => ({
      PutRequest: { Item: item },
    }));

    try {
      let unprocessed = { [TABLE_NAME]: requestItems };
      let retries = 0;

      while (unprocessed[TABLE_NAME]?.length > 0 && retries < 5) {
        const result = await docClient.send(
          new BatchWriteCommand({ RequestItems: unprocessed })
        );
        unprocessed = result.UnprocessedItems || {};
        if (unprocessed[TABLE_NAME]?.length > 0) {
          retries++;
          await sleep(1000 * retries);
        }
      }
      written += batch.length;
    } catch (err) {
      console.error(`Batch write error at index ${i}: ${err.message}`);
    }
  }
  return written;
}

async function fetchNvdWindow(startDate, endDate, kevMap) {
  const baseUrl = "https://services.nvd.nist.gov/rest/json/cves/2.0";
  const headers = NVD_API_KEY ? { apiKey: NVD_API_KEY } : {};
  let startIndex = 0;
  let totalResults = 0;
  let allItems = [];

  console.log(`Fetching NVD CVEs: ${startDate} to ${endDate}`);

  do {
    const url = `${baseUrl}?pubStartDate=${startDate}T00:00:00.000&pubEndDate=${endDate}T23:59:59.999&startIndex=${startIndex}&resultsPerPage=2000`;
    const data = await fetchWithRetry(url, headers);
    totalResults = data.totalResults || 0;
    const vulnerabilities = data.vulnerabilities || [];

    for (const entry of vulnerabilities) {
      if (entry.cve) {
        allItems.push(buildCveItem(entry.cve, kevMap));
      }
    }

    startIndex += vulnerabilities.length;
    console.log(`  Fetched ${startIndex}/${totalResults} CVEs`);

    if (startIndex < totalResults) {
      await sleep(NVD_API_KEY ? 700 : 6500);
    }
  } while (startIndex < totalResults);

  return allItems;
}

function getDateWindows(startDate, endDate, windowDays = 119) {
  const windows = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    const windowEnd = new Date(current);
    windowEnd.setDate(windowEnd.getDate() + windowDays);
    if (windowEnd > end) windowEnd.setTime(end.getTime());

    windows.push({
      start: current.toISOString().split("T")[0],
      end: windowEnd.toISOString().split("T")[0],
    });

    current = new Date(windowEnd);
    current.setDate(current.getDate() + 1);
  }
  return windows;
}

export const handler = async (event) => {
  console.log("Starting VulnSentinel sync...");
  const startTime = Date.now();

  try {
    const kevMap = await fetchKevData();

    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const endDate = now.toISOString().split("T")[0];
    const startDate = twoYearsAgo.toISOString().split("T")[0];

    const windows = getDateWindows(startDate, endDate);
    console.log(`Processing ${windows.length} date windows`);

    let totalProcessed = 0;
    let totalWritten = 0;
    let kevMatches = 0;

    for (const window of windows) {
      const items = await fetchNvdWindow(window.start, window.end, kevMap);
      totalProcessed += items.length;
      kevMatches += items.filter((i) => i.isKev === "TRUE").length;

      if (items.length > 0) {
        const written = await batchWriteItems(items);
        totalWritten += written;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary = {
      totalProcessed,
      totalWritten,
      kevMatches,
      durationSeconds: duration,
    };
    console.log("Sync complete:", JSON.stringify(summary));
    return { statusCode: 200, body: JSON.stringify(summary) };
  } catch (err) {
    console.error("Sync failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
