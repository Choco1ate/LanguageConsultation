import competitorsData from '@/data/competitors.json';

export interface StoreUpdate {
  competitor_id: string;
  product_name: string;
  title: string;
  content: string;
  update_type: string;
  source_channel: string;
  source_url: string;
  published_at: string;
  product_icon_url?: string;
  product_screenshot_urls?: string[];
  product_description?: string;
  store_type?: 'apple' | 'android';
}

export interface StoreRunResult {
  sourceName: string;
  competitorId: string;
  status: 'success' | 'error';
  fetchedCount: number;
  error?: string;
}

interface AppleResult {
  trackName: string;
  version: string;
  currentVersionReleaseDate: string;
  releaseNotes?: string;
  trackViewUrl: string;
  sellerName: string;
  description?: string;
  artworkUrl512?: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
}

interface CompetitorAppConfig {
  id: string;
  name: string;
  appleAppId?: string;
}

export function normalizeProductName(name: string) {
  const normalized = name.trim().split(/\s*[-–—:：]\s*/)[0]?.trim();
  return normalized || '产品名称待确认';
}

async function fetchAppleApp(appId: string): Promise<AppleResult | null> {
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=cn`,
    { signal: AbortSignal.timeout(12_000) }
  );
  if (!response.ok) throw new Error(`Apple lookup returned ${response.status}`);
  const data = await response.json() as { resultCount: number; results: AppleResult[] };
  return data.resultCount > 0 ? data.results[0] : null;
}

export async function scrapeAppStoreUpdates(): Promise<{
  updates: StoreUpdate[];
  results: StoreRunResult[];
}> {
  const updates: StoreUpdate[] = [];
  const results: StoreRunResult[] = [];
  const competitors = competitorsData as CompetitorAppConfig[];

  for (const competitor of competitors) {
    if (!competitor.appleAppId) continue;
    try {
      const info = await fetchAppleApp(competitor.appleAppId);
      if (!info) throw new Error('Apple App Store 未找到该应用');
      const publishedAt = info.currentVersionReleaseDate?.split('T')[0];
      if (!publishedAt || !info.version) throw new Error('Apple App Store 返回的版本信息不完整');
      updates.push({
        competitor_id: competitor.id,
        product_name: normalizeProductName(info.trackName),
        title: `Apple App Store · v${info.version}`,
        content: info.releaseNotes?.trim() || '该版本未提供更新说明。',
        update_type: 'app_update',
        source_channel: 'Apple App Store',
        source_url: info.trackViewUrl,
        published_at: publishedAt,
        product_icon_url: info.artworkUrl512,
        product_screenshot_urls: [...(info.screenshotUrls || []), ...(info.ipadScreenshotUrls || [])].slice(0, 4),
        product_description: info.description?.trim(),
        store_type: 'apple',
      });
      results.push({
        sourceName: `Apple App Store · ${competitor.name}`,
        competitorId: competitor.id,
        status: 'success',
        fetchedCount: 1,
      });
    } catch (error) {
      results.push({
        sourceName: `Apple App Store · ${competitor.name}`,
        competitorId: competitor.id,
        status: 'error',
        fetchedCount: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { updates, results };
}
