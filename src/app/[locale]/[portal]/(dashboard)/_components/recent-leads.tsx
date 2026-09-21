import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { leadStatusConfig } from "./constants";
import type { DashboardLead } from "./types";

const statusTile: Record<string, string> = {
  NEW: "bg-accent-blue text-accent-blue-text",
  CONTACTED: "bg-accent-yellow text-accent-yellow-text",
  INTERESTED: "bg-accent-purple text-accent-purple-text",
  NEGOTIATING: "bg-surface-muted text-foreground-muted",
  CONVERTED: "bg-accent-green text-accent-green-text",
  LOST: "bg-accent-red text-accent-red-text",
};

interface RecentLeadsProps {
  leads: DashboardLead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  const portalPath = usePortalPath();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 animate-fade-up-delay-2">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Nguồn khách hàng</CardTitle>
          <CardAction>
            <Link
              href={portalPath("/leads")}
              className="group flex items-center gap-1.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground shrink-0"
            >
              Xem tất cả
              <span className="inline-flex size-5 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight size={10} />
              </span>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {leads.length > 0 ? (
              leads.map((lead) => {
                const statusCfg = leadStatusConfig[lead.status] ?? { label: lead.status, variant: "default" as const };
                return (
                  <div
                    key={lead.id}
                    className="group flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${statusTile[lead.status] ?? "bg-surface-muted text-foreground-muted"}`}
                      >
                        {(lead.customer?.fullName ?? lead.phoneNormalized ?? "K").charAt(0).toUpperCase()}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{lead.customer?.fullName ?? lead.phoneNormalized ?? "Khach vang"}</span>
                        <span className="text-xs text-foreground-muted tabular-nums">
                          {lead.customer?.phone ?? lead.phoneNormalized ?? "-"}
                          {lead.property ? ` · ${lead.property.title}` : ""}
                        </span>
                      </div>
                    </div>
                    <Badge variant={statusCfg.variant} className="self-start sm:self-auto">{statusCfg.label}</Badge>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-foreground-muted">Chưa có nguồn khách hàng nào</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
