"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { News } from "@/lib/api/types/news";
import { formatNewsDate, NewsCard } from "@/components/shared/news-card";
import { getNewsCategoryColor } from "@/constants/news";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/pagination";

interface NewsCarouselProps {
  newsList: News[];
}

export function NewsCarousel({ newsList }: NewsCarouselProps) {
  const t = useTranslations("public");
  if (newsList.length === 0) return null;

  return (
    <div className="news-carousel relative">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        spaceBetween={32}
        loop={newsList.length > 1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        className="!pb-12"
      >
        {newsList.map((news) => (
          <SwiperSlide key={news.id} className="h-auto!">
            {/* Mobile / tablet: normal article card */}
            <NewsCard article={news} className="h-full lg:hidden" />

            {/* Desktop: featured slide */}
            <Link
              href={`/news/${news.category?.code ?? "uncategorized"}/${news.slug}`}
              className="group hidden flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] lg:flex lg:flex-row"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-muted lg:w-[55%] xl:w-[720px]">
                <img
                  src={news.thumbnail?.url || "/image-fallback.jpg"}
                  alt={news.title || ""}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src.endsWith("/image-fallback.jpg")) return;
                    img.src = "/image-fallback.jpg";
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-4 p-10">
                <div className="flex flex-wrap items-center gap-2 pb-3">
                  {news.category?.name && (
                    <span className={cn("rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", getNewsCategoryColor(news.category.code).solid)}>
                      {news.category.name}
                    </span>
                  )}
                  <span className="text-xs text-foreground-muted">
                    {formatNewsDate(news.createdAt)}
                  </span>
                </div>

                <h3 className="font-serif text-4xl font-semibold leading-tight tracking-tighter line-clamp-2 transition-colors group-hover:text-black/80">
                  {news.title || ""}
                </h3>

                {news.description && (
                  <p className="text-base leading-relaxed text-foreground-muted line-clamp-3">
                    {news.description}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2.5">
                  {news.creator?.avatarFile?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={news.creator.avatarFile.url}
                      alt={news.creator.fullName}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                      <User size={18} className="text-foreground-muted" />
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {news.creator?.fullName ?? t("common.anonymous")}
                    </span>
                    {news.creator?.role?.name && (
                      <span className="text-xs text-foreground-muted">
                        {news.creator.role.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
