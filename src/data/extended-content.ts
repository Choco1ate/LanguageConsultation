export interface ExamSeed {
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

export const examSeeds: ExamSeed[] = [
  {
    id: 'jlpt-2026-12',
    exam_type: 'JLPT',
    language: 'japanese',
    title: '2026 年第二回日语能力测试',
    registration_start: null,
    registration_end: null,
    exam_date: '2026-12-06',
    result_date: null,
    source_url: 'https://www.jlpt.jp/e/application/overseas_index.html',
    source_name: 'JLPT 官方网站',
    description: '海外考点通常于 8–9 月报名、次年 3 月前后收到成绩；各城市安排可能不同，请以当地承办机构为准。',
  },
  {
    id: 'dele-2026-10',
    exam_type: 'DELE',
    language: 'spanish',
    title: '2026 年 10 月 DELE 考试',
    registration_start: '2025-12-01',
    registration_end: '2026-09-02',
    exam_date: '2026-10-16',
    result_date: null,
    source_url: 'https://examenes.cervantes.es/es/dele/cuando',
    source_name: 'Instituto Cervantes',
    description: '10 月 16 日开考 B1、B2、C1，10 月 17 日开考 A2；报名截止日为 9 月 2 日。',
  },
  {
    id: 'dele-2026-11',
    exam_type: 'DELE',
    language: 'spanish',
    title: '2026 年 11 月 DELE 考试',
    registration_start: '2025-12-01',
    registration_end: '2026-09-30',
    exam_date: '2026-11-13',
    result_date: null,
    source_url: 'https://examenes.cervantes.es/es/dele/cuando',
    source_name: 'Instituto Cervantes',
    description: '11 月 13–14 日举行学生组及通用组多个级别考试，报名截止日为 9 月 30 日。',
  },
  {
    id: 'delf-dalf-2026-08',
    exam_type: 'DELF/DALF',
    language: 'french',
    title: '2026 年 8 月 DELF/DALF 法国考区',
    registration_start: null,
    registration_end: null,
    exam_date: '2026-08-18',
    result_date: null,
    source_url: 'https://www.france-education-international.fr/article/informations-pratiques-pour-les-candidats-au-delf-dalf?langue=fr',
    source_name: 'France Éducation international',
    description: '8 月 18–20 日分别举行 DELF A1/A2、B1/B2 与 DALF C1/C2 集体考试；报名安排由考点发布。',
  },
  {
    id: 'delf-dalf-2026-10',
    exam_type: 'DELF/DALF',
    language: 'french',
    title: '2026 年 10 月 DELF/DALF 法国考区',
    registration_start: null,
    registration_end: null,
    exam_date: '2026-10-06',
    result_date: null,
    source_url: 'https://www.france-education-international.fr/article/informations-pratiques-pour-les-candidats-au-delf-dalf?langue=fr',
    source_name: 'France Éducation international',
    description: '10 月 6–8 日举行 DELF/DALF 集体考试；法国以外考区需向当地考试中心确认日期。',
  },
  {
    id: 'testdaf-schedule',
    exam_type: 'TestDaF',
    language: 'german',
    title: 'TestDaF 最新考试场次',
    registration_start: null,
    registration_end: null,
    exam_date: null,
    result_date: null,
    source_url: 'https://www.testdaf.de/de/teilnehmende/mein-testdaf/testdaf-termine-und-anmeldung/',
    source_name: 'TestDaF 官方网站',
    description: '数字化与纸笔考试场次随考点变化，请在官方场次页选择国家、考点和日期。',
  },
  {
    id: 'topik-schedule',
    exam_type: 'TOPIK',
    language: 'korean',
    title: 'TOPIK 最新考试场次',
    registration_start: null,
    registration_end: null,
    exam_date: null,
    result_date: null,
    source_url: 'https://www.topik.go.kr/',
    source_name: 'TOPIK 官方网站',
    description: '各国家和地区的报名与考试安排不同，请从官方公告或当地承办机构查询。',
  },
  {
    id: 'ielts-schedule',
    exam_type: 'IELTS',
    language: 'english',
    title: 'IELTS 近期机考与纸笔考试',
    registration_start: null,
    registration_end: null,
    exam_date: null,
    result_date: null,
    source_url: 'https://ielts.org/take-a-test/test-dates',
    source_name: 'IELTS 官方网站',
    description: 'IELTS 场次按城市和考试中心持续开放，请在官方日期查询页选择所在地。',
  },
];

export interface CompetitorProfileSeed {
  competitor_id: string;
  supported_languages: string[];
  platforms: string[];
  learning_modes: string[];
  target_audience: string;
  pricing_model: string;
  key_features: string[];
}

export const competitorProfileSeeds: CompetitorProfileSeed[] = [
  ['hujiang', ['日语', '韩语', '法语', '德语', '西班牙语', '俄语等'], ['Web', '移动端'], ['录播课程', '直播课程', '资讯内容'], '兴趣、考级、留学和职场学习者', '课程付费', ['多语种课程', '学习资讯', '题库与工具']],
  ['izaodao', ['日语', '韩语', '法语', '德语', '西班牙语'], ['Web', '移动端'], ['直播课程', '录播课程', '督学'], '考级、高考日语及兴趣学习者', '课程付费', ['直播课堂', '高考日语', '考级课程']],
  ['koolearn-languages', ['日语', '韩语', '法语', '德语', '西班牙语'], ['Web', '移动端'], ['录播课程', '直播课程'], '考级、留学与零基础学习者', '课程付费', ['名师课程', '考试培训', '配套练习']],
  ['olacio', ['法语', '德语', '西班牙语', '俄语', '葡萄牙语'], ['Web', 'App'], ['真人直播', '小班课', '企业培训'], '留学、职场及企业客户', '课程付费 / 企业方案', ['全球师资', '欧标课程', '企业定制']],
  ['yangtuo', ['日语', '韩语', '英语'], ['Web', 'App'], ['直播课程', '一对一', '督学'], '留学考试与日韩语学习者', '课程付费', ['学习工具', '在线答疑', '留学指导']],
  ['hellotalk', ['多语种'], ['iOS', 'Android', 'Web'], ['语言交换', '社区互动', '真人教学'], '口语练习、跨文化交流及企业用户', '免费增值 / 企业方案', ['语伴社区', '语音房', '企业培训']],
  ['youda', ['日语'], ['Web', '移动端'], ['一对一真人教学'], '成人、青少儿、高考及企业用户', '按课程付费', ['自主约课', '中外教教学', '企业培训']],
  ['ribencun', ['日语'], ['Web', 'App', '小程序'], ['日本外教一对一'], '口语、商务和兴趣日语学习者', '按课程付费', ['日本外教', '口语课程', '商务场景']],
  ['weimingtian', ['日语'], ['Web'], ['直播课程', '一对一'], '高考、JLPT、日本留学及升学用户', '课程付费', ['高考日语', '考级课程', '升学服务']],
  ['zhizhu', ['日语'], ['Web'], ['直播课程', '录播课程'], 'JLPT、EJU和日本升学学习者', '课程付费', ['JLPT', 'EJU', '大学院升学']],
].map(([competitor_id, supported_languages, platforms, learning_modes, target_audience, pricing_model, key_features]) => ({
  competitor_id: competitor_id as string,
  supported_languages: supported_languages as string[],
  platforms: platforms as string[],
  learning_modes: learning_modes as string[],
  target_audience: target_audience as string,
  pricing_model: pricing_model as string,
  key_features: key_features as string[],
}));
