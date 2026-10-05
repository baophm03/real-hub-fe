import { getApiNews } from "@/lib/api/endpoints/news";
import type { GetNewsResponse, News } from "@/lib/api/types/news";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { NewsCard } from "@/components/shared/news-card";
import { NewsListItem } from "@/components/shared/news-list-item";
import { NewsCarousel } from "@/components/shared/news-carousel";

export async function FeaturedNews() {
  const t = await getTranslations("public.home");
  const tc = await getTranslations("public.common");
  let newsList: News[] = [];

  try {
    const res = await getApiNews({ limit: "12" } as any);
    newsList = ((res as unknown as GetNewsResponse)?.data) || [];
  } catch {
    // Keep empty
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full bg-primary/8 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
              {t("newsEyebrow")}
            </span>
            <h2 className="font-serif text-3xl font-semibold tracking-tighter md:text-5xl">
              {t("newsTitle")}
            </h2>
            <p className="max-w-[48ch] text-sm leading-relaxed text-foreground-muted">
              {t("newsDesc")}
            </p>
          </div>
          <Link
            href="/news/all"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            {tc("viewAll")}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {newsList.length > 0 ? (
          <div className="flex flex-col gap-10 md:gap-12">
            <NewsCarousel newsList={newsList.slice(0, 6)} />
            {/* Mobile: compact list cards (related-news style) */}
            <div className="flex flex-col sm:hidden">
              {newsList.slice(6, 12).map((news) => (
                <NewsListItem key={news.id} article={news} />
              ))}
            </div>
            {/* sm+: article card grid */}
            <div className="hidden gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {newsList.slice(6, 12).map((news) => (
                <NewsCard key={news.id} article={news} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-center">
            <p className="text-sm text-foreground-muted">{t("noNews")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
