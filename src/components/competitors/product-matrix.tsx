'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useState } from 'react';

export interface ProductMedia {
  id: string;
  media_type: 'cover' | 'screenshot';
  local_path: string | null;
  original_url: string | null;
  source_url: string;
  alt_text: string;
}

export interface CompetitorProduct {
  id: string;
  competitor_id?: string;
  name: string;
  product_type: 'app' | 'website' | 'course' | 'service';
  short_description: string;
  description: string;
  languages: string[];
  platforms: string[];
  target_audience: string | null;
  key_features: string[];
  pricing_model: string | null;
  official_url: string;
  app_store_url: string | null;
  android_url: string | null;
  icon_url: string | null;
  source_name: string;
  source_url: string;
  sort_order?: number;
  last_verified_at: string | null;
  media: ProductMedia[];
}

export const productTypeLabels = {
  app: 'App',
  website: '网站产品',
  course: '课程产品',
  service: '服务产品',
};

export function productMediaUrl(media: ProductMedia) {
  return media.local_path || media.original_url;
}

function ProductVisual({ product }: { product: CompetitorProduct }) {
  const [failed, setFailed] = useState(false);
  const image = product.media.map(productMediaUrl).find(Boolean) || product.icon_url;

  if (!image || failed) {
    return (
      <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-primary-light to-muted">
        <span className="text-3xl font-bold text-primary/70">{product.name.slice(0, 1)}</span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={`${product.name}产品图`}
      className="h-36 w-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductMatrix({
  products,
  competitorId,
}: {
  products: CompetitorProduct[];
  competitorId: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
        <p className="font-medium text-foreground">产品资料整理中</p>
        <p className="mt-1 text-sm text-text-secondary">完成官方来源核验后将在这里展示。</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/competitors/${encodeURIComponent(competitorId)}/products/${encodeURIComponent(product.id)}`}
          className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ProductVisual product={product} />
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-dark">
                {productTypeLabels[product.product_type]}
              </span>
              <span className="text-xs font-medium text-primary group-hover:underline">查看产品 →</span>
            </div>
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">
              {product.short_description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.platforms.slice(0, 2).map((platform) => (
                <span key={platform} className="rounded bg-muted px-2 py-0.5 text-xs text-text-secondary">
                  {platform}
                </span>
              ))}
              {product.languages.slice(0, 1).map((language) => (
                <span key={language} className="rounded bg-muted px-2 py-0.5 text-xs text-text-secondary">
                  {language}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
