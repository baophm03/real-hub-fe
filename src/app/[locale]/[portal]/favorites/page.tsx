"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { PropertyCard } from "@/components/shared/property-card";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useGetApiFavorites } from "@/lib/api/endpoints/favorites";
import type { ApiEnvelope, FavoriteItem } from "@/lib/api/types/customer-portal";
import type { Property } from "@/lib/api/types/properties";

export default function FavoritesPage() {
  const pagination = usePagination(12);
  const { data, isLoading } = useGetApiFavorites({
    limit: pagination.limit,
    offset: pagination.offset,
  });

  const payload = data as unknown as ApiEnvelope<FavoriteItem[]> | undefined;
  const items = useMemo(() => payload?.data ?? [], [payload]);
  const totalPages = Math.max(1, Math.ceil((payload?.meta?.total ?? 0) / pagination.pageSize));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Của tôi"
        title="BĐS đã lưu"
        description="Danh sách bất động sản bạn đã quan tâm"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((fav) => (
              <PropertyCard key={fav.id} property={fav.property as unknown as Property} />
            ))}
          </div>
          <PaginationBar
            pageSize={pagination.pageSize}
            setPageSize={pagination.setPageSize}
            currentPage={pagination.currentPage}
            setCurrentPage={pagination.setCurrentPage}
            totalPages={totalPages}
          />
        </>
      ) : (
        <EmptyState
          icon={<Heart size={24} />}
          title="Chưa có BĐS nào được lưu"
          description="Nhấn biểu tượng trái tim trên trang listings để lưu bất động sản quan tâm"
        />
      )}
    </div>
  );
}
