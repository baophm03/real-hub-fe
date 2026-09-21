"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { usePostApiUser } from "@/lib/api/endpoints/users";
import { getGetApiMembershipsQueryKey } from "@/lib/api/endpoints/memberships";
import type { CreateUserDto } from "@/lib/api/models/createUserDto";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: createUser, isPending } = usePostApiUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const reset = () => {
    setFullName("");
    setEmail("");
    setUsername("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      toast.error("Vui lòng nhập đủ thông tin (mật khẩu ≥ 8 ký tự)");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }
    const usernameTrimmed = username.trim();
    if (usernameTrimmed && !/^[a-zA-Z0-9_.-]{3,30}$/.test(usernameTrimmed)) {
      toast.error("Username 3-30 ký tự (chữ, số, _, ., -)");
      return;
    }
    try {
      const dto: CreateUserDto = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        username: usernameTrimmed || undefined,
        phone: phone.trim() || undefined,
      };
      await createUser({ data: dto });
      await queryClient.invalidateQueries({ queryKey: getGetApiMembershipsQueryKey() });
      router.refresh();
      toast.success(`Đã tạo người dùng "${fullName.trim()}"`);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message?.[0] ?? "Tạo người dùng thất bại";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={18} />
              Thêm người dùng
            </DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới trong tenant hiện tại. Người dùng có thể đăng
              nhập ngay — gán vai trò sau bằng nút chỉnh sửa.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-fullname">Họ và tên *</Label>
              <Input
                id="user-fullname"
                placeholder="Nguyễn Văn An"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                placeholder="nguyen.van.a (không bắt buộc)"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-xs text-foreground-muted">
                Dùng để đăng nhập thay email — 3-30 ký tự (chữ, số, _, ., -).
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-phone">Số điện thoại</Label>
              <Input
                id="user-phone"
                type="tel"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-password">Mật khẩu *</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="Ít nhất 8 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-foreground-muted">
                Mật khẩu tạm thời — người dùng nên đổi sau khi đăng nhập.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-confirm-password">Xác nhận mật khẩu *</Label>
              <Input
                id="user-confirm-password"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Tạo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
