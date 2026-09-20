"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleUser } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { customInstance } from "@/lib/api/mutator/custom-instance";
import type { TeamMemberDetail } from "@/lib/api/types/teams";
import { formatDate } from "@/utils";

const genderLabel: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-right text-sm">{value || "—"}</span>
    </div>
  );
}

export function MemberDetailPanel({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string | null;
}) {
  const { data: raw, isLoading } = useQuery({
    queryKey: [`/api/teams/${teamId}/members/${userId}`],
    queryFn: () =>
      customInstance<{ data?: TeamMemberDetail }>({
        url: `/api/teams/${teamId}/members/${userId}`,
        method: "GET",
      }),
    enabled: !!teamId && !!userId,
  });
  const detail = raw?.data;

  if (!userId) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
        <CircleUser size={28} className="text-foreground-muted" />
        <p className="text-sm text-foreground-muted">
          Chọn một thành viên để xem chi tiết
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />;
  }

  if (!detail) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed border-border p-6">
        <p className="text-sm text-foreground-muted">Không tải được thông tin thành viên</p>
      </div>
    );
  }

  const u = detail.user;
  const stats: { label: string; value: number }[] = [
    { label: "Leads", value: detail.stats.leads },
    { label: "Deals", value: detail.stats.deals },
    { label: "Khách hàng", value: detail.stats.customers },
    { label: "Lịch hẹn", value: detail.stats.appointments },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      {/* Header: avatar + name + role */}
      <div className="flex items-center gap-3">
        {u?.avatarFile?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={u.avatarFile.url}
            alt={u.fullName}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
            {u?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{u?.fullName ?? detail.member.userId}</p>
          <p className="truncate text-xs text-foreground-muted">{u?.email}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {detail.tenantRoles.map((r) => (
              <Badge key={r.code} variant="default">
                {r.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-md bg-surface-muted/40 px-3 py-2 text-center"
          >
            <p className="text-lg font-semibold">{s.value}</p>
            <p className="text-[11px] text-foreground-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="divide-y divide-border/60">
        <InfoRow label="Điện thoại" value={u?.phone} />
        <InfoRow label="Giới tính" value={u?.gender ? genderLabel[u.gender] ?? u.gender : null} />
        <InfoRow label="Ngày sinh" value={formatDate(u?.dateOfBirth)} />
        <InfoRow
          label="Khu vực"
          value={[u?.ward?.name, u?.province?.name].filter(Boolean).join(", ") || null}
        />
        <InfoRow label="Vào tenant" value={formatDate(detail.memberSince)} />
        <InfoRow label="Vào team" value={formatDate(detail.member.createdAt)} />
        <InfoRow label="Đăng nhập cuối" value={formatDate(u?.lastLoginAt)} />
        <InfoRow label="Trạng thái TK" value={u?.status} />
      </div>
    </div>
  );
}
