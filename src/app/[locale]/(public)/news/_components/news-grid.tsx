import type { News } from "@/lib/api/types/news";
import { Newspaper } from "lucide-react";
import { NewsCard } from "@/components/shared/news-card";
import { NewsListItem } from "@/components/shared/news-list-item";
import { getTranslations } from "next-intl/server";

export async function NewsGrid({ news }: { news: News[] }) {
  const t = await getTranslations("public.news");

  const sorted = [...news].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Newspaper size={32} className="text-foreground-muted" />
        <p className="text-base text-foreground-muted">{t("noArticles")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: compact list cards (related-news style) */}
      <div className="flex flex-col sm:hidden">
        {sorted.map((article) => (
          <NewsListItem key={article.id} article={article} />
        ))}
      </div>
      {/* sm+: article card grid */}
      <div className="hidden gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </>
  );
}
