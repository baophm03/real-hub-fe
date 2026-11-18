"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropertyCard } from "@/components/shared/property-card";
import { extractFirstImageUrlFromMedia } from "@/components/shared/property-utils";
import { getApiProperties } from "@/lib/api/endpoints/properties";
import type { GetPropertiesResponse, Property } from "@/lib/api/types/properties";

interface ListingsResultsGridProps {
  apiParams: Record<string, string>;
  initialPage: GetPropertiesResponse;
  schemas: any[];
}

function findFieldValue(
  schemas: any[],
  dynamicValues: Record<string, unknown> | null | undefined,
  patterns: string[],
): string | null {
  const directKeysBed = ["bed_room_count", "bedroom_count", "bedrooms", "beds", "phong_ngu"];
  const directKeysBath = ["pathroom_count", "bathroom_count", "bathrooms", "baths", "phong_tam"];
  const isBedroom = patterns.some((pattern) => pattern.includes("bed") || pattern.includes("ngu"));
  const isBathroom = patterns.some((pattern) => pattern.includes("bath") || pattern.includes("tam") || pattern.includes("path"));

  if (dynamicValues) {
    const keys = isBedroom ? directKeysBed : isBathroom ? directKeysBath : [];
    for (const key of keys) {
      const value = dynamicValues[key];
      if (value !== undefined && value !== null && value !== "") return String(value);
    }
  }

  for (const schema of schemas) {
    for (const schemaField of schema.fields || []) {
      const field = schemaField.field;
      if (!field) continue;
      const key = (field.fieldKey || "").toLowerCase();
      const label = (field.fieldLabel || "").toLowerCase();
      if (!patterns.some((pattern) => key.includes(pattern) || label.includes(pattern))) continue;

      const rawValue = dynamicValues?.[field.fieldKey];
      if (rawValue === undefined || rawValue === null || rawValue === "") return null;
      if (Array.isArray(field.options)) {
        const option = field.options.find((item: any) => item.value === String(rawValue));
        if (option) return option.label;
      }
      return String(rawValue);
    }
  }
  return null;
}

export function ListingsResultsGrid({ apiParams, initialPage, schemas }: ListingsResultsGridProps) {
  const t = useTranslations("public.listings");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryKey = useMemo(() => ["public-listings", apiParams] as const, [apiParams]);

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      getApiProperties(
        { ...apiParams, offset: String(pageParam) } as any,
        signal,
      ) as Promise<GetPropertiesResponse>,
    initialPageParam: 0,
    initialData: {
      pages: [initialPage],
      pageParams: [0],
    },
    getNextPageParam: (lastPage) => {
      const offset = lastPage.meta?.offset ?? 0;
      const total = lastPage.meta?.total ?? offset + lastPage.data.length;
      const nextOffset = offset + lastPage.data.length;
      return lastPage.data.length > 0 && nextOffset < total ? nextOffset : undefined;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const properties = useMemo(
    () => data.pages.flatMap((page) => page.data || []),
    [data.pages],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { threshold: 1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, loadMore]);

  const propertyDetails = useMemo(() => {
    const details = new Map<string, { imageUrl: string | null; bedrooms: string | null; bathrooms: string | null }>();
    for (const property of properties) {
      const relevantSchemas = schemas.filter(
        (schema) =>
          !schema.propertyType ||
          schema.propertyType?.id === undefined ||
          schema.propertyType?.id === property.propertyType?.id,
      );
      const dynamicValues = property.dynamicValuesJson;
      details.set(property.id, {
        imageUrl: extractFirstImageUrlFromMedia(property.media),
        bedrooms: findFieldValue(relevantSchemas, dynamicValues, ["bedroom", "beds", "bed_room", "phong_ngu", "phòng ngủ"]),
        bathrooms: findFieldValue(relevantSchemas, dynamicValues, ["bathroom", "baths", "pathroom", "phong_tam", "phòng tắm"]),
      });
    }
    return details;
  }, [properties, schemas]);

  return (
    <section aria-busy={isFetchingNextPage} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.pages.flatMap((page, pageIndex) =>
          page.data.map((property: Property, propertyIndex) => {
            const details = propertyDetails.get(property.id);
            const isNewestBatch = pageIndex === data.pages.length - 1 && pageIndex > 0;

            return (
              <div
                key={property.id}
                className={`h-full ${isNewestBatch ? "listing-card-enter" : ""}`}
                style={
                  isNewestBatch
                    ? { animationDelay: `${Math.min(propertyIndex * 28, 392)}ms` }
                    : undefined
                }
              >
                <PropertyCard
                  property={property}
                  imageUrl={details?.imageUrl}
                  bedrooms={details?.bedrooms}
                  bathrooms={details?.bathrooms}
                />
              </div>
            );
          }),
        )}
      </div>

      <div ref={sentinelRef} aria-hidden="true" className="h-1" />

      {isFetchingNextPage ? (
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-3 text-sm text-foreground-muted">
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin"
            style={{ animationDuration: "1.8s" }}
          />
          {t("loadingMore")}
        </div>
      ) : isFetchNextPageError ? (
        <div role="alert" className="flex flex-col items-center gap-2 py-3 text-sm text-foreground-muted">
          <span>{t("loadMoreError")}</span>
          <button type="button" onClick={loadMore} className="font-medium text-primary hover:underline">
            {t("loadMore")}
          </button>
        </div>
      ) : hasNextPage ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-muted"
          >
            {t("loadMore")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
