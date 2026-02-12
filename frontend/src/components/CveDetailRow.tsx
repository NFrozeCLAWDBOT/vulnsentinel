import type { CVE } from "@/types";
import { ExternalLink } from "lucide-react";

interface CveDetailRowProps {
  cve: CVE;
}

export function CveDetailRow({ cve }: CveDetailRowProps) {
  return (
    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-heading text-xs text-text-secondary uppercase tracking-wider mb-2">
            Description
          </h4>
          <p className="font-body text-sm text-text-primary/80 leading-relaxed">
            {cve.description || "No description available."}
          </p>
        </div>
        <div className="space-y-4">
          {cve.isKev === "TRUE" && (
            <div>
              <h4 className="font-heading text-xs text-text-secondary uppercase tracking-wider mb-2">
                KEV Details
              </h4>
              <div className="space-y-1 font-mono text-sm">
                <div>
                  <span className="text-text-secondary">Added: </span>
                  <span className="text-amber">{cve.kevDateAdded}</span>
                </div>
                {cve.kevDueDate && (
                  <div>
                    <span className="text-text-secondary">Due: </span>
                    <span className="text-ember-red">{cve.kevDueDate}</span>
                  </div>
                )}
                <div>
                  <span className="text-text-secondary">Ransomware: </span>
                  <span
                    className={
                      cve.knownRansomware === "Known"
                        ? "text-crimson-glow"
                        : "text-text-secondary"
                    }
                  >
                    {cve.knownRansomware}
                  </span>
                </div>
              </div>
            </div>
          )}
          {cve.references?.length > 0 && (
            <div>
              <h4 className="font-heading text-xs text-text-secondary uppercase tracking-wider mb-2">
                References
              </h4>
              <div className="space-y-1">
                {cve.references.slice(0, 5).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-amber hover:text-bright-gold transition-colors text-sm font-body truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
