"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Key,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Can } from "@casl/react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGetApiPermissions } from "@/lib/api/endpoints/permissions";
import {
  useGetApiRoleId,
  usePutApiRoleIdPermissions,
  getGetApiRolesQueryKey,
  getGetApiRoleIdQueryKey,
} from "@/lib/api/endpoints/roles";
import type { PermissionEntryDto } from "@/lib/api/models/permissionEntryDto";
import {
  buildPermissionSet,
  hasPermissionInSet,
  togglePermissionInSet,
  type PermissionKey,
} from "@/config/permissions";
import { RoleUsersTab } from "./role-users-tab";
import { ModuleRow } from "./module-row";
import type {
  Role,
  RoleDetailResponse,
  PermissionActionDef,
  PermissionModuleDef,
  PermissionsResponse,
} from "./types";

const COMMISSION_READ_SCOPE_ACTIONS = ["READ", "READ_OWN", "READ_ALL"] as const;

interface PermissionDialogProps {
  roleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionDialog({ roleId, open, onOpenChange }: PermissionDialogProps) {
  const queryClient = useQueryClient();

  const { data: permissionsData } = useGetApiPermissions();
  const permissionModules: PermissionModuleDef[] =
    (permissionsData as unknown as PermissionsResponse)?.data ?? [];

  const { data: roleData, isLoading: roleLoading } = useGetApiRoleId(roleId ?? "", {
    query: { enabled: open && !!roleId },
  });
  const role: Role | null = (roleData as unknown as RoleDetailResponse)?.data ?? null;

  const [permissionSet, setPermissionSet] = useState<Set<PermissionKey>>(new Set());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const originalPermissionSet = useMemo(
    () => (role ? buildPermissionSet(role.permissions.map((p) => ({ module: p.module, action: p.action }))) : new Set<PermissionKey>()),
    [role?.id, role?.permissions],
  );

  useEffect(() => {
    if (role) {
      setPermissionSet(
        buildPermissionSet(
          role.permissions.map((p) => ({ module: p.module, action: p.action })),
        ),
      );
      setSearch("");
    }
  }, [role?.id, role?.permissions]);

  const { mutateAsync: updatePermissions } = usePutApiRoleIdPermissions();

  const filteredModules = useMemo(() => {
    if (!search.trim()) return permissionModules;
    const q = search.toLowerCase();
    return permissionModules.filter(
      (m) =>
        m.module.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q),
    );
  }, [permissionModules, search]);

  const handleToggle = useCallback(
    (module: string, action: string) => {
      setPermissionSet((prev) => {
        const next = togglePermissionInSet(prev, module, action);
        const isCommissionReadScope =
          module === "COMMISSION" &&
          COMMISSION_READ_SCOPE_ACTIONS.some((scopeAction) => scopeAction === action);
        if (!isCommissionReadScope || !hasPermissionInSet(next, module, action)) {
          return next;
        }

        for (const scopeAction of COMMISSION_READ_SCOPE_ACTIONS) {
          if (scopeAction !== action) next.delete(`${module}:${scopeAction}`);
        }
        return next;
      });
    },
    [],
  );

  const handleToggleModule = useCallback(
    (moduleActions: PermissionActionDef[], module: string) => {
      setPermissionSet((prev) => {
        const next = new Set(prev);
        const scopedReadActions = module === "COMMISSION"
          ? COMMISSION_READ_SCOPE_ACTIONS
          : [];
        const nonScopeActions = moduleActions.filter(
          (a) => !scopedReadActions.some((scopeAction) => scopeAction === a.action),
        );
        const hasReadScope = scopedReadActions.some((action) =>
          hasPermissionInSet(next, module, action),
        );
        const allChecked = nonScopeActions.every((a) =>
          hasPermissionInSet(next, module, a.action),
        ) && (!scopedReadActions.length || hasReadScope);
        for (const a of moduleActions) {
          const key = `${module}:${a.action}`;
          if (allChecked) next.delete(key);
          else next.add(key);
        }
        if (!allChecked && scopedReadActions.length) {
          for (const action of scopedReadActions) {
            if (action !== "READ_ALL") next.delete(`${module}:${action}`);
          }
        }
        return next;
      });
    },
    [],
  );

  const hasChanges = useMemo(() => {
    if (!role) return false;
    if (permissionSet.size !== originalPermissionSet.size) return true;
    for (const key of permissionSet) {
      if (!originalPermissionSet.has(key)) return true;
    }
    return false;
  }, [role, permissionSet, originalPermissionSet]);

  const handleSave = async () => {
    if (!role || !roleId) return;
    setSaving(true);
    try {
      const validKeys = new Set<string>(
        permissionModules.flatMap((m) =>
          m.actions.map((a) => `${m.module}:${a.action}`),
        ),
      );
      const perms: PermissionEntryDto[] = Array.from(permissionSet)
        .filter((key) => validKeys.has(key))
        .map((key) => {
          const [module, action] = key.split(":");
          return { module, action };
        });
      await updatePermissions({
        id: roleId,
        data: { permissions: perms },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetApiRolesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetApiRoleIdQueryKey(roleId) }),
      ]);
      toast.success(`Đã cập nhật quyền cho role "${role.name}"`);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message?.[0] ?? "Lưu quyền thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key size={18} />
              Phân quyền: {roleLoading ? "..." : role?.name}
            </DialogTitle>
            <DialogDescription>
              {role?.description || "Chọn các quyền cho role này"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="permissions" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full">
              <TabsTrigger value="permissions">
                <Key size={14} />
                Quyền
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users size={14} />
                Thành viên
                {role && (role._count?.membershipRoles ?? 0) > 0 && (
                  <Badge variant="default" className="ml-1 text-[10px] tabular-nums">
                    {role._count?.membershipRoles}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Permissions ── */}
            <TabsContent value="permissions" className="flex-1 flex flex-col min-h-0 gap-3">
              <Input
                type="search"
                placeholder="Tìm module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />

              <div className="flex-1 overflow-y-auto -mx-2 px-2">
                {permissionModules.length === 0 && !search ? (
                  <div className="flex items-center justify-center py-8 text-sm text-foreground-muted">
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Đang tải danh sách quyền...
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredModules.map((mod) => (
                      <ModuleRow
                        key={mod.module}
                        mod={mod}
                        permissionSet={permissionSet}
                        onToggle={handleToggle}
                        onToggleModule={handleToggleModule}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                <span className="text-xs text-foreground-muted">
                  {permissionSet.size} quyền đã chọn
                  {hasChanges && " • có thay đổi chưa lưu"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                  >
                    Hủy
                  </Button>
                  <Can I="UPDATE" a="ROLE">
                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Lưu
                        </>
                      )}
                    </Button>
                  </Can>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Users ── */}
            <TabsContent value="users" className="flex-1 flex flex-col min-h-0">
              {roleId && (
                <RoleUsersTab roleId={roleId} />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
