"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  Loader2,
  AtSign,
  Mail,
  Phone,
  VenusAndMars,
  Cake,
  MapPin,
  BadgeCheck,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/lib/stores/user-store";
import { usePatchApiMe } from "@/lib/api/endpoints/auth";
import { usePostApiFileUpload } from "@/lib/api/endpoints/files";
import { formatDate } from "@/utils";

const genderLabel: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const statusLabel: Record<string, { label: string; variant: "green" | "default" }> = {
  ACTIVE: { label: "Hoạt động", variant: "green" },
  INACTIVE: { label: "Tắt", variant: "default" },
};

function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-3 text-sm text-foreground-muted">
        <Icon size={16} strokeWidth={2.25} className="shrink-0" />
        {label}
      </span>
      <span className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 text-right text-sm">{children || "—"}</span>
    </div>
  );
}

interface FileUploadResponse {
  success: boolean;
  data: { id: string; url: string; original: string };
  timestamp: string;
}

interface ProfileSummaryCardProps {
  onSynced: () => Promise<void>;
  onUploadingChange?: (uploading: boolean) => void;
}

export function ProfileSummaryCard({ onSynced, onUploadingChange }: ProfileSummaryCardProps) {
  const user = useUserStore((s) => s.user);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updateProfile } = usePatchApiMe();
  const { mutateAsync: uploadFile } = usePostApiFileUpload();

  const setUploading = (uploading: boolean) => {
    setUploadingAvatar(uploading);
    onUploadingChange?.(uploading);
  };

  const currentAvatarUrl = previewAvatarUrl ?? user?.avatarFile?.url ?? null;

  const initials =
    user?.fullName
      ?.split(" ")
      .slice(-2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Preview locally
    setPreviewAvatarUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await uploadFile({ data: { file, ownerType: "USER", ownerId: user.id } });
      const uploaded = (result as unknown as FileUploadResponse)?.data;
      if (!uploaded?.id) throw new Error("Upload failed");
      await updateProfile({
        data: {
          avatarFileId: uploaded.id,
          fullName: user.fullName,
          phone: user.phone ?? "",
          dateOfBirth: (user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "") as any,
        },
      });
      await onSynced();
      setPreviewAvatarUrl(null);
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (err) {
      toast.error("Tải ảnh lên thất bại");
      console.error(err);
      setPreviewAvatarUrl(null);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const status = statusLabel[user.status] ?? { label: user.status, variant: "default" as const };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 px-6">
        <div className="flex items-center justify-start gap-3">
          <div className="relative group shrink-0">
            <Avatar className="size-20 rounded-full overflow-hidden">
              {currentAvatarUrl && (
                <AvatarImage src={currentAvatarUrl} alt={user.fullName ?? "User"} />
              )}
              <AvatarFallback className="flex size-20 items-center justify-center rounded-full bg-surface-muted text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 flex size-20 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
              aria-label="Đổi ảnh đại diện"
            >
              {uploadingAvatar ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Camera size={20} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-sm font-medium">{user.fullName || "—"}</p>
            {user.roles?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((r) => (
                  <Badge key={r.code} variant="blue">{r.name}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3.5 w-full border-t border-border/60 pt-5">
          <InfoRow icon={AtSign} label="Username">{user.username ? `@${user.username}` : null}</InfoRow>
          <InfoRow icon={Mail} label="Email">{user.email}</InfoRow>
          <InfoRow icon={Phone} label="Số điện thoại">{user.phone}</InfoRow>
          <InfoRow icon={VenusAndMars} label="Giới tính">{user.gender ? genderLabel[user.gender] ?? user.gender : null}</InfoRow>
          <InfoRow icon={Cake} label="Ngày sinh">{user.dateOfBirth ? formatDate(user.dateOfBirth) : null}</InfoRow>
          <InfoRow icon={MapPin} label="Địa chỉ">
            {[user.ward?.name, user.province?.name].filter(Boolean).join(", ") || null}
          </InfoRow>
          <InfoRow icon={BadgeCheck} label="Trạng thái">
            <Badge variant={status.variant}>{status.label}</Badge>
          </InfoRow>
          <InfoRow icon={CalendarDays} label="Ngày tạo">{user.createdAt ? formatDate(user.createdAt) : null}</InfoRow>
        </div>
      </CardContent>
    </Card>
  );
}
