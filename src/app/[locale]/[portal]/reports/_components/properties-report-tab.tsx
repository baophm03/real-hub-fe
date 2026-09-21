"use client";

import { Building2, Loader2, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetApiPropertiesReport } from "@/lib/api/endpoints/reports";
import type { PropertiesReport } from "./types";
import {
  businessLabels,
  publicationLabels,
  sellingModeLabels,
  verificationLabels,
} from "./constants";
import { formatCompact, formatVnd, recordToChartData } from "./helpers";
import { StatCard } from "./stat-card";
import { BreakdownPie } from "./breakdown-pie";
import { BreakdownBar } from "./breakdown-bar";

export function PropertiesReportTab() {
  const { data: raw, isLoading, isFetching, refetch } = useGetApiPropertiesReport();
  const report = (raw as unknown as { data?: PropertiesReport })?.data;

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />;

  const bySellingMode = recordToChartData(report?.bySellingMode, sellingModeLabels);
  const byVerification = recordToChartData(report?.byVerification, verificationLabels);
  const byPublication = recordToChartData(report?.byPublication, publicationLabels);
  const byBusiness = recordToChartData(report?.byBusiness, businessLabels);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Tổng BĐS" value={report ? String(report.total) : "—"} icon={Building2} accent="green" />
        <StatCard label="Tổng giá trị" value={report ? formatCompact(report.totalValue) : "—"} sub={report ? formatVnd(report.totalValue) : ""} icon={Wallet} accent="yellow" />
        <StatCard label="Đã duyệt" value={report ? String(report.byVerification?.VERIFIED ?? 0) : "—"} icon={TrendingUp} accent="blue" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Theo hình thức bán</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownPie data={bySellingMode} total={report?.total ?? 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Theo trạng thái duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownPie data={byVerification} total={report?.total ?? 0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Theo trạng thái xuất bản</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={byPublication} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Theo trạng thái kinh doanh</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBar data={byBusiness} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
