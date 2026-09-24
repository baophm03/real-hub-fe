"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { customInstance } from "@/lib/api/mutator/custom-instance";
import { useAuthStore } from "@/lib/stores/auth-store";

interface TenantBranding {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Resolve tenant hiện tại qua `GET /api/tenants/code/:code` (public)
 * và apply `primaryColor` lên CSS var `--primary` cho dynamic branding.
 * Tenant code lấy từ auth-store → fallback NEXT_PUBLIC_TENANT_CODE → "DEMO".
 */
export function useTenantBranding() {
  const tenantCode =
    useAuthStore((s) => s.tenantCode) ?? process.env.NEXT_PUBLIC_TENANT_CODE ?? "DEMO";

  const { data } = useQuery({
    queryKey: ["tenant-branding", tenantCode],
    queryFn: async () => {
      const res = await customInstance<{ data?: TenantBranding } | TenantBranding>({
        url: `/api/tenants/code/${encodeURIComponent(tenantCode)}`,
        method: "GET",
      });
      // TransformInterceptor wrap { success, data }
      return ((res as any)?.data ?? res) as TenantBranding;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const primaryColor = data?.primaryColor;

  useEffect(() => {
    const root = document.documentElement;
    if (primaryColor && HEX_COLOR_RE.test(primaryColor)) {
      root.style.setProperty("--primary", primaryColor);
      return () => {
        root.style.removeProperty("--primary");
      };
    }
  }, [primaryColor]);

  return { tenant: data, tenantCode };
}
