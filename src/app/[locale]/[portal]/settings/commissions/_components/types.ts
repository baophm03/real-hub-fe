import type { CommissionRuleDto } from "@/lib/api/models/commissionRuleDto";
import type { CommissionSplitDto } from "@/lib/api/models/commissionSplitDto";
import type { CommissionOptions } from "@/lib/api/endpoints/commission-meta";
import { CircleDashed, Clock, CheckCircle2, Layers } from "lucide-react";

// ── Types ────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  version?: number;
  status: string;
  priority?: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  rules?: Rule[];
  _count?: { dealCommissions: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface Rule extends Omit<CommissionRuleDto, "splits" | "conditionsJson"> {
  id?: string;
  commissionType?: string;
  dealType?: string;
  propertyTypeId?: string;
  sellingMode?: string;
  zoneId?: string;
  projectId?: string;
  leadSource?: string;
  splits: Split[];
}

export interface Split extends CommissionSplitDto {
  id?: string;
  receiverName?: string;
}

// ── Constants ────────────────────────────────────────────

export const statusConfig: Record<
  string,
  { variant: "default" | "blue" | "green" | "yellow" | "purple"; icon: typeof Clock }
> = {
  DRAFT: { variant: "default", icon: CircleDashed },
  PENDING_APPROVAL: { variant: "yellow", icon: Clock },
  ACTIVE: { variant: "green", icon: CheckCircle2 },
  ARCHIVED: { variant: "purple", icon: Layers },
};

// ── Helpers ──────────────────────────────────────────────


export function emptyRule(options?: CommissionOptions): Rule {
  return {
    name: "",
    priority: 0,
    commissionType: options?.commissionTypes[0]?.value,
    dealType: "",
    propertyTypeId: "",
    sellingMode: "",
    zoneId: "",
    projectId: "",
    leadSource: "",
    calculationType: options?.calculationTypes[0]?.value ?? "",
    calculationValue: 0,
    calculationBase: options?.calculationBases[0]?.value ?? "",
    minCommissionAmount: undefined,
    maxCommissionAmount: undefined,
    splits: [emptySplit(options)],
  };
}

export function emptySplit(options?: CommissionOptions): Split {
  return {
    receiverType: options?.receiverTypes[0]?.value ?? "",
    receiverRole: options?.receiverRoles[0]?.value,
    splitType: options?.splitTypes[0]?.value ?? "",
    splitValue: 0,
  };
}
