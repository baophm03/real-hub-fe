"use client";

import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyPrice } from "@/components/shared/property-detail/property-price";
import type { Property } from "@/lib/api/types/properties";

interface ContactSidebarProps {
  property: Property | null | undefined;
}

interface ContactInfo {
  id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  position: string;
}

export function ContactSidebar({ property }: ContactSidebarProps) {
  // Contact fallback chain: active assigned sales → owner
  const activeAssignment = (property as any)?.assignments?.find((a: any) => a.status === "ACTIVE");
  const assignedUser = activeAssignment?.assignedUser;
  const owner = (property as any)?.owner;

  const contacts: ContactInfo[] = assignedUser && (assignedUser.fullName || assignedUser.phone)
    ? [{
      id: assignedUser.id ?? null,
      name: assignedUser.fullName ?? null,
      phone: assignedUser.phone ?? null,
      email: (assignedUser as any)?.email ?? null,
      position: "Nhân viên kinh doanh",
    }]
    : owner && (owner.fullName || owner.phone || owner.email)
      ? [{
        id: owner.id ?? null,
        name: owner.fullName ?? null,
        phone: owner.phone ?? null,
        email: owner.email ?? null,
        position: "Chủ bất động sản",
      }]
      : [];

  return (
    <div className="w-full lg:sticky lg:top-24">
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(42,37,32,0.02),0_8px_24px_-12px_rgba(45,95,63,0.06)]">
        <PropertyPrice property={property} />
        <div>
          <h2 className="font-serif text-lg font-medium tracking-tight text-foreground border-b border-border pb-3 mb-4">
            Thông tin liên hệ
          </h2>
          {contacts.length === 0 ? (
            <p className="text-sm text-foreground-muted">Không có thông tin liên hệ.</p>
          ) : (
            contacts.map((item) => (
              <div key={`${item.id ?? item.name ?? "contact"}`} className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-16 overflow-hidden rounded-lg border border-primary/20">
                    <img
                      src="/avatar-fallback.png"
                      alt={item.name ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-foreground">{item.name || "Chưa có thông tin"}</h3>
                    <p className="text-xs text-foreground-muted">{item.position}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {item.phone && (
                    <Button type="button" variant="outline" className="w-full" render={<a href={`tel:${item.phone}`} />}>
                      <Phone size={14} />
                      {item.phone}
                    </Button>
                  )}
                  {item.email && (
                    <Button type="button" variant="outline" className="w-full" render={<a href={`mailto:${item.email}`} />}>
                      <Mail size={14} />
                      {item.email}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
