'use client';

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import type { ProductMedia } from './product-matrix';
import { productMediaUrl } from './product-matrix';

export default function ProductGallery({
  productName,
  media,
}: {
  productName: string;
  media: ProductMedia[];
}) {
  const images = useMemo(
    () => media.filter((item) => Boolean(productMediaUrl(item))).slice(0, 4),
    [media]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const visibleImages = images.filter((item) => {
    const url = productMediaUrl(item);
    return url && !failed.includes(url);
  });
  const active = visibleImages[Math.min(activeIndex, visibleImages.length - 1)];
  const activeUrl = active ? productMediaUrl(active) : null;

  if (!active || !activeUrl) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
        <div>
          <p className="font-semibold text-foreground">暂无官方截图</p>
          <p className="mt-1 text-sm text-text-secondary">其他产品资料仍可正常查看。</p>
        </div>
      </div>
    );
  }

  const markFailed = (url: string) => {
    setFailed((current) => (current.includes(url) ? current : [...current, url]));
    setActiveIndex(0);
  };

  return (
    <section aria-label={`${productName}产品截图`}>
      <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/30 p-3 sm:min-h-[430px]">
        <img
          src={activeUrl}
          alt={active.alt_text || `${productName}产品截图`}
          className="max-h-[520px] w-full object-contain"
          onError={() => markFailed(activeUrl)}
        />
      </div>
      {visibleImages.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2" aria-label="选择产品截图">
          {visibleImages.map((item, index) => {
            const url = productMediaUrl(item);
            if (!url) return null;
            const selected = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`查看第 ${index + 1} 张截图`}
                aria-pressed={selected}
                className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 bg-muted ${
                  selected ? 'border-primary' : 'border-transparent hover:border-border'
                }`}
              >
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => markFailed(url)}
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
