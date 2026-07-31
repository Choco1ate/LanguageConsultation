export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return formatDate(date);
}

export function truncate(str: string, len: number): string {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

export const LANGUAGE_MAP: Record<string, string> = {
  chinese: '中文',
  japanese: '日语',
  korean: '韩语',
  french: '法语',
  german: '德语',
  spanish: '西班牙语',
  english: '英语',
  multi: '多语种',
};

// 小语种站不展示中文学习内容；中文仅作为界面语言使用。
export const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_MAP)
  .filter(([value]) => value !== 'chinese')
  .map(([value, label]) => ({ value, label }));

export const TAG_OPTIONS = [
  { value: '考级', label: '考级' },
  { value: '高考', label: '高考' },
  { value: '留学', label: '留学' },
  { value: '行业资讯', label: '行业资讯' },
  { value: '学习方法', label: '学习方法' },
];
