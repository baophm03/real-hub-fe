import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, STATUS_COLORS, tooltipStyle } from "./constants";
import type { ChartPoint } from "./types";

interface BreakdownChartProps {
  data: ChartPoint[];
  labels: Record<string, string>;
}

export function BreakdownChart({ data, labels }: BreakdownChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-foreground-muted">Chưa có dữ liệu</div>;
  }
  const chartData = data.map((d) => ({ name: labels[d.label] ?? d.label, value: d.value, rawLabel: d.label }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
        >
          {chartData.map((d, i) => (
            <Cell key={i} fill={STATUS_COLORS[d.rawLabel] ?? CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
