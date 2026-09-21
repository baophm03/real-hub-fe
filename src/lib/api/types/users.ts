export type UserRole =
  | "SUPER_ADMIN"
  | "AGENCY_ADMIN"
  | "TEAM_LEADER"
  | "SALES"
  | "COLLABORATOR"
  | "OPERATOR"
  | "CUSTOMER"
  | "OWNER";

export type UserGender = "MALE" | "FEMALE" | "OTHER";

export interface UserLocation {
  id: string;
  name: string;
  code: string;
  slug: string | null;
  fullPath: string | null;
  type: string;
  level: number;
}

export interface Avatar {
  id: string;
  name: string;
  url: string;
}

export interface RolePermission {
  module: string;
  action: string;
}

export interface Role {
  code: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
}

export interface User {
  id: string;
  email: string;
  username?: string | null;
  fullName: string;
  phone?: string | null;
  avatarFile?: Avatar | null;
  dateOfBirth?: string | null;
  gender?: UserGender | null;
  province?: UserLocation | null;
  ward?: UserLocation | null;
  status: string;
  roles: Role[];
  lastLoginAt?: string | null;
  createdAt?: string;
}
