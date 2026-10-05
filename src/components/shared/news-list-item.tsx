import { ArrowRight, Calendar, ImageIcon, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { News } from "@/lib/api/types/news";
import { formatDate } from "@/utils/date";
import { getNewsCategoryColor } from "@/constants/news";
import { cn } from "@/lib/utils";

interface NewsListItemProps {
  article: News;
  fallbackCategoryCode?: string;
  formatDate?: (iso: string) => string;
  className?: string;
}

/**
 * Compact horizontal news card (thumbnail + category + title + date/author),
 * used for "related news" on the detail page and mobile news lists.
 */
export function NewsListItem({
  article,
  fallbackCategoryCode,
  formatDate: formatDateProp,
  className,
}: NewsListItemProps) {
  const formatDateFn = formatDateProp ?? formatDate;
  const catCode = article.category?.code ?? fallbackCategoryCode;

  return (
    <Link
      href={`/news/${catCode ?? "uncategorized"}/${article.slug}`}
      className={cn(
        "group -mx-2 flex gap-3 rounded-lg px-2 py-3 transition-colors duration-300 hover:bg-surface-muted/40",
        className,
      )}
    >
      {/* Image */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        {article.thumbnail?.url ? (
          <img
            src={article.thumbnail.url}
            alt={article.title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={20} className="text-foreground-muted" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {article.category && (
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wide",
              getNewsCategoryColor(article.category.code).text,
            )}
          >
            {article.category.name}
          </span>
        )}
        <h3 className="text-sm font-medium leading-snug tracking-tight text-black/80 transition-colors group-hover:text-primary line-clamp-2">
          {article.title}
        </h3>
        <div className="mt-auto flex items-center gap-3 text-[11px] text-black/50">
          <span className="flex items-center gap-1">
            <Calendar size={10} /> {formatDateFn(article.createdAt)}
          </span>
          {article.creator && (
            <span className="flex items-center gap-1">
              <User size={10} /> {article.creator.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight
        size={14}
        className="mt-1 shrink-0 text-black/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
      />
    </Link>
  );
}
