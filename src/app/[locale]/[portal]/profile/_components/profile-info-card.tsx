"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-section";
import { LocationSelectWithLabel } from "@/app/[locale]/_components/location-select-with-label";
import { useUserStore } from "@/lib/stores/user-store";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { usePatchApiMe } from "@/lib/api/endpoints/auth";

const GENDERS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
] as const;

const profileSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  username: z.string().regex(/^[a-zA-Z0-9_.-]{3,30}$/, "Username 3-30 ký tự (chữ, số, _, ., -)").optional().or(z.literal("")),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
  provinceId: z.string().optional().or(z.literal("")),
  wardId: z.string().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileInfoCardProps {
  onSynced: () => Promise<void>;
  avatarUploading?: boolean;
}

export function ProfileInfoCard({ onSynced, avatarUploading }: ProfileInfoCardProps) {
  const user = useUserStore((s) => s.user);
  const [savingProfile, setSavingProfile] = useState(false);
  const { mutateAsync: updateProfile } = usePatchApiMe();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    setValue: setProfileValue,
    watch: watchProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      username: user?.username ?? "",
      phone: user?.phone ?? "",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
      gender: (user?.gender as any) ?? "",
      provinceId: user?.province?.id ?? "",
      wardId: user?.ward?.id ?? "",
    },
  });

  const watchedGender = watchProfile("gender");
  const watchedProvinceId = watchProfile("provinceId");
  const watchedWardId = watchProfile("wardId");

  useEffect(() => {
    if (user) {
      resetProfile({
        fullName: user.fullName ?? "",
        username: user.username ?? "",
        phone: user.phone ?? "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        gender: (user.gender as any) ?? "",
        provinceId: user.province?.id ?? "",
        wardId: user.ward?.id ?? "",
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSavingProfile(true);
    try {
      await updateProfile({
        data: {
          fullName: data.fullName,
          username: (data.username || null) as any,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth as any,
          ...(data.gender ? { gender: data.gender } : {}),
          ...(data.provinceId ? { provinceId: data.provinceId } : {}),
          ...(data.wardId ? { wardId: data.wardId } : {}),
        },
      });
      await onSynced();
      toast.success("Đã cập nhật hồ sơ");
    } catch (err) {
      toast.error(
        (err as any)?.response?.data?.error?.message?.[0] ||
        "Có lỗi xảy ra khi cập nhật, vui lòng thử lại"
      );
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField labelClassName="text-sm text-foreground-muted" label="Họ và tên" htmlFor="fullName" required error={profileErrors.fullName?.message}>
              <Input id="fullName" placeholder="Nguyễn Văn An" {...registerProfile("fullName")} />
            </FormField>
            <FormField labelClassName="text-sm text-foreground-muted" label="Username" htmlFor="username" error={profileErrors.username?.message}>
              <Input id="username" placeholder="realhubvn" {...registerProfile("username")} />
            </FormField>
            <FormField labelClassName="text-sm text-foreground-muted" label="Email" htmlFor="email">
              <Input id="email" defaultValue={user?.email ?? ""} disabled />
            </FormField>
            <FormField labelClassName="text-sm text-foreground-muted" label="Số điện thoại" htmlFor="phone" required error={profileErrors.phone?.message}>
              <Input id="phone" placeholder="0901234567" {...registerProfile("phone")} />
            </FormField>
            <FormField labelClassName="text-sm text-foreground-muted" label="Ngày sinh" htmlFor="dateOfBirth" required error={profileErrors.dateOfBirth?.message}>
              <Input
                id="dateOfBirth"
                type="date"
                {...registerProfile("dateOfBirth")}
              />
            </FormField>
            <FormField labelClassName="text-sm text-foreground-muted" label="Giới tính" error={profileErrors.gender?.message}>
              <Select
                value={watchedGender ?? ""}
                onValueChange={(v) => setProfileValue("gender", v as ProfileFormData["gender"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giới tính">
                    {GENDERS.find((gender) => gender.value === watchedGender)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value} label={g.label}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              labelClassName="text-sm text-foreground-muted"
              label="Địa chỉ"
              error={profileErrors.provinceId?.message}
              className="col-span-1 md:col-span-2"
            >
              <LocationSelectWithLabel
                provinceId={watchedProvinceId || null}
                wardId={watchedWardId || null}
                onProvinceChange={(id) => setProfileValue("provinceId", id ?? "")}
                onWardChange={(id) => setProfileValue("wardId", id ?? "")}
                horizontal
              />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingProfile || avatarUploading}>
              {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
