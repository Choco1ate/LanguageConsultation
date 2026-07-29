import * as cheerio from 'cheerio';
import { Agent } from 'node:https';

const insecureAgent = new Agent({ rejectUnauthorized: false });

export interface CompetitorUpdate {
  competitor_id: string;
  product_name: string;
  title: string;
  content: string;
  update_type: string;
  source_channel: string;
  source_url: string;
  published_at: string;
}

export interface ScraperConfig {
  id: string;
  productName: string;
  url: string;
  changelogPath?: string;
  blogPath?: string;
  selectors: {
    list: string;
    title: string;
    content?: string;
    date?: string;
    link?: string;
  };
}

// Competitor scraper configurations
export const competitorConfigs: ScraperConfig[] = [
  ['hujiang', '沪江网校', 'https://www.hujiang.com/'],
  ['izaodao', '早道网校', 'https://njp.izaodao.com/'],
  ['koolearn-languages', '新东方在线小语种', 'https://language.koolearn.com/'],
  ['olacio', '欧那在线课程', 'https://www.olacio.com/'],
  ['yangtuo', '羊驼教育课程', 'https://www.yangtuoedu.com/index'],
  ['hellotalk', 'HelloTalk', 'https://www.hellotalk.com/blog/'],
  ['youda', '友达日语在线课程', 'https://www.youda.com.cn/'],
  ['ribencun', '日本村外教网', 'https://www.ribencun.com/'],
  ['weimingtian', '未名天日语课程', 'https://www.riyu365.com/index.html'],
  ['zhizhu', '知诸日语课程', 'https://www.zhizhuxueyuan.com/'],
].map(([id, productName, url]) => ({
  id,
  productName,
  url,
  selectors: {
    list: 'article',
    title: 'h2, h3',
    content: 'p',
    date: 'time',
    link: 'a@href',
  },
}));

export async function scrapeCompetitor(config: ScraperConfig): Promise<CompetitorUpdate[]> {
  const updates: CompetitorUpdate[] = [];

  try {
    const fetchOptions: RequestInit & { agent?: Agent } = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    };

    let response: Response;
    try {
      response = await fetch(config.url, fetchOptions);
    } catch {
      // SSL 证书失败时回退：跳过证书验证
      // @ts-expect-error Node.js specific option
      response = await fetch(config.url, { ...fetchOptions, agent: insecureAgent });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${config.url}: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const items = $(config.selectors.list).slice(0, 5);

    items.each((_, el) => {
      const titleEl = $(el).find(config.selectors.title).first();
      const title = titleEl.text().trim();

      if (!title) return;

      const content = config.selectors.content
        ? $(el).find(config.selectors.content).first().text().trim()
        : '';

      let date = '';
      if (config.selectors.date) {
        const dateEl = $(el).find(config.selectors.date).first();
        // 优先使用 <time> 标签的 datetime 属性
        date = dateEl.attr('datetime') || dateEl.text().trim();
      }
      if (!date || Number.isNaN(new Date(date).getTime())) return;
      date = new Date(date).toISOString().split('T')[0];

      let link = '';
      if (config.selectors.link) {
        const hasAttr = config.selectors.link.includes('@href');
        const hrefAttr = hasAttr ? config.selectors.link.split('@')[1] : 'href';
        const selector = hasAttr ? config.selectors.link.split('@')[0] : config.selectors.link;
        const linkEl = $(el).find(selector).first();
        link = linkEl.attr(hrefAttr) || '';
      }

      updates.push({
        competitor_id: config.id,
        product_name: config.productName,
        title,
        content: content.substring(0, 500),
        update_type: 'content',
        source_channel: '官方网站',
        source_url: link ? new URL(link, config.url).toString() : config.url,
        published_at: date,
      });
    });
  } catch (error) {
    console.error(`Error scraping ${config.url}:`, error);
    throw error;
  }

  return updates;
}
