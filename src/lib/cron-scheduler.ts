import cron from 'node-cron';
import { fetchArticles, fetchCompetitorUpdates } from './cron-tasks';

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

      console.log(`[Cron] 每日抓取任务全部完成`);
    } catch (error) {
      console.error('[Cron] 抓取任务执行失败:', error);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });

  console.log('[Cron] 定时任务已注册：每天 06:00 (Asia/Shanghai) 执行数据抓取');
}
