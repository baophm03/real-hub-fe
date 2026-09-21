export const formatVnd = (v: number | string | null | undefined) => {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  if (n === 0) return "0 ₫";
  return n.toLocaleString("vi-VN") + " ₫";
};

export const formatCompact = (v: number) => {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + " tỷ";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + " tr";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "k";
  return String(v);
};

export const recordToChartData = (rec: Record<string, number> | undefined, labels: Record<string, string>) => {
  if (!rec) return [];
  return Object.entries(rec).map(([key, value]) => ({
    key,
    name: labels[key] ?? key,
    value,
  }));
};
