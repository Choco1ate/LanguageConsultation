import { formatDate } from '@/lib/utils';

interface Update {
  id: string;
  product_name: string | null;
  title: string;
  content: string | null;
  update_type: string | null;
  source_url: string | null;
  published_at: string | null;
  source_channel?: string | null;
  editorial?: {
    summary: string;
    whyItMatters: string;
    keyPoints: string[];
    category: string;
    generatedAt: string;
    aiAssisted: true;
  } | null;
}

const updateTypeLabels: Record<string, { label: string; color: string }> = {
  app_update: { label: '版本更新', color: 'bg-emerald-100 text-emerald-700' },
  android_update: { label: 'Android 更新', color: 'bg-lime-100 text-lime-700' },
  feature: { label: '新功能', color: 'bg-green-100 text-green-700' },
  content: { label: '内容更新', color: 'bg-blue-100 text-blue-700' },
  pricing: { label: '价格变动', color: 'bg-orange-100 text-orange-700' },
  ui: { label: '界面优化', color: 'bg-purple-100 text-purple-700' },
};

export default function UpdateTimeline({ updates }: { updates: Update[] }) {
  if (updates.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>暂无更新记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-6">
        {updates.map((update, index) => {
          const typeInfo = updateTypeLabels[update.update_type || ''] || {
            label: '其他',
            color: 'bg-gray-100 text-gray-700',
          };
          const isMaintenance = !update.editorial && ['app_update', 'android_update'].includes(update.update_type || '');

          const timelineItem = (
            <div key={update.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                index === 0 ? 'border-primary bg-primary' : 'border-border bg-card'
              }`} />

              {/* Content */}
              <div className="bg-card rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                    {update.editorial?.category || typeInfo.label}
                  </span>
                  {update.published_at && (
                    <span className="text-xs text-text-secondary">
                      {formatDate(update.published_at)}
                    </span>
                  )}
                  {update.source_channel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-secondary">
                      {update.source_channel}
                    </span>
                  )}
                  {update.source_url && (
                    <a
                      href={update.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline ml-auto"
                    >
                      查看来源 →
                    </a>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary mb-1">
                  {update.product_name || '产品名称待确认'}
                </p>
                <h4 className="font-medium text-foreground mb-1">
                  {update.source_url ? (
                    <a
                      href={update.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {update.title}
                    </a>
                  ) : (
                    update.title
                  )}
                </h4>
                {(update.editorial?.summary || update.content) && (
                  <p className="text-sm text-text-secondary leading-relaxed">{update.editorial?.summary || update.content}</p>
                )}
                {update.editorial && (
                  <div className="mt-3 bg-muted p-3">
                    <p className="text-xs font-bold text-primary">为什么值得关注</p>
                    <p className="text-sm mt-1 leading-6">{update.editorial.whyItMatters}</p>
                    <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                      {update.editorial.keyPoints.map((point) => <li key={point}>· {point}</li>)}
                    </ul>
                    <p className="text-[9px] text-text-tertiary mt-2">AI 辅助整理 · 来源可追溯</p>
                  </div>
                )}
              </div>
            </div>
          );
          return isMaintenance ? (
            <details key={update.id} className="group">
              <summary className="ml-8 cursor-pointer text-xs text-text-secondary hover:text-primary">
                版本维护 · {update.title} {update.published_at ? `· ${formatDate(update.published_at)}` : ''}
              </summary>
              <div className="mt-3">{timelineItem}</div>
            </details>
          ) : timelineItem;
        })}
      </div>
    </div>
  );
}
