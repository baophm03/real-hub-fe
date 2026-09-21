"use client";

import { ability } from "@/config/casl/ability";
import { notFound } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUserStore } from "@/lib/stores/user-store";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user = useUserStore((s) => s.user);

  if (!hasHydrated || !user) return null;

  if (!ability.can('VIEW', 'POOL')) {
    notFound();
  }

  return children;
}
