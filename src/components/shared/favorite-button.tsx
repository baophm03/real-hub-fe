"use client";

import { Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  useGetApiFavoriteIds,
  usePostApiFavorites,
  useDeleteApiFavorite,
  getGetApiFavoriteIdsQueryKey,
  getGetApiFavoritesQueryKey,
} from "@/lib/api/endpoints/favorites";
import type { ApiEnvelope } from "@/lib/api/types/customer-portal";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
}

export function FavoriteButton({ propertyId, className }: FavoriteButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const { data: idsData } = useGetApiFavoriteIds({
    query: { enabled: isAuthenticated === true, staleTime: 60_000 },
  });
  const addFavorite = usePostApiFavorites();
  const removeFavorite = useDeleteApiFavorite();

  if (isAuthenticated !== true) return null;

  const ids = (idsData as unknown as ApiEnvelope<string[]> | undefined)?.data ?? [];
  const isFavorite = ids.includes(propertyId);
  const isPending = addFavorite.isPending || removeFavorite.isPending;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetApiFavoriteIdsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetApiFavoritesQueryKey() });
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    if (isFavorite) {
      removeFavorite.mutate({ propertyId }, { onSuccess: invalidate });
    } else {
      addFavorite.mutate({ data: { propertyId } }, { onSuccess: invalidate });
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFavorite ? "Bỏ lưu" : "Lưu sản phẩm"}
      className={cn(
        "absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:scale-110 dark:bg-black/50 dark:hover:bg-black/60",
        isFavorite ? "text-red-500" : "text-foreground-muted",
        className,
      )}
    >
      <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
