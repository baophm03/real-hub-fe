import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getApiProperties } from "@/lib/api/endpoints/properties";
import { getApiFormSchemas } from "@/lib/api/endpoints/dynamic-fields";
import type { GetPropertiesResponse } from "@/lib/api/types/properties";
import { ListingsToolbar } from "./listings-toolbar";
import { ListingsMap } from "./listings-map";
import { ListingsResultsGrid } from "./listings-results-grid";

const LISTING_PAGE_SIZE = 15;

interface ListingsContentSectionProps {
  transactionType: string;
  provinceId: string;
  districtId: string;
  wardId: string;
  types: string[];
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  projectId: string;
  sort: string;
  view: string;
}

export async function ListingsContentSection({
  transactionType,
  provinceId,
  districtId,
  wardId,
  types,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  projectId,
  sort,
  view,
}: ListingsContentSectionProps) {
  const t = await getTranslations("public.listings");
  const apiParams: Record<string, string> = {
    verificationStatus: "VERIFIED",
    publicationStatus: "PUBLIC",
    include: "media",
    limit: String(view === "map" ? 100 : LISTING_PAGE_SIZE),
    sort,
  };
  if (transactionType) apiParams.transactionType = transactionType;
  if (provinceId) apiParams.provinceId = provinceId;
  if (districtId) apiParams.districtId = districtId;
  if (wardId) apiParams.wardId = wardId;
  if (minPrice) apiParams.minPrice = minPrice;
  if (maxPrice) apiParams.maxPrice = maxPrice;
  if (minArea) apiParams.minArea = minArea;
  if (maxArea) apiParams.maxArea = maxArea;
  if (projectId) apiParams.projectId = projectId;
  if (types.length > 0) apiParams.propertyTypeCodes = types.join(",");

  const [propertiesRes, schemaRes] = await Promise.all([
    getApiProperties(apiParams as any),
    getApiFormSchemas({ entityType: "PROPERTY" } as any),
  ]);

  const initialPage = propertiesRes as unknown as GetPropertiesResponse;
  const properties = initialPage?.data || [];
  const resultCount = initialPage?.meta?.total ?? properties.length;
  const schemas: any[] = ((schemaRes as any)?.data as any[]) || [];

  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0 pt-0 lg:pt-8">
      <ListingsToolbar currentSort={sort} resultCount={resultCount} currentView={view} />

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-base text-foreground-muted">{t("noResults")}</p>
          <Link href="/listings" className="text-sm font-medium text-primary hover:underline">
            {t("clearAllFilters")}
          </Link>
        </div>
      ) : view === "map" ? (
        <ListingsMap properties={properties} />
      ) : (
        <ListingsResultsGrid
          apiParams={apiParams}
          initialPage={initialPage}
          schemas={schemas}
        />
      )}
    </div>
  );
}
