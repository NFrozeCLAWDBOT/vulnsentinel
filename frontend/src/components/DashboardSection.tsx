import type { DashboardStats } from "@/types";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { KevTimelineChart } from "@/components/charts/KevTimelineChart";
import { VendorBarChart } from "@/components/charts/VendorBarChart";
import { SeverityDonutChart } from "@/components/charts/SeverityDonutChart";
import { CweBarChart } from "@/components/charts/CweBarChart";
import { RansomwareCard } from "@/components/charts/RansomwareCard";

interface DashboardSectionProps {
  stats: DashboardStats | null;
  loading: boolean;
}

function GlassCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useIntersectionObserver();
  return (
    <div
      ref={ref}
      className={`glass rounded-2xl p-6 transition-all duration-700 hover:-translate-y-0.5 hover:border-white/20 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      <h3 className="font-heading text-sm font-medium text-text-secondary mb-4 uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function DashboardSection({ stats, loading }: DashboardSectionProps) {
  if (loading || !stats) {
    return (
      <section className="bg-bg-deep px-4 md:px-8 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 h-64 skeleton-shimmer"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-bg-deep px-4 md:px-8 py-16" id="dashboard">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-peak-lum mb-8">
          Threat Landscape
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassCard title="KEV Additions Over Time" className="lg:col-span-2">
            <KevTimelineChart data={stats.kevByYear} />
          </GlassCard>

          <GlassCard title="Ransomware Threat">
            <RansomwareCard count={stats.ransomwareCount} />
          </GlassCard>

          <GlassCard title="Top Targeted Vendors">
            <VendorBarChart data={stats.topVendors} />
          </GlassCard>

          <GlassCard title="Severity Distribution">
            <SeverityDonutChart data={stats.severityDistribution} />
          </GlassCard>

          <GlassCard title="Most Common CWE Types">
            <CweBarChart data={stats.topCwes} />
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
