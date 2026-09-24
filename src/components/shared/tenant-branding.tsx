"use client";

import { useTenantBranding } from "@/lib/hooks/use-tenant-branding";

/**
 * Apply tenant branding (primaryColor → --primary CSS var).
 * Mount 1 lần ở locale layout — render ra null.
 */
export function TenantBranding() {
  useTenantBranding();
  return null;
}
