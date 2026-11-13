"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Handshake, Loader2, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiCommissionReport } from "@/lib/api/endpoints/commission-meta";
import { getApiErrorMessage } from "@/lib/api/get-api-error-message";
import type { CommissionReport } from "./types";
import { tooltipStyle } from "./constants";
import { formatCompact, formatVnd, recordToChartData } from "./helpers";
import { StatCard } from "./stat-card";
import { BreakdownPie } from "./breakdown-pie";
import { getLeadSourceLabel } from "@/utils/lead-source-labels";

interface CommissionReportTabProps { startDate: string; endDate: string }
const ALL = "ALL";

export function CommissionReportTab({ startDate, endDate }: CommissionReportTabProps) {
  const [zoneId, setZoneId] = useState(ALL);
  const [projectId, setProjectId] = useState(ALL);
  const [teamId, setTeamId] = useState(ALL);
  const [leadSource, setLeadSource] = useState(ALL);
  const [commissionType, setCommissionType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [planId, setPlanId] = useState(ALL);
  const params = useMemo(() => ({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    zoneId: zoneId === ALL ? undefined : zoneId,
    projectId: projectId === ALL ? undefined : projectId,
    teamId: teamId === ALL ? undefined : teamId,
    leadSource: leadSource === ALL ? undefined : leadSource,
    commissionType: commissionType === ALL ? undefined : commissionType,
    status: status === ALL ? undefined : status,
    planId: planId === ALL ? undefined : planId,
  }), [startDate, endDate, zoneId, projectId, teamId, leadSource, commissionType, status, planId]);
  const { data: reportEnvelope, isLoading, isFetching, isError, error, refetch } = useApiCommissionReport(params);
  const report = reportEnvelope?.data as CommissionReport | undefined;
  const options = report?.options;
  const totalEstimatedNumber = report ? Number(report.totalEstimated) : Number.NaN;
  const totalConfirmedNumber = report ? Number(report.totalConfirmed) : Number.NaN;
  const totalEstimated = Number.isFinite(totalEstimatedNumber) ? totalEstimatedNumber : 0;
  const totalConfirmed = Number.isFinite(totalConfirmedNumber) ? totalConfirmedNumber : 0;
  const totalEstimatedDisplay = report
    ? Number.isFinite(totalEstimatedNumber) ? formatCompact(totalEstimatedNumber) : report.totalEstimated
    : "—";
  const totalConfirmedDisplay = report
    ? Number.isFinite(totalConfirmedNumber) ? formatCompact(totalConfirmedNumber) : report.totalConfirmed
    : "—";
  const statusLabels = Object.fromEntries((options?.commissionStatuses ?? []).map((item) => [item.value, item.label]));
  const sourceFilterLabel = leadSource === ALL
    ? "Mọi nguồn lead"
    : getLeadSourceLabel(options?.leadSources.find((source) => source === leadSource) ?? leadSource);
  const commissionTypeFilterLabel = commissionType === ALL
    ? "Mọi loại khoản"
    : options?.commissionTypes.find((type) => type.value === commissionType)?.label ?? "Loại khoản không khả dụng";
  const statusFilterLabel = status === ALL
    ? "Mọi trạng thái"
    : statusLabels[status] ?? "Trạng thái không khả dụng";
  const zoneFilterLabel = zoneId === ALL
    ? "Mọi khu vực"
    : options?.zones.find((zone) => zone.id === zoneId)?.name ?? "Khu vực không khả dụng";
  const projectFilterLabel = projectId === ALL
    ? "Mọi dự án"
    : options?.projects.find((project) => project.id === projectId)?.name ?? "Dự án không khả dụng";
  const teamFilterLabel = teamId === ALL
    ? "Mọi đội nhóm"
    : options?.teams.find((team) => team.id === teamId)?.name ?? "Đội nhóm không khả dụng";
  const selectedPlan = options?.plans.find((plan) => plan.id === planId);
  const planFilterLabel = planId === ALL
    ? "Mọi kế hoạch"
    : selectedPlan
      ? `${selectedPlan.name} · v${selectedPlan.version}`
      : "Kế hoạch không khả dụng";

  const byRoleData = useMemo(() => Object.entries(report?.byRole ?? {}).map(([role, entry]) => ({
    name: options?.receiverRoles.find((item) => item.value === role)?.label ?? role,
    role,
    estimated: Number.isFinite(Number(entry.estimated)) ? Number(entry.estimated) : null,
    confirmed: Number.isFinite(Number(entry.confirmed)) ? Number(entry.confirmed) : null,
    estimatedDisplay: entry.estimated,
    confirmedDisplay: entry.confirmed,
    count: entry.count,
  })), [report, options?.receiverRoles]);
  const byRoleAmountsMasked = byRoleData.some((entry) => entry.estimated === null || entry.confirmed === null);
  const byStatusData = recordToChartData(report?.byStatus, statusLabels);
  const confirmedRate = Number.isFinite(totalEstimatedNumber) && Number.isFinite(totalConfirmedNumber)
    ? totalEstimated > 0 ? `${Math.round((totalConfirmed / totalEstimated) * 100)}%` : "0%"
    : !Number.isFinite(totalEstimatedNumber) ? report?.totalEstimated ?? "****" : report?.totalConfirmed ?? "****";
  const dimensionRows = (dimension: CommissionReport["byZone"], names: Map<string, string>, unknownLabel: string) => Object.entries(dimension ?? {}).map(([key, entry]) => ({
    key,
    name: key === "UNKNOWN" ? unknownLabel : entry.label ?? names.get(key) ?? key,
    count: entry.count,
    estimated: entry.estimated,
    confirmed: entry.confirmed,
  }));
  const zones = dimensionRows(report?.byZone, new Map<string, string>((options?.zones ?? []).map((zone): [string, string] => [zone.id, zone.name])), "Chưa gán khu vực");
  const projects = dimensionRows(report?.byProject, new Map<string, string>((options?.projects ?? []).map((project): [string, string] => [project.id, project.name])), "Chưa gắn dự án");
  const sources = dimensionRows(report?.byLeadSource, new Map(), "Không rõ nguồn lead")
    .map((row) => ({ ...row, name: row.key === "UNKNOWN" ? row.name : getLeadSourceLabel(row.key) }));
  const plans = dimensionRows(report?.byPlan, new Map<string, string>((options?.plans ?? []).map((plan): [string, string] => [plan.id, `${plan.name} · v${plan.version}`])), "Không rõ kế hoạch");

  if (isLoading) return <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />;

  if (isError) return <Alert variant="destructive">
    <RefreshCw />
    <AlertTitle>Không tải được báo cáo hoa hồng</AlertTitle>
    <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
      <span>{getApiErrorMessage(error) ?? "API đang gặp lỗi hoặc chưa kết nối được. Hãy thử tải lại báo cáo."}</span>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
    </AlertDescription>
  </Alert>;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <div className="flex min-w-0 flex-col gap-1.5"><label htmlFor="commission-report-zone" className="text-xs font-medium text-foreground-muted">Khu vực</label><Select value={zoneId} onValueChange={(value) => setZoneId(value ?? ALL)}><SelectTrigger id="commission-report-zone" className="w-full"><SelectValue placeholder="Mọi khu vực">{zoneFilterLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL} label="Mọi khu vực">Mọi khu vực</SelectItem>{(options?.zones ?? []).map((zone) => <SelectItem key={zone.id} value={zone.id} label={zone.name}>{zone.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex min-w-0 flex-col gap-1.5"><label htmlFor="commission-report-project" className="text-xs font-medium text-foreground-muted">Dự án</label><Select value={projectId} onValueChange={(value) => setProjectId(value ?? ALL)}><SelectTrigger id="commission-report-project" className="w-full"><SelectValue placeholder="Mọi dự án">{projectFilterLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL} label="Mọi dự án">Mọi dự án</SelectItem>{(options?.projects ?? []).map((project) => <SelectItem key={project.id} value={project.id} label={project.name}>{project.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex min-w-0 flex-col gap-1.5"><label htmlFor="commission-report-team" className="text-xs font-medium text-foreground-muted">Đội nhóm</label><Select value={teamId} onValueChange={(value) => setTeamId(value ?? ALL)}><SelectTrigger id="commission-report-team" className="w-full"><SelectValue placeholder="Mọi đội nhóm">{teamFilterLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL} label="Mọi đội nhóm">Mọi đội nhóm</SelectItem>{(options?.teams ?? []).map((team) => <SelectItem key={team.id} value={team.id} label={team.name}>{team.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex min-w-0 flex-col gap-1.5"><label htmlFor="commission-report-source" className="text-xs font-medium text-foreground-muted">Nguồn khách hàng</label><Select value={leadSource} onValueChange={(value) => setLeadSource(value ?? ALL)}><SelectTrigger id="commission-report-source" className="w-full"><SelectValue placeholder="Mọi nguồn lead">{sourceFilterLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL} label="Mọi nguồn lead">Mọi nguồn lead</SelectItem>{(options?.leadSources ?? []).map((source) => <SelectItem key={source} value={source} label={getLeadSourceLabel(source)}>{getLeadSourceLabel(source)}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex min-w-0 flex-col gap-1.5"><label htmlFor="commission-report-type" className="text-xs font-medium text-foreground-muted">Loại khoản</label><Select value={commissionType} onValueChange={(value) => setCommissionType(value ?? ALL)}><SelectTrigger id="commission-report-type" className="w-full"><SelectValue placeholder="Mọi loại khoản">{commissionTypeFilterLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL} label="Mọi loại khoản">Mọi loại khoản</SelectItem>{(options?.commissionTypes ?? []).map((type) => <SelectItem key={type.value} value={type.value} label={type.label}>{type.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex min-w-0 flex-col gap-1.5"><label htmlFor="commission-report-status" className="text-xs font-medium text-foreground-muted">Trạng thái</label><Select value={status} onValueChange={(value) => setStatus(value ?? ALL)}><SelectTrigger id="commission-report-status" className="w-full"><SelectValue placeholder="Mọi trạng thái">{statusFilterLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL} label="Mọi trạng thái">Mọi trạng thái</SelectItem>{(options?.commissionStatuses ?? []).map((item) => <SelectItem key={item.value} value={item.value} label={item.label}>{item.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex min-w-0 flex-col gap-1.5"><label htmlFor="commission-report-plan" className="text-xs font-medium text-foreground-muted">Kế hoạch</label><Select value={planId} onValueChange={(value) => setPlanId(value ?? ALL)}><SelectTrigger id="commission-report-plan" className="w-full"><SelectValue placeholder="Mọi kế hoạch">{planFilterLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value={ALL} label="Mọi kế hoạch">Mọi kế hoạch</SelectItem>{(options?.plans ?? []).map((plan) => <SelectItem key={plan.id} value={plan.id} label={`${plan.name} · v${plan.version}`}>{plan.name} · v{plan.version}</SelectItem>)}</SelectContent></Select></div>
      </div>

      <div className="flex min-h-8 items-center justify-between gap-3">
        {isFetching ? <p role="status" className="text-xs text-foreground-muted">Đang cập nhật báo cáo theo bộ lọc…</p> : <span />}
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>{isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}Làm mới</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Giao dịch có hoa hồng" value={report ? String(report.total) : "—"} icon={BarChart3} accent="blue" />
        <StatCard label="Hoa hồng ước tính" value={totalEstimatedDisplay} sub={report ? formatVnd(report.totalEstimated) : ""} icon={TrendingUp} accent="yellow" />
        <StatCard label="Hoa hồng đã xác nhận" value={totalConfirmedDisplay} sub={report ? formatVnd(report.totalConfirmed) : ""} icon={Wallet} accent="green" />
        <StatCard label="Tỷ lệ xác nhận" value={report ? confirmedRate : "—"} icon={Handshake} accent="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Phân bố theo trạng thái</CardTitle><CardDescription>{report?.total ?? 0} giao dịch có hoa hồng</CardDescription></CardHeader><CardContent><BreakdownPie data={byStatusData} total={report?.total ?? 0} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Hoa hồng theo vai trò</CardTitle><CardDescription>Ước tính và đã xác nhận theo khoản phân bổ</CardDescription></CardHeader><CardContent>
          {byRoleData.length === 0 ? <div className="flex h-[260px] items-center justify-center text-sm text-foreground-muted">Chưa có dữ liệu</div> : byRoleAmountsMasked ? <div className="flex h-[260px] items-center justify-center text-sm text-foreground-muted">Giá trị đang được che theo quyền truy cập.</div> : <ResponsiveContainer width="100%" height={260}><BarChart data={byRoleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" /><YAxis tick={{ fontSize: 11 }} stroke="var(--foreground-muted)" tickFormatter={formatCompact} width={56} /><Tooltip contentStyle={tooltipStyle} formatter={(value: any) => formatVnd(value)} cursor={{ fill: "var(--surface-muted)", opacity: 0.4 }} /><Bar dataKey="estimated" name="Ước tính" fill="#d4a373" radius={[4, 4, 0, 0]} maxBarSize={36} /><Bar dataKey="confirmed" name="Đã xác nhận" fill="#2a5f3f" radius={[4, 4, 0, 0]} maxBarSize={36} /></BarChart></ResponsiveContainer>}
        </CardContent></Card>
      </div>

      {!!byRoleData.length && <Card><CardHeader><CardTitle>Chi tiết theo vai trò người nhận</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-foreground-muted"><th className="py-2 pr-4 font-medium">Vai trò</th><th className="px-4 py-2 text-right font-medium">Số khoản</th><th className="px-4 py-2 text-right font-medium">Ước tính</th><th className="px-4 py-2 text-right font-medium">Đã xác nhận</th></tr></thead><tbody className="divide-y divide-border">{byRoleData.map((row) => <tr key={row.role}><td className="py-3 pr-4"><Badge variant="outline">{row.name}</Badge></td><td className="px-4 py-3 text-right tabular-nums">{row.count}</td><td className="px-4 py-3 text-right tabular-nums">{formatVnd(row.estimatedDisplay)}</td><td className="px-4 py-3 text-right tabular-nums font-medium text-primary">{formatVnd(row.confirmedDisplay)}</td></tr>)}</tbody></table></div></CardContent></Card>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {[{ title: "Theo khu vực", rows: zones }, { title: "Theo dự án", rows: projects }, { title: "Theo nguồn lead", rows: sources }, { title: "Theo kế hoạch", rows: plans }].map(({ title, rows }) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{!rows.length ? <p className="text-sm text-foreground-muted">Chưa có dữ liệu</p> : <div className="flex flex-col gap-3">{rows.map((row) => <div key={row.key} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.name}</p><p className="text-xs text-foreground-muted">{row.count} khoản</p></div><div className="text-right"><p className="text-sm tabular-nums">{formatVnd(row.estimated)}</p><p className="text-xs tabular-nums text-primary">Đã xác nhận {formatVnd(row.confirmed)}</p></div></div>)}</div>}</CardContent></Card>)}
      </div>
    </div>
  );
}
