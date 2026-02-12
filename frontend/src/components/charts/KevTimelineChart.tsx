import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface KevTimelineChartProps {
  data: { year: string; count: number }[];
}

export function KevTimelineChart({ data }: KevTimelineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="kevGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C87A2A" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#C87A2A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="year"
          tick={{ fill: "#A89880", fontSize: 12, fontFamily: "JetBrains Mono" }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
        />
        <YAxis
          tick={{ fill: "#A89880", fontSize: 12, fontFamily: "JetBrains Mono" }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(26,18,16,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#FAECC4",
            fontFamily: "JetBrains Mono",
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#C87A2A"
          strokeWidth={2}
          fill="url(#kevGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
