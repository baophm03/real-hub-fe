import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getApiPropertyCode,
  getApiProperties,
} from "@/lib/api/endpoints/properties";
import { getApiFormSchemas } from "@/lib/api/endpoints/dynamic-fields";
import { findFieldValue } from "@/constants/property-icons";
import type {
  GetPropertiesResponse,
  GetPropertyItemResponse,
  Property,
  PropertyMedia,
} from "@/lib/api/types/properties";
import { Link } from "@/i18n/navigation";
import {
  formatPriceWithTransaction as formatPrice,
  formatPricePerSqm,
} from "@/utils";
import { MapPin, ChevronRight } from "lucide-react";
import { ListingGallery } from "./_components/listing-gallery";
import { ListingSpecs } from "./_components/listing-specs";
import { ListingDescription } from "./_components/listing-description";
import { ListingHighlights } from "./_components/listing-highlights";
import { ListingTags } from "./_components/listing-tags";
import { ListingMap } from "./_components/listing-map";
import { ContactSidebar } from "./_components/contact-sidebar";
import { FeaturedPropertiesCarousel } from "@/components/shared/featured-properties-carousel";
import { generateSeoMetadata } from "@/lib/seo";
import { buildPropertyDetailContext } from "@/lib/seo-context";

type Props = {
  params: Promise<{ locale: string; propertyCode: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { propertyCode } = await params;
  const t = await getTranslations("public.listingDetail");
  try {
    const propertyRes = await getApiPropertyCode(propertyCode);
    const property = (propertyRes as unknown as GetPropertyItemResponse)?.data;
    if (!property) {
      return generateSeoMetadata("PROPERTY_DETAIL", {}, {
        title: t("metaTitle"),
        description: t("metaDesc"),
      });
    }
    const context = buildPropertyDetailContext(property);
    return generateSeoMetadata("PROPERTY_DETAIL", context, {
      title: `${property.title} - RealHub`,
      description: `${property.title} tại ${context.location || "Việt Nam"}`,
    });
  } catch {
    return generateSeoMetadata("PROPERTY_DETAIL", {}, {
      title: t("metaTitle"),
      description: t("metaDesc"),
    });
  }
}

export async function generateStaticParams() {
  const propertiesRes = await getApiProperties({
    verificationStatus: "VERIFIED" as any,
    publicationStatus: "PUBLIC" as any,
    limit: "100",
    include: "media",
  } as any);
  const properties = (propertiesRes as unknown as GetPropertiesResponse)?.data ?? [];
  return ["vi", "en"].flatMap((locale) =>
    properties.map((p) => ({ locale, propertyCode: p.propertyCode })),
  );
}

function extractFirstImageUrlFromMedia(media: PropertyMedia[] | undefined): string | null {
  if (!media || media.length === 0) return null;
  const imageItem = media
    .filter((m) => m.type === "IMAGE" || m.file?.mimeType?.startsWith("image/"))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  return imageItem?.file?.url ?? null;
}

export default async function ListingDetailPage({ params }: Props) {
  const { locale, propertyCode } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("public.listingDetail");
  const tp = await getTranslations("public");
  const tprops = await getTranslations("properties");

  const [propertyRes, schemaRes] = await Promise.all([
    getApiPropertyCode(propertyCode),
    getApiFormSchemas({ entityType: "PROPERTY" } as any),
  ]);

  const property = (propertyRes as unknown as GetPropertyItemResponse)?.data ?? null;
  const schemas = ((schemaRes as any)?.data as any[]) || [];

  const propertyTypeId = property?.propertyType?.id;
  let similarProperties: Property[] = [];
  let similarImageMap = new Map<string, string | null>();

  if (property) {
    const similarRes = await getApiProperties(
      propertyTypeId
        ? { propertyTypeId, verificationStatus: "VERIFIED", publicationStatus: "PUBLIC", limit: "10", include: "media" }
        : { verificationStatus: "VERIFIED", publicationStatus: "PUBLIC", limit: "10", include: "media" } as any,
    );
    similarProperties = (((similarRes as unknown as GetPropertiesResponse)?.data) || [])
      .filter((p: Property) => p.propertyCode !== propertyCode)
      .slice(0, 10);

    for (const p of similarProperties) {
      similarImageMap.set(p.id, extractFirstImageUrlFromMedia(p.media));
    }
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <Link href="/listings" className="hover:text-foreground transition-colors text-sm text-foreground-muted">
          {tprops("title")}
        </Link>
        <div className="mx-auto max-w-3xl py-20 text-center">
          <h1 className="mb-2 font-serif text-2xl font-semibold">{t("notFound")}</h1>
          <p className="text-sm text-foreground-muted">{t("notFoundDesc")}</p>
        </div>
      </div>
    );
  }

  const relevantSchemas = schemas.filter(
    (s) => !s.propertyType || s.propertyType?.id === undefined || s.propertyType?.id === propertyTypeId,
  );
  const dynamicValues = (property as any)?.dynamicValuesJson as Record<string, unknown> | undefined;
  const direction = findFieldValue(relevantSchemas, dynamicValues, ["direction", "huong", "hướng"]);

  const gallery: string[] = (() => {
    const mediaList = (property as any)?.media as any[] | undefined;
    if (!mediaList || mediaList.length === 0) return [];
    return mediaList
      .filter((m) => m.type === "IMAGE" || m.file?.mimeType?.startsWith("image/"))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((m) => m.file?.url)
      .filter(Boolean) as string[];
  })();

  return (
    <div className="container">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-foreground-muted mb-4">
        <Link href="/listings" className="hover:text-foreground transition-colors">{tprops("title")}</Link>
        <ChevronRight size={14} className="text-foreground-muted" />
        <span>{property.propertyType?.name ?? tprops("title")}</span>
        <ChevronRight size={14} className="text-foreground-muted" />
        <span className="truncate">{property.title}</span>
      </div>

      {/* Image Gallery */}
      <ListingGallery images={gallery} propertyCode={property.propertyCode} />
      <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
        {/* Left Column: Details */}
        <div className="flex-grow w-full lg:w-2/3 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${property.transactionType === "SALE" ? "bg-[#FCEAEB] text-[#C57B7A]" : "bg-accent-blue text-accent-blue-text"}`}>
                {tp(`enums.transaction.${property.transactionType}`) ?? property.transactionType}
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${property.businessStatus === "AVAILABLE" ? "bg-accent-green text-accent-green-text" : property.businessStatus === "RESERVED" ? "bg-accent-yellow text-accent-yellow-text" : property.businessStatus === "SOLD" ? "bg-accent-red text-accent-red-text" : "bg-surface-muted text-foreground-muted"}`}>
                {property.businessStatus ? tp(`enums.businessStatus.${property.businessStatus}`) : property.businessStatus}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-black md:text-4xl">
              {property.title}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-base text-foreground-muted">
              <MapPin size={16} className="text-black" />
              {[property.district?.name, property.province?.name].filter(Boolean).join(", ") || t("updatingLocation")}
            </p>
            <div className="mt-4 flex flex-col gap-0.5">
              <div className="font-serif text-xl font-semibold text-black md:text-3xl">
                {formatPrice(property.price, property.transactionType)}
              </div>
              <div className="text-sm text-foreground-muted">{formatPricePerSqm(property.price, property.area)}</div>
            </div>
          </div>

          <ListingSpecs property={property} schemas={relevantSchemas} />
          <ListingDescription property={property} />
          <ListingHighlights property={property} schemas={relevantSchemas} />
          <ListingTags property={property} />
          <ListingMap property={property} />
        </div>

        {/* Right Column: Contact Sidebar */}
        <ContactSidebar
          property={property}
          direction={direction}
        />
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="pt-8 border-t border-border mt-8">
          <div className="mb-6 flex flex-col gap-2">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-primary">{t("similarTitle")}</h2>
            <p className="text-sm text-foreground-muted">
              {t("similarDesc")}
            </p>
          </div>
          <FeaturedPropertiesCarousel properties={similarProperties} imageMap={similarImageMap} />
        </section>
      )}
    </div>
  );
}
