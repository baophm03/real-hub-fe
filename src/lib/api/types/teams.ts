export interface TeamMemberUser {
  id: string;
  fullName: string;
  email: string;
  avatarFile: { id: string; original: string; url: string } | null;
}

export interface TeamMember {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: TeamMemberUser | null;
}

export interface TeamView {
  id: string;
  name: string;
  leaderId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  leader: TeamMemberUser;
  members: TeamMember[];
}

export interface GetTeamsResponse {
  success: boolean;
  data: TeamView[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface GetTeamResponse {
  success: boolean;
  data: TeamView;
  timestamp: string;
}

export interface TeamMemberDetail {
  member: {
    id: string;
    userId: string;
    status: string;
    createdAt: string;
  };
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    status: string;
    lastLoginAt: string | null;
    avatarFile: { id: string; original: string; url: string } | null;
    province: { id: string; name: string } | null;
    ward: { id: string; name: string } | null;
  } | null;
  tenantRoles: { code: string; name: string }[];
  memberSince: string | null;
  stats: {
    leads: number;
    deals: number;
    customers: number;
    appointments: number;
  };
}

export interface GetTeamMemberResponse {
  success: boolean;
  data: TeamMemberDetail;
  timestamp: string;
}
