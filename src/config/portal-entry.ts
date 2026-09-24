import { Building2, LayoutDashboard, Store, UserRound } from "lucide-react";
import type { UserRole } from "@/lib/api/types/users";

export const dashboardRoles: UserRole[] = ["SUPER_ADMIN", "OPERATOR", "AGENCY_ADMIN", "TEAM_LEADER"];
export const salesRoles: UserRole[] = ["SALES", "COLLABORATOR"];
export const ownerRoles: UserRole[] = ["OWNER"];
export const customerRoles: UserRole[] = ["CUSTOMER"];

export type PortalSlug = "dashboard" | "sales-portal" | "owner-portal" | "customer-portal";

export interface PortalEntry {
  slug: PortalSlug;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

export const portalEntries: Record<PortalSlug, PortalEntry> = {
  "dashboard": {
    slug: "dashboard",
    label: "Bảng điều khiển",
    icon: LayoutDashboard,
    roles: dashboardRoles,
  },
  "sales-portal": {
    slug: "sales-portal",
    label: "Quản lý bán hàng",
    icon: Store,
    roles: salesRoles,
  },
  "owner-portal": {
    slug: "owner-portal",
    label: "Quản lý BĐS",
    icon: Building2,
    roles: ownerRoles,
  },
  "customer-portal": {
    slug: "customer-portal",
    label: "Cổng khách hàng",
    icon: UserRound,
    roles: customerRoles,
  },
};

export function isValidPortalSlug(slug: string): slug is PortalSlug {
  return slug in portalEntries;
}

export function getPortalEntry(roleCodes?: string[] | string | null): PortalEntry | null {
  if (!roleCodes) return null;
  const codes = Array.isArray(roleCodes) ? roleCodes : [roleCodes];
  if (codes.length === 0) return null;
  if (codes.some((c) => dashboardRoles.includes(c as UserRole))) {
    return portalEntries["dashboard"];
  }
  if (codes.some((c) => salesRoles.includes(c as UserRole))) {
    return portalEntries["sales-portal"];
  }
  if (codes.some((c) => ownerRoles.includes(c as UserRole))) {
    return portalEntries["owner-portal"];
  }
  if (codes.some((c) => customerRoles.includes(c as UserRole))) {
    return portalEntries["customer-portal"];
  }
  return null;
}

export function canAccessPortal(portal: string, roleCodes?: string[] | string | null): boolean {
  if (!roleCodes) return false;
  const codes = Array.isArray(roleCodes) ? roleCodes : [roleCodes];
  if (codes.length === 0) return false;
  const slug = portal.startsWith("/") ? (portal.slice(1) as PortalSlug) : (portal as PortalSlug);
  if (!isValidPortalSlug(slug)) return false;
  return codes.some((c) => portalEntries[slug].roles.includes(c as UserRole));
}
