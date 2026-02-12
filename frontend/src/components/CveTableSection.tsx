import { useState, useEffect, useCallback } from "react";
import { Shield, ChevronDown, ChevronRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CveDetailRow } from "@/components/CveDetailRow";
import { FilterBar } from "@/components/FilterBar";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useCveSearch } from "@/hooks/useApi";
import type { CveSearchParams } from "@/hooks/useApi";
import type { DashboardStats, CVE } from "@/types";

interface CveTableSectionProps {
  stats: DashboardStats | null;
  initialSearch?: string;
}

export function CveTableSection({ stats, initialSearch }: CveTableSectionProps) {
  const { ref, isVisible } = useIntersectionObserver();
  const { result, loading, search } = useCveSearch();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [params, setParams] = useState<CveSearchParams>({
    limit: "50",
    search: initialSearch,
  });
  const [allItems, setAllItems] = useState<CVE[]>([]);

  const doSearch = useCallback(
    (newParams: CveSearchParams) => {
      const merged = { ...newParams, limit: "50" };
      setParams(merged);
      setAllItems([]);
      search(merged);
    },
    [search]
  );

  useEffect(() => {
    if (isVisible) {
      search(params);
    }
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialSearch) {
      doSearch({ ...params, search: initialSearch });
    }
  }, [initialSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (result?.items) {
      if (params.lastKey) {
        setAllItems((prev) => [...prev, ...result.items]);
      } else {
        setAllItems(result.items);
      }
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (result?.lastKey) {
      const newParams = { ...params, lastKey: result.lastKey };
      setParams(newParams);
      search(newParams);
    }
  };

  const toggleExpand = (cveId: string) => {
    setExpandedId(expandedId === cveId ? null : cveId);
  };

  return (
    <section
      ref={ref}
      className={`bg-bg-deep px-4 md:px-8 py-16 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      id="cve-table"
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-peak-lum mb-8">
          CVE Explorer
        </h2>

        <FilterBar
          stats={stats}
          onFilter={doSearch}
          currentParams={params}
        />

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">
                    CVE ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider hidden md:table-cell">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">
                    CVSS
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading text-text-secondary uppercase tracking-wider">
                    KEV
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading text-text-secondary uppercase tracking-wider hidden sm:table-cell">
                    Ransomware
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((cve) => (
                  <CveRow
                    key={cve.cveId}
                    cve={cve}
                    expanded={expandedId === cve.cveId}
                    onToggle={() => toggleExpand(cve.cveId)}
                  />
                ))}
                {allItems.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-text-secondary font-body"
                    >
                      No CVEs found. Try adjusting your filters.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {result?.lastKey && (
            <div className="flex justify-center p-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="border-amber/50 text-amber hover:bg-amber/10"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CveRow({
  cve,
  expanded,
  onToggle,
}: {
  cve: CVE;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors group"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-amber shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-secondary group-hover:text-amber shrink-0 transition-colors" />
            )}
            <span className="font-mono text-sm text-amber">{cve.cveId}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-body text-sm text-text-primary hidden md:table-cell capitalize">
          {cve.vendor}
        </td>
        <td className="px-4 py-3 font-body text-sm text-text-secondary hidden lg:table-cell capitalize">
          {cve.product}
        </td>
        <td className="px-4 py-3 font-mono text-sm text-bright-gold font-semibold">
          {cve.cvssScore.toFixed(1)}
        </td>
        <td className="px-4 py-3">
          <SeverityBadge severity={cve.cvssSeverity} />
        </td>
        <td className="px-4 py-3 text-center">
          {cve.isKev === "TRUE" ? (
            <Shield className="h-4 w-4 text-amber mx-auto" />
          ) : (
            <Minus className="h-4 w-4 text-muted-steel mx-auto" />
          )}
        </td>
        <td className="px-4 py-3 text-center hidden sm:table-cell">
          {cve.knownRansomware === "Known" ? (
            <span className="text-crimson-glow text-sm font-heading">!</span>
          ) : (
            <Minus className="h-4 w-4 text-muted-steel mx-auto" />
          )}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden lg:table-cell">
          {cve.publishedDate?.split("T")[0]}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8}>
            <CveDetailRow cve={cve} />
          </td>
        </tr>
      )}
    </>
  );
}
