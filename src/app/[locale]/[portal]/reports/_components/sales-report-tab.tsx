"use client";

import { useMemo } from "react";
import { Calendar, Handshake, Loader2, RefreshCw, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetApiSalesReport } from "@/lib/api/endpoints/reports";
import type { SalesReport } from "./types";
import {
  apptStatusLabels,
  dealStatusLabels,
  leadStatusLabels,
  reservationStatusLabels,
} from "./constants";
import { formatCompact, recordToChartData } from "./helpers";
import { StatCard } from "./stat-card";
import { BreakdownPie } from "./breakdown-pie";
import { BreakdownBar } from "./breakdown-bar";

interface SalesReportTabProps {
  startDate: string;
  endDate: string;
}

export function SalesReportTab({ startDate, endDate }: SalesReportTabProps) {
  const params = useMemo(
    () => ({ startDate: startDate || undefined, endDate: endDate || undefined }),
    [startDate, endDate],
  );
  const { data: raw, isLoading, isFetching, refetch } = useGetApiSalesReport(params);
  const report = (raw as unknown as { data?: SalesReport })?.data;

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />;

  const dealsByStatus = recordToChartData(report?.deals?.byStatus, dealStatusLabels);
  const leadsByStatus = recordToChartData(report?.leads?.byStatus, leadStatusLabels);
  const leadsBySource = recordToChartData(report?.leads?.bySource, {});
  const apptByStatus = recordToChartData(report?.appointments?.byStatus, apptStatusLabels);
  const resByStatus = recordToChartData(report?.reservations?.byStatus, reservationStatusLabels);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Giao dịch" value={report ? String(report.deals.total) : "—"} sub={report ? formatCompact(report.deals.totalFinalValue) : ""} icon={Handshake} accent="green" />
        <StatCard label="Nguồn khách" value={report ? String(report.leads.total) : "—"} icon={Users} accent="purple" />
        <StatCard label="Lịch hẹn" value={report ? String(report.appointments.total) : "—"} icon={Calendar} accent="blue" />
        <StatCard label="Đặt cọc" value={report ? String(report.reservations.total) : "—"} icon={Wallet} accent="yellow" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Giao dịch theo trạng thái</CardTitle>
            <CardDescription>Phân bổ deal theo trạng thái workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownPie data={dealsByStatus} total={report?.deals.total ?? 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nguồn khách theo trạng thái</CardTitle>
            <CardDescription>Phân bổ lead theo trạng thái xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownPie data={leadsByStatus} total={report?.leads.total ?? 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={apptByStatus} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Đặt cọc theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={resByStatus} />
          </CardContent>
        </Card>
      </div>

      {leadsBySource.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nguồn khách theo nguồn</CardTitle>
            <CardDescription>Phân bổ lead theo nguồn tiếp nhận</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={leadsBySource} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
