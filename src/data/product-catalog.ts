export type ProductType = 'app' | 'website' | 'course' | 'service';

export interface ProductSeed {
  id: string;
  competitor_id: string;
  name: string;
  product_type: ProductType;
  short_description: string;
  description: string;
  languages: string[];
  platforms: string[];
  target_audience: string;
  key_features: string[];
  pricing_model: string;
  official_url: string;
  source_name: string;
  source_url: string;
  aliases?: string[];
  sort_order: number;
}

const product = (
  competitorId: string,
  slug: string,
  name: string,
  productType: ProductType,
  shortDescription: string,
  languages: string[],
  platforms: string[],
  targetAudience: string,
  keyFeatures: string[],
  pricingModel: string,
  officialUrl: string,
  sourceName: string,
  sortOrder: number,
  aliases: string[] = []
): ProductSeed => ({
  id: `${competitorId}-${slug}`,
  competitor_id: competitorId,
  name,
  product_type: productType,
  short_description: shortDescription,
  description: `${shortDescription} 资料依据${sourceName}公开页面整理，具体功能、课程安排和价格以官方最新信息为准。`,
  languages,
  platforms,
  target_audience: targetAudience,
  key_features: keyFeatures,
  pricing_model: pricingModel,
  official_url: officialUrl,
  source_name: sourceName,
  source_url: officialUrl,
  aliases,
  sort_order: sortOrder,
});

