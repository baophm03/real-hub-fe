"use client";

import dynamic from "next/dynamic";
import type { Property } from "@/lib/api/types/properties";

const ListingsMapView = dynamic(() => import("./listings-map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-full items-center justify-center rounded-xl border border-border bg-surface">
      <span className="text-sm text-foreground-muted">Đang tải bản đồ…</span>
    </div>
  ),
});

export function ListingsMap({ properties }: { properties: Property[] }) {
  return <ListingsMapView properties={properties} />;
}
