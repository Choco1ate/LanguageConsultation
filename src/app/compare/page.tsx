'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { UPDATE_CATEGORIES } from '@/lib/content-intelligence';
import { formatDate } from '@/lib/utils';

interface CompetitorOption {
  id: string;
  name: string;
  language: string;
  ranking: number;
}

interface ComparedCompetitor extends CompetitorOption {
  description: string;
  supported_languages: string[];
  platforms: string[];
  learning_modes: string[];
  target_audience: string;
  pricing_model: string;
  key_features: string[];
  product_count: number;
  product_types: string[];
  products: Array<{ name: string; type: string; pricingModel: string }>;
  updates_30d: number;
  meaningful_updates_30d: number;
  maintenance_updates_30d: number;
  meaningful_updates_90d: number;
  update_categories: Array<{ key: string; count: number }>;
  latest_update_date: string | null;
  last_verified_at: string | null;
  snapshot_count: number;
  profile_completeness: number;
}

type CompareRow = { label: string; render: (item: ComparedCompetitor) => ReactNode };
type CompareGroup = { title: string; description: string; rows: CompareRow[] };

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  app: '移动应用',
  website: '网站产品',
  course: '课程',
  service: '服务',
};

function join(values: string[]) {
  return values.length ? values.join('、') : '待补充';
}

function positioning(item: ComparedCompetitor) {
  if (item.learning_modes.some((mode) => /社区|语言交换/.test(mode))) return '语言社区平台';
  if (item.supported_languages.length >= 5) return '多语种综合平台';
  if (item.supported_languages.length === 1 && item.supported_languages[0] === '日语') return '日语垂直平台';
  return '专项语言平台';
}

const groups: CompareGroup[] = [
  {
    title: '定位与市场',
    description: '判断平台覆盖范围、核心受众与市场位置。',
    rows: [
      { label: '市场位置', render: (item) => `国内重点平台 #${item.ranking}` },
      { label: '平台定位', render: positioning },
      { label: '目标用户', render: (item) => item.target_audience || '待补充' },
      { label: '支持语种', render: (item) => join(item.supported_languages) },
      { label: '语种广度', render: (item) => `${item.supported_languages.length} 类` },
    ],
  },
  {
    title: '产品与覆盖',
    description: '比较产品矩阵、终端覆盖和代表性产品。',
    rows: [
      { label: '产品数量', render: (item) => `${item.product_count || 0} 个` },
      { label: '产品类型', render: (item) => join(item.product_types.map((type) => PRODUCT_TYPE_LABELS[type] || type)) },
      { label: '代表产品', render: (item) => join(item.products.slice(0, 4).map((product) => product.name)) },
      { label: '覆盖终端', render: (item) => join(item.platforms) },
    ],
  },
  {
    title: '学习与服务',
    description: '比较教学组织方式、用户体验与差异化能力。',
    rows: [
      { label: '学习方式', render: (item) => join(item.learning_modes) },
      { label: '核心能力', render: (item) => join(item.key_features) },
      { label: '服务特点', render: (item) => item.learning_modes.some((mode) => /一对一/.test(mode)) ? '强调个性化教学' : item.learning_modes.some((mode) => /直播/.test(mode)) ? '强调实时课堂' : '强调自主学习与工具' },
    ],
  },
  {
    title: '商业与动态',
    description: '区分真实经营动作与常规版本维护。',
    rows: [
      { label: '商业模式', render: (item) => item.pricing_model || '待补充' },
      { label: '近 30 日有效动作', render: (item) => `${item.meaningful_updates_30d || 0} 条` },
      { label: '近 90 日有效动作', render: (item) => `${item.meaningful_updates_90d || 0} 条` },
      { label: '近 30 日版本维护', render: (item) => `${item.maintenance_updates_30d || 0} 条` },
      {
        label: '近 90 日信号构成',
        render: (item) => item.update_categories.length
          ? item.update_categories.map((entry) => `${UPDATE_CATEGORIES[entry.key as keyof typeof UPDATE_CATEGORIES] || '其他'} ${entry.count}`).join('、')
          : '暂无有效信号',
      },
      { label: '最近动态', render: (item) => item.latest_update_date ? formatDate(item.latest_update_date) : '暂无动态' },
    ],
  },
  {
    title: '数据可信度',
    description: '说明资料是否完整、何时验证以及是否具备连续快照。',
    rows: [
      { label: '资料完整度', render: (item) => `${item.profile_completeness}/7 项` },
      { label: '最近验证', render: (item) => item.last_verified_at ? formatDate(item.last_verified_at) : '待验证' },
      { label: '官方页面快照', render: (item) => item.snapshot_count ? `${item.snapshot_count} 次` : '等待首轮快照' },
      { label: '数据说明', render: () => '公开官方来源 · 不采集登录后内容' },
    ],
  },
];

function winner(items: ComparedCompetitor[], getter: (item: ComparedCompetitor) => number) {
  if (!items.length) return null;
  const max = Math.max(...items.map(getter));
  return { max, names: items.filter((item) => getter(item) === max).map((item) => item.name).join('、') };
}

