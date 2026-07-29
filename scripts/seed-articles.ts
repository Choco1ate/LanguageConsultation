import { initDb } from '../src/lib/db';

console.log('Seeding articles...');
const db = initDb();

const insert = db.prepare(`
  INSERT OR REPLACE INTO articles (id, title, summary, content, source_url, source_name, language, tags, cover_image, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const articles = [
  {
    id: 'a1',
    title: '2025年JLPT日语能力考试报名指南：时间、费用、注意事项全解读',
    summary: '2025年12月JLPT考试即将开始报名，本文详细解读报名时间、费用、考点选择及备考建议，帮助考生顺利报名。',
    content: '2025年下半年JLPT日语能力考试将于12月7日举行，报名时间通常为8月至9月。考试分为N1-N5五个级别...',
    source_url: 'https://www.jlpt.jp',
    source_name: 'JLPT官网',
    language: 'japanese',
    tags: JSON.stringify(['考级', 'JLPT']),
    published_at: '2025-07-20',
  },
  {
    id: 'a2',
    title: '高考日语难度分析：与N3-N2水平对比及备考策略',
    summary: '越来越多考生选择日语作为高考外语科目，本文分析高考日语的实际难度水平，并提供针对性备考方案。',
    content: '近年来选择日语参加高考的学生逐年增加。高考日语难度大致在N3-N2之间...',
    source_url: 'https://www.gaokao.com',
    source_name: '高考网',
    language: 'japanese',
    tags: JSON.stringify(['高考', '考级']),
    published_at: '2025-07-19',
  },
  {
    id: 'a3',
    title: 'DELF/DALF法语考试改革：2025年新题型变化详解',
    summary: '2025年起法语DELF/DALF考试将进行重大改革，口语和写作部分题型有显著变化，考生需提前了解并调整备考策略。',
    content: '法国国际教育研究中心宣布，2025年起DELF/DALF考试将进行以下调整...',
    source_url: 'https://www.delfdalf.fr',
    source_name: 'DELF/DALF官网',
    language: 'french',
    tags: JSON.stringify(['考级']),
    published_at: '2025-07-18',
  },
  {
    id: 'a4',
    title: '韩语TOPIK考试全攻略：从报名到备考一站式指南',
    summary: 'TOPIK考试是韩语能力认证的标准，本文涵盖报名流程、考试结构、评分标准及高效备考方法。',
    content: 'TOPIK（Test of Proficiency in Korean）分为TOPIK I（初级）和TOPIK II（中高级）...',
    source_url: 'http://www.topik.go.kr',
    source_name: 'TOPIK官网',
    language: 'korean',
    tags: JSON.stringify(['考级', '学习方法']),
    published_at: '2025-07-17',
  },
  {
    id: 'a5',
    title: '2025年高考外语改革动向：多语种考试政策最新解读',
    summary: '教育部最新文件明确了小语种高考的政策方向，日语、韩语、法语等语种的高考命题将更加规范化。',
    content: '教育部近日发布通知，进一步明确小语种高考的命题规范和评分标准...',
    source_url: 'https://www.gaokao.com',
    source_name: '高考网',
    language: 'multi',
    tags: JSON.stringify(['高考', '行业资讯']),
    published_at: '2025-07-16',
  },
  {
    id: 'a6',
    title: 'TestDaF德语考试备考经验：从B1到C1的进阶之路',
    summary: '分享一位考生从B1水平备考TestDaF满分的学习历程，包含详细的备考计划、推荐教材和时间安排。',
    content: 'TestDaF是德国大学入学德语考试，要求达到B2-C1水平...',
    source_url: 'https://www.testdaf.de',
    source_name: 'TestDaF官网',
    language: 'german',
    tags: JSON.stringify(['考级', '学习方法']),
    published_at: '2025-07-15',
  },
  {
    id: 'a7',
    title: '西班牙语DELE考试改革：2025年新增机考模式',
    summary: '塞万提斯学院宣布DELE考试将逐步引入机考模式，考生可在更多城市参加考试。',
    content: '塞万提斯学院宣布，自2025年下半年起，DELE考试将在全球主要考点引入机考模式...',
    source_url: 'https://www.dele.org',
    source_name: 'DELE官网',
    language: 'spanish',
    tags: JSON.stringify(['考级', '行业资讯']),
    published_at: '2025-07-14',
  },
  {
    id: 'a8',
    title: '零基础学日语：五十音图记忆法与入门学习路线',
    summary: '为日语初学者整理的五十音图高效记忆方法，以及从零基础到N4的完整学习路线图。',
    content: '学习日语的第一步是掌握五十音图。推荐使用联想记忆法...',
    source_url: 'https://jp.hujiang.com',
    source_name: '沪江日语',
    language: 'japanese',
    tags: JSON.stringify(['学习方法', '教材推荐']),
    published_at: '2025-07-13',
  },
  {
    id: 'a9',
    title: '小语种留学趋势报告：2025年最受欢迎的留学目的地',
    summary: '分析2025年小语种国家留学趋势，日本、韩国、法国、德国仍是最热门选择，东南亚留学新兴崛起。',
    content: '根据最新统计数据，2025年中国学生赴小语种国家留学人数持续增长...',
    source_url: 'https://www.hujiang.com',
    source_name: '沪江网校',
    language: 'multi',
    tags: JSON.stringify(['留学', '行业资讯']),
    published_at: '2025-07-12',
  },
  {
    id: 'a10',
    title: '法语学习必备工具推荐：从词典到AI助手全面评测',
    summary: '评测市面上主流的法语学习工具，包括法语助手、Reverso、ChatGPT法语学习等，帮你选择最适合的工具。',
    content: '对于法语学习者来说，选择合适的工具可以大大提高学习效率...',
    source_url: 'https://fr.hujiang.com',
    source_name: '沪江法语',
    language: 'french',
    tags: JSON.stringify(['教材推荐', '学习方法']),
    published_at: '2025-07-11',
  },
  {
    id: 'a11',
    title: '西班牙语DELE备考攻略：从B1到C1高效学习计划',
    summary: 'DELE考试是西班牙语能力认证的国际标准，本文分享从B1到C1水平的备考策略和资源推荐。',
    content: 'DELE（Diplomas de Español como Lengua Extranjera）是塞万提斯学院颁发的官方证书...',
    source_url: 'https://www.dele.org',
    source_name: 'DELE官网',
    language: 'spanish',
    tags: JSON.stringify(['考级', '学习方法']),
    published_at: '2025-07-10',
  },
  {
    id: 'a12',
    title: '高考德语代替英语：优势、风险与适合人群分析',
    summary: '越来越多高中开设德语课程作为高考外语替代选项，本文分析其优劣势及适合选择德语高考的学生类型。',
    content: '近年来，选择德语作为高考外语科目的学生逐渐增多...',
    source_url: 'https://www.gaokao.com',
    source_name: '高考网',
    language: 'german',
    tags: JSON.stringify(['高考']),
    published_at: '2025-07-09',
  },
];

for (const a of articles) {
  insert.run(a.id, a.title, a.summary, a.content, a.source_url, a.source_name, a.language, a.tags, null, a.published_at);
}

console.log(`Seeded ${articles.length} articles.`);
process.exit(0);
