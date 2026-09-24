"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePostApiVerifyOtp, usePostApiResendOtp, useGetApiMe } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUserStore } from "@/lib/stores/user-store";
import { GetAuthMeResponse } from "@/lib/api/types/auth-me";
import { AuthCard } from "../_components/auth-card";

const OTP_RESEND_COOLDOWN_SECONDS = 60;

type AuthT = (key: string) => string;

function mapOtpError(err: any, t: AuthT): string {
  const messages = err?.response?.data?.error?.message;
  const message = Array.isArray(messages) ? messages[0] : messages;
  switch (message) {
    case "Invalid OTP":
      return t("errInvalidOtp");
    case "Too many attempts":
      return t("errTooManyAttempts");
    case "Please wait before requesting a new OTP":
      return t("errOtpRateLimited");
    case "Account already verified":
      return t("errAlreadyVerified");
    case "User not found":
      return t("errUserNotFound");
    default:
      return message || t("genericError");
  }
}

function VerifyOtpContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useUserStore((s) => s.setUser);
  const { refetch: getProfile } = useGetApiMe({
    query: { enabled: false },
  });

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const { mutate: verifyOtp, isPending } = usePostApiVerifyOtp({
    mutation: {
      onSuccess: async (res: any) => {
        const payload = res?.data ?? res;
        if (payload?.accessToken) {
          setAuth({
            activeTenantId: payload.activeTenantId,
            expiresIn: payload.expiresIn,
            roleInTenant: payload.roleInTenant,
            sessionId: payload.sessionId,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
          });

          const profile = await getProfile();
          const profileData = (profile.data as unknown as GetAuthMeResponse)?.data;

          if (profileData) {
            const mapRole = (r: any) => ({
              code: r.code,
              name: r.name,
              description: r.description,
              permissions: (r.permissions ?? []).map((p: any) => ({
                module: p.module,
                action: p.action,
              })),
            });
            setUser({
              id: profileData.id,
              email: profileData.email,
              username: profileData.username,
              fullName: profileData.fullName,
              phone: profileData.phone,
              avatarFile: profileData.avatarFile,
              status: profileData.status,
              roles: (profileData.roles ?? []).map(mapRole),
              lastLoginAt: profileData.lastLoginAt,
              createdAt: profileData.createdAt,
            });
          }
        }
        setVerified(true);
      },
      onError: (err: any) => {
        setError(mapOtpError(err, t));
      },
    },
  });

  const { mutate: resendOtp, isPending: isResending } = usePostApiResendOtp({
    mutation: {
      onSuccess: () => {
        setError(null);
        setOtp("");
        setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      },
      onError: (err: any) => {
        setError(mapOtpError(err, t));
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError(t("emailInvalid"));
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError(t("otpInvalid"));
      return;
    }

    verifyOtp({ data: { email: normalizedEmail, otp } });
  };

  if (verified) {
    return (
      <AuthCard className="max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-accent-green/40">
            <MailCheck size={26} className="text-accent-green-text" />
          </div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            {t("verifiedTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            {t("verifiedDesc")}
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("verifyTitle")}
      subtitle={t("verifySubtitle")}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-[13px] font-medium">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="otp" className="text-[13px] font-medium">{t("otpLabel")}</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-lg font-semibold tracking-[0.5em]"
            aria-invalid={!!error}
          />
          <p className="text-xs text-foreground-muted">
            {t("otpHint")}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg bg-accent-red/20 px-4 py-3 text-sm text-accent-red-text"
          >
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="mt-1 w-full" size="lg">
          {isPending ? t("verifying") : t("verify")}
        </Button>

        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-muted">{t("noCode")}</span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            disabled={resendCooldown > 0 || isResending || isPending}
            onClick={() => resendOtp({ data: { email: email.trim() } })}
          >
            {resendCooldown > 0
              ? t("resendIn", { seconds: resendCooldown })
              : isResending
                ? t("resending")
                : t("resend")}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <span>{t("backToLogin")}</span>
          <span className="inline-flex size-6 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight size={12} />
          </span>
        </Link>
      </div>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
