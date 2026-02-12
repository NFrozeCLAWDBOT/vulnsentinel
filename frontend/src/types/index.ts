export interface CVE {
  cveId: string;
  vendor: string;
  product: string;
  cweId: string;
  cweName: string;
  cvssScore: number;
  cvssSeverity: string;
  isKev: string;
  kevDateAdded: string | null;
  kevDueDate: string | null;
  knownRansomware: string;
  description: string;
  publishedDate: string;
  lastModifiedDate: string;
  references: string[];
}

export interface CVESearchResult {
  items: CVE[];
  lastKey: string | null;
  count: number;
}

export interface DashboardStats {
  totalCves: number;
  totalKev: number;
  ransomwareCount: number;
  severityDistribution: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    NONE: number;
  };
  topVendors: { name: string; count: number }[];
  topCwes: { id: string; count: number }[];
  kevByYear: { year: string; count: number }[];
}
