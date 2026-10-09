import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import config from "@/config";
import { getApiNews } from "@/lib/api/endpoints/news";
import { getApiProjects } from "@/lib/api/endpoints/projects";
import { getApiProperties } from "@/lib/api/endpoints/properties";
import type { GetNewsResponse, News } from "@/lib/api/types/news";
import type { GetProjectsResponse, Project } from "@/lib/api/types/projects";
import type { GetPropertiesResponse, Property } from "@/lib/api/types/properties";

const BASE_URLS: Record<string, string> = {
  vi: config.siteUrl,
  en: `${config.siteUrl}/en`,
};

const STATIC_ROUTES = [
  "",
  "/listings",
  "/about",
  "/contact",
  "/projects",
  "/news",
];

type SitemapEntry = MetadataRoute.Sitemap[number];

function buildAlternates(route: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const altLocale of routing.locales) {
    languages[altLocale] = `${BASE_URLS[altLocale]}${route}`;
  }
  return { languages };
}

function buildStaticEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const locale of routing.locales) {
    const base = BASE_URLS[locale] ?? `${config.siteUrl}/${locale}`;

    for (const route of STATIC_ROUTES) {
      entries.push({
        url: `${base}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
        alternates: buildAlternates(route),
      });
    }
  }

  return entries;
}

async function buildPropertyEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  try {
    const propertiesRes = await getApiProperties({
      verificationStatus: "VERIFIED" as never,
      publicationStatus: "PUBLIC" as never,
      limit: "100",
      include: "media",
    } as never);
    const properties =
      (propertiesRes as unknown as GetPropertiesResponse)?.data ?? [];

    for (const property of properties as Property[]) {
      const route = `/listings/${property.propertyCode}`;
      for (const locale of routing.locales) {
        const base = BASE_URLS[locale] ?? `${config.siteUrl}/${locale}`;
        entries.push({
          url: `${base}${route}`,
          lastModified: new Date(property.updatedAt || property.createdAt),
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: buildAlternates(route),
        });
      }
    }
  } catch {
    // API không khả dụng — bỏ qua dynamic entries
  }

  return entries;
}

async function buildProjectEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  try {
    const projectsRes = await getApiProjects({ limit: "100" });
    const projects =
      (projectsRes as unknown as GetProjectsResponse)?.data ?? [];

    for (const project of projects as Project[]) {
      const route = `/projects/${project.code}`;
      for (const locale of routing.locales) {
        const base = BASE_URLS[locale] ?? `${config.siteUrl}/${locale}`;
        entries.push({
          url: `${base}${route}`,
          lastModified: new Date(project.updatedAt || project.createdAt),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: buildAlternates(route),
        });
      }
    }
  } catch {
    // API không khả dụng — bỏ qua dynamic entries
  }

  return entries;
}

async function buildNewsEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  try {
    const newsRes = await getApiNews({ limit: "100" });
    const news = (newsRes as unknown as GetNewsResponse)?.data ?? [];

    for (const article of news as News[]) {
      const categoryCode = article.category?.code ?? "uncategorized";
      const route = `/news/${categoryCode}/${article.slug}`;
      for (const locale of routing.locales) {
        const base = BASE_URLS[locale] ?? `${config.siteUrl}/${locale}`;
        entries.push({
          url: `${base}${route}`,
          lastModified: new Date(article.updatedAt || article.createdAt),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: buildAlternates(route),
        });
      }
    }
  } catch {
    // API không khả dụng — bỏ qua dynamic entries
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [staticEntries, propertyEntries, projectEntries, newsEntries] =
    await Promise.all([
      Promise.resolve(buildStaticEntries()),
      buildPropertyEntries(),
      buildProjectEntries(),
      buildNewsEntries(),
    ]);

  return [
    ...staticEntries,
    ...propertyEntries,
    ...projectEntries,
    ...newsEntries,
  ];
}
