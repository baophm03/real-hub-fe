import { CircleDashed, CheckCircle2, MessageCircle, Ban, Mail, Phone, User } from "lucide-react";

export { MessageCircle };

export interface ContactRequest {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  subject?: string | null;
  message?: string | null;
  status: "UNREAD" | "READ" | "REPLIED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequestsResponse {
  success: boolean;
  data: ContactRequest[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
  timestamp: string;
}

export const statusConfig: Record<
  ContactRequest["status"],
  { label: string; variant: "red" | "blue" | "green" | "default"; icon: typeof CircleDashed }
> = {
  UNREAD: { label: "Chưa đọc", variant: "red", icon: CircleDashed },
  READ: { label: "Đã đọc", variant: "blue", icon: CheckCircle2 },
  REPLIED: { label: "Đã phản hồi", variant: "green", icon: MessageCircle },
  ARCHIVED: { label: "Đã lưu trữ", variant: "default", icon: Ban },
};

export const filterTabs: { value: ContactRequest["status"] | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "UNREAD", label: "Chưa đọc" },
  { value: "READ", label: "Đã đọc" },
  { value: "REPLIED", label: "Đã phản hồi" },
  { value: "ARCHIVED", label: "Đã lưu trữ" },
];

export { User, Mail, Phone };
