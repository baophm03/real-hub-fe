"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-section";
import { usePatchApiPassword } from "@/lib/api/endpoints/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  confirmPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Xác nhận mật khẩu không khớp",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "Mật khẩu mới phải khác mật khẩu hiện tại",
  path: ["newPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ChangePasswordCard() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { mutateAsync: changePassword, isPending: changingPassword } = usePatchApiPassword();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword({
        data: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      });
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      resetPassword();
      logout();
      router.push("/login");
    } catch (err) {
      toast.error(
        (err as any)?.response?.data?.error?.message?.[0] ||
        (err as any)?.response?.data?.message ||
        "Có lỗi xảy ra khi đổi mật khẩu, vui lòng thử lại"
      );
      console.error(err);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Đổi mật khẩu</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField labelClassName="text-sm text-foreground-muted" label="Mật khẩu hiện tại" htmlFor="currentPassword" required error={passwordErrors.currentPassword?.message}>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="pr-11"
                  {...registerPassword("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>
            <FormField labelClassName="text-sm text-foreground-muted" label="Mật khẩu mới" htmlFor="newPassword" required error={passwordErrors.newPassword?.message}>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Ít nhất 8 ký tự"
                  className="pr-11"
                  {...registerPassword("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>
            <FormField labelClassName="text-sm text-foreground-muted" label="Xác nhận mật khẩu" htmlFor="confirmPassword" required error={passwordErrors.confirmPassword?.message}>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  className="pr-11"
                  {...registerPassword("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" disabled={changingPassword}>
              {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
