import {
  Calendar,
  CircleUser,
  Handshake,
  Heart,
  House,
  MailCheck,
  Settings,
  ClipboardList,
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

const entryPortal = portalEntries["customer-portal"];

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
    label: "Của tôi",
    items: [
      {
        label: "BĐS đã lưu",
        href: `/${entryPortal?.slug}/favorites`,
        icon: Heart,
      },
      {
        label: "Nhu cầu của tôi",
        href: `/${entryPortal?.slug}/my-needs`,
        icon: ClipboardList,
      },
      {
        label: "Yêu cầu tư vấn",
        href: `/${entryPortal?.slug}/my-contacts`,
        icon: MailCheck,
      },
      {
        label: "Lịch hẹn",
        href: `/${entryPortal?.slug}/appointments`,
        icon: Calendar,
        permission: { action: "VIEW", subject: "APPOINTMENT" },
      },
      {
        label: "Giao dịch",
        href: `/${entryPortal?.slug}/my-deals`,
        icon: Handshake,
      },
    ],
  },
  {
    label: "Tài khoản",
    items: [
      {
        label: "Hồ sơ",
        href: `/${entryPortal?.slug}/profile`,
        icon: CircleUser,
      },
      {
        label: "Cài đặt",
        href: `/${entryPortal?.slug}/settings`,
        icon: Settings,
        permission: { action: "VIEW", subject: "SETTING" },
      },
    ],
  },
];
