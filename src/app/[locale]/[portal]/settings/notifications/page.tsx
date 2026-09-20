"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Plus, Pencil, Trash2, FileText, MoreVertical } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Can } from "@casl/react";
import { ability } from "@/config/casl/ability";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  useGetApiNotificationRules,
  useGetApiNotificationTemplates,
  useDeleteApiNotificationRule,
  useDeleteApiNotificationTemplate,
  getGetApiNotificationRulesQueryKey,
  getGetApiNotificationTemplatesQueryKey,
} from "@/lib/api/endpoints/notifications";
import {
  eventCodeOptions,
  eventCodeLabel,
  receiverTypeLabel,
  channelLabel,
  channelIcon,
  type NotificationRule,
  type NotificationTemplate,
} from "./_components/types";
import { formatDate } from "@/utils";
import { NotificationRuleFormDialog } from "./_components/notification-rule-form-dialog";
import { NotificationTemplateFormDialog } from "./_components/notification-template-form-dialog";
import { DeleteConfirmDialog } from "./_components/delete-confirm-dialog";

export default function NotificationsSettingsPage() {
  const canCreate = ability.can("CREATE", "SETTING");
  const canUpdate = ability.can("UPDATE", "SETTING");
  const canDelete = ability.can("DELETE", "SETTING");
  const queryClient = useQueryClient();

  // ── Rules state ──
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleEventFilter, setRuleEventFilter] = useState<string>("");
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<NotificationRule | null>(null);

  // ── Templates state ──
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateChannelFilter, setTemplateChannelFilter] = useState<string>("");
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<NotificationTemplate | null>(null);

  // ── Queries ──
  const { data: rulesRaw, isLoading: rulesLoading } = useGetApiNotificationRules(
    ruleEventFilter ? { eventCode: ruleEventFilter } : undefined,
  );
  const rules: NotificationRule[] = (rulesRaw as any)?.data ?? [];

  const { data: templatesRaw, isLoading: templatesLoading } = useGetApiNotificationTemplates(
    templateChannelFilter ? { channel: templateChannelFilter as any } : undefined,
  );
  const templates: NotificationTemplate[] = (templatesRaw as any)?.data ?? [];

  // ── Mutations ──
  const { mutateAsync: deleteRule, isPending: isDeletingRule } = useDeleteApiNotificationRule({
    mutation: {
      onSuccess: () => {
        toast.success("Đã xóa rule");
        setDeleteRuleTarget(null);
        queryClient.invalidateQueries({ queryKey: getGetApiNotificationRulesQueryKey() });
      },
      onError: (e: any) =>
        toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi xóa rule"),
    },
  });

  const { mutateAsync: deleteTemplate, isPending: isDeletingTemplate } =
    useDeleteApiNotificationTemplate({
      mutation: {
        onSuccess: () => {
          toast.success("Đã xóa template");
          setDeleteTemplateTarget(null);
          queryClient.invalidateQueries({
            queryKey: getGetApiNotificationTemplatesQueryKey(),
          });
        },
        onError: (e: any) =>
          toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi xóa template"),
      },
    });

  // ── Filtered data ──
  const filteredRules = useMemo(() => {
    if (!ruleSearch.trim()) return rules;
    const q = ruleSearch.toLowerCase();
    return rules.filter(
      (r) =>
        r.eventCode.toLowerCase().includes(q) ||
        (r.receiverType || "").toLowerCase().includes(q) ||
        (r.channel || "").toLowerCase().includes(q),
    );
  }, [rules, ruleSearch]);

  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return templates;
    const q = templateSearch.toLowerCase();
    return templates.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.titleTemplate.toLowerCase().includes(q) ||
        t.bodyTemplate.toLowerCase().includes(q),
    );
  }, [templates, templateSearch]);

  // ── Columns ──
  const ruleColumns = useMemo<ColumnDef<NotificationRule>[]>(
    () => [
      {
        accessorKey: "eventCode",
        header: "Event",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{eventCodeLabel(row.original.eventCode)}</span>
            <span className="font-mono text-xs text-foreground-muted">
              {row.original.eventCode}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "receiverType",
        header: "Người nhận",
        cell: ({ row }) => (
          <span className="text-sm">
            {receiverTypeLabel[row.original.receiverType] ?? row.original.receiverType}
          </span>
        ),
      },
      {
        accessorKey: "channel",
        header: "Channel",
        cell: ({ row }) => {
          const Icon = channelIcon[row.original.channel] ?? Bell;
          return (
            <Badge variant="default">
              <Icon size={10} />
              {channelLabel[row.original.channel] ?? row.original.channel}
            </Badge>
          );
        },
      },
      {
        accessorKey: "isEnabled",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge variant={row.original.isEnabled ? "green" : "default"}>
            {row.original.isEnabled ? "Bật" : "Tắt"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs text-foreground-muted">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted"
                    aria-label="Thao tác"
                  />
                }
              >
                <MoreVertical size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate && (
                  <DropdownMenuItem
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setEditingRule(row.original);
                      setRuleFormOpen(true);
                    }}
                  >
                    <Pencil size={14} />
                    Sửa
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setDeleteRuleTarget(row.original);
                    }}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canUpdate, canDelete],
  );

  const templateColumns = useMemo<ColumnDef<NotificationTemplate>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "titleTemplate",
        header: "Title",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.titleTemplate}</span>
        ),
      },
      {
        accessorKey: "channel",
        header: "Channel",
        cell: ({ row }) => {
          const Icon = channelIcon[row.original.channel] ?? Bell;
          return (
            <Badge variant="default">
              <Icon size={10} />
              {channelLabel[row.original.channel] ?? row.original.channel}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ACTIVE" ? "green" : "default"}>
            {row.original.status === "ACTIVE" ? "Active" : row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs text-foreground-muted">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted"
                    aria-label="Thao tác"
                  />
                }
              >
                <MoreVertical size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate && (
                  <DropdownMenuItem
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setEditingTemplate(row.original);
                      setTemplateFormOpen(true);
                    }}
                  >
                    <Pencil size={14} />
                    Sửa
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setDeleteTemplateTarget(row.original);
                    }}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canUpdate, canDelete],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt"
        title="Cấu hình thông báo & mẫu"
        description="Cấu hình thông báo tự động theo event và template nội dung"
        actions={
          <Can I="CREATE" a="SETTING">
            <Button
              onClick={() => {
                setEditingRule(null);
                setRuleFormOpen(true);
              }}
            >
              <Plus size={16} />
              Tạo rule
            </Button>
          </Can>
        }
      />

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">
            <Bell size={14} />
            Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText size={14} />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Rules tab ── */}
        <TabsContent value="rules" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground-muted">
              <span className="font-medium text-foreground">{filteredRules.length}</span> rule
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="search"
                placeholder="Tìm rule..."
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="w-full sm:w-[240px]"
              />
              <Select
                value={ruleEventFilter}
                onValueChange={(v) => setRuleEventFilter((v as string) ?? "")}
              >
                <SelectTrigger className="w-[200px] shrink-0">
                  <SelectValue placeholder="Tất cả event">
                    {(value: string) =>
                      eventCodeOptions.find((o) => o.value === value)?.label ?? "Tất cả event"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" label="Tất cả event">
                    Tất cả event
                  </SelectItem>
                  {eventCodeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {rulesLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-surface-muted" />
          ) : filteredRules.length > 0 ? (
            <DataTable
              columns={ruleColumns}
              data={filteredRules}
              emptyMessage="Không tìm thấy rule"
            />
          ) : (
            <EmptyState
              icon={<Bell size={24} />}
              title="Chưa có notification rule"
              description="Tạo rule đầu tiên để tự động gửi thông báo khi event xảy ra"
              action={
                canCreate ? (
                  <Button
                    onClick={() => {
                      setEditingRule(null);
                      setRuleFormOpen(true);
                    }}
                  >
                    <Plus size={16} />
                    Tạo rule đầu tiên
                  </Button>
                ) : undefined
              }
            />
          )}
        </TabsContent>

        {/* ── Templates tab ── */}
        <TabsContent value="templates" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground-muted">
              <span className="font-medium text-foreground">{filteredTemplates.length}</span>{" "}
              template
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="search"
                placeholder="Tìm template..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full sm:w-[240px]"
              />
              <Select
                value={templateChannelFilter}
                onValueChange={(v) => setTemplateChannelFilter((v as string) ?? "")}
              >
                <SelectTrigger className="w-[160px] shrink-0">
                  <SelectValue placeholder="Tất cả channel">
                    {(value: string) =>
                      channelLabel[value] ?? "Tất cả channel"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" label="Tất cả channel">
                    Tất cả channel
                  </SelectItem>
                  {Object.entries(channelLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value} label={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Can I="CREATE" a="SETTING">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateFormOpen(true);
                  }}
                >
                  <Plus size={16} />
                  Tạo template
                </Button>
              </Can>
            </div>
          </div>

          {templatesLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-surface-muted" />
          ) : filteredTemplates.length > 0 ? (
            <DataTable
              columns={templateColumns}
              data={filteredTemplates}
              emptyMessage="Không tìm thấy template"
            />
          ) : (
            <EmptyState
              icon={<FileText size={24} />}
              title="Chưa có notification template"
              description="Tạo template đầu tiên để dùng cho notification rules"
              action={
                canCreate ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateFormOpen(true);
                    }}
                  >
                    <Plus size={16} />
                    Tạo template đầu tiên
                  </Button>
                ) : undefined
              }
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      <NotificationRuleFormDialog
        open={ruleFormOpen}
        onOpenChange={(o) => {
          setRuleFormOpen(o);
          if (!o) setEditingRule(null);
        }}
        editing={editingRule}
      />
      <NotificationTemplateFormDialog
        open={templateFormOpen}
        onOpenChange={(o) => {
          setTemplateFormOpen(o);
          if (!o) setEditingTemplate(null);
        }}
        editing={editingTemplate}
      />
      <DeleteConfirmDialog
        open={!!deleteRuleTarget}
        title="Xóa notification rule"
        targetLabel={
          deleteRuleTarget
            ? `${eventCodeLabel(deleteRuleTarget.eventCode)} · ${receiverTypeLabel[deleteRuleTarget.receiverType] ?? deleteRuleTarget.receiverType
            }`
            : undefined
        }
        onOpenChange={(o) => !o && setDeleteRuleTarget(null)}
        isSubmitting={isDeletingRule}
        onConfirm={async () => {
          if (deleteRuleTarget) await deleteRule({ id: deleteRuleTarget.id });
        }}
      />
      <DeleteConfirmDialog
        open={!!deleteTemplateTarget}
        title="Xóa notification template"
        targetLabel={deleteTemplateTarget?.code}
        onOpenChange={(o) => !o && setDeleteTemplateTarget(null)}
        isSubmitting={isDeletingTemplate}
        onConfirm={async () => {
          if (deleteTemplateTarget) await deleteTemplate({ id: deleteTemplateTarget.id });
        }}
      />
    </div>
  );
}
