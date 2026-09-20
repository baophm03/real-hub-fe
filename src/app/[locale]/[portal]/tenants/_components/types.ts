import { Building2, CheckCircle2, Ban, CircleDashed, Layers } from "lucide-react";

export interface Tenant {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  _count?: { domains: number; features: number };
}

export interface TenantDetail extends Tenant {
  domains?: TenantDomain[];
  features?: TenantFeature[];
}

export interface TenantDomain {
  id: string;
  domain: string;
  subdomain?: string | null;
  isPrimary: boolean;
  status: string;
  verifiedAt?: string | null;
}

export interface TenantFeature {
  id: string;
  featureKey: string;
  isEnabled: boolean;
  configJson?: any;
}

export interface TenantSetting {
  id: string;
  tenantId: string;
  settingKey: string;
  settingValueJson: any;
}

export const typeLabel: Record<string, string> = {
  AGENCY: "Agency",
  DEVELOPER: "Chủ đầu tư",
  DISTRIBUTOR: "Phân phối",
  PLATFORM_INTERNAL: "Nội bộ",
};

export const typeOptions = Object.keys(typeLabel).map((k) => ({
  value: k,
  label: typeLabel[k] ?? k,
}));

export const statusConfig: Record<
  string,
  { label: string; variant: "green" | "default" | "purple"; icon: typeof CheckCircle2 }
> = {
  ACTIVE: { label: "Đang hoạt động", variant: "green", icon: CheckCircle2 },
  INACTIVE: { label: "Tắt", variant: "default", icon: Ban },
  SUSPENDED: { label: "Tạm khóa", variant: "purple", icon: CircleDashed },
  ARCHIVED: { label: "Lưu trữ", variant: "purple", icon: Layers },
};

export const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Tắt" },
  { value: "SUSPENDED", label: "Tạm khóa" },
];


export { Building2 };
