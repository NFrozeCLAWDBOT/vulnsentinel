import { useState, useEffect, useCallback } from "react";
import type { CVE, CVESearchResult, DashboardStats } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardStats>("/api/stats")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

export interface CveSearchParams {
  vendor?: string;
  severity?: string;
  cweId?: string;
  isKev?: string;
  minCvss?: string;
  maxCvss?: string;
  search?: string;
  product?: string;
  limit?: string;
  lastKey?: string;
}

export function useCveSearch() {
  const [result, setResult] = useState<CVESearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: CveSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v) qs.set(k, v);
      }
      const data = await apiFetch<CVESearchResult>(`/api/cves?${qs}`);
      setResult(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, search };
}

export function useCveDetail(cveId: string | null) {
  const [cve, setCve] = useState<CVE | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cveId) return;
    setLoading(true);
    apiFetch<CVE>(`/api/cves/${cveId}`)
      .then(setCve)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cveId]);

  return { cve, loading, error };
}

export function getExportUrl(params: CveSearchParams) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  return `${API_URL}/api/export?${qs}`;
}
