export async function register() {
  // 仅在 Node.js 运行时注册定时任务（避免 Edge 运行时重复注册）
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCronJobs } = await import('@/lib/cron-scheduler');
    startCronJobs();
  }
}
