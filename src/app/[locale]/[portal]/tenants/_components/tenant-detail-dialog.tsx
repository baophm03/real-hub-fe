"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, Globe, ToggleLeft, ToggleRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  useGetApiTenantId,
  useGetApiTenantSettings,
  useGetApiTenantFeatures,
  usePatchApiTenantSetting,
  usePatchApiTenantFeature,
  getGetApiTenantIdQueryKey,
} from "@/lib/api/endpoints/tenants";
import {
  typeLabel,
  statusConfig,
  type Tenant,
  type TenantDetail,
  type TenantFeature,
} from "./types";
import { formatDate } from "@/utils";

interface Props {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function TenantDetailDialog({ tenant, open, onOpenChange }: Props) {
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");

  const { data: detailRaw, isLoading } = useGetApiTenantId(tenant?.id ?? "", {
    query: { enabled: !!tenant?.id },
  });
  const detail = detailRaw as unknown as TenantDetail | undefined;

  const { data: settingsRaw } = useGetApiTenantSettings(tenant?.id ?? "", {
    query: { enabled: !!tenant?.id },
  });
  const settings = (settingsRaw as any[]) ?? [];

  const { data: featuresRaw } = useGetApiTenantFeatures(tenant?.id ?? "", {
    query: { enabled: !!tenant?.id },
  });
  const features = (featuresRaw as TenantFeature[]) ?? [];

  const { mutateAsync: upsertSetting } = usePatchApiTenantSetting({
    mutation: {
      onSuccess: () => toast.success("Đã lưu setting"),
      onError: (e: any) =>
        toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi lưu setting"),
    },
  });
  const { mutateAsync: toggleFeature } = usePatchApiTenantFeature({
    mutation: {
      onSuccess: () => toast.success("Đã đổi feature flag"),
      onError: (e: any) =>
        toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi đổi feature"),
    },
  });

  const handleAddSetting = async () => {
    if (!tenant || !newSettingKey.trim()) return;
    await upsertSetting({
      id: tenant.id,
      data: { key: newSettingKey.trim(), value: { v: newSettingValue } },
    });
    setNewSettingKey("");
    setNewSettingValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết tenant</DialogTitle>
            <DialogDescription>
              {tenant?.name} ({tenant?.code})
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-surface-muted" />
          ) : (
            tenant && (
              <div className="flex flex-col gap-6">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-foreground-muted">Loại</span>
                    <span className="text-sm">{typeLabel[tenant.type] ?? tenant.type}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-foreground-muted">Trạng thái</span>
                    <Badge variant={statusConfig[tenant.status]?.variant ?? "default"}>
                      {statusConfig[tenant.status]?.label ?? tenant.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-foreground-muted">Mã</span>
                    <span className="font-mono text-sm">{tenant.code}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-foreground-muted">Ngày tạo</span>
                    <span className="text-sm">{formatDate(tenant.createdAt)}</span>
                  </div>
                </div>

                {/* Branding */}
                {(tenant.logoUrl || tenant.primaryColor) && (
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted/40 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                      Branding
                    </span>
                    <div className="flex items-center gap-4">
                      {tenant.logoUrl && (
                        <img
                          src={tenant.logoUrl}
                          alt={tenant.name}
                          className="h-10 w-auto rounded"
                        />
                      )}
                      {tenant.primaryColor && (
                        <div className="flex items-center gap-2">
                          <div
                            className="size-8 rounded-md border border-border"
                            style={{ backgroundColor: tenant.primaryColor }}
                          />
                          <span className="font-mono text-xs">{tenant.primaryColor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Domains */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    <Globe size={14} />
                    Domains
                  </div>
                  {detail?.domains && detail.domains.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {detail.domains.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/40 p-3"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{d.domain}</span>
                            {d.subdomain && (
                              <span className="text-xs text-foreground-muted">
                                subdomain: {d.subdomain}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {d.isPrimary && <Badge variant="blue">Primary</Badge>}
                            <Badge variant={d.status === "ACTIVE" ? "green" : "default"}>
                              {d.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">Chưa có domain</p>
                  )}
                </div>

                {/* Feature flags */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    <ToggleLeft size={14} />
                    Feature flags
                  </div>
                  {features.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {features.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/40 p-3"
                        >
                          <span className="font-mono text-sm">{f.featureKey}</span>
                          <Button
                            variant={f.isEnabled ? "default" : "outline"}
                            size="sm"
                            leftIcon={
                              f.isEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />
                            }
                            onClick={async () => {
                              await toggleFeature({
                                id: tenant.id,
                                data: {
                                  featureKey: f.featureKey,
                                  enabled: !f.isEnabled,
                                },
                              });
                            }}
                          >
                            {f.isEnabled ? "Bật" : "Tắt"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">Chưa có feature flag</p>
                  )}
                </div>

                {/* Settings */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    <Settings2 size={14} />
                    Settings
                  </div>
                  {settings.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {settings.map((s: any) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/40 p-3"
                        >
                          <span className="font-mono text-sm">{s.settingKey}</span>
                          <span className="text-xs text-foreground-muted">
                            {JSON.stringify(s.settingValueJson)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground-muted">Chưa có setting</p>
                  )}

                  {/* Add setting */}
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      placeholder="key"
                      value={newSettingKey}
                      onChange={(e) => setNewSettingKey(e.target.value)}
                      className="font-mono"
                    />
                    <Input
                      placeholder="value"
                      value={newSettingValue}
                      onChange={(e) => setNewSettingValue(e.target.value)}
                    />
                    <Button size="sm" onClick={handleAddSetting} disabled={!newSettingKey.trim()}>
                      Lưu
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
