import type { WorkflowStateDto } from "@/lib/api/models/workflowStateDto";
import type { WorkflowTransitionDto } from "@/lib/api/models/workflowTransitionDto";
import { CircleDashed, CheckCircle2, Layers } from "lucide-react";

// ── Types ────────────────────────────────────────────────
// WorkflowState/WorkflowTransition: response shape of
// GET /api/workflows/:id/states and /:id/transitions (lazy-loaded)

export interface WorkflowState {
  id: string;
  stateName: string;
  columnName: string;
  isInitial: boolean;
  isFinal: boolean;
  sortOrder: number;
  color?: string | null;
}

export interface WorkflowTransition {
  id: string;
  actionCode: string;
  actionLabel: string;
  requiredRoleJson?: unknown;
  requireReason: boolean;
  requireAttachment: boolean;
  status: string;
  fromState: { id: string; stateName: string; columnName: string; isInitial: boolean; isFinal: boolean };
  toState: { id: string; stateName: string; columnName: string; isInitial: boolean; isFinal: boolean };
}

export interface WorkflowDefinition {
  id: string;
  entityType: string;
  name: string;
  version: number;
  status: string;
  stateCount: number;
  transitionCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Entity Type Labels ───────────────────────────────────

export const entityTypeConfig: Record<
  string,
  { label: string; icon: typeof Layers }
> = {
  PROPERTY: { label: "Bất động sản", icon: Layers },
  LEAD: { label: "Nguồn khách hàng", icon: Layers },
  DEAL: { label: "Giao dịch", icon: Layers },
};

export const entityTypeOptions = Object.entries(entityTypeConfig).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

// ── Status Config ────────────────────────────────────────

export const statusConfig: Record<
  string,
  { label: string; variant: "default" | "blue" | "green" | "yellow" | "purple"; icon: typeof CheckCircle2 }
> = {
  ACTIVE: { label: "Đang áp dụng", variant: "green", icon: CheckCircle2 },
  DRAFT: { label: "Bản nháp", variant: "default", icon: CircleDashed },
  ARCHIVED: { label: "Lưu trữ", variant: "purple", icon: Layers },
};

export const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang áp dụng" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

// ── Color presets for states ─────────────────────────────

export const stateColorPresets: { value: string; label: string }[] = [
  { value: "#6b7280", label: "Xám" },
  { value: "#3b82f6", label: "Xanh dương" },
  { value: "#10b981", label: "Xanh lá" },
  { value: "#f59e0b", label: "Vàng" },
  { value: "#ef4444", label: "Đỏ" },
  { value: "#8b5cf6", label: "Tím" },
  { value: "#ec4899", label: "Hồng" },
  { value: "#14b8a6", label: "Teal" },
];

// ── Helpers ──────────────────────────────────────────────

export function emptyState(): WorkflowStateDto {
  return {
    stateName: "",
    columnName: "",
    isInitial: false,
    isFinal: false,
    sortOrder: 0,
  };
}

export function emptyTransition(): WorkflowTransitionDto {
  return {
    fromStateName: "",
    toStateName: "",
    actionCode: "",
    actionLabel: "",
    requiredRoleJson: [] as any,
    requireReason: false,
    requireAttachment: false,
  };
}

export const roleLabel: Record<string, string> = {};


