import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, STATUS_COLORS, tooltipStyle } from "./constants";

interface BreakdownPieProps {
  data: { key?: string; name: string; value: number }[];
  total: number;
}

const colorFor = (key: string | undefined, i: number) =>
  (key && STATUS_COLORS[key]) || CHART_COLORS[i % CHART_COLORS.length];

export function BreakdownPie({ data, total }: BreakdownPieProps) {
  if (!data || data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-foreground-muted">Chưa có dữ liệu</div>;
  }
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={260} className="sm:!w-[240px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colorFor(entry.key, i)} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-1 flex-col gap-2">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: colorFor(entry.key, i) }} />
              <span className="text-foreground-muted">{entry.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-medium">{entry.value}</span>
              <span className="text-xs text-foreground-muted tabular-nums">
                ({total ? Math.round((entry.value / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
