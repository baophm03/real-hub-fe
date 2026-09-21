"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePostApiForgotPassword,
  usePutApiResetPassword,
} from "@/lib/api/endpoints/auth";
import { AuthCard } from "../_components/auth-card";

function mapForgotPasswordError(err: any): string {
  const messages = err?.response?.data?.error?.message;
  const message = Array.isArray(messages) ? messages[0] : messages;
  switch (message) {
    case "Please wait before requesting a new reset code":
      return "Vui lòng đợi chút trước khi yêu cầu gửi lại mã.";
    default:
      return message || "Đã có lỗi xảy ra, vui lòng thử lại";
  }
}

function mapResetPasswordError(err: any): string {
  const messages = err?.response?.data?.error?.message;
  const message = Array.isArray(messages) ? messages[0] : messages;
  switch (message) {
    case "User not found":
      return "Không tìm thấy người dùng với email này.";
    case "Invalid or expired reset code":
      return "Mã đặt lại không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.";
    default:
      return message || "Đã có lỗi xảy ra, vui lòng thử lại";
  }
}

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { mutate: forgotPassword, isPending } = usePostApiForgotPassword({
    mutation: {
      onSuccess: () => setSent(true),
      onError: (err: any) => setError(mapForgotPasswordError(err)),
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

    forgotPassword({ data: { email: normalizedEmail } });
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-accent-green/40 bg-accent-green/30 px-4 py-3.5">
          <MailCheck size={18} className="mt-0.5 shrink-0 text-accent-green-text" />
          <div className="text-sm leading-relaxed text-accent-green-text">
            Yêu cầu đặt lại mật khẩu thành công. Vui lòng kiểm tra hộp thư của bạn.
          </div>
        </div>
        <Link href="/login">
          <Button variant="secondary" className="w-full" size="lg">
            Quay lại đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Nhập email của bạn"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
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
        {isPending ? "Đang gửi..." : "Gửi yêu cầu"}
      </Button>
    </form>
  );
}

function ResetPasswordForm({ codeFromQuery }: { codeFromQuery: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.push("/login"), 3000);
    return () => clearTimeout(timer);
  }, [done, router]);

  const { mutate: resetPassword, isPending } = usePutApiResetPassword({
    mutation: {
      onSuccess: () => setDone(true),
      onError: (err: any) => setError(mapResetPasswordError(err)),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(codeFromQuery)) {
      setError("Mã đặt lại không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    resetPassword({
      data: { code: codeFromQuery, newPassword: password },
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-accent-green/40">
          <KeyRound size={26} className="text-accent-green-text" />
        </div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Đặt lại mật khẩu thành công
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          Bạn có thể đăng nhập bằng mật khẩu mới. Đang chuyển hướng...
        </p>
        <Link href="/login" className="mt-6 w-full">
          <Button variant="secondary" className="w-full" size="lg">
            Đăng nhập ngay
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password" className="text-[13px] font-medium">Mật khẩu mới</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            className="pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password" className="text-[13px] font-medium">Xác nhận mật khẩu</Label>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
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
        {isPending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
      </Button>
    </form>
  );
}

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const isResetMode = code.length > 0;

  return (
    <AuthCard
      title={isResetMode ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
      subtitle={
        isResetMode
          ? "Nhập mật khẩu mới để hoàn tất đặt lại"
          : "Nhập email đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu"
      }
      className="max-w-md"
      backHref="/login"
    >
      {isResetMode ? (
        <ResetPasswordForm codeFromQuery={code} />
      ) : (
        <RequestResetForm />
      )}
    </AuthCard>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
