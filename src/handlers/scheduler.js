import cron from 'node-cron';
import prisma from '../database/db.js';
import { csAgent } from '../agents/cs-agent.js';
import { bot } from '../bot/telegram.js';
import { generateDailyLessons } from '../learning/lessons.js';

// 1. Agent 1: Rangkuman Harian ke Admin (Setiap jam 17:00)
cron.schedule('0 17 * * *', async () => {
  console.log('⏰ Running 17:00 Cron: Daily Summary for Admin...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.tripEvent.findMany({
    where: { created_at: { gte: today } }
  });

  const summaryMsg = await csAgent.generateDailySummary(events);
  
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (bot && adminChatId) {
    bot.sendMessage(adminChatId, `📊 *RANGKUMAN HARIAN (17:00)*\n\n${summaryMsg}`, { parse_mode: 'Markdown' });
  } else {
    console.log('Admin Chat ID or Bot not configured. Summary:', summaryMsg);
  }

  // Save to DB
  await prisma.dailySummary.create({
    data: { summary_text: summaryMsg }
  });
});

// 2. Learning Engine: Batch Analysis (Setiap jam 23:00 malam)
cron.schedule('0 23 * * *', async () => {
  await generateDailyLessons();
});

console.log('✅ Cron Schedulers Initialized');
