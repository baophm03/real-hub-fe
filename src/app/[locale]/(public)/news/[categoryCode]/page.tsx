import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getApiNewsCategories } from "@/lib/api/endpoints/news-categories";
import { getApiNews, getApiNewsCategoryCode } from "@/lib/api/endpoints/news";
import type {
  GetNewsResponse,
  GetNewsCategoriesResponse,
  News,
  NewsCategory,
} from "@/lib/api/types/news";
import { NewsFilter } from "../_components/news-filter";
import { NewsGrid } from "../_components/news-grid";
import { NewsCarousel } from "@/components/shared/news-carousel";
import { RevealSection } from "@/components/shared/reveal-section";
import { PageBanner } from "@/components/shared/page-banner";
import { generateSeoMetadata } from "@/lib/seo";
import { buildBlogListContext } from "@/lib/seo-context";

export const ALL_SLUG = "all";

type Props = {
  params: Promise<{ locale: string; categoryCode: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale, categoryCode } = await params;
  const t = await getTranslations({ locale, namespace: "public.news" });
  const categoryName = categoryCode === ALL_SLUG ? t("categoryMetaTitle") : categoryCode;
  return generateSeoMetadata(
    "BLOG_LIST",
    buildBlogListContext(categoryName),
    {
      title: `${categoryName} - RealHub`,
      description: t("categoryMetaDesc", { category: categoryName }),
    },
  );
}

export async function generateStaticParams() {
  const catsRes = await getApiNewsCategories({ limit: "100" });
  const cats =
    (catsRes as unknown as GetNewsCategoriesResponse)?.data ?? ([] as NewsCategory[]);
  return ["vi", "en"].flatMap((locale) => [
    { locale, categoryCode: ALL_SLUG },
    ...cats.map((c) => ({ locale, categoryCode: c.code })),
  ]);
}

export default async function NewsListPage({ params }: Props) {
  const { locale, categoryCode } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("public.news");
  const tc = await getTranslations("public.common");

  const isAll = categoryCode === ALL_SLUG;

  const [newsRes, categoriesRes] = await Promise.all([
    isAll
      ? getApiNews({ limit: "100" })
      : getApiNewsCategoryCode(categoryCode, { limit: "100" }),
    getApiNewsCategories({ limit: "100" }),
  ]);

  const categories = (categoriesRes as unknown as GetNewsCategoriesResponse)?.data ?? ([] as NewsCategory[]);
  const news = (newsRes as unknown as GetNewsResponse)?.data ?? ([] as News[]);

  const active = isAll ? undefined : categories.find((c) => c.code === categoryCode);

  return (
    <>
      <PageBanner
        title={active ? active.name : t("defaultTitle")}
        description={t("defaultDesc")}
        backgroundImage="/background/news.jpg"
        breadcrumbs={[
          { label: tc("home"), href: "/" },
          ...(active ? [{ label: t("categoryMetaTitle"), href: "/news/all" }] : []),
          { label: active ? active.name : t("categoryMetaTitle") },
        ]}
      />

      <div className="container py-12 md:py-16">
        <RevealSection>
          <NewsFilter categories={categories} activeCategory={isAll ? undefined : categoryCode} />
        </RevealSection>

        {news.length > 0 && (
          <RevealSection className="pb-6">
            <NewsCarousel newsList={news.slice(0, 3)} />
          </RevealSection>
        )}

        <RevealSection>
          <NewsGrid news={news.slice(3)} />
        </RevealSection>
      </div>
    </>
  );
}
