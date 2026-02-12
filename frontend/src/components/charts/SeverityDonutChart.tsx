import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SeverityDonutChartProps {
  data: Record<string, number>;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#C43A1E",
  HIGH: "#E04830",
  MEDIUM: "#E8B44A",
  LOW: "#2A3B3A",
  NONE: "#3E4D50",
};

export function SeverityDonutChart({ data }: SeverityDonutChartProps) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={SEVERITY_COLORS[entry.name] || "#3E4D50"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(26,18,16,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#FAECC4",
            fontFamily: "JetBrains Mono",
          }}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "#A89880", fontFamily: "JetBrains Mono", fontSize: "12px" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