export default function ComparePage() {
  const [options, setOptions] = useState<CompetitorOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compared, setCompared] = useState<ComparedCompetitor[]>([]);
  const [comparedKey, setComparedKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedKey = useMemo(() => selected.join(','), [selected]);

  useEffect(() => {
    fetch('/api/competitors')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: CompetitorOption[]) => {
        const sorted = [...data].sort((a, b) => a.ranking - b.ranking);
        setOptions(sorted);
        setSelected(sorted.slice(0, 3).map((item) => item.id));
      })
      .catch(() => setError('平台列表暂时无法加载，请稍后重试。'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected.length < 2) return;
    fetch(`/api/competitors/compare?ids=${encodeURIComponent(selectedKey)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setCompared(data.competitors || []);
        setComparedKey(selectedKey);
      })
      .catch(() => setError('对比数据暂时无法加载，请稍后重试。'))
  }, [selected, selectedKey]);

  const toggle = (id: string) => {
    setComparedKey('');
    setError('');
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 4 ? [...current, id] : current
    );
  };

  const languageWinner = winner(compared, (item) => item.supported_languages.length);
  const productWinner = winner(compared, (item) => item.product_count);
  const activityWinner = winner(compared, (item) => item.meaningful_updates_90d);
  const completenessWinner = winner(compared, (item) => item.profile_completeness);
  const comparing = selected.length >= 2 && comparedKey !== selectedKey;

  return (
    <div className="editorial-page">
      <header className="page-rule py-9">
        <p className="eyebrow">Competitor Intelligence Matrix</p>
        <h1 className="text-4xl md:text-6xl mt-3">竞品对比</h1>
        <p className="text-base md:text-lg text-text-secondary leading-8 mt-5 max-w-3xl">
          从市场定位、产品矩阵、学习体验、商业模式、更新节奏和数据可信度六个方向，识别平台差异与值得继续验证的竞争信号。
        </p>
      </header>

      <section className="py-7 border-b border-border">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div><p className="section-kicker">Select Platforms</p><h2 className="text-xl mt-2">选择 2–4 个平台</h2></div>
          <span className="text-sm text-text-secondary">已选 {selected.length}/4</span>
        </div>
        {loading ? <p className="text-text-secondary">正在加载平台…</p> : (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const active = selected.includes(option.id);
              const disabled = !active && selected.length >= 4;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(option.id)}
                  disabled={disabled}
                  className={`px-3 py-2 text-sm border ${active ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:border-primary'} disabled:opacity-35`}
                >
                  <span className="text-[10px] opacity-70 mr-2">#{option.ranking}</span>{option.name}
                </button>
              );
            })}
          </div>
        )}
        {selected.length < 2 && <p className="text-sm text-primary mt-4">请至少选择 2 个平台。</p>}
        {error && <p className="text-sm text-primary mt-4">{error}</p>}
      </section>

      {comparing && <div className="py-10 text-text-secondary">正在生成多维对比…</div>}

      {!comparing && selected.length >= 2 && compared.length >= 2 && (
        <>
          <section className="py-9 border-b border-border">
            <div className="panel-heading"><div><p className="section-kicker">Comparison Summary</p><h2 className="text-2xl mt-2">一眼看懂差异</h2></div><span className="text-xs text-text-secondary">结论仅针对当前所选平台</span></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['语种覆盖最广', languageWinner?.names || '待补充', `${languageWinner?.max || 0} 类语种`],
                ['产品矩阵最多', productWinner?.names || '待补充', `${productWinner?.max || 0} 个产品`],
                ['近期有效动作', activityWinner?.max ? activityWinner.names : '当前均较安静', `${activityWinner?.max || 0} 条 / 90 日`],
                ['资料最完整', completenessWinner?.names || '待补充', `${completenessWinner?.max || 0}/7 项`],
              ].map(([label, name, value]) => (
                <div key={label} className="metric-card">
                  <p className="text-[11px] text-text-secondary">{label}</p>
                  <strong className="block text-lg mt-3">{name}</strong>
                  <span className="block text-xs text-primary mt-2">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="py-9 space-y-8">
            {groups.map((group, groupIndex) => (
              <div key={group.title}>
                <div className="panel-heading">
                  <div><p className="section-kicker">0{groupIndex + 1}</p><h2 className="text-2xl mt-2">{group.title}</h2><p className="text-sm text-text-secondary mt-2">{group.description}</p></div>
                </div>
                <div className="overflow-x-auto border border-border bg-card">
                  <table className="w-full min-w-[820px] border-collapse">
                    <thead>
                      <tr className="bg-muted/70">
                        <th className="text-left p-4 text-xs text-text-secondary w-40">对比维度</th>
                        {compared.map((item) => (
                          <th key={item.id} className="text-left p-4 min-w-52">
                            <Link href={`/competitors/${item.id}`} className="font-bold hover:text-primary">{item.name}</Link>
                            <p className="text-[11px] text-text-secondary font-normal mt-1 line-clamp-2">{item.description}</p>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-t border-border align-top">
                          <th className="text-left p-4 text-sm text-text-secondary font-medium bg-muted/30">{row.label}</th>
                          {compared.map((item) => <td key={item.id} className="p-4 text-sm leading-6">{row.render(item)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <p className="text-xs text-text-tertiary leading-6">
              说明：更新节奏仅统计站内已验证公开来源；“有效动作”排除常规版本维护。平台排名用于确定监测范围，不代表本站对产品质量的评分。
            </p>
          </section>
        </>
      )}
    </div>
  );
}
