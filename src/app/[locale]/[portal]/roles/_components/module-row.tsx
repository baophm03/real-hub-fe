"use client";

import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  hasPermissionInSet,
  type PermissionKey,
} from "@/config/permissions";
import { cn } from "@/lib/utils";
import type { PermissionActionDef, PermissionModuleDef } from "./types";

const SCOPED_MODULES = new Set([
  "PROPERTY",
  "LEAD",
  "CUSTOMER",
  "DEAL",
  "APPOINTMENT",
  "FILE",
  "NOTIFICATION",
  "NEWS",
]);
const COMMISSION_READ_SCOPE_ACTIONS = new Set(["READ", "READ_OWN", "READ_ALL"]);

interface ModuleRowProps {
  mod: PermissionModuleDef;
  permissionSet: Set<PermissionKey>;
  onToggle: (module: string, action: string) => void;
  onToggleModule: (actions: PermissionActionDef[], module: string) => void;
}

export const ModuleRow = memo(function ModuleRow({
  mod,
  permissionSet,
  onToggle,
  onToggleModule,
}: ModuleRowProps) {
  const isScoped = SCOPED_MODULES.has(mod.module);

  const allChecked = mod.actions
    .filter((action) => mod.module !== "COMMISSION" || !COMMISSION_READ_SCOPE_ACTIONS.has(action.action))
    .every((a) =>
    hasPermissionInSet(permissionSet, mod.module, a.action),
  ) && (mod.module !== "COMMISSION" || [...COMMISSION_READ_SCOPE_ACTIONS].some((action) =>
    hasPermissionInSet(permissionSet, mod.module, action),
  ));
  const someChecked = mod.actions.some((a) =>
    hasPermissionInSet(permissionSet, mod.module, a.action),
  );

  const isOwnDisabled = (action: string): boolean => {
    if (!action.endsWith("_OWN")) return false;
    const baseAction = action.replace("_OWN", "");
    const allAction = `${baseAction}_ALL`;
    return hasPermissionInSet(permissionSet, mod.module, allAction);
  };

  const handleToggleWithAuto = (action: string) => {
    if (action.endsWith("_ALL")) {
      const baseAction = action.replace("_ALL", "");
      const ownAction = `${baseAction}_OWN`;
      if (!hasPermissionInSet(permissionSet, mod.module, action)) {
        if (!hasPermissionInSet(permissionSet, mod.module, ownAction)) {
          onToggle(mod.module, ownAction);
        }
      }
    }
    onToggle(mod.module, action);
  };

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-3">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Checkbox
          checked={allChecked}
          indeterminate={!allChecked && someChecked}
          onCheckedChange={() => onToggleModule(mod.actions, mod.module)}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{mod.label}</span>
          <span className="text-[10px] font-mono uppercase tracking-wide text-foreground-muted">
            {mod.module}
          </span>
        </div>
        {mod.description && (
          <span className="ml-auto text-xs text-foreground-muted">
            {mod.description}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 pt-2 sm:grid-cols-3 md:grid-cols-4">
        {mod.actions.map((act) => {
          const checked = hasPermissionInSet(
            permissionSet,
            mod.module,
            act.action,
          );
          const ownDisabled = isScoped && isOwnDisabled(act.action);
          return (
            <label
              key={act.action}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                ownDisabled
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-surface-muted",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={ownDisabled}
                onCheckedChange={() =>
                  isScoped ? handleToggleWithAuto(act.action) : onToggle(mod.module, act.action)
                }
              />
              <span className="flex flex-col">
                <span>{act.label}</span>
                <span className="text-[10px] font-mono uppercase text-foreground-muted">
                  {act.action}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
});
