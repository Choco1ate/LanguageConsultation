export const UPDATE_CATEGORIES = {
  product_feature: '产品功能',
  course_content: '课程内容',
  pricing: '价格促销',
  app_release: 'App 版本',
  marketing: '品牌市场',
  company_news: '公司新闻',
  other: '其他',
} as const;

const categoryRules: Array<[keyof typeof UPDATE_CATEGORIES, RegExp]> = [
  ['app_release', /版本|更新日志|release|version|bug fix|app store|android|ios/i],
  ['pricing', /价格|优惠|促销|折扣|会员|订阅|套餐|pricing|discount|sale/i],
  ['course_content', /课程|语法|词汇|听力|口语|阅读|lesson|course|vocabulary|grammar/i],
  ['product_feature', /功能|上线|新增|体验|工具|feature|launch|introduc|update/i],
  ['company_news', /融资|收购|财报|高管|合作|公司|funding|acqui|revenue|partner/i],
  ['marketing', /品牌|活动|市场|广告|代言|campaign|brand|event/i],
];

export function classifyUpdate(title: string, content = '', updateType = '') {
  if (updateType === 'app_update' || updateType === 'android_update') return 'app_release';
  const text = `${title} ${content}`;
  return categoryRules.find(([, rule]) => rule.test(text))?.[0] || 'other';
}

export function calculateImportance(title: string, content = '', category = 'other') {
  const text = `${title} ${content}`;
  let score = category === 'company_news' || category === 'pricing' ? 3 : 2;
  if (/重大|全新|发布|上线|收购|融资|涨价|降价|全球|major|launch|acqui|funding/i.test(text)) score += 1;
  if (/修复|细节|小幅|bug fix|minor/i.test(text)) score -= 1;
  return Math.max(1, Math.min(5, score));
}

export const KEYWORD_DICTIONARY = [
  'JLPT', 'TOPIK', 'DELF', 'DALF', 'TestDaF', 'DELE', 'IELTS',
  '高考日语', '留学', '口语', '听力', '词汇', '语法', '阅读', '写作',
  '游戏化', '订阅', '外教', '背词', '发音', '考试', '报名', '课程',
];

export interface KeywordSource {
  title: string;
  summary?: string | null;
  source_name?: string | null;
  published_at?: string | null;
}

export function extractKeywords(rows: KeywordSource[], limit = 10) {
  const now = Date.now();
  const stats = new Map<string, { score: number; count: number; sources: Set<string> }>();

  for (const row of rows) {
    const text = `${row.title} ${row.summary || ''}`;
    const ageDays = row.published_at
      ? Math.max(0, (now - new Date(row.published_at).getTime()) / 86_400_000)
      : 30;
    const decay = Math.exp(-ageDays / 30);
    for (const keyword of KEYWORD_DICTIONARY) {
      const matches = text.match(new RegExp(keyword, 'gi'));
      if (!matches) continue;
      const current = stats.get(keyword) || { score: 0, count: 0, sources: new Set<string>() };
      current.count += matches.length;
      current.score += matches.length * decay;
      if (row.source_name) current.sources.add(row.source_name);
      stats.set(keyword, current);
    }
  }

  return [...stats.entries()]
    .map(([keyword, value]) => ({
      keyword,
      count: value.count,
      sourceCount: value.sources.size,
      score: Number((value.score + value.sources.size * 0.35).toFixed(2)),
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count || a.keyword.localeCompare(b.keyword))
    .slice(0, limit);
}
