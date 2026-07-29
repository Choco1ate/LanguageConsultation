import * as cheerio from 'cheerio';
import { Agent } from 'node:https';

const insecureAgent = new Agent({ rejectUnauthorized: false });

export interface ArticleData {
  title: string;
  summary: string;
  content: string;
  source_url: string;
  source_name: string;
  language: string;
  tags: string[];
  published_at: string;
  score: number;
}

export interface ArticleSourceConfig {
  name: string;
  url: string;
  language: string;
  tags: string[];
  isChinese?: boolean;
  linkFilter?: string;
  titleIncludes?: string;
  selector: {
    list: string;
    title: string;
    link: string;
    summary?: string;
    date?: string;
  };
}

/**
 * 计算文章热度评分
 * 基于：时效性 + 关键词相关性 + 内容长度 + 来源权重
 */
export function calculateScore(article: Partial<ArticleData> & { published_at: string }): number {
  let score = 0;

  // 1. 时效性（最高 40 分）
  const now = new Date();
  const pubDate = new Date(article.published_at);
  const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 1) score += 40;
  else if (daysDiff <= 3) score += 35;
  else if (daysDiff <= 7) score += 28;
  else if (daysDiff <= 14) score += 20;
  else if (daysDiff <= 30) score += 12;
  else if (daysDiff <= 90) score += 5;
  else score += 1;

  // 2. 关键词热度（最高 30 分）
  const hotKeywords = [
    '报名', '考试', 'JLPT', 'TOPIK', 'TestDaF', 'DELF', 'DELE', '能力考',
    '高考', '留学', '奖学金', '新规', '政策', '改革', '2026', '2025',
    '热门', '必看', '攻略', '指南', '解读', '分析', '答案', '真题',
    'N1', 'N2', 'N3', 'N4', 'N5', 'TOPIK II',
  ];
  const title = article.title || '';
  const summary = article.summary || '';
  const text = title + summary;
  let keywordHits = 0;
  for (const kw of hotKeywords) {
    if (text.includes(kw)) keywordHits++;
  }
  score += Math.min(keywordHits * 6, 30);

  // 3. 标题质量（最高 15 分）
  if (title.length >= 15 && title.length <= 50) score += 10;
  else if (title.length >= 10) score += 5;
  if (title.includes('？') || title.includes('！')) score += 3; // 吸引眼球
  if (/\d/.test(title)) score += 2; // 含数字的标题更吸引人

  // 4. 内容充实度（最高 15 分）
  const contentLen = (article.content || article.summary || '').length;
  if (contentLen >= 200) score += 15;
  else if (contentLen >= 100) score += 10;
  else if (contentLen >= 50) score += 5;

  return Math.round(score * 10) / 10;
}

/**
 * 抓取沪江系列中文文章（特殊模式）
 */
async function scrapeHujiangSource(source: ArticleSourceConfig): Promise<ArticleData[]> {
  const articles: ArticleData[] = [];

  const fetchOptions: RequestInit & { agent?: Agent } = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(15000),
  };

  let response: Response;
  try {
    response = await fetch(source.url, fetchOptions);
  } catch {
    // @ts-expect-error Node.js specific option
    response = await fetch(source.url, { ...fetchOptions, agent: insecureAgent });
  }

  if (!response.ok) return articles;

  const html = await response.text();
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const linkFilter = source.linkFilter || '/new/p';

  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const title = $(el).text().trim();

    // 过滤：只取文章链接，去重
    if (!href.includes(linkFilter)) return;
    if (!title || title.length < 6 || title.length > 80) return;
    if (seen.has(title)) return;
    seen.add(title);

    const fullUrl = href.startsWith('http') ? href : new URL(source.url).origin + href;

    articles.push({
      title,
      summary: '',
      content: '',
      source_url: fullUrl,
      source_name: source.name,
      language: source.language,
      tags: source.tags,
      published_at: new Date().toISOString().split('T')[0],
      score: 0,
    });
  });

  return articles.slice(0, 20);
}

/**
 * 通用文章抓取器
 */
export async function scrapeArticleSource(source: ArticleSourceConfig): Promise<ArticleData[]> {
  // 沪江特殊模式
  if (source.isChinese) {
    const articles = await scrapeHujiangSource(source);
    return articles.map(a => ({ ...a, score: calculateScore(a) }));
  }

  const articles: ArticleData[] = [];

  try {
    const fetchOptions: RequestInit & { agent?: Agent } = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    };

    let response: Response;
    try {
      response = await fetch(source.url, fetchOptions);
    } catch {
      // @ts-expect-error Node.js specific option
      response = await fetch(source.url, { ...fetchOptions, agent: insecureAgent });
    }

    if (!response.ok) {
      console.error(`Failed to fetch ${source.url}: ${response.status}`);
      return articles;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const items = $(source.selector.list).slice(0, 10);

    items.each((_, el) => {
      const titleAttr = source.selector.title.includes('@')
        ? source.selector.title.split('@')[1]
        : '';
      const titleSelector = titleAttr
        ? source.selector.title.split('@')[0]
        : source.selector.title;
      const titleEl = $(el).find(titleSelector).first();
      const title = (titleAttr ? titleEl.attr(titleAttr) : titleEl.text())?.trim() || '';

      if (!title || title.length < 5) return;
      if (source.titleIncludes && !title.includes(source.titleIncludes)) return;

      const linkAttr = source.selector.link.includes('@href')
        ? source.selector.link.split('@')[1]
        : 'href';
      const linkSelector = source.selector.link.includes('@href')
        ? source.selector.link.split('@')[0]
        : source.selector.link;
      
      const linkEl = $(el).find(linkSelector).first();
      let link = linkEl.attr(linkAttr) || '';

      if (!link.startsWith('http')) {
        const baseUrl = new URL(source.url);
        link = `${baseUrl.origin}${link}`;
      }

      const summary = source.selector.summary
        ? $(el).find(source.selector.summary).first().text().trim()
        : '';

      let date = '';
      if (source.selector.date) {
        const dateEl = $(el).find(source.selector.date).first();
        date = dateEl.attr('datetime') || dateEl.text().trim();
      }
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      const article: ArticleData = {
        title,
        summary: summary.substring(0, 300),
        content: '',
        source_url: link,
        source_name: source.name,
        language: source.language,
        tags: source.tags,
        published_at: date,
        score: 0,
      };
      article.score = calculateScore(article);

      articles.push(article);
    });
  } catch (error) {
    console.error(`Error scraping ${source.url}:`, error);
  }

  return articles;
}
