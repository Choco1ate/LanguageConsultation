import cron from 'node-cron';
import { fetchArticles, fetchCompetitorUpdates } from './cron-tasks';
import { enrichContent, generateDailyBrief, generateTrendDigest, generateWeeklyReport } from './editorial';

export function startCronJobs() {
  // 每天早上 6:00 执行抓取任务
  cron.schedule('0 6 * * *', async () => {
    const startTime = new Date().toISOString();
    console.log(`[Cron] 开始执行每日抓取任务 - ${startTime}`);

    try {
      const articleCount = await fetchArticles();
      console.log(`[Cron] 文章抓取完成，新增 ${articleCount} 条`);

      const updateCount = await fetchCompetitorUpdates();
      console.log(`[Cron] 竞品动态抓取完成，新增 ${updateCount} 条`);

      if (process.env.OPENAI_API_KEY) {
        const enrichment = await enrichContent({ limit: 30 });
        console.log(`[Cron] 内容增强完成，发布 ${enrichment.published} 条`);
        await generateDailyBrief();
        console.log('[Cron] 每日情报简报已更新');
      } else {
        console.log('[Cron] 未配置 OPENAI_API_KEY，跳过内容增强');
      }
      await Promise.all([generateTrendDigest('7d'), generateTrendDigest('30d')]);
      console.log('[Cron] 7 日与 30 日行业趋势已更新');

      console.log(`[Cron] 每日抓取任务全部完成`);
    } catch (error) {
      console.error('[Cron] 抓取任务执行失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });

  cron.schedule('0 7 * * 1', async () => {
    try {
      await generateWeeklyReport();
      console.log('[Cron] 每周行业观察已更新');
    } catch (error) {
      console.error('[Cron] 周报生成失败:', error);
    }
  }, { timezone: 'Asia/Shanghai' });

  console.log('[Cron] 定时任务已注册：每日 06:00 抓取与简报，每周一 07:00 生成周报');
}
