"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useUserStore } from "@/lib/stores/user-store";
import { useSyncProfile } from "./_components/use-sync-profile";
import { ProfileSummaryCard } from "./_components/profile-summary-card";
import { ProfileInfoCard } from "./_components/profile-info-card";
import { ChangePasswordCard } from "./_components/change-password-card";

export default function ProfilePage() {
  const user = useUserStore((s) => s.user);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const syncProfile = useSyncProfile();

  // Fetch profile on mount and sync to store
  useEffect(() => {
    syncProfile().catch((err) => console.error("Failed to fetch profile:", err));
  }, [syncProfile]);

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Tài khoản" title="Hồ sơ cá nhân" description="Thông tin tài khoản và mật khẩu" />
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Tài khoản" title="Hồ sơ cá nhân" description="Thông tin tài khoản và mật khẩu" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProfileSummaryCard onSynced={syncProfile} onUploadingChange={setUploadingAvatar} />
        <ProfileInfoCard onSynced={syncProfile} avatarUploading={uploadingAvatar} />
      </div>

      <ChangePasswordCard />
    </div>
  );
}
