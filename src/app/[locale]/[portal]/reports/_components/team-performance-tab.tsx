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
import { Loader2, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetApiTeamPerformanceReport } from "@/lib/api/endpoints/reports";
import type { TeamMember } from "./types";
import { roleLabels, tooltipStyle } from "./constants";

interface TeamPerformanceTabProps {
  startDate: string;
  endDate: string;
}

export function TeamPerformanceTab({ startDate, endDate }: TeamPerformanceTabProps) {
  const params = useMemo(
    () => ({ startDate: startDate || undefined, endDate: endDate || undefined }),
    [startDate, endDate],
  );
  const { data: raw, isLoading, isFetching, refetch } = useGetApiTeamPerformanceReport(params);
  const members = ((raw as unknown as { data?: TeamMember[] })?.data) ?? [];

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />;

  const chartData = members.map((m) => ({
    name: m.user.fullName?.split(" ").slice(-2).join(" ") ?? m.user.email,
    deals: m.stats.deals,
    leads: m.stats.leads,
    appointments: m.stats.appointments,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Làm mới
        </Button>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted">
              <Users size={20} className="text-foreground-muted" />
            </div>
            <div>
              <p className="font-medium">Chưa có thành viên</p>
              <p className="text-sm text-foreground-muted">Thêm thành viên vào tenant để xem hiệu suất</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Hiệu suất theo thành viên</CardTitle>
              <CardDescription>So sánh số deal, lead, lịch hẹn của từng thành viên</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" allowDecimals={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-muted)", opacity: 0.4 }} />
                  <Bar dataKey="deals" fill="#2a5f3f" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="leads" fill="#1F6C9F" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="appointments" fill="#d4a373" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: "#2a5f3f" }} />
                  <span className="text-foreground-muted">Giao dịch</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: "#1F6C9F" }} />
                  <span className="text-foreground-muted">Nguồn khách</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: "#d4a373" }} />
                  <span className="text-foreground-muted">Lịch hẹn</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bảng chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-foreground-muted">
                      <th className="py-2 pr-4 font-medium">Thành viên</th>
                      <th className="py-2 px-4 font-medium">Vai trò</th>
                      <th className="py-2 px-4 font-medium text-right">Giao dịch</th>
                      <th className="py-2 px-4 font-medium text-right">Nguồn KH</th>
                      <th className="py-2 pl-4 font-medium text-right">Lịch hẹn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.map((m) => (
                      <tr key={m.user.id} className="transition-colors hover:bg-surface-muted/40">
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{m.user.fullName}</span>
                            <span className="text-xs text-foreground-muted">{m.user.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {m.roles.map((r) => (
                              <Badge key={r} variant="outline">{roleLabels[r] ?? r}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-medium">{m.stats.deals}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{m.stats.leads}</td>
                        <td className="py-3 pl-4 text-right tabular-nums">{m.stats.appointments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
