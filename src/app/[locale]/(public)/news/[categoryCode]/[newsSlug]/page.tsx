import type { Metadata } from "next";
import { setRequestLocale, getTranslations, getFormatter } from "next-intl/server";
import {
  getApiNews,
  getApiNewsSlug,
} from "@/lib/api/endpoints/news";
import type {
  GetNewsItemResponse,
  GetNewsResponse,
  News,
} from "@/lib/api/types/news";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { NewsContent } from "./_components/news-content";
import { RelatedNews } from "./_components/related-news";
import { generateSeoMetadata } from "@/lib/seo";
import { buildBlogDetailContext } from "@/lib/seo-context";

type Props = {
  params: Promise<{ locale: string; categoryCode: string; newsSlug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale, newsSlug } = await params;
  const t = await getTranslations({ locale, namespace: "public.news" });
  try {
    const newsRes = await getApiNewsSlug(newsSlug);
    const news = (newsRes as unknown as GetNewsItemResponse)?.data;
    if (!news) {
      return generateSeoMetadata("BLOG_DETAIL", {}, {
        title: t("articleMetaTitle"),
        description: t("articleMetaDesc"),
      });
    }
    const context = buildBlogDetailContext(news, newsSlug);
    return generateSeoMetadata("BLOG_DETAIL", context, {
      title: `${news.title} - RealHub`,
      description: (news as any)?.excerpt ?? news.title,
    });
  } catch {
    return generateSeoMetadata("BLOG_DETAIL", {}, {
      title: t("articleMetaTitle"),
      description: t("articleMetaDesc"),
    });
  }
}

export async function generateStaticParams() {
  const newsRes = await getApiNews({ limit: "100" });
  const news = (newsRes as unknown as GetNewsResponse)?.data ?? ([] as News[]);

  const byCategory = new Map<string, News[]>();
  for (const n of news) {
    const catCode = n.category?.code ?? "uncategorized";
    if (!byCategory.has(catCode)) byCategory.set(catCode, []);
    byCategory.get(catCode)!.push(n);
  }

  return ["vi", "en"].flatMap((locale) =>
    Array.from(byCategory.entries()).flatMap(([catCode, articles]) =>
      articles.map((n) => ({ locale, categoryCode: catCode, newsSlug: n.slug })),
    ),
  );
}

function formatDate(iso: string, format: Awaited<ReturnType<typeof getFormatter>>): string {
  if (!iso) return "";
  try {
    return format.dateTime(new Date(iso), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function NewsImage({
  url,
  alt,
  className,
  iconSize = 28,
}: {
  url?: string | null;
  alt: string;
  className?: string;
  iconSize?: number;
}) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-surface-muted ${className ?? ""}`}>
        <ImageIcon size={iconSize} className="text-foreground-muted" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={className} loading="lazy" />
  );
}

function renderContent(content: string) {
  return (
    <div
      className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg prose-img:my-4"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default async function NewsDetailPage({ params }: Props) {
  const { locale, categoryCode, newsSlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("public.news");

  const [articleRes, relatedRes] = await Promise.all([
    getApiNewsSlug(newsSlug),
    getApiNews({ limit: "4" }),
  ]);

  const article = (articleRes as unknown as GetNewsItemResponse)?.data ?? null;
  const relatedNews = (((relatedRes as unknown as GetNewsResponse)?.data) ?? [])
    .filter((n: News) => n.slug !== newsSlug)
    .slice(0, 3);

  if (!article) {
    return (
      <div className="container pb-8 md:pb-12">
        <Link
          href={`/news/${categoryCode}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> {t("backToNews")}
        </Link>
        <div className="mx-auto max-w-3xl py-20 text-center">
          <h1 className="mb-2 font-serif text-2xl font-semibold">{t("notFound")}</h1>
          <p className="text-sm text-foreground-muted">{t("notFoundDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative -mt-20 lg:-mt-100 ">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          {article.thumbnail?.url ? (
            <img
              src={article.thumbnail.url}
              alt={article.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-surface-muted">
              <ImageIcon size={48} className="text-foreground-muted" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        </div>
      </div>

      <div className="container relative z-10 -mt-[10%] pb-8 md:pb-12">
        <Link
          href={`/news/${categoryCode}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-white transition-colors hover:text-white/80"
        >
          <ArrowLeft size={16} /> {t("backToNews")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <NewsContent article={article} renderContent={renderContent} />
          </div>
          <div className="lg:col-span-4">
            <RelatedNews news={relatedNews} categoryCode={categoryCode} />
          </div>
        </div>
      </div>
    </>
  );
}
