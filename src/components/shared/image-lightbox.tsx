"use client";

import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export interface LightboxImage {
  id?: string;
  url: string;
  alt?: string;
  name?: string;
  caption?: string;
}

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
}

export function ImageLightbox({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
}: ImageLightboxProps) {
  const current = open && index >= 0 && index < images.length ? images[index] : null;

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext, onOpenChange]);

  if (!current) return null;

  const label = current.name || current.alt || current.caption || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[90vh] max-h-[90vh] max-w-[95vw] sm:max-w-[95vw] overflow-hidden rounded-lg border border-border bg-black/95 p-0"
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="relative flex h-full items-center justify-center">
          <img
            src={current.url}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />

          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Trước"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Sau"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {index + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
