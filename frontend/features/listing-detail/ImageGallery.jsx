'use client';

import { useState } from 'react';
import Image from 'next/image';
import Badge from '@/shared/ui/Badge';
import ImagePlaceholder from '@/shared/ui/ImagePlaceholder';

export default function ImageGallery({ images = [], title = 'Property', badge }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());

  const handleImageError = (index) => {
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const validImages = images.filter((_, idx) => !failedImages.has(idx));
  const hasImages = images.length > 0 && !failedImages.has(activeIdx);

  const prevImage = () => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const nextImage = () => {
    setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image Frame */}
      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-beige/60 shadow-sm border border-navy/10">
        {hasImages ? (
          <Image
            src={images[activeIdx]}
            alt={`${title} - Photo ${activeIdx + 1}`}
            fill
            unoptimized
            priority
            onError={() => handleImageError(activeIdx)}
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
        ) : (
          <ImagePlaceholder label={title} />
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          {badge && (
            <Badge tone={badge.tone} className="shadow-md text-xs font-semibold">
              {badge.label}
            </Badge>
          )}
        </div>

        {/* Photo Counter Pill */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10 bg-navy/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide">
            {activeIdx + 1} / {images.length} Photos
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-navy flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
            >
              &#8592;
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-navy flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
            >
              &#8594;
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {images.map((imgUrl, i) => {
            const isFailed = failedImages.has(i);
            const isActive = i === activeIdx;

            return (
              <button
                key={imgUrl + i}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-label={`View photo ${i + 1}`}
                className={`relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  isActive
                    ? 'border-gold shadow-md scale-102 ring-1 ring-gold'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:border-navy/20'
                }`}
              >
                {!isFailed ? (
                  <Image
                    src={imgUrl}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    unoptimized
                    onError={() => handleImageError(i)}
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full bg-cream flex items-center justify-center text-[10px] text-charcoal/60">
                    N/A
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
