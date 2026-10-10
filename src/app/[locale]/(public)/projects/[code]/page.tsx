import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getApiProjectCode, getApiProjects } from "@/lib/api/endpoints/projects";
import type {
  GetProjectItemResponse,
  GetProjectsResponse,
  Project,
} from "@/lib/api/types/projects";
import { Link } from "@/i18n/navigation";
import {
  MapPin,
  ArrowLeft,
  Phone,
  Calendar,
  ArrowRight,
  BedDouble,
  Bath,
  Square,
  Building2,
  Hash,
  Briefcase,
  Ruler,
  Tag,
  Home,
} from "lucide-react";
import { formatPriceWithTransaction } from "@/utils";
import { getProjectScale, getProjectPriceRange, getProjectImages, getPropertyImageUrl } from "@/utils/project-helpers";
import { pickDynamicValue } from "@/components/shared/property-utils";
import { formatLocationShort } from "@/utils";
import { ProjectCard } from "@/components/shared/project-card";
import { PropertyGallery } from "@/components/shared/property-detail/property-gallery";
import type { IconColor } from "@/constants/property-icons";
import { generateSeoMetadata } from "@/lib/seo";
import { buildProjectDetailContext } from "@/lib/seo-context";

const iconColorClasses: Record<IconColor, string> = {
  blue: "text-accent-blue-text",
  purple: "text-accent-purple-text",
  green: "text-accent-green-text",
  yellow: "text-accent-yellow-text",
  red: "text-accent-red-text",
};

type Props = {
  params: Promise<{ locale: string; code: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: "public.projectDetail" });
  try {
    const projectRes = await getApiProjectCode(code);
    const project = (projectRes as unknown as GetProjectItemResponse)?.data;
    if (!project) {
      return generateSeoMetadata("PROPERTY_DETAIL", {}, {
        title: t("metaTitle"),
        description: t("metaDesc"),
      });
    }
    const context = buildProjectDetailContext(project);
    return generateSeoMetadata("PROPERTY_DETAIL", context, {
      title: `${project.name} - RealHub`,
      description: `${project.name} - ${project.developer ?? t("fallbackDeveloper")}`,
    });
  } catch {
    return generateSeoMetadata("PROPERTY_DETAIL", {}, {
      title: t("metaTitle"),
      description: t("metaDesc"),
    });
  }
}

export async function generateStaticParams() {
  const projectsRes = await getApiProjects({ limit: "100" });
  const projects = (projectsRes as unknown as GetProjectsResponse)?.data ?? [];
  return ["vi", "en"].flatMap((locale) =>
    projects.map((p) => ({ locale, code: p.code })),
  );
}

const buttonBase =
  "inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none select-none gap-1.5 h-10 px-2.5 w-full";
const buttonPrimary = `${buttonBase} bg-primary text-primary-foreground hover:bg-primary/80`;
const buttonOutline = `${buttonBase} border border-border bg-background shadow-xs hover:bg-muted hover:text-foreground`;

const propertyBadgeBase =
  "inline-flex h-6 min-w-[3.25rem] items-center justify-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-md shadow-sm whitespace-nowrap";

const BEDROOM_KEYS = ["bed_room_count", "bedroom_count", "bedrooms", "beds", "phong_ngu"];
const BATHROOM_KEYS = ["bathroom_count", "bathrooms", "baths", "pathroom_count", "phong_tam"];

