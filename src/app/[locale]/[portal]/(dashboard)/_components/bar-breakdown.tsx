import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, STATUS_COLORS, tooltipStyle } from "./constants";
import type { ChartPoint } from "./types";

interface BarBreakdownProps {
  data: ChartPoint[];
  labels: Record<string, string>;
}

export function BarBreakdown({ data, labels }: BarBreakdownProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-foreground-muted">Chưa có dữ liệu</div>;
  }
  const chartData = data.map((d) => ({ name: labels[d.label] ?? d.label, value: d.value, rawLabel: d.label }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" />
        <YAxis tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-muted)", opacity: 0.4 }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={STATUS_COLORS[d.rawLabel] ?? CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
