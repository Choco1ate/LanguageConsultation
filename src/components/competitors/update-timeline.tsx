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

          return (
            <div key={update.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                index === 0 ? 'border-primary bg-primary' : 'border-border bg-card'
              }`} />

              {/* Content */}
              <div className="bg-card rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
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
                {update.content && (
                  <p className="text-sm text-text-secondary leading-relaxed">{update.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
