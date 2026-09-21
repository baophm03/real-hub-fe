import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, STATUS_COLORS, tooltipStyle } from "./constants";

interface BreakdownBarProps {
  data: { key?: string; name: string; value: number }[];
  valueFormatter?: (v: number) => string;
}

export function BreakdownBar({ data, valueFormatter }: BreakdownBarProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-foreground-muted">Chưa có dữ liệu</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="var(--foreground-muted)"
          allowDecimals={false}
          tickFormatter={valueFormatter ?? undefined}
          width={valueFormatter ? 60 : 40}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-muted)", opacity: 0.4 }} formatter={valueFormatter ? ((v: any) => valueFormatter(Number(v))) : undefined} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={i} fill={(entry.key && STATUS_COLORS[entry.key]) || CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
