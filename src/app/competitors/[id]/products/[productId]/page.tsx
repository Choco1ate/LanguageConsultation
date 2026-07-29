import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/competitors/product-gallery';
import { productTypeLabels } from '@/components/competitors/product-matrix';
import { getProductPageData } from '@/lib/product-data';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ id: string; productId: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id, productId } = await params;
  const data = await getProductPageData(id, productId);

  if (!data) {
    return { title: '产品未找到 | 小语种资讯站' };
  }

  return {
    title: `${data.product.name} - ${data.competitor.name} | 小语种资讯站`,
    description: data.product.short_description,
  };
}

function ExternalLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
    >
      {children} ↗
    </a>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id, productId } = await params;
  const data = await getProductPageData(id, productId);
  if (!data) notFound();

  const { competitor, product, siblings } = data;
  const currentIndex = siblings.findIndex((item) => item.id === product.id);
  const previous = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;
  const companyHref = `/competitors/${encodeURIComponent(competitor.id)}`;
  const productHref = (targetId: string) =>
    `${companyHref}/products/${encodeURIComponent(targetId)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="面包屑" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <Link href="/competitors" className="hover:text-primary">行业产品动态</Link>
        <span aria-hidden="true">/</span>
        <Link href={companyHref} className="hover:text-primary">{competitor.name}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <header className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                {productTypeLabels[product.product_type]}
              </span>
              {product.languages.map((language) => (
                <span key={language} className="rounded-full bg-muted px-3 py-1 text-xs text-text-secondary">
                  {language}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-base leading-7 text-text-secondary sm:text-lg">{product.short_description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ExternalLink href={product.official_url}>官方网站</ExternalLink>
            <ExternalLink href={product.app_store_url}>App Store</ExternalLink>
            <ExternalLink href={product.android_url}>Android</ExternalLink>
          </div>
        </div>
      </header>

      <nav className="mb-6 lg:hidden" aria-label="同企业产品">
        <p className="mb-2 text-sm font-semibold text-foreground">同企业产品</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {siblings.map((item) => {
            const current = item.id === product.id;
            return (
              <Link
                key={item.id}
                href={productHref(item.id)}
                aria-current={current ? 'page' : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                  current
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-card text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0 space-y-8">
          <ProductGallery productName={product.name} media={product.media} />

          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">产品介绍</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-text-secondary">
              {product.description || product.short_description}
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              ['目标用户', product.target_audience || '以官方公开信息为准'],
              ['支持平台', product.platforms.join('、') || '暂未核验'],
              ['价格模式', product.pricing_model || '以官方页面为准'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-5">
                <dt className="text-sm font-medium text-text-secondary">{label}</dt>
                <dd className="mt-2 leading-6 text-foreground">{value}</dd>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">核心功能</h2>
            {product.key_features.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.key_features.map((feature) => (
                  <li key={feature} className="rounded-lg bg-primary-light px-3 py-2 text-sm text-primary-dark">
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">核心功能资料正在核验中。</p>
            )}
            <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-text-secondary">
              资料来源：
              <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">
                {product.source_name}
              </a>
              {product.last_verified_at && ` · 最近核验 ${product.last_verified_at.slice(0, 10)}`}
            </p>
          </section>

          <nav className="rounded-2xl border border-border bg-card p-5" aria-label="产品翻页">
            <div className="grid grid-cols-2 gap-3">
              <div>
                {previous && (
                  <Link href={productHref(previous.id)} className="block rounded-lg p-3 hover:bg-muted">
                    <span className="text-xs text-text-secondary">← 上一个产品</span>
                    <span className="mt-1 block font-medium text-foreground">{previous.name}</span>
                  </Link>
                )}
              </div>
              <div className="text-right">
                {next && (
                  <Link href={productHref(next.id)} className="block rounded-lg p-3 hover:bg-muted">
                    <span className="text-xs text-text-secondary">下一个产品 →</span>
                    <span className="mt-1 block font-medium text-foreground">{next.name}</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4 text-center">
              <Link href={companyHref} className="text-sm font-medium text-primary hover:underline">
                ← 返回{competitor.name}产品矩阵
              </Link>
            </div>
          </nav>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-4">
            <p className="px-2 pb-3 text-sm font-semibold text-foreground">同企业产品</p>
            <nav className="space-y-1" aria-label="同企业产品">
              {siblings.map((item) => {
                const current = item.id === product.id;
                return (
                  <Link
                    key={item.id}
                    href={productHref(item.id)}
                    aria-current={current ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-3 ${
                      current
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="block text-xs opacity-75">{productTypeLabels[item.product_type]}</span>
                    <span className="mt-0.5 block font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
