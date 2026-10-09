"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Phone, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { usePostApiPropertyContacts } from "@/lib/api/endpoints/property-contacts";
import {
  useGetApiFavoriteIds,
  usePostApiFavorites,
  useDeleteApiFavorite,
  getGetApiFavoriteIdsQueryKey,
  getGetApiFavoritesQueryKey,
} from "@/lib/api/endpoints/favorites";
import type { ApiEnvelope } from "@/lib/api/types/customer-portal";
import { PropertyPrice } from "@/components/shared/property-detail/property-price";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

interface ContactSidebarProps {
  property?: any;
}

export function ContactSidebar(props: ContactSidebarProps) {
  return (
    <Suspense fallback={<ContactSidebarInner {...props} />}>
      <ContactSidebarInner {...props} />
    </Suspense>
  );
}

function ContactSidebarInner({ property }: ContactSidebarProps) {
  const t = useTranslations("public.listingDetail");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { mutateAsync: submitContact, isPending } = usePostApiPropertyContacts();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: idsData } = useGetApiFavoriteIds({
    query: { enabled: isAuthenticated === true, staleTime: 60_000 },
  });
  const addFavorite = usePostApiFavorites();
  const removeFavorite = useDeleteApiFavorite();

  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const currentUrl = typeof window !== "undefined"
    ? `${window.location.pathname}${window.location.search}`
    : "/";
  const loginHref = `/${locale}/login?redirect=${encodeURIComponent(currentUrl)}`;

  const handleContact = async () => {
    try {
      await submitContact({
        data: {
          propertyId: property?.id,
          refCode: refCode || undefined,
        },
      });
      toast.success(t("contactSuccess"));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || t("contactError"));
      console.error(err);
    }
  };

  const favoriteIds = (idsData as unknown as ApiEnvelope<string[]> | undefined)?.data ?? [];
  const isFavorite = !!property?.id && favoriteIds.includes(property.id);
  const isFavPending = addFavorite.isPending || removeFavorite.isPending;

  const invalidateFavorites = () => {
    queryClient.invalidateQueries({ queryKey: getGetApiFavoriteIdsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetApiFavoritesQueryKey() });
  };

  const toggleFavorite = () => {
    if (isFavPending || !property?.id) return;
    if (isFavorite) {
      removeFavorite.mutate({ propertyId: property.id }, { onSuccess: invalidateFavorites });
    } else {
      addFavorite.mutate({ data: { propertyId: property.id } }, { onSuccess: invalidateFavorites });
    }
  };

  return (
    <div className="w-full lg:w-[30%] lg:sticky lg:top-24">
      <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
        {/* Giá */}
        {property?.price != null && <PropertyPrice property={property} title={t("contactPrice")} />}

        <div className="space-y-2 border-b border-border pb-8">
          {isAuthenticated ? (
            <Button
              type="button"
              className="w-full h-12 bg-[#102F10] hover:bg-[#102F10]/90"
              size="lg"
              disabled={isPending}
              onClick={handleContact}
              leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
            >
              {isPending ? t("contactSending") : t("contactNow")}
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full h-12 bg-[#102F10] hover:bg-[#102F10]/90"
              size="lg"
              render={<a href={loginHref} />}
              leftIcon={<Phone size={16} />}
            >
              {t("contactNow")}
            </Button>
          )}

          {isAuthenticated ? (
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full h-12",
                isFavorite &&
                "border-rose-500 bg-rose-50 text-rose-600 hover:border-rose-500 hover:bg-rose-100 hover:text-rose-600",
              )}
              disabled={isFavPending}
              onClick={toggleFavorite}
              leftIcon={<Heart size={16} fill={isFavorite ? "currentColor" : "none"} />}
            >
              {isFavorite ? t("savedListing") : t("saveListing")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              render={<a href={loginHref} />}
              leftIcon={<Heart size={16} />}
            >
              {t("saveListing")}
            </Button>
          )}
        </div>

        {/* Property Meta */}
        <div className="space-y-2 text-sm text-foreground-muted">
          <div className="flex justify-between">
            <span>{t("contactCategory")}</span>
            <span className="font-medium text-foreground">{property?.propertyType?.name ?? "—"}</span>
          </div>
          {property?.createdAt && (
            <div className="flex justify-between">
              <span>{t("contactPostedDate")}</span>
              <span className="font-medium text-foreground">
                {new Date(property.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
