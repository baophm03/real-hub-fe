import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getApiProperties } from "@/lib/api/endpoints/properties";
import { getApiFormSchemas } from "@/lib/api/endpoints/dynamic-fields";
import type {
  GetPropertiesResponse,
  Property,
} from "@/lib/api/types/properties";
import { ListingsToolbar } from "./listings-toolbar";
import { ListingsMap } from "./listings-map";
import { PropertyCard } from "@/components/shared/property-card";
import { extractFirstImageUrlFromMedia } from "@/components/shared/property-utils";

function findFieldValue(
  schemas: any[],
  dynamicValues: Record<string, unknown> | undefined,
  patterns: string[],
): string | null {
  const directKeysBed = ["bed_room_count", "bedroom_count", "bedrooms", "beds", "phong_ngu"];
  const directKeysBath = ["pathroom_count", "bathroom_count", "bathrooms", "baths", "phong_tam"];
  const isBedroom = patterns.some((p) => p.includes("bed") || p.includes("ngu"));
  const isBathroom = patterns.some((p) => p.includes("bath") || p.includes("tam") || p.includes("path"));
  if (dynamicValues) {
    const keys = isBedroom ? directKeysBed : isBathroom ? directKeysBath : [];
    for (const k of keys) {
      const v = dynamicValues[k];
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
  }
  for (const schema of schemas) {
    for (const f of schema.fields || []) {
      const field = f.field;
      if (!field) continue;
      const key = (field.fieldKey || "").toLowerCase();
      const label = (field.fieldLabel || "").toLowerCase();
      if (patterns.some((p) => key.includes(p) || label.includes(p))) {
        const rawValue = dynamicValues?.[field.fieldKey];
        if (rawValue === undefined || rawValue === null || rawValue === "") return null;
        if (field.options && Array.isArray(field.options)) {
          const opt = field.options.find((o: any) => o.value === String(rawValue));
          if (opt) return opt.label;
        }
        return String(rawValue);
      }
    }
  }
  return null;
}

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
    limit: "100",
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

  const [propertiesRes, schemaRes] = await Promise.all([
    getApiProperties(apiParams as any),
    getApiFormSchemas({ entityType: "PROPERTY" } as any),
  ]);

  const properties: Property[] =
    ((propertiesRes as unknown as GetPropertiesResponse)?.data) || [];
  const schemas: any[] = ((schemaRes as any)?.data as any[]) || [];

  // Filter + sort
  let result = [...properties];
  if (types.length > 0) {
    result = result.filter(
      (p) => p.propertyType && types.includes(p.propertyType.code),
    );
  }
  switch (sort) {
    case "price-asc":
      result = result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      break;
    case "price-desc":
      result = result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      break;
    case "area-desc":
      result = result.sort((a, b) => (b.area || 0) - (a.area || 0));
      break;
    default:
      result = result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }

  // Pre-compute maps
  const propertyImageMap = new Map<string, string | null>();
  const bedroomsMap = new Map<string, string | null>();
  const bathroomsMap = new Map<string, string | null>();
  for (const p of result) {
    propertyImageMap.set(p.id, extractFirstImageUrlFromMedia(p.media));
    const propertyTypeId = p.propertyType?.id;
    const relevantSchemas = schemas.filter(
      (s) => !s.propertyType || s.propertyType?.id === undefined || s.propertyType?.id === propertyTypeId,
    );
    const dynamicValues = (p as any)?.dynamicValuesJson as Record<string, unknown> | undefined;
    bedroomsMap.set(
      p.id,
      findFieldValue(relevantSchemas, dynamicValues, ["bedroom", "beds", "bed_room", "phong_ngu", "phòng ngủ"]),
    );
    bathroomsMap.set(
      p.id,
      findFieldValue(relevantSchemas, dynamicValues, ["bathroom", "baths", "pathroom", "phong_tam", "phòng tắm"]),
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <ListingsToolbar currentSort={sort} resultCount={result.length} currentView={view} />

      {result.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-base text-foreground-muted">{t("noResults")}</p>
          <Link href="/listings" className="text-sm font-medium text-primary hover:underline">
            {t("clearAllFilters")}
          </Link>
        </div>
      ) : view === "map" ? (
        <ListingsMap properties={result} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {result.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              imageUrl={propertyImageMap.get(property.id) ?? null}
              bedrooms={bedroomsMap.get(property.id)}
              bathrooms={bathroomsMap.get(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
