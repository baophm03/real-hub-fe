"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function mapOtpError(err: any): string {
  const messages = err?.response?.data?.error?.message;
  const message = Array.isArray(messages) ? messages[0] : messages;
  switch (message) {
    case "Invalid OTP":
      return "Mã OTP không đúng. Vui lòng thử lại.";
    case "Too many attempts":
      return "Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.";
    case "Please wait before requesting a new OTP":
      return "Vui lòng đợi chút trước khi yêu cầu gửi lại mã.";
    case "Account already verified":
      return "Tài khoản đã được xác thực. Bạn có thể đăng nhập.";
    case "User not found":
      return "Không tìm thấy người dùng với email này.";
    default:
      return message || "Đã có lỗi xảy ra, vui lòng thử lại";
  }
}

function VerifyOtpContent() {
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
        setError(mapOtpError(err));
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
        setError(mapOtpError(err));
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Mã OTP gồm 6 chữ số");
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
            Xác thực thành công
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            Tài khoản của bạn đã được kích hoạt. Đang chuyển hướng...
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Xác thực email"
      subtitle="Nhập mã OTP 6 số đã được gửi đến email của bạn"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="otp" className="text-[13px] font-medium">Mã OTP</Label>
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
            Mã có hiệu lực trong 5 phút
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
          {isPending ? "Đang xác thực..." : "Xác thực"}
        </Button>

        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-muted">Không nhận được mã?</span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            disabled={resendCooldown > 0 || isResending || isPending}
            onClick={() => resendOtp({ data: { email: email.trim() } })}
          >
            {resendCooldown > 0
              ? `Gửi lại sau ${resendCooldown}s`
              : isResending
                ? "Đang gửi..."
                : "Gửi lại mã"}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <span>Quay lại đăng nhập</span>
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
