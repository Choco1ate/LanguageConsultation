import * as cheerio from 'cheerio';
import competitorsData from '@/data/competitors.json';
import { normalizeProductName, type StoreRunResult, type StoreUpdate } from './appstore-scraper';

interface AndroidAppConfig {
  id: string;
  name: string;
  androidPackageId?: string;
}

function normalizeGoogleDate(value: string) {
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

async function fetchGooglePlayUpdate(competitor: AndroidAppConfig): Promise<StoreUpdate> {
  const packageId = competitor.androidPackageId!;
  const baseUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageId)}&hl=en&gl=US`;
  const response = await fetch(baseUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LanguageStudyMonitor/1.0)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Google Play returned ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const appTitle = normalizeProductName($('h1').first().text().trim());
  const productDescription = $('.bARER').first().text().trim();
  const imageUrls = $('[data-screenshot-item-index] img, .Q4vdJd img')
    .map((_, element) => $(element).attr('src') || '')
    .get()
    .filter(Boolean)
    .slice(0, 4);
  const iconUrl = $('img.T75of').first().attr('src');
  const whatsNewHeading = $('h2').filter((_, element) =>
    /^What['’]s new$/i.test($(element).text().trim())
  ).first();
  const whatsNew = whatsNewHeading
    .closest('section')
    .find('.SfzRHd [itemprop="description"]')
    .first()
    .text()
    .trim();
  const updatedText = $('div').filter((_, element) => $(element).text().trim() === 'Updated on')
    .first().parent().find('.xg1aie').first().text().trim();
  const publishedAt = normalizeGoogleDate(updatedText);
  if (!publishedAt) throw new Error('Google Play 页面未提供可解析的更新日期');
  return {
    competitor_id: competitor.id,
    product_name: appTitle,
    title: `Google Play · Android 更新 · ${publishedAt}`,
    content: whatsNew.slice(0, 1200) || `${appTitle} 本次更新未提供公开说明。`,
    update_type: 'android_update',
    source_channel: 'Google Play',
    source_url: `${baseUrl}&release=${publishedAt}`,
    published_at: publishedAt,
    product_icon_url: iconUrl,
    product_screenshot_urls: imageUrls,
    product_description: productDescription,
    store_type: 'android',
  };
}

async function fetchXiaomiUpdate(competitor: AndroidAppConfig): Promise<StoreUpdate> {
  const packageId = competitor.androidPackageId!;
  const baseUrl = `https://app.mi.com/details?id=${encodeURIComponent(packageId)}`;
  const response = await fetch(baseUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LanguageStudyMonitor/1.0)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`小米应用商店 returned ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const metadata = $('.app-info .intro-titles p').map((_, element) => $(element).text().trim()).get();
  const version = metadata.find((item) => /版本|Version/i.test(item))?.replace(/^.*?[：:]/, '').trim();
  const updatedRaw = metadata.find((item) => /更新|日期|Update/i.test(item))?.replace(/^.*?[：:]/, '').trim();
  const publishedAt = updatedRaw ? normalizeGoogleDate(updatedRaw.replace(/[年月]/g, '-').replace('日', '')) : null;
  const content = $('.details .details-con').first().text().trim()
    || $('.app-text').first().text().trim();
  const appTitle = normalizeProductName(
    $('.app-info h3, .app-info .intro-titles h3, h1').first().text().trim()
  );
  if (!publishedAt) throw new Error('小米应用商店页面未提供可解析的更新日期');
  return {
    competitor_id: competitor.id,
    product_name: appTitle,
    title: `小米应用商店 · ${version ? `v${version}` : 'Android 更新'}`,
    content: content.slice(0, 1200) || '该版本未提供公开更新说明。',
    update_type: 'android_update',
    source_channel: '小米应用商店',
    source_url: `${baseUrl}&release=${publishedAt}`,
    published_at: publishedAt,
    store_type: 'android',
  };
}

export async function scrapeAndroidStoreUpdates(): Promise<{
  updates: StoreUpdate[];
  results: StoreRunResult[];
}> {
  const updates: StoreUpdate[] = [];
  const results: StoreRunResult[] = [];
  const competitors = competitorsData as AndroidAppConfig[];
  const channels = [
    { name: 'Google Play', fetcher: fetchGooglePlayUpdate },
    { name: '小米应用商店', fetcher: fetchXiaomiUpdate },
  ];

  for (const competitor of competitors) {
    if (!competitor.androidPackageId) continue;
    for (const channel of channels) {
      try {
        const update = await channel.fetcher(competitor);
        updates.push(update);
        results.push({
          sourceName: `${channel.name} · ${competitor.name}`,
          competitorId: competitor.id,
          status: 'success',
          fetchedCount: 1,
        });
      } catch (error) {
        results.push({
          sourceName: `${channel.name} · ${competitor.name}`,
          competitorId: competitor.id,
          status: 'error',
          fetchedCount: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  return { updates, results };
}
