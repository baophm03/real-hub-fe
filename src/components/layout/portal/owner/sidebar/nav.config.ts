import {
  Building2,
  Calendar,
  CircleUser,
  Folder,
  Handshake,
  Headset,
  House,
  Key,
  MailCheck,
  Newspaper,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import type { Actions, Features } from "@/config/casl/ability";
import { portalEntries } from "@/config/portal-entry";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof House;
  permission?: { action: Actions; subject: Features };
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const entryPortal = portalEntries["owner-portal"];

export const navGroups: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      {
        label: "Dashboard",
        href: `/${entryPortal?.slug}`,
        icon: House,
      },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      {
        label: "Bất động sản",
        href: `/${entryPortal?.slug}/properties`,
        icon: Building2,
        permission: { action: "VIEW", subject: "PROPERTY" },
      },
      {
        label: "Duyệt BĐS",
        href: `/${entryPortal?.slug}/verification`,
        icon: ShieldCheck,
        permission: { action: "APPROVE_VIEW", subject: "PROPERTY" },
      },
      {
        label: "BĐS phụ trách",
        href: `/${entryPortal?.slug}/available-properties`,
        icon: Handshake,
        permission: { action: "VIEW", subject: "ASSIGNMENT" },
      },
      {
        label: "BĐS đang phụ trách",
        href: `/${entryPortal?.slug}/my-properties`,
        icon: Building2,
        permission: { action: "VIEW", subject: "ASSIGNMENT" },
      },
      {
        label: "Dự án",
        href: `/${entryPortal?.slug}/projects`,
        icon: Building2,
        permission: { action: "VIEW", subject: "PROJECTS" },
      },
      {
        label: "Tư vấn",
        href: `/${entryPortal?.slug}/consultations`,
        icon: Headset,
        permission: { action: "VIEW", subject: "PROPERTY_CONTACT" },
      },
      {
        label: "Liên hệ",
        href: `/${entryPortal?.slug}/contact-requests`,
        icon: MailCheck,
        permission: { action: "VIEW", subject: "CONTACT_REQUEST" },
      },
      {
        label: "Lịch hẹn",
        href: `/${entryPortal?.slug}/appointments`,
        icon: Calendar,
        permission: { action: "VIEW", subject: "APPOINTMENT" },
      },
      {
        label: "Khách hàng",
        href: `/${entryPortal?.slug}/customers`,
        icon: Users,
        permission: { action: "VIEW", subject: "CUSTOMER" },
      },
      {
        label: "Nguồn KH",
        href: `/${entryPortal?.slug}/leads`,
        icon: CircleUser,
        permission: { action: "VIEW", subject: "LEAD" },
      },
      {
        label: "Giao dịch",
        href: `/${entryPortal?.slug}/deals`,
        icon: Handshake,
        permission: { action: "VIEW", subject: "DEAL" },
      },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      {
        label: "Tin tức",
        href: `/${entryPortal?.slug}/news`,
        icon: Newspaper,
        permission: { action: "VIEW", subject: "NEWS" },
      },
      {
        label: "Tài liệu",
        href: `/${entryPortal?.slug}/files`,
        icon: Folder,
        permission: { action: "VIEW", subject: "FILE" },
      },
      {
        label: "Phân quyền",
        href: `/${entryPortal?.slug}/roles`,
        icon: Key,
        permission: { action: "VIEW", subject: "ROLE" },
      },
      {
        label: "Người dùng",
        href: `/${entryPortal?.slug}/users`,
        icon: UserCog,
        permission: { action: "VIEW", subject: "USER" },
      },
      {
        label: "Nhóm",
        href: `/${entryPortal?.slug}/teams`,
        icon: UsersRound,
        permission: { action: "VIEW", subject: "TEAM" },
      },
    ],
  },
  {
    label: "Cài đặt",
    items: [
      {
        label: "Cài đặt",
        href: `/${entryPortal?.slug}/settings`,
        icon: Settings,
        permission: { action: "VIEW", subject: "SETTING" },
      },
    ],
  },
];
