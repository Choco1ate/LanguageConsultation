import { initDb } from '../src/lib/db';
import competitors from '../src/data/competitors.json';

console.log('Seeding competitors...');
const db = initDb();

const insert = db.prepare(`
  INSERT OR REPLACE INTO competitors (id, name, language, type, url, logo_url, description)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const c of competitors) {
  insert.run(c.id, c.name, c.language, c.type, c.url, c.logo_url, c.description);
}

console.log(`Seeded ${competitors.length} competitors successfully.`);

// Seed some sample updates for demo
const insertUpdate = db.prepare(`
  INSERT OR REPLACE INTO competitor_updates (id, competitor_id, title, content, update_type, source_url, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const sampleUpdates = [
  { id: 'u1', competitor_id: 'duolingo', title: '新增印尼语课程', content: '多邻国宣布上线印尼语学习课程，支持从英语学习者直接学习印尼语。', update_type: 'content', source_url: 'https://blog.duolingo.com', published_at: '2025-07-18' },
  { id: 'u2', competitor_id: 'duolingo', title: 'AI 对话功能升级', content: 'Duolingo Max 新增 AI 角色扮演对话练习，支持更自然的口语训练。', update_type: 'feature', source_url: 'https://blog.duolingo.com', published_at: '2025-07-15' },
  { id: 'u3', competitor_id: 'duolingo', title: '2025年度报告发布', content: '发布2025年全球语言学习趋势报告，日语学习增长30%。', update_type: 'content', source_url: 'https://blog.duolingo.com', published_at: '2025-07-10' },
  { id: 'u4', competitor_id: 'hujiang-jp', title: 'JLPT N1冲刺班开课', content: '沪江日语推出JLPT N1冲刺班，由名师授课，针对12月考试。', update_type: 'content', source_url: 'https://jp.hujiang.com', published_at: '2025-07-17' },
  { id: 'u5', competitor_id: 'hujiang-jp', title: '新版标日初级课程上线', content: '基于新版《大家的日本语》重新录制初级课程，增加动画讲解。', update_type: 'feature', source_url: 'https://jp.hujiang.com', published_at: '2025-07-12' },
  { id: 'u6', competitor_id: 'italki', title: '新增越南语教师团队', content: 'italki 招募了50+越南语母语教师，支持1对1在线教学。', update_type: 'feature', source_url: 'https://www.italki.com', published_at: '2025-07-16' },
  { id: 'u7', competitor_id: 'italki', title: '暑期促销活动', content: 'italki 暑期特惠，首次购课享7折优惠，覆盖所有语种。', update_type: 'pricing', source_url: 'https://www.italki.com', published_at: '2025-07-14' },
  { id: 'u8', competitor_id: 'babbel', title: '阿拉伯语课程扩展', content: 'Babbel 扩展阿拉伯语课程，新增现代标准阿拉伯语中级内容。', update_type: 'content', source_url: 'https://www.babbel.com', published_at: '2025-07-13' },
  { id: 'u9', competitor_id: 'busuu', title: 'AI语法纠错功能上线', content: 'Busuu 推出 AI 驱动的语法纠错功能，可在写作练习中获得即时反馈。', update_type: 'feature', source_url: 'https://www.busuu.com', published_at: '2025-07-11' },
  { id: 'u10', competitor_id: 'french-helper', title: '法语助手 v8.0 发布', content: '新增AI对话练习模式，支持法语语音识别和发音评分。', update_type: 'feature', source_url: '', published_at: '2025-07-09' },
  { id: 'u11', competitor_id: 'lingodeer', title: '泰语课程全新上线', content: 'LingoDeer 推出泰语学习课程，从字母发音到日常会话全覆盖。', update_type: 'content', source_url: 'https://www.lingodeer.com', published_at: '2025-07-08' },
  { id: 'u12', competitor_id: 'memrise', title: '社区视频功能更新', content: 'Memrise 更新社区视频模块，新增更多母语者实景对话视频。', update_type: 'feature', source_url: 'https://www.memrise.com', published_at: '2025-07-07' },
];

for (const u of sampleUpdates) {
  insertUpdate.run(u.id, u.competitor_id, u.title, u.content, u.update_type, u.source_url, u.published_at);
}

console.log(`Seeded ${sampleUpdates.length} competitor updates.`);
process.exit(0);
