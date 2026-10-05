"use client";

import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyPrice } from "@/components/shared/property-detail/property-price";

interface OwnerContactSidebarProps {
  property?: any;
  title?: string;
}

export function OwnerContactSidebar({ property, title = "Thông tin liên hệ chủ bất động sản" }: OwnerContactSidebarProps) {
  const owner = property?.owner;

  return (
    <div className="w-full lg:w-1/3 lg:sticky lg:top-24">
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(42,37,32,0.02),0_8px_24px_-12px_rgba(45,95,63,0.06)]">
        <PropertyPrice property={property} />
        <div>
          <h2 className="font-serif text-lg font-medium tracking-tight text-foreground border-b border-border pb-3 mb-4">
            {title}
          </h2>
          {!owner || (!owner.fullName && !owner.phone && !owner.email) ? (
            <p className="text-sm text-foreground-muted">Không có thông tin liên hệ của chủ bất động sản.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="size-16 overflow-hidden rounded-lg border border-primary/20">
                  <img src="/avatar-fallback.png" alt={owner.fullName ?? ""} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-foreground">{owner.fullName || "Chưa có tên"}</h3>
                  <p className="text-xs text-foreground-muted">Chủ bất động sản</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {owner.phone && (
                  <Button type="button" variant="outline" className="w-full" render={<a href={`tel:${owner.phone}`} />}>
                    <Phone size={14} />
                    {owner.phone}
                  </Button>
                )}
                {owner.email && (
                  <Button type="button" variant="outline" className="w-full" render={<a href={`mailto:${owner.email}`} />}>
                    <Mail size={14} />
                    {owner.email}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
