"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Clock, CircleCheck, CircleX } from "lucide-react";
import { Can } from "@casl/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetApiPropertyTransitions,
  getGetApiPropertyTransitionsQueryOptions,
} from "@/lib/api/endpoints/properties";
import { Property } from "@/lib/api/types/properties";
import type { UpdatePropertyDtoVerificationStatus } from "@/lib/api/models";

type VerificationStatus = UpdatePropertyDtoVerificationStatus;

const statusIcon: Record<VerificationStatus, typeof ChevronDown> = {
  DRAFT: Pencil,
  PENDING: Clock,
  VERIFIED: CircleCheck,
  REJECTED: CircleX,
};

const statusColor: Record<VerificationStatus, string> = {
  VERIFIED: "text-accent-green-text",
  REJECTED: "text-accent-red-text",
  PENDING: "text-accent-yellow-text",
  DRAFT: "text-foreground-muted",
};

interface Props {
  property: Property;
  onPick: (target: { property: Property; status: VerificationStatus; transitionId: string }) => void;
}

export function VerificationActions({ property, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: transitionsRaw, isLoading } = useGetApiPropertyTransitions(
    property.id,
    {
      query: { enabled: open },
    },
  );
  const transitions: any[] = (transitionsRaw as any)?.data ?? [];

  const prefetchTransitions = () => {
    void queryClient.prefetchQuery(
      getGetApiPropertyTransitionsQueryOptions(property.id),
    );
  };

  return (
    <Can I="APPROVE" a="PROPERTY">
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={prefetchTransitions}
        onFocus={prefetchTransitions}
        className="flex justify-start"
      >
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                aria-label="Đổi trạng thái kiểm duyệt"
                className="h-7 px-2 text-xs"
              />
            }
          >
            Thao tác
            <ChevronDown size={12} className="ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="min-w-[180px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Chuyển trạng thái</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isLoading ? (
                <div className="px-2 py-1.5 text-xs text-foreground-muted">
                  Đang tải...
                </div>
              ) : (() => {
                const eligible = transitions.filter(
                  (t) => t.actionCode === "APPROVE" || t.actionCode === "REJECT",
                );
                if (eligible.length === 0) {
                  return (
                    <div className="px-2 py-1.5 text-xs text-foreground-muted">
                      Không có trạng thái thích hợp
                    </div>
                  );
                }
                return eligible.map((t) => {
                  const status = t.toStateName as VerificationStatus;
                  const Icon = statusIcon[status] ?? ChevronDown;
                  return (
                    <DropdownMenuItem
                      key={t.transitionId ?? t.id}
                      onClick={() =>
                        onPick({
                          property,
                          status,
                          transitionId: t.transitionId ?? t.id,
                        })
                      }
                    >
                      <Icon size={14} className={statusColor[status] ?? "text-foreground-muted"} />
                      {t.actionLabel && (
                        <span className="ml-1 text-xs font-medium text-foreground">
                          {t.actionLabel}
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                });
              })()}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Can>
  );
}
