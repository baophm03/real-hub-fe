"use client";

import { useState, useMemo } from "react";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { ImageLightbox, type LightboxImage } from "@/components/shared/image-lightbox";

interface PropertyGalleryProps {
  images: string[];
  propertyCode?: string;
}

export function PropertyGallery({ images, propertyCode }: PropertyGalleryProps) {
  const t = useTranslations("public.listingDetail");
  const tc = useTranslations("public.common");
  const [activeImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const gallery = images;

  const lightboxImages = useMemo<LightboxImage[]>(
    () => gallery.map((url, i) => ({ id: `img-${i}`, url, alt: propertyCode ?? "" })),
    [gallery, propertyCode],
  );

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  if (gallery.length === 0) {
    return (
      <div className="flex h-[300px] md:h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted mb-8">
        <div className="flex flex-col items-center gap-2 text-foreground-muted">
          <Camera size={32} />
          <p className="text-sm">{t("noImages")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden mb-8">
        <div
          className="md:col-span-2 md:row-span-2 relative group cursor-pointer overflow-hidden"
          onClick={() => openLightbox(activeImage)}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${gallery[activeImage]})` }}
          />
          {propertyCode && (
            <div className="absolute top-4 right-4 z-10">
              <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm bg-surface/90 backdrop-blur-sm text-primary">
                {propertyCode}
              </span>
            </div>
          )}
        </div>
        {gallery.slice(1, 5).map((img, i) => {
          const hasMore = i === 3 && gallery.length > 5;
          return (
            <div
              key={i}
              className="hidden md:block relative group cursor-pointer overflow-hidden"
              onClick={() => (hasMore ? openLightbox(0) : openLightbox(i + 1))}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${img})` }}
              />
              {hasMore && (
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white font-serif text-xl font-medium">
                    +{gallery.length - 5} {tc("photos")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {gallery.length < 5 &&
          Array.from({ length: 5 - gallery.length }).map((_, i) => (
            <div key={`placeholder-${i}`} className="hidden md:block relative overflow-hidden bg-surface-muted" />
          ))}
      </div>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={lightboxImages}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}
