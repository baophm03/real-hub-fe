"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { PoolLead } from "@/lib/api/types/pool";
import { formatDate } from "@/utils";

const statusVariant: Record<string, "blue" | "yellow" | "purple" | "default" | "green" | "red"> = {
  NEW: "blue",
  CONTACTED: "yellow",
  INTERESTED: "purple",
  NEGOTIATING: "default",
  CONVERTED: "green",
  LOST: "red",
  RECYCLED: "default",
};

const statusLabel: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  INTERESTED: "Quan tâm",
  NEGOTIATING: "Đàm phán",
  CONVERTED: "Chuyển đổi",
  LOST: "Mất",
  RECYCLED: "Khách cũ",
};

const sourceLabel: Record<string, string> = {
  WEBSITE: "Website",
  PROPERTY_DETAIL: "Trang BĐS",
  OWNER_PAGE: "Trang chủ",
  SALES_LINK: "Link sales",
  CTV_LINK: "Link CTV",
  AGENCY_MARKETING: "Marketing",
  MANUAL_INPUT: "Nhập tay",
  LEAD_POOL: "Lead pool",
  IMPORT: "Nhập file",
};

interface Props {
  leads: PoolLead[];
  /** Render action cell cho từng row (claim/assign...) */
  actions?: (lead: PoolLead) => ReactNode;
}

export function PoolLeadsTable({ leads, actions }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b border-border bg-surface-muted/50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Mã KHTN</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Khách hàng</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Điện thoại</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">BĐS</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Nguồn</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Trạng thái</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Ngày tạo</th>
            {actions && (
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted/30">
              <td className="px-4 py-3 font-medium tabular-nums">{lead.leadCode}</td>
              <td className="px-4 py-3 font-medium">{lead.customer?.fullName ?? "—"}</td>
              <td className="px-4 py-3 tabular-nums text-foreground-muted">
                {lead.phoneNormalized ?? lead.customer?.phone ?? "—"}
              </td>
              <td className="px-4 py-3 text-foreground-muted truncate max-w-[180px]">
                {lead.property?.title ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variant="default" className="text-[10px]">
                  {sourceLabel[lead.source] ?? lead.source}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant[lead.status] ?? "default"}>
                  {statusLabel[lead.status] ?? lead.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-foreground-muted tabular-nums">
                {formatDate(lead.createdAt)}
              </td>
              {actions && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">{actions(lead)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
