import { Loader2 } from "lucide-react";
import { ChartCard } from "./chart-card";
import { TrendChart } from "./trend-chart";
import { BreakdownChart } from "./breakdown-chart";
import { BarBreakdown } from "./bar-breakdown";
import {
  dealStatusLabels,
  leadStatusConfigLabels,
  publicationLabels,
  verificationLabels,
} from "./constants";
import type { ChartsData } from "./types";

interface DashboardChartsProps {
  charts?: ChartsData;
  isLoading: boolean;
  isOwnerPortal: boolean;
  isSalesPortal: boolean;
}

export function DashboardCharts({ charts, isLoading, isOwnerPortal, isSalesPortal }: DashboardChartsProps) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-foreground-muted">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 animate-fade-up-delay-2">
      {isOwnerPortal ? (
        <>
          <ChartCard title="BĐS theo trạng thái xuất bản">
            <BreakdownChart data={charts?.myPropertiesByPublication ?? []} labels={publicationLabels} />
          </ChartCard>
          <ChartCard title="BĐS theo trạng thái duyệt">
            <BreakdownChart data={charts?.propertiesByVerification ?? []} labels={verificationLabels} />
          </ChartCard>
        </>
      ) : isSalesPortal ? (
        <>
          <ChartCard title="Xu hướng giao dịch (6 tháng)">
            <TrendChart data={charts?.dealsTrend ?? []} label="deals" />
          </ChartCard>
          <ChartCard title="Giao dịch theo trạng thái">
            <BarBreakdown data={charts?.dealsByStatus ?? []} labels={dealStatusLabels} />
          </ChartCard>
          <ChartCard title="Nguồn khách hàng theo trạng thái">
            <BarBreakdown data={charts?.leadsByStatus ?? []} labels={leadStatusConfigLabels} />
          </ChartCard>
        </>
      ) : (
        <>
          <ChartCard title="Xu hướng giao dịch (6 tháng)">
            <TrendChart data={charts?.dealsTrend ?? []} label="deals" />
          </ChartCard>
          <ChartCard title="Xu hướng nguồn khách (6 tháng)">
            <TrendChart data={charts?.leadsTrend ?? []} color="#1F6C9F" label="leads" />
          </ChartCard>
          <ChartCard title="BĐS theo trạng thái duyệt">
            <BreakdownChart data={charts?.propertiesByVerification ?? []} labels={verificationLabels} />
          </ChartCard>
          <ChartCard title="Giao dịch theo trạng thái">
            <BarBreakdown data={charts?.dealsByStatus ?? []} labels={dealStatusLabels} />
          </ChartCard>
        </>
      )}
    </div>
  );
}
