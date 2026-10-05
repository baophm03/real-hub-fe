"use client"

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Spinner } from "@/components/ui/spinner";
import { useUserStore } from "@/lib/stores/user-store";

/** Chỉ cho phép redirect tới đường dẫn nội bộ, chặn open-redirect. */
function safeRedirectPath(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasUser = useUserStore((s) => !!s.user);

  const shouldRedirect = isAuthenticated && hasUser;

  useEffect(() => {
    if (!hasHydrated) return;
    if (shouldRedirect) router.push(safeRedirectPath(searchParams.get("redirect")));
  }, [hasHydrated, shouldRedirect, router, searchParams]);

  if (!hasHydrated || shouldRedirect) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 py-12">
        <Spinner className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background">
      <div className="relative z-10 flex w-full justify-center animate-fade-up">
        {children}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 py-12">
          <Spinner className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
