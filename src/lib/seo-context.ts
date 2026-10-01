import type { SeoPageType, SeoContext } from "./seo";
import type { Property } from "@/lib/api/types/properties";
import type { Project } from "@/lib/api/types/projects";
import type { News } from "@/lib/api/types/news";
import { formatLocationShort } from "@/utils";
import { getProjectImage } from "@/utils/project-helpers";

/* -------------------------------------------------------------------------- */
/*  Registry — available placeholders per page type (for settings UI hints)   */
/* -------------------------------------------------------------------------- */

export interface ContextKeyDef {
  key: string;
  description: string;
  example?: string;
}

export const SEO_CONTEXT_REGISTRY: Record<SeoPageType, ContextKeyDef[]> = {
  HOME: [
    { key: "tenantName", description: "Tên tenant / nền tảng", example: "RealHub" },
  ],

  PROPERTY_LISTING: [
    { key: "tenantName", description: "Tên tenant / nền tảng", example: "RealHub" },
    { key: "location", description: "Vị trí lọc (nếu có)", example: "Quận 1, TP.HCM" },
    { key: "count", description: "Số lượng BĐS (nếu có)", example: "150" },
  ],

  PROPERTY_DETAIL: [
    { key: "propertyTitle", description: "Tiêu đề BĐS", example: "Căn hộ Luxury Apartment" },
    { key: "propertyCode", description: "Mã BĐS", example: "bds-013" },
    { key: "location", description: "Vị trí (quận, tỉnh)", example: "Quận 1, TP.HCM" },
    { key: "price", description: "Giá (đã format)", example: "2 tỷ" },
    { key: "area", description: "Diện tích", example: "85 m²" },
    { key: "propertyTypeName", description: "Loại BĐS", example: "Căn hộ chung cư" },
    { key: "transactionType", description: "Bán / Cho thuê", example: "Bán" },
    { key: "propertyImageUrl", description: "URL ảnh đại diện", example: "https://..." },
    { key: "tenantName", description: "Tên tenant", example: "RealHub" },
  ],

  BLOG_LIST: [
    { key: "tenantName", description: "Tên tenant", example: "RealHub" },
    { key: "categoryName", description: "Tên danh mục tin tức", example: "Tư vấn đầu tư" },
  ],

  BLOG_DETAIL: [
    { key: "newsTitle", description: "Tiêu đề bài viết", example: "5 sai lầm khi đầu tư BĐS" },
    { key: "newsSlug", description: "Slug bài viết", example: "5-sai-lam-dau-tu-bds" },
    { key: "categoryName", description: "Tên danh mục", example: "Tư vấn" },
    { key: "newsExcerpt", description: "Mô tả ngắn / excerpt", example: "Những sai lầm phổ biến..." },
    { key: "newsImageUrl", description: "URL ảnh đại diện", example: "https://..." },
    { key: "tenantName", description: "Tên tenant", example: "RealHub" },
  ],

  ABOUT: [
    { key: "tenantName", description: "Tên tenant", example: "RealHub" },
  ],

  CONTACT: [
    { key: "tenantName", description: "Tên tenant", example: "RealHub" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Builders — convert entity data → SeoContext                               */
/* -------------------------------------------------------------------------- */

/**
 * Get property media image URL (first image sorted by sortOrder).
 */
function getPropertyImageUrl(property: any): string {
  const mediaList = property?.media as any[] | undefined;
  if (!mediaList || mediaList.length === 0) return "";
  const image = mediaList
    .filter((m) => m.type === "IMAGE" || m.file?.mimeType?.startsWith("image/"))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  return image?.file?.url ?? "";
}

/**
 * Build context for PROPERTY_DETAIL from a Property entity.
 */
export function buildPropertyDetailContext(property: Property): SeoContext {
  return {
    propertyTitle: property.title ?? "",
    propertyCode: property.propertyCode ?? "",
    location: formatLocationShort(property as any) ?? "",
    price: String(property.price ?? ""),
    area: String(property.area ?? ""),
    propertyTypeName: property.propertyType?.name ?? "",
    transactionType: property.transactionType ?? "",
    propertyImageUrl: getPropertyImageUrl(property),
    tenantName: "RealHub",
  };
}

/**
 * Build context for PROPERTY_DETAIL from a Project entity (project detail page
 * reuses PROPERTY_DETAIL page type).
 */
export function buildProjectDetailContext(project: Project): SeoContext {
  return {
    propertyTitle: project.name ?? "",
    propertyCode: project.code ?? "",
    location: formatLocationShort(project as any) ?? "",
    price: "",
    area: "",
    propertyTypeName: "Dự án",
    transactionType: "",
    propertyImageUrl: getProjectImage(project) ?? "",
    tenantName: "RealHub",
  };
}

/**
 * Build context for BLOG_DETAIL from a News entity.
 */
export function buildBlogDetailContext(news: News, slug?: string): SeoContext {
  const n = news as any;
  return {
    newsTitle: news.title ?? "",
    newsSlug: news.slug ?? slug ?? "",
    categoryName: news.category?.name ?? "",
    newsExcerpt: n?.excerpt ?? n?.summary ?? news.description ?? "",
    newsImageUrl: n?.thumbnail?.url ?? n?.featuredImage ?? "",
    tenantName: "RealHub",
  };
}

/**
 * Build context for BLOG_LIST from category name.
 */
export function buildBlogListContext(categoryName: string): SeoContext {
  return {
    categoryName,
    tenantName: "RealHub",
  };
}

/**
 * Build context for PROPERTY_LISTING (optional filters).
 */
export function buildPropertyListContext(opts?: {
  location?: string;
  count?: number | string;
}): SeoContext {
  return {
    location: opts?.location ?? "",
    count: opts?.count != null ? String(opts.count) : "",
    tenantName: "RealHub",
  };
}

/**
 * Build context for static pages (HOME, ABOUT, CONTACT).
 */
export function buildStaticContext(): SeoContext {
  return {
    tenantName: "RealHub",
  };
}

/**
 * Get all unique context keys across all page types — useful for settings UI
 * to show a complete list of available placeholders.
 */
export function getAllContextKeys(): ContextKeyDef[] {
  const seen = new Set<string>();
  const all: ContextKeyDef[] = [];
  for (const keys of Object.values(SEO_CONTEXT_REGISTRY)) {
    for (const k of keys) {
      if (!seen.has(k.key)) {
        seen.add(k.key);
        all.push(k);
      }
    }
  }
  return all;
}
