import { Skull } from "lucide-react";

interface RansomwareCardProps {
  count: number;
}

export function RansomwareCard({ count }: RansomwareCardProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-crimson-glow/20 blur-2xl rounded-full" />
        <Skull className="relative h-12 w-12 text-crimson-glow" />
      </div>
      <div className="font-heading text-5xl font-bold text-crimson-glow">
        {count.toLocaleString()}
      </div>
      <div className="font-body text-text-secondary text-sm">
        Ransomware-Linked CVEs
      </div>
    </div>
  );
}