export default async function ProjectDetailPage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("public.projectDetail");
  const tc = await getTranslations("public.common");
  const tp = await getTranslations("public");

  const businessStatusBadgeClasses: Record<string, string> = {
    AVAILABLE: "bg-accent-green text-accent-green-text",
    RESERVED: "bg-accent-yellow text-accent-yellow-text",
    SOLD: "bg-accent-red text-accent-red-text",
    RENTED: "bg-accent-blue text-accent-blue-text",
    OFF_MARKET: "bg-surface-muted text-foreground-muted",
  };

  const enumLabel = (prefix: string, code: string): string => {
    const key = `${prefix}.${code}` as never;
    return tp.has(key) ? tp(key) : code;
  };

  const [projectRes, projectsRes] = await Promise.all([
    getApiProjectCode(code),
    getApiProjects({ limit: "10" }),
  ]);

  const project = (projectRes as unknown as GetProjectItemResponse)?.data ?? null;
  const allProjects = (projectsRes as unknown as GetProjectsResponse)?.data ?? [];
  const relatedProjects = allProjects.filter((p) => p.code !== code).slice(0, 3);

  // Properties trong dự án — media đã được embed trong ProjectProperty
  const properties = project?.properties ?? [];

  if (!project) {
    return (
      <div className="container py-8 md:py-12 pt-4">
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> {t("backToList")}
        </Link>
        <div className="mx-auto max-w-3xl py-20 text-center">
          <h1 className="mb-2 font-serif text-2xl font-semibold">{t("notFound")}</h1>
          <p className="text-sm text-foreground-muted">{t("notFoundDesc")}</p>
        </div>
      </div>
    );
  }

  const location = formatLocationShort(project, t("updatingLocation"));
  const scale = getProjectScale(project);
  const projectImages = getProjectImages(project);
  const gallery = projectImages.map((img) => img.url);

  return (
    <div className="container pb-8 md:pb-12 pt-4">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> {t("backToList")}
      </Link>

      {/* Gallery dùng chung — bấm ảnh để phóng to như listing detail */}
      <PropertyGallery images={gallery} propertyCode={project.code} />

      {/* Tiêu đề dự án */}
      <div className="mb-8 mt-6 flex flex-col items-start gap-2">
        <span className="inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-primary-foreground">
          {enumLabel("enums.projectStatus", project.status)}
        </span>
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          {project.name}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-base text-foreground-muted">
          <MapPin size={16} />
          <span>{location}</span>
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          {/* Description */}
          <div>
            <h2 className="mb-3 font-serif text-xl font-semibold">{t("introTitle")}</h2>
            {project.description ? (
              <p className="whitespace-pre-line text-base leading-relaxed text-foreground-muted">{project.description}</p>
            ) : (
              <p className="text-base leading-relaxed text-foreground-muted">{t("introFallback", { name: project.name })}</p>
            )}
          </div>

          <div>
            <h2 className="mb-4 font-serif text-xl font-semibold">{t("detailsTitle")}</h2>
            <div className="rounded-xl border border-border bg-white px-6 py-2 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col divide-y divide-border md:grid md:grid-cols-2 md:divide-y-0">
                {[
                  { label: t("detailName"), value: project.name, icon: Building2, color: "blue" as IconColor },
                  { label: t("detailCode"), value: project.code, icon: Hash, color: "purple" as IconColor },
                  { label: t("detailLocation"), value: location, icon: MapPin, color: "red" as IconColor },
                  { label: t("detailDeveloper"), value: project.developer ?? tc("updating"), icon: Briefcase, color: "green" as IconColor },
                  { label: t("detailScale"), value: scale, icon: Ruler, color: "yellow" as IconColor },
                  {
                    label: t("detailStatus"),
                    value: enumLabel("enums.projectStatus", project.status),
                    icon: Tag,
                    color: "blue" as IconColor,
                  },
                  { label: t("detailType"), value: tc("updating"), icon: Home, color: "purple" as IconColor },
                  { label: t("detailHandover"), value: project.handoverDate ?? tc("updating"), icon: Calendar, color: "red" as IconColor },
                ].map(({ label, value, icon: Icon, color }, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 py-4 ${i % 2 === 0 ? "md:pr-6 md:border-r md:border-border" : "md:pl-6"} ${i >= 2 ? "md:border-t md:border-border" : ""} ${i < 2 ? "pt-0 md:pt-4" : ""} ${i >= 6 ? "pb-0 md:pb-4" : ""}`}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                      <Icon size={16} className={iconColorClasses[color]} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-foreground line-clamp-1">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{t("priceRange")}</span>
              <p className="text-2xl font-semibold text-primary">{getProjectPriceRange(project)}</p>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="flex flex-col gap-3">
              <button type="button" className={buttonPrimary}>
                <Phone size={16} />
                {t("contactNow")}
              </button>
              <button type="button" className={buttonOutline}>
                <Calendar size={16} />
                {t("scheduleViewing")}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {properties.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 font-serif text-xl font-semibold">{t("propertiesTitle")}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => {
              const badgeClass = businessStatusBadgeClasses[property.businessStatus ?? ""];
              const badgeLabel = property.businessStatus ? enumLabel("enums.businessStatus", property.businessStatus) : null;
              const imageUrl = getPropertyImageUrl(property);
              const bedrooms = pickDynamicValue(property.dynamicValuesJson, BEDROOM_KEYS);
              const bathrooms = pickDynamicValue(property.dynamicValuesJson, BATHROOM_KEYS);
              const tx = property.transactionType ?? "";
              return (
                <Link
                  key={property.id}
                  href={`/listings/${property.propertyCode}`}
                  className="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-primary transition-colors shadow-sm hover:shadow-md"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-muted">
                        <span className="text-xs text-foreground-muted">{tc("noImage")}</span>
                      </div>
                    )}
                    {badgeClass && badgeLabel && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`${propertyBadgeBase} ${badgeClass}`}>{badgeLabel}</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={`${propertyBadgeBase} ${tx === "SALE"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent-blue text-accent-blue-text"
                          }`}
                      >
                        {enumLabel("enums.transaction", tx)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="font-serif text-lg font-medium text-primary truncate pr-2 group-hover:text-primary/80 transition-colors">
                      {property.title}
                    </h3>

                    <p className="text-sm text-foreground-muted flex items-center gap-1">
                      <MapPin size={16} />
                      <span>
                        {property?.district?.name ?? tc("updating")},{" "}
                        {property?.province?.name ?? tc("updating")}
                      </span>
                    </p>

                    {property.propertyType?.name && (
                      <div className="flex gap-2 mt-1">
                        <span className="bg-surface-muted text-xs px-2 py-1 rounded text-foreground-muted">
                          {property.propertyType.name}
                        </span>
                      </div>
                    )}

                    {/* Giá tiền */}
                    <div className="flex flex-col items-start justify-start gap-1 mt-1">
                      <div className="font-serif text-2xl font-bold text-primary">
                        {formatPriceWithTransaction(String(property.price ?? 0), tx)}
                      </div>
                    </div>

                    {/* Thông tin phòng ngủ, phòng tắm, diện tích */}
                    <div className="flex flex-wrap items-center justify-start gap-3 mt-auto pt-4 border-t border-border text-xs text-foreground-muted">
                      {bedrooms && (
                        <span className="flex items-center gap-1">
                          <BedDouble size={13} className="shrink-0" />
                          <span className="tabular-nums">{bedrooms}</span>
                          <span>{tc("bedroom")}</span>
                        </span>
                      )}
                      {bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath size={13} className="shrink-0" />
                          <span className="tabular-nums">{bathrooms}</span>
                          <span>{tc("bathroom")}</span>
                        </span>
                      )}
                      {property.area != null && (
                        <span className="flex items-center gap-1">
                          <Square size={13} className="shrink-0" />
                          <span className="tabular-nums">
                            {property.area.toLocaleString("vi-VN")}
                          </span>
                          <span>{tc("sqm")}</span>
                        </span>
                      )}
                    </div>

                    {/* Xem chi tiết */}
                    <div className="flex items-center gap-1 pt-2 text-xs font-medium text-primary">
                      {tc("viewDetail")}
                      <ArrowRight size={13} className="shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <div className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">{t("relatedTitle")}</h2>
            <Link
              href="/projects"
              className="group flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {tc("viewAll")}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
