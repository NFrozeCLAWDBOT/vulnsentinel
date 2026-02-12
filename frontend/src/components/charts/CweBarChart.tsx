import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CweBarChartProps {
  data: { id: string; count: number }[];
}

export function CweBarChart({ data }: CweBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#A89880", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
        />
        <YAxis
          dataKey="id"
          type="category"
          width={110}
          tick={{ fill: "#A89880", fontSize: 11, fontFamily: "JetBrains Mono" }}
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
        <Bar dataKey="count" fill="#A85520" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
