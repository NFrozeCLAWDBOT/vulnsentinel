import { cn } from "@/lib/utils";

const severityColors: Record<string, string> = {
  CRITICAL: "bg-ember-red text-white",
  HIGH: "bg-crimson-glow text-white",
  MEDIUM: "bg-bright-gold text-bg-deep",
  LOW: "bg-dark-teal text-text-primary",
  NONE: "bg-muted-steel text-text-secondary",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const colorClass = severityColors[severity] || severityColors.NONE;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-heading font-medium",
        colorClass
      )}
    >
      {severity}
    </span>
  );
}