export const productSeeds: ProductSeed[] = [
  product('hujiang', 'class', '沪江网校', 'app', '覆盖多语种课程、考试培训与在线学习服务的综合网校。', ['多语种'], ['Web', 'iOS', 'Android'], '兴趣、考级、留学和职场学习者', ['在线课程', '学习计划', '课程回放'], '课程付费', 'https://class.hujiang.com/', '沪江网校', 1),
  product('hujiang', 'cichang', '开心词场', 'app', '沪江旗下多语种背词工具，提供词书、闯关与复习功能。', ['英语', '日语', '韩语', '法语等'], ['Web', 'iOS', 'Android'], '需要积累词汇的语言学习者', ['多语种词书', '闯关背词', '复习计划'], '免费增值', 'https://www.hujiang.com/app', '沪江学习工具', 2),
  product('hujiang', 'dict', '小D词典', 'app', '提供英语、日语等多语种查词、翻译和离线词库的学习工具。', ['英语', '日语等'], ['Web', 'iOS', 'Android'], '查词、翻译及阅读学习用户', ['多语种词典', '拍照翻译', '离线词库'], '免费增值', 'https://dict.hjenglish.com/', '沪江小D词典', 3),
  product('hujiang', 'tingli', '听力酷', 'website', '面向多语种学习者的听写和听力训练平台。', ['英语', '日语', '法语', '韩语等'], ['Web'], '需要专项训练听力的学习者', ['分级听写', '每日材料', '学习交流'], '免费', 'https://ting.hujiang.com/', '沪江听力酷', 4),
  product('hujiang', 'tiku', '沪江题库', 'website', '提供语言考试练习、模考和专项训练的在线题库。', ['多语种'], ['Web'], '语言考试备考用户', ['在线练习', '模拟考试', '能力评估'], '免费增值', 'https://www.hujiang.com/app', '沪江学习工具', 5),

  product('izaodao', 'school', '早道网校', 'app', '真人直播、多语种课程和多对一学习服务组成的在线网校。', ['日语', '韩语', '法语', '德语', '西班牙语等'], ['Web', 'iOS', 'Android'], '兴趣、考级及职业语言学习者', ['真人直播', 'CPSS学习系统', '督学服务'], '课程付费', 'https://www.izaodao.com/', '早道教育', 1),
  product('izaodao', 'gaokao', '早道优途', 'service', '面向学校与学生的小语种高考教学和服务品牌。', ['日语', '俄语等'], ['线下', 'Web'], '高中学校及高考小语种学生', ['进校教学', '高考课程', '教研服务'], '咨询报价', 'https://rp.izaodao.com/Index/About', '早道教育集团', 2),
  product('izaodao', 'study-abroad', '早道留学', 'service', '提供面向不同年龄阶段的留学规划与申请服务。', ['多语种'], ['顾问服务', 'Web'], '计划海外升学的学生及家庭', ['留学规划', '院校申请', '顾问服务'], '咨询报价', 'https://rp.izaodao.com/Index/About', '早道教育集团', 3),
  product('izaodao', 'study-tour', '早道研学', 'service', '提供日本青少研学、大学研修与商务考察定制服务。', ['日语'], ['线下', '顾问服务'], '青少年、大学生及商务考察用户', ['日本研学', '短期研修', '定制考察'], '咨询报价', 'https://rp.izaodao.com/Index/About', '早道教育集团', 4),
  product('izaodao', 'publishing', '早道出版', 'service', '围绕能力考试和高考小语种建设教辅出版产品线。', ['日语', '俄语等'], ['图书'], '小语种考试学习者和学校', ['考试教辅', '高考教材', '学习资料'], '图书付费', 'https://rp.izaodao.com/Index/About', '早道教育集团', 5),
  product('izaodao', 'career', '早道就职', 'service', '面向海外职业发展提供语言与就业衔接服务。', ['多语种'], ['顾问服务'], '有海外就业需求的学习者', ['就业咨询', '职业衔接', '语言支持'], '咨询报价', 'https://rp.izaodao.com/Index/About', '早道教育集团', 6),

  product('koolearn-languages', 'japanese', '日语课程', 'course', '覆盖日语入门、能力考试和留学方向的在线课程。', ['日语'], ['Web', '移动端'], '日语入门、考级与留学用户', ['录播课程', '互动直播', '配套练习'], '课程付费', 'https://language.koolearn.com/japanese/', '新东方在线小语种', 1),
  product('koolearn-languages', 'korean', '韩语课程', 'course', '覆盖韩语入门、TOPIK与实用韩语的在线课程。', ['韩语'], ['Web', '移动端'], '韩语入门和TOPIK备考用户', ['系统课程', '考试培训', '课程讲义'], '课程付费', 'https://language.koolearn.com/korean/', '新东方在线小语种', 2),
  product('koolearn-languages', 'french', '法语课程', 'course', '覆盖法语零基础、进阶与DELF/DALF方向的在线课程。', ['法语'], ['Web', '移动端'], '法语入门、进阶和考试用户', ['分级课程', '考试培训', '名师教学'], '课程付费', 'https://language.koolearn.com/french/', '新东方在线小语种', 3),
  product('koolearn-languages', 'german', '德语课程', 'course', '覆盖德语零基础、进阶及TestDaF方向的在线课程。', ['德语'], ['Web', '移动端'], '德语入门、留学与德福备考用户', ['分级课程', '德福备考', '配套练习'], '课程付费', 'https://language.koolearn.com/german/', '新东方在线小语种', 4),
  product('koolearn-languages', 'spanish', '西班牙语课程', 'course', '覆盖西班牙语语音、入门和进阶学习的在线课程。', ['西班牙语'], ['Web', '移动端'], '西班牙语入门和进阶用户', ['视频课程', '外教朗读', '系统语法'], '课程付费', 'https://language.koolearn.com/spanish/', '新东方在线小语种', 5),

  product('olacio', 'french', '欧那法语', 'course', '按欧洲语言标准构建的法语直播与进阶课程。', ['法语'], ['Web', 'App'], '法语入门、留学和职场用户', ['真人直播', '分级课程', '作业批改'], '课程付费', 'https://fr.olacio.com/', '欧那教育', 1),
  product('olacio', 'german', '欧那德语', 'course', '覆盖德语入门、欧标进阶和应用场景的在线课程。', ['德语'], ['Web', 'App'], '德语入门、留学和职场用户', ['真人直播', '欧标课程', '课后答疑'], '课程付费', 'https://de.olacio.com/', '欧那教育', 2),
  product('olacio', 'spanish', '欧那西班牙语', 'course', '覆盖西班牙语发音、日常交际和分级进阶的在线课程。', ['西班牙语'], ['Web', 'App'], '西班牙语兴趣、留学和职场用户', ['真人直播', '情景口语', '分级课程'], '课程付费', 'https://es.olacio.com/', '欧那教育', 3),
  product('olacio', 'russian', '欧那俄语', 'course', '覆盖俄语语音、语法与实用交流的在线课程。', ['俄语'], ['Web', 'App'], '俄语入门、留学和商务用户', ['零基础课程', '真人直播', '实用交流'], '课程付费', 'https://ru.olacio.com/', '欧那教育', 4),
  product('olacio', 'portuguese', '欧那葡萄牙语', 'course', '覆盖葡萄牙语入门、生活口语和进阶学习的在线课程。', ['葡萄牙语'], ['Web', 'App'], '葡萄牙语兴趣、留学和商务用户', ['零基础课程', '生活口语', '在线答疑'], '课程付费', 'https://pt.olacio.com/', '欧那教育', 5),

  product('yangtuo', 'pte', '羊驼PTE', 'course', '面向PTE备考的课程、练习和个性化提分服务。', ['英语'], ['Web', 'App'], 'PTE留学考试用户', ['PTE课程', '题库练习', '一对一教学'], '课程付费', 'https://www.yangtuoedu.com/index', '羊驼教育', 1),
  product('yangtuo', 'ielts', '羊驼雅思', 'course', '面向雅思备考的全科课程、练习和测评服务。', ['英语'], ['Web', 'App'], '雅思留学考试用户', ['雅思课程', '智能练习', '学习测评'], '课程付费', 'https://www.yangtuoedu.com/index', '羊驼教育', 2),
  product('yangtuo', 'japanese', '羊驼日语', 'app', '提供日语五十音、分级课程和能力考试学习服务。', ['日语'], ['Web', 'iOS', 'Android'], '日语入门和JLPT备考用户', ['五十音学习', '分级课程', '考级训练'], '免费增值 / 课程付费', 'https://www.yangtuoedu.com/index', '羊驼教育', 3),
  product('yangtuo', 'korean', '羊驼韩语', 'course', '提供韩语入门、TOPIK分级和直播课程。', ['韩语'], ['Web', 'App'], '韩语入门和TOPIK备考用户', ['真人直播', '分级课程', '考级冲刺'], '课程付费', 'https://www.yangtuoedu.com/index', '羊驼教育', 4),

  product('hellotalk', 'app', 'HelloTalk App', 'app', '连接母语者进行语言交换、文字语音互动和社区交流的应用。', ['多语种'], ['iOS', 'Android', 'Web'], '口语练习和跨文化交流用户', ['语言交换', '语音房', '社区动态'], '免费增值', 'https://www.hellotalk.com/', 'HelloTalk', 1, ['HelloTalk']),
  product('hellotalk', 'business', 'HelloTalk for Business', 'service', '面向企业提供真人教师、课程内容和学习数据管理的语言培训方案。', ['多语种'], ['Web', '企业服务'], '跨国企业、HR与学习发展团队', ['企业课程', '能力评估', '学习数据看板'], '企业咨询报价', 'https://www.hellotalk.com/en/business', 'HelloTalk for Business', 2),

  product('youda', 'one-to-one', '一对一日语', 'course', '按学习目标和水平定制的中外教一对一在线日语课程。', ['日语'], ['Web', '移动端'], '成人日语和个性化学习用户', ['自主约课', '中外教教学', '课程回放'], '课程付费', 'https://www.youda.com.cn/idea', '友达日语', 1),
  product('youda', 'jlpt', 'JLPT能力考', 'course', '围绕N5至N1能力考试提供系统学习与专项备考。', ['日语'], ['Web', '移动端'], 'JLPT各级别备考用户', ['分级课程', '专项强化', '真题冲刺'], '课程付费', 'https://www.youda.com.cn/ability-test', '友达日语', 2),
  product('youda', 'gaokao', '高考日语', 'course', '面向高中生的高考日语教学与提分课程。', ['日语'], ['Web', '移动端'], '高考日语学生', ['一对一教学', '应试训练', '学习规划'], '课程付费', 'https://www.youda.com.cn/gaokao', '友达日语', 3),
  product('youda', 'kids', '少儿日语', 'course', '面向青少儿的兴趣启蒙和互动式日语课程。', ['日语'], ['Web', '移动端'], '青少儿及家庭用户', ['兴趣启蒙', '互动课堂', '中外教课程'], '课程付费', 'https://www.youda.com.cn/shaoer', '友达日语', 4),
  product('youda', 'business', '企业日语培训', 'service', '面向企业员工和业务场景定制日语培训方案。', ['日语'], ['Web', '企业服务'], '日企、对日业务团队及企业员工', ['企业定制', '商务场景', '学习报告'], '企业咨询报价', 'https://www.youda.com.cn/cooperation', '友达日语', 5),

  product('ribencun', 'one-to-one', '真人外教一对一', 'course', '由日籍外教提供的一对一在线互动日语课程。', ['日语'], ['Web', 'App', '平板'], '希望强化口语和实用交流的用户', ['日籍外教', '一对一直播', '自主约课'], '课程付费', 'https://www.ribencun.com/navcourse/', '日本村外教网', 1, ['日本村日语']),
  product('ribencun', 'jlpt', '日语能力考', 'course', '围绕JLPT考点、真题和专项能力提供备考课程。', ['日语'], ['Web', 'App'], 'JLPT备考用户', ['能力考课程', '模拟题库', '专项训练'], '课程付费', 'https://www.ribencun.com/index.aspx', '日本村外教网', 2),
  product('ribencun', 'business', '商务日语', 'course', '聚焦职场沟通、商务礼仪和商务会话的实用课程。', ['日语'], ['Web', 'App'], '职场和对日商务用户', ['商务会话', '职场礼仪', '情景实训'], '课程付费', 'https://www.ribencun.com/curriculum/business/', '日本村外教网', 3),
  product('ribencun', 'kids', '少儿日语', 'course', '面向儿童的日本外教互动与场景体验式课程。', ['日语'], ['Web', 'App'], '7–12岁儿童及家庭', ['外教互动', '场景课程', '课程回放'], '课程付费', 'https://www.ribencun.com/navchildrenJapanese/', '日本村外教网', 4),
  product('ribencun', 'interest', '兴趣主题课', 'course', '围绕日本文化、生活会话与兴趣主题开展的短期课程。', ['日语'], ['Web', 'App'], '日语兴趣和文化学习者', ['文化主题', '生活会话', '小班互动'], '课程付费', 'https://www.ribencun.com/navcourse/', '日本村外教网', 5),

  product('weimingtian', 'all-in-one', '全能日语学习卡', 'course', '覆盖实用日语、考级和口语方向的综合学习产品。', ['日语'], ['Web'], '希望系统学习日语的用户', ['综合课程', '灵活学习', '多级别内容'], '课程付费', 'https://www.riyu365.com/index.html', '未名天日语', 1),
  product('weimingtian', 'speaking', '日语外教口语', 'course', '由外教提供的日语口语表达和实用交流课程。', ['日语'], ['Web'], '需要提升日语口语的用户', ['外教口语', '互动练习', '实用场景'], '课程付费', 'https://www.riyu365.com/index.html', '未名天日语', 2),
  product('weimingtian', 'exam', '日语考级冲刺', 'course', '面向能力考试考前阶段的重点强化和冲刺课程。', ['日语'], ['Web'], 'JLPT考前冲刺用户', ['考点强化', '真题训练', '冲刺辅导'], '课程付费', 'https://www.riyu365.com/index.html', '未名天日语', 3),
  product('weimingtian', 'gaokao', '高考日语学习卡', 'course', '为高中生提供高考日语系统学习和应试训练。', ['日语'], ['Web'], '高考日语学生', ['系统课程', '应试训练', '学习卡'], '课程付费', 'https://www.riyu365.com/index.html', '未名天日语', 4),
  product('weimingtian', 'full-time', '全日制日语签约班', 'course', '提供集中式、全日制的日语课程和学习服务。', ['日语'], ['线下', 'Web'], '需要集中强化学习的用户', ['全日制教学', '阶段规划', '签约班服务'], '课程付费', 'https://www.riyu365.com/index.html', '未名天日语', 5),
  product('weimingtian', 'self-paced', '日语自由学', 'course', '支持不受地点限制、按个人节奏学习的日语课程。', ['日语'], ['Web'], '时间不固定的自主学习者', ['在线课程', '自由安排', '课程回看'], '课程付费', 'https://www.riyu365.com/index.html', '未名天日语', 6),

  product('zhizhu', 'beginner', '零基础入门', 'course', '从五十音和基础语法开始的系统日语入门课程。', ['日语'], ['Web', '移动端'], '零基础和初级日语用户', ['五十音', '基础语法', '分级进阶'], '课程付费', 'https://www.zhizhuxueyuan.com/', '知诸日语', 1),
  product('zhizhu', 'jlpt', 'JLPT备考', 'course', '面向N5至N1能力考试的系统课程和考前强化。', ['日语'], ['Web', '移动端'], 'JLPT备考用户', ['能力考课程', '实战模考', '考前强化'], '课程付费', 'https://jlpt.zhizhuxueyuan.com/', '知诸日语', 2),
  product('zhizhu', 'jtest', 'J.TEST备考', 'course', '覆盖J.TEST不同级别的基础强化和考试课程。', ['日语'], ['Web', '移动端'], 'J.TEST备考用户', ['分级课程', '词汇强化', '模拟考试'], '课程付费', 'https://www.zhizhuxueyuan.com/', '知诸日语', 3),
  product('zhizhu', 'eju', 'EJU/日本升学', 'service', '围绕EJU、学部与大学院提供课程和升学规划。', ['日语'], ['Web', '顾问服务'], '计划赴日升学的学生', ['EJU课程', '升学规划', '留学顾问'], '课程付费 / 咨询报价', 'https://www.zhizhuxueyuan.com/', '知诸日语', 4),
  product('zhizhu', 'speaking', '日语口语一对一', 'course', '根据个人目标提供口测、约课和一对一口语教学。', ['日语'], ['在线授课'], '需要针对性提升口语的用户', ['一对一授课', '口语测评', '个性化约课'], '课程付费', 'https://www.zhizhuxueyuan.com/', '知诸日语', 5),
];
