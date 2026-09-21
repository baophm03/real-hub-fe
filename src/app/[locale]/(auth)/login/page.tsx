"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, EyeOff, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUserStore } from "@/lib/stores/user-store";
import { useForm } from "react-hook-form";
import { usePostApiLogin } from "@/lib/api/endpoints/auth";
import { useGetApiMe } from "@/lib/api/endpoints/auth";
import { GetAuthMeResponse } from "@/lib/api/types/auth-me";
import { AuthCard } from "../_components/auth-card";

interface LoginFormData {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  // store
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useUserStore((s) => s.setUser);

  const { refetch: getProfile } = useGetApiMe({
    query: { enabled: false },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>();

  // mutation
  const { mutate: login, isPending } = usePostApiLogin({
    mutation: {
      onSuccess: async (res: any) => {
        setAuth({
          activeTenantId: res?.data?.activeTenantId,
          expiresIn: res?.data?.expiresIn,
          roleInTenant: res?.data?.roleInTenant,
          sessionId: res?.data?.sessionId,
          accessToken: res?.data?.accessToken,
          refreshToken: res?.data?.refreshToken,
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
            fullName: profileData.fullName,
            phone: profileData.phone,
            avatarFile: profileData.avatarFile,
            status: profileData.status,
            roles: (profileData.roles ?? []).map(mapRole),
            lastLoginAt: profileData.lastLoginAt,
            createdAt: profileData.createdAt,
          });
        }
      },
      onError: (err: any) => {
        const apiError = err?.response?.data?.error;
        const messages = apiError?.message;
        const isPendingVerification = Array.isArray(messages)
          ? messages.includes("Please verify your email first")
          : messages === "Please verify your email first";
        const errorMessage = Array.isArray(messages)
          ? messages[0]
          : messages || "Đã có lỗi xảy ra vui lòng thử lại";
        setError(
          isPendingVerification
            ? "Tài khoản chưa được xác thực email. Vui lòng nhập mã OTP được gửi đến email của bạn."
            : errorMessage
        );
        setNeedsVerification(isPendingVerification);
      }
    },
  });

  const onSubmit = async (formData: LoginFormData) => {
    setError(null);
    setNeedsVerification(false);

    login({
      data: {
        identifier: formData.identifier,
        password: formData.password,
      },
    });
  };

  return (
    <div className="relative grid min-h-[100dvh] w-full lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-foreground lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14 xl:px-20 xl:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(74,139,95,0.55) 0%, transparent 42%), radial-gradient(circle at 82% 78%, rgba(247,246,243,0.10) 0%, transparent 48%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold tracking-tight text-background"
          >
            RealHub
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="font-serif text-[2rem] leading-[1.15] tracking-tight text-background/95 xl:text-[2.5rem]">
            Hệ sinh thái Bất động sản{" "}
            <span className="italic text-accent-green/80">đa tenant</span> — kết nối toàn vòng đời.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-background/55">
            Sản phẩm · Khách hàng · Lịch hẹn · Giao dịch · Hoa hồng
          </p>
        </div>
        <div className="relative z-10 text-[11px] uppercase tracking-[0.18em] text-background/40">
          © {new Date().getFullYear()} RealHub
        </div>
      </aside>

      <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6 lg:min-h-0 lg:px-14 lg:py-16 xl:px-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 25%, var(--surface-muted) 0%, transparent 45%), radial-gradient(circle at 85% 75%, var(--surface-muted) 0%, transparent 50%)",
          }}
        />
        <Link
          href="/"
          className="relative z-10 mb-8 font-serif text-2xl font-semibold tracking-tight lg:hidden"
        >
          RealHub
        </Link>
        <div className="relative z-10 flex w-full justify-center animate-fade-up">
          <AuthCard
            title="Đăng nhập"
            subtitle="Nhập thông tin tài khoản để tiếp tục"
            className="max-w-md"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="identifier" className="text-[13px] font-medium">Email hoặc username</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Email hoặc username của bạn"
                  autoComplete="username"
                  {...register("identifier")}
                  aria-invalid={!!errors.identifier}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                />
                {errors.identifier && (
                  <p id="identifier-error" className="text-xs text-accent-red-text">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-[13px] font-medium">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className="pr-11"
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted transition-colors duration-300 hover:text-foreground"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-accent-red-text">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot password — đặt ngay dưới field, căn phải */}
              <div className="-mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-foreground-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
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

              {needsVerification && (
                <Link
                  href={watch("identifier")?.includes("@")
                    ? `/verify-otp?email=${encodeURIComponent(watch("identifier"))}`
                    : "/verify-otp"}
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <MailCheck size={16} />
                  Xác thực email ngay
                </Link>
              )}

              <Button type="submit" disabled={isPending} className="mt-1 w-full" size="lg">
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
              >
                <span>Chưa có tài khoản? Đăng ký</span>
                <span className="inline-flex size-6 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight size={12} />
                </span>
              </Link>
            </div>
          </AuthCard>
        </div>
      </main>
    </div>
  );
}
