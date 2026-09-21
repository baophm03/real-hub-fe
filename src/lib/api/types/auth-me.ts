import type { UserGender, UserLocation } from './users';

export interface AuthMePermission {
  module: string;
  action: string;
}

export interface AuthMeRole {
  code: string;
  name: string;
  description: string | null;
  permissions: AuthMePermission[];
}

export interface AuthMeAvatar {
  id: string;
  name: string;
  url: string;
}

export interface AuthMeResponse {
  id: string;
  fullName: string;
  email: string;
  username?: string | null;
  phone: string | null;
  avatarFile: AuthMeAvatar | null;
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  province?: UserLocation | null;
  ward?: UserLocation | null;
  status: string;
  roles: AuthMeRole[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface GetAuthMeResponse {
  success: boolean;
  data: AuthMeResponse;
  timestamp: string;
}
