import Link from 'next/link';
import { getDb, initDb } from '@/lib/db';
import { formatDate, LANGUAGE_MAP } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface ExamEvent {
  id: string;
  exam_type: string;
  language: string;
  title: string;
  registration_start: string | null;
  registration_end: string | null;
  exam_date: string | null;
  result_date: string | null;
  source_url: string;
  source_name: string;
  description: string;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const { language = 'all' } = await searchParams;
  initDb();
  const db = getDb();
  const events = (language === 'all'
    ? db.prepare('SELECT * FROM exam_events ORDER BY exam_date IS NULL, exam_date ASC').all()
    : db.prepare('SELECT * FROM exam_events WHERE language = ? ORDER BY exam_date IS NULL, exam_date ASC').all(language)
  ) as ExamEvent[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl mb-8">
        <p className="section-kicker">Exam Calendar</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2">考试日历</h1>
        <p className="text-text-secondary mt-3 leading-7">
          集中查看 JLPT、TOPIK、DELF/DALF、TestDaF、DELE 与 IELTS。日期均链接至官方来源；地区差异以当地考点为准。
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/calendar" className={`px-4 py-2 rounded-full text-sm ${language === 'all' ? 'bg-primary text-white' : 'bg-white border border-border'}`}>全部</Link>
        {Object.entries(LANGUAGE_MAP).filter(([key]) => !['multi', 'chinese'].includes(key)).map(([key, label]) => (
          <Link key={key} href={`/calendar?language=${key}`} className={`px-4 py-2 rounded-full text-sm ${language === key ? 'bg-primary text-white' : 'bg-white border border-border'}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <article key={event.id} className="panel grid md:grid-cols-[9rem_1fr_auto] gap-5 items-start">
            <div>
              <p className="text-xs font-bold tracking-wider text-primary">{event.exam_type}</p>
              <p className="text-2xl font-bold mt-2">{event.exam_date ? formatDate(event.exam_date).slice(5) : '持续开放'}</p>
              <p className="text-xs text-text-secondary mt-1">{LANGUAGE_MAP[event.language]}</p>
            </div>
            <div>
              <h2 className="text-lg font-bold">{event.title}</h2>
              <p className="text-sm text-text-secondary leading-6 mt-2">{event.description}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs mt-4">
                {event.registration_end && <span><b>报名截止</b> {formatDate(event.registration_end)}</span>}
                {event.exam_date && <span><b>考试日期</b> {formatDate(event.exam_date)}</span>}
                {event.result_date && <span><b>成绩发布</b> {formatDate(event.result_date)}</span>}
              </div>
            </div>
            <a href={event.source_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg border border-border text-sm text-primary hover:bg-primary-light whitespace-nowrap">
              官方来源 ↗
            </a>
          </article>
        ))}
        {events.length === 0 && <div className="panel text-center text-text-secondary py-14">该语种暂未收录考试安排</div>}
      </div>
    </div>
  );
}

