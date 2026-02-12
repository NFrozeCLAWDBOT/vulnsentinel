import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME;
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

function respond(statusCode, body, extraHeaders = {}) {
  const isString = typeof body === "string";
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": isString && extraHeaders["Content-Type"]
        ? extraHeaders["Content-Type"]
        : "application/json",
      ...extraHeaders,
    },
    body: isString ? body : JSON.stringify(body),
  };
}

function decodeLastKey(encoded) {
  if (!encoded) return undefined;
  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
  } catch {
    return undefined;
  }
}

function encodeLastKey(lastKey) {
  if (!lastKey) return null;
  return Buffer.from(JSON.stringify(lastKey)).toString("base64");
}

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function scanAll(params) {
  const items = [];
  let lastKey = undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({ ...params, ExclusiveStartKey: lastKey })
    );
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function handleGetCves(queryParams) {
  const {
    vendor,
    severity,
    cweId,
    isKev,
    minCvss,
    maxCvss,
    search,
    product,
    limit: limitStr,
    lastKey: lastKeyParam,
  } = queryParams || {};

  const limit = Math.min(parseInt(limitStr) || 50, 200);
  const exclusiveStartKey = decodeLastKey(lastKeyParam);

  let params;
  let useQuery = false;

  if (vendor) {
    useQuery = true;
    params = {
      TableName: TABLE_NAME,
      IndexName: "vendor-index",
      KeyConditionExpression: "vendor = :v",
      ExpressionAttributeValues: { ":v": vendor.toLowerCase().replace(/_/g, " ") },
      ScanIndexForward: false,
      Limit: limit,
    };
  } else if (severity) {
    useQuery = true;
    params = {
      TableName: TABLE_NAME,
      IndexName: "severity-index",
      KeyConditionExpression: "cvssSeverity = :s",
      ExpressionAttributeValues: { ":s": severity.toUpperCase() },
      ScanIndexForward: false,
      Limit: limit,
    };
  } else if (cweId) {
    useQuery = true;
    params = {
      TableName: TABLE_NAME,
      IndexName: "cwe-index",
      KeyConditionExpression: "cweId = :c",
      ExpressionAttributeValues: { ":c": cweId },
      ScanIndexForward: false,
      Limit: limit,
    };
  } else if (isKev === "TRUE" || isKev === "true") {
    useQuery = true;
    params = {
      TableName: TABLE_NAME,
      IndexName: "kev-index",
      KeyConditionExpression: "isKev = :k",
      ExpressionAttributeValues: { ":k": "TRUE" },
      ScanIndexForward: false,
      Limit: limit,
    };
  } else {
    params = {
      TableName: TABLE_NAME,
      Limit: limit,
    };
  }

  if (exclusiveStartKey) {
    params.ExclusiveStartKey = exclusiveStartKey;
  }

  const result = useQuery
    ? await docClient.send(new QueryCommand(params))
    : await docClient.send(new ScanCommand(params));

  let items = result.Items || [];

  // Apply client-side filters
  if (product) {
    items = items.filter((i) =>
      i.product?.toLowerCase().includes(product.toLowerCase())
    );
  }
  if (minCvss) {
    items = items.filter((i) => (i.cvssScore || 0) >= parseFloat(minCvss));
  }
  if (maxCvss) {
    items = items.filter((i) => (i.cvssScore || 0) <= parseFloat(maxCvss));
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.cveId?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.vendor?.toLowerCase().includes(q) ||
        i.product?.toLowerCase().includes(q)
    );
  }

  return respond(200, {
    items,
    lastKey: encodeLastKey(result.LastEvaluatedKey),
    count: items.length,
  });
}

async function handleGetCveDetail(cveId) {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { cveId } })
  );

  if (!result.Item) {
    return respond(404, { error: "CVE not found" });
  }

  return respond(200, result.Item);
}

async function handleGetStats() {
  const allItems = await scanAll({
    TableName: TABLE_NAME,
    ProjectionExpression: "cveId, isKev, kevDateAdded, knownRansomware, cvssSeverity, vendor, cweId",
  });

  const totalCves = allItems.length;
  let totalKev = 0;
  let ransomwareCount = 0;
  const severityDist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
  const vendorCounts = {};
  const cweCounts = {};
  const kevByYear = {};

  for (const item of allItems) {
    if (item.isKev === "TRUE") {
      totalKev++;
      if (item.kevDateAdded && item.kevDateAdded !== "N/A") {
        const year = item.kevDateAdded.substring(0, 4);
        kevByYear[year] = (kevByYear[year] || 0) + 1;
      }
    }

    if (item.knownRansomware === "Known") {
      ransomwareCount++;
    }

    const sev = item.cvssSeverity || "NONE";
    severityDist[sev] = (severityDist[sev] || 0) + 1;

    if (item.vendor && item.vendor !== "unknown") {
      vendorCounts[item.vendor] = (vendorCounts[item.vendor] || 0) + 1;
    }

    if (item.cweId && item.cweId !== "NVD-CWE-noinfo") {
      cweCounts[item.cweId] = (cweCounts[item.cweId] || 0) + 1;
    }
  }

  const topVendors = Object.entries(vendorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topCwes = Object.entries(cweCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  const kevByYearSorted = Object.entries(kevByYear)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, count }));

  return respond(200, {
    totalCves,
    totalKev,
    ransomwareCount,
    severityDistribution: severityDist,
    topVendors,
    topCwes,
    kevByYear: kevByYearSorted,
  });
}

async function handleExport(queryParams) {
  const result = await handleGetCves({ ...queryParams, limit: "10000" });
  const body = JSON.parse(result.body);
  const items = body.items || [];

  const headers = [
    "CVE ID",
    "Vendor",
    "Product",
    "CVSS Score",
    "Severity",
    "KEV",
    "Ransomware",
    "CWE ID",
    "Published Date",
    "Description",
  ];

  let csv = headers.join(",") + "\n";

  for (const item of items) {
    csv +=
      [
        escapeCsv(item.cveId),
        escapeCsv(item.vendor),
        escapeCsv(item.product),
        escapeCsv(item.cvssScore),
        escapeCsv(item.cvssSeverity),
        escapeCsv(item.isKev),
        escapeCsv(item.knownRansomware),
        escapeCsv(item.cweId),
        escapeCsv(item.publishedDate),
        escapeCsv(item.description),
      ].join(",") + "\n";
  }

  return respond(200, csv, {
    "Content-Type": "text/csv",
    "Content-Disposition": 'attachment; filename="vulnsentinel-export.csv"',
  });
}

export const handler = async (event) => {
  const { httpMethod, path, resource, pathParameters, queryStringParameters } =
    event;

  if (httpMethod === "OPTIONS") {
    return respond(200, {});
  }

  try {
    // Route matching
    if (resource === "/api/stats" && httpMethod === "GET") {
      return await handleGetStats();
    }

    if (resource === "/api/export" && httpMethod === "GET") {
      return await handleExport(queryStringParameters || {});
    }

    if (resource === "/api/cves/{cveId}" && httpMethod === "GET") {
      const cveId = pathParameters?.cveId;
      if (!cveId) return respond(400, { error: "Missing cveId" });
      return await handleGetCveDetail(cveId);
    }

    if (resource === "/api/cves" && httpMethod === "GET") {
      return await handleGetCves(queryStringParameters || {});
    }

    return respond(404, { error: "Not found" });
  } catch (err) {
    console.error("Handler error:", err);
    return respond(500, { error: "Internal server error" });
  }
};
