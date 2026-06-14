import prisma from '../database/db.js';

/**
 * Batch analysis (Cron Malam)
 * Analyzes today's outcomes to find lessons and patterns
 */
export async function generateDailyLessons() {
  console.log('📚 Running Daily Batch Analysis (Lessons)...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch today's outcomes
  const outcomes = await prisma.outcomeLog.findMany({
    where: { created_at: { gte: today } },
    include: { shipment: true }
  });

  if (outcomes.length === 0) {
    console.log('No outcomes to analyze today.');
    return;
  }

  // Basic mock analysis
  let delayCount = 0;
  outcomes.forEach(o => {
    if (o.actual_delay > 30) delayCount++;
  });

  const lessonStr = `Dari ${outcomes.length} trip hari ini, ${delayCount} mengalami delay > 30 menit. (Ini insight contoh yang di-generate dari batch analysis harian)`;

  console.log('💡 Lesson Generated:', lessonStr);

  // In a real system, we save this to a Lessons/Insights table to be queried by Agent 2
}
