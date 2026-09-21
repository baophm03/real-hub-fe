"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Handshake, Loader2, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetApiCommissionReport } from "@/lib/api/endpoints/reports";
import type { CommissionReport } from "./types";
import { commissionStatusLabels, roleLabels, tooltipStyle } from "./constants";
import { formatCompact, formatVnd, recordToChartData } from "./helpers";
import { StatCard } from "./stat-card";
import { BreakdownPie } from "./breakdown-pie";

interface CommissionReportTabProps {
  startDate: string;
  endDate: string;
}

export function CommissionReportTab({ startDate, endDate }: CommissionReportTabProps) {
  const params = useMemo(
    () => ({ startDate: startDate || undefined, endDate: endDate || undefined }),
    [startDate, endDate],
  );
  const { data: raw, isLoading, isFetching, refetch } = useGetApiCommissionReport(params);
  const report = (raw as unknown as { data?: CommissionReport })?.data;

  const byRoleData = useMemo(() => {
    if (!report?.byRole) return [];
    return Object.entries(report.byRole).map(([role, entry]) => ({
      name: roleLabels[role] ?? role,
      role,
      estimated: Number(entry.estimated) || 0,
      confirmed: Number(entry.confirmed) || 0,
      count: entry.count,
    }));
  }, [report]);

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />;

  const byStatusData = recordToChartData(report?.byStatus, commissionStatusLabels);

  const confirmedRate = report && report.totalEstimated > 0 ? Math.round((report.totalConfirmed / report.totalEstimated) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng deal có hoa hồng" value={report ? String(report.total) : "—"} icon={BarChart3} accent="blue" />
        <StatCard label="Hoa hồng ước tính" value={report ? formatCompact(report.totalEstimated) : "—"} sub={report ? formatVnd(report.totalEstimated) : ""} icon={TrendingUp} accent="yellow" />
        <StatCard label="Hoa hồng đã xác nhận" value={report ? formatCompact(report.totalConfirmed) : "—"} sub={report ? formatVnd(report.totalConfirmed) : ""} icon={Wallet} accent="green" />
        <StatCard label="Tỷ lệ xác nhận" value={report ? `${confirmedRate}%` : "—"} icon={Handshake} accent="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo trạng thái</CardTitle>
            <CardDescription>{report?.total ?? 0} deal có hoa hồng</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownPie data={byStatusData} total={report?.total ?? 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hoa hồng theo vai trò</CardTitle>
            <CardDescription>Ước tính vs đã xác nhận</CardDescription>
          </CardHeader>
          <CardContent>
            {byRoleData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-foreground-muted">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byRoleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" tickFormatter={formatCompact} width={56} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatVnd(Number(v))} cursor={{ fill: "var(--surface-muted)", opacity: 0.4 }} />
                  <Bar dataKey="estimated" fill="#d4a373" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="confirmed" fill="#2a5f3f" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: "#d4a373" }} />
                <span className="text-foreground-muted">Ước tính</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: "#2a5f3f" }} />
                <span className="text-foreground-muted">Đã xác nhận</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {byRoleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết theo vai trò</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-foreground-muted">
                    <th className="py-2 pr-4 font-medium">Vai trò</th>
                    <th className="py-2 px-4 font-medium text-right">Số deal</th>
                    <th className="py-2 px-4 font-medium text-right">Ước tính</th>
                    <th className="py-2 px-4 font-medium text-right">Đã xác nhận</th>
                    <th className="py-2 pl-4 font-medium text-right">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byRoleData.map((row) => {
                    const rate = row.estimated > 0 ? Math.round((row.confirmed / row.estimated) * 100) : 0;
                    return (
                      <tr key={row.role} className="transition-colors hover:bg-surface-muted/40">
                        <td className="py-3 pr-4"><Badge variant="outline">{row.name}</Badge></td>
                        <td className="py-3 px-4 text-right tabular-nums">{row.count}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-foreground-muted">{formatVnd(row.estimated)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-medium text-primary">{formatVnd(row.confirmed)}</td>
                        <td className="py-3 pl-4 text-right tabular-nums">
                          <span className={rate >= 70 ? "text-accent-green-text" : rate >= 30 ? "text-accent-yellow-text" : "text-foreground-muted"}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border-strong text-sm font-semibold">
                    <td className="py-3 pr-4">Tổng</td>
                    <td className="py-3 px-4 text-right tabular-nums">{report?.total ?? 0}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatVnd(report?.totalEstimated)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-primary">{formatVnd(report?.totalConfirmed)}</td>
                    <td className="py-3 pl-4 text-right tabular-nums">{confirmedRate}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
