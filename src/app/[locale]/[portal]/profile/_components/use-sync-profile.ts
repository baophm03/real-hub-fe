"use client";

import { useCallback } from "react";
import { useGetApiMe } from "@/lib/api/endpoints/auth";
import { useUserStore } from "@/lib/stores/user-store";
import type { GetAuthMeResponse } from "@/lib/api/types/auth-me";

export function useSyncProfile() {
  const setUser = useUserStore((s) => s.setUser);
  const { refetch: getProfile } = useGetApiMe({
    query: { enabled: false },
  });

  return useCallback(async () => {
    const result = await getProfile();
    const profileData = (result.data as unknown as GetAuthMeResponse)?.data;
    if (profileData) {
      setUser({
        id: profileData.id,
        email: profileData.email,
        username: profileData.username,
        fullName: profileData.fullName,
        phone: profileData.phone,
        avatarFile: profileData.avatarFile,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        province: profileData.province,
        ward: profileData.ward,
        status: profileData.status,
        roles: profileData.roles ?? [],
        lastLoginAt: profileData.lastLoginAt,
        createdAt: profileData.createdAt,
      });
    }
  }, [getProfile, setUser]);
}
