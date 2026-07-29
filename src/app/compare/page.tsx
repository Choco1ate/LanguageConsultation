'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface CompetitorOption {
  id: string;
  name: string;
  language: string;
}

interface ComparedCompetitor extends CompetitorOption {
  description: string;
  supported_languages: string[];
  platforms: string[];
  learning_modes: string[];
  target_audience: string;
  pricing_model: string;
  key_features: string[];
  updates_30d: number;
  latest_update_date: string | null;
}

const rows: Array<{ label: string; render: (item: ComparedCompetitor) => string }> = [
  { label: '支持语种', render: (item) => item.supported_languages.join('、') || '待补充' },
  { label: '产品形态', render: (item) => item.platforms.join('、') || '待补充' },
  { label: '学习方式', render: (item) => item.learning_modes.join('、') || '待补充' },
  { label: '目标用户', render: (item) => item.target_audience || '待补充' },
  { label: '价格模式', render: (item) => item.pricing_model || '待补充' },
  { label: '核心功能', render: (item) => item.key_features.join('、') || '待补充' },
  { label: '近 30 日更新', render: (item) => `${item.updates_30d || 0} 条` },
];

export default function ComparePage() {
  const [options, setOptions] = useState<CompetitorOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compared, setCompared] = useState<ComparedCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedKey = useMemo(() => selected.join(','), [selected]);

  useEffect(() => {
    fetch('/api/competitors')
      .then((response) => response.json())
      .then((data: CompetitorOption[]) => {
        setOptions(data);
        setSelected(data.slice(0, 3).map((item) => item.id));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected.length < 2) return;
    fetch(`/api/competitors/compare?ids=${encodeURIComponent(selectedKey)}`)
      .then((response) => response.json())
      .then((data) => setCompared(data.competitors || []));
  }, [selected, selectedKey]);

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 4 ? [...current, id] : current
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl mb-8">
        <p className="section-kicker">Competitor Matrix</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2">竞品对比</h1>
        <p className="text-text-secondary mt-3">选择 2–4 个平台，对比产品定位、学习方式、价格模式与更新频率。</p>
      </div>

      <section className="panel mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-bold">选择平台</h2>
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
                  onClick={() => toggle(option.id)}
                  disabled={disabled}
                  className={`px-3 py-2 rounded-lg text-sm border ${active ? 'bg-primary text-white border-primary' : 'bg-white border-border'} disabled:opacity-35`}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        )}
        {selected.length < 2 && <p className="text-sm text-amber-700 mt-4">请至少选择 2 个平台。</p>}
      </section>

      {selected.length >= 2 && compared.length >= 2 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left p-4 text-sm text-text-secondary w-36">对比维度</th>
                {compared.map((item) => (
                  <th key={item.id} className="text-left p-4">
                    <Link href={`/competitors/${item.id}`} className="font-bold hover:text-primary">{item.name}</Link>
                    <p className="text-xs text-text-secondary font-normal mt-1">{item.description}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border align-top">
                  <th className="text-left p-4 text-sm text-text-secondary font-medium">{row.label}</th>
                  {compared.map((item) => <td key={item.id} className="p-4 text-sm leading-6">{row.render(item)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
