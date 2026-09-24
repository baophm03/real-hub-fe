import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ListingsFilterSection } from "./_components/listings-filter-section";
import { ListingsContentSection } from "./_components/listings-content-section";
import {
  ListingsFilterSkeleton,
  ListingsContentSkeleton,
} from "./_components/listings-skeletons";
import { generateSeoMetadata } from "@/lib/seo";
import { buildPropertyListContext } from "@/lib/seo-context";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.listings");
  return generateSeoMetadata("PROPERTY_LISTING", buildPropertyListContext(), {
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function ListingsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;

  // filters
  const transactionType = (sp.transactionType as string) ?? "";
  const provinceId = (sp.provinceId as string) ?? "";
  const districtId = (sp.districtId as string) ?? "";
  const wardId = (sp.wardId as string) ?? "";
  const view = (sp.view as string) ?? "grid";
  const typesRaw = (sp.types as string) ?? "";
  const types = typesRaw ? typesRaw.split(",").filter(Boolean) : [];
  const minPrice = (sp.minPrice as string) ?? "";
  const maxPrice = (sp.maxPrice as string) ?? "";
  const minArea = (sp.minArea as string) ?? "";
  const maxArea = (sp.maxArea as string) ?? "";
  const projectId = (sp.projectId as string) ?? "";
  const sort = (sp.sort as string) ?? "newest";
  const priceMultiplier = transactionType === "RENT" ? 1000000 : 1000000000;
  const currentPriceFrom = minPrice ? String(Number(minPrice) / priceMultiplier) : "";
  const currentPriceTo = maxPrice ? String(Number(maxPrice) / priceMultiplier) : "";

  return (
    <div className="container pb-10">
      <div className="flex flex-1 gap-6 flex-col lg:flex-row">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <Suspense fallback={<ListingsFilterSkeleton />}>
            <ListingsFilterSection
              currentTransactionType={transactionType}
              currentProvinceId={provinceId}
              currentDistrictId={districtId}
              currentWardId={wardId}
              currentTypes={types}
              currentPriceFrom={currentPriceFrom}
              currentPriceTo={currentPriceTo}
              currentMinArea={minArea}
              currentMaxArea={maxArea}
              currentProjectId={projectId}
            />
          </Suspense>
        </aside>

        <Suspense fallback={<ListingsContentSkeleton />}>
          <ListingsContentSection
            transactionType={transactionType}
            provinceId={provinceId}
            districtId={districtId}
            wardId={wardId}
            types={types}
            minPrice={minPrice}
            maxPrice={maxPrice}
            minArea={minArea}
            maxArea={maxArea}
            projectId={projectId}
            sort={sort}
            view={view}
          />
        </Suspense>
      </div>
    </div>
  );
}
