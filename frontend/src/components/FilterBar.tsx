import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CveSearchParams } from "@/hooks/useApi";
import { getExportUrl } from "@/hooks/useApi";
import type { DashboardStats } from "@/types";

interface FilterBarProps {
  stats: DashboardStats | null;
  onFilter: (params: CveSearchParams) => void;
  currentParams: CveSearchParams;
}

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const severityButtonColors: Record<string, string> = {
  CRITICAL: "bg-ember-red/20 border-ember-red text-ember-red hover:bg-ember-red/30",
  HIGH: "bg-crimson-glow/20 border-crimson-glow text-crimson-glow hover:bg-crimson-glow/30",
  MEDIUM: "bg-bright-gold/20 border-bright-gold text-bright-gold hover:bg-bright-gold/30",
  LOW: "bg-dark-teal/20 border-dark-teal text-text-primary hover:bg-dark-teal/30",
};

export function FilterBar({ stats, onFilter, currentParams }: FilterBarProps) {
  const [vendor, setVendor] = useState(currentParams.vendor || "");
  const [cweId, setCweId] = useState(currentParams.cweId || "");
  const [showFilters, setShowFilters] = useState(false);

  const handleSeverity = (sev: string) => {
    onFilter({
      ...currentParams,
      severity: currentParams.severity === sev ? undefined : sev,
      vendor: undefined,
      cweId: undefined,
      isKev: undefined,
    });
  };

  const handleKevToggle = () => {
    onFilter({
      ...currentParams,
      isKev: currentParams.isKev === "TRUE" ? undefined : "TRUE",
      vendor: undefined,
      severity: undefined,
      cweId: undefined,
    });
  };

  const handleVendorSelect = (v: string) => {
    setVendor(v);
    if (v) {
      onFilter({
        ...currentParams,
        vendor: v,
        severity: undefined,
        cweId: undefined,
        isKev: undefined,
      });
    } else {
      onFilter({ ...currentParams, vendor: undefined });
    }
  };

  const handleCweSelect = (c: string) => {
    setCweId(c);
    if (c) {
      onFilter({
        ...currentParams,
        cweId: c,
        vendor: undefined,
        severity: undefined,
        isKev: undefined,
      });
    } else {
      onFilter({ ...currentParams, cweId: undefined });
    }
  };

  const handleClear = () => {
    setVendor("");
    setCweId("");
    onFilter({});
  };

  return (
    <div className="glass rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-text-secondary hover:text-text-primary"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>

        <div className="flex gap-2 flex-wrap">
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              onClick={() => handleSeverity(sev)}
              className={`px-3 py-1 rounded-full text-xs font-heading border transition-all ${
                currentParams.severity === sev
                  ? severityButtonColors[sev]
                  : "border-white/10 text-text-secondary hover:border-white/20"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <button
          onClick={handleKevToggle}
          className={`px-3 py-1 rounded-full text-xs font-heading border transition-all ${
            currentParams.isKev === "TRUE"
              ? "bg-amber/20 border-amber text-amber"
              : "border-white/10 text-text-secondary hover:border-white/20"
          }`}
        >
          KEV Only
        </button>

        {(currentParams.severity ||
          currentParams.isKev ||
          currentParams.vendor ||
          currentParams.cweId) && (
          <button
            onClick={handleClear}
            className="px-3 py-1 rounded-full text-xs font-heading border border-white/10 text-text-secondary hover:border-white/20 transition-all"
          >
            Clear All
          </button>
        )}

        <div className="ml-auto">
          <a
            href={getExportUrl(currentParams)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="border-amber/50 text-amber hover:bg-amber/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-heading text-text-secondary mb-2 uppercase tracking-wider">
              Vendor
            </label>
            <select
              value={vendor}
              onChange={(e) => handleVendorSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary font-body text-sm focus:outline-none focus:border-amber"
            >
              <option value="">All Vendors</option>
              {stats?.topVendors.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-heading text-text-secondary mb-2 uppercase tracking-wider">
              CWE Type
            </label>
            <select
              value={cweId}
              onChange={(e) => handleCweSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary font-body text-sm focus:outline-none focus:border-amber"
            >
              <option value="">All CWE Types</option>
              {stats?.topCwes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
