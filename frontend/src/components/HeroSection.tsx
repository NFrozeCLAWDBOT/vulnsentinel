import { useState } from "react";
import { Search } from "lucide-react";
import type { DashboardStats } from "@/types";

interface HeroSectionProps {
  stats: DashboardStats | null;
  loading: boolean;
  onSearch: (query: string) => void;
}

export function HeroSection({ stats, loading, onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const statItems = [
    { label: "Total CVEs", value: stats?.totalCves ?? 0 },
    { label: "KEV-Flagged", value: stats?.totalKev ?? 0 },
    {
      label: "Critical",
      value: stats?.severityDistribution?.CRITICAL ?? 0,
    },
    { label: "Ransomware-Linked", value: stats?.ransomwareCount ?? 0 },
  ];

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/vulnsentinel-hero-loop.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1A1210]" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div className="glass rounded-2xl p-8 md:p-12 max-w-2xl w-full text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-peak-lum mb-4">
            VulnSentinel
          </h1>
          <p className="font-body text-text-secondary text-lg md:text-xl mb-8">
            Vulnerability intelligence. Actionable in seconds.
          </p>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-amber transition-colors" />
              <input
                type="text"
                placeholder="Search CVEs, vendors, products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-text-primary placeholder:text-text-secondary/60 font-body text-lg focus:outline-none focus:border-amber focus:shadow-[0_0_20px_rgba(200,122,42,0.15)] transition-all"
              />
            </div>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className="font-heading text-2xl md:text-3xl font-bold text-bright-gold">
                  {loading ? (
                    <span className="inline-block w-16 h-8 skeleton-shimmer rounded" />
                  ) : (
                    item.value.toLocaleString()
                  )}
                </div>
                <div className="font-body text-xs md:text-sm text-text-secondary mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-amber rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
