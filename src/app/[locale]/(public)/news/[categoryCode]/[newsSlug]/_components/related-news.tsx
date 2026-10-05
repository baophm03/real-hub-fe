import { Link } from "@/i18n/navigation";
import type { News } from "@/lib/api/types/news";
import { getFormatter, getTranslations } from "next-intl/server";
import { NewsListItem } from "@/components/shared/news-list-item";

interface RelatedNewsProps {
  news: News[];
  categoryCode: string;
}

export async function RelatedNews({ news, categoryCode }: RelatedNewsProps) {
  const t = await getTranslations("public.news");
  const format = await getFormatter();

  const formatDate = (iso: string): string => {
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
  };

  if (news.length === 0) return null;

  return (
    <div className="w-full lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-[1rem] border border-border bg-white p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="font-serif text-lg font-semibold tracking-tight">
            {t("relatedTitle")}
          </h2>
        </div>

        {/* List items */}
        <div className="flex flex-col">
          {news.map((n) => (
            <NewsListItem
              key={n.id}
              article={n}
              fallbackCategoryCode={categoryCode}
              formatDate={formatDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
