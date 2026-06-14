import OpenAI from 'openai';
import prisma from '../database/db.js';

// OpenRouter setup for MiniMax (Agent 1)
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key_to_prevent_crash',
  defaultHeaders: {
    'HTTP-Referer': 'https://yeslogistics.id',
    'X-Title': 'YesLogistics-CS-Agent',
  }
});

const SYSTEM_PROMPT = `
Kamu adalah asisten CS dan operasional Yes Logistics. 
Tugasmu:
1. Balas pertanyaan customer tentang status pengiriman, order, dan estimasi tiba 
   berdasarkan data database yang diberikan.
2. Proses order baru dan catat ke sistem.
3. Generate rangkuman operasional harian yang ringkas dan jelas untuk admin.
4. Kalau tidak tahu jawaban atau di luar kapasitasmu, 
   katakan "Saya akan hubungkan dengan tim kami" — jangan mengarang.

Gunakan bahasa Indonesia yang ramah, singkat, dan profesional.
Jangan pernah memberikan informasi yang tidak ada di database.
`;

export class CSAgent {
  
  async handleCustomerMessage(customerName, customerId, message, contextData = {}) {
    try {
      const response = await openai.chat.completions.create({
        model: 'minimax/minimax-01',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: `Context Data Database saat ini: ${JSON.stringify(contextData)}` },
          { role: 'user', content: `[${customerName}]: ${message}` }
        ]
      });

      return response.choices[0].message.content;
    } catch (err) {
      console.error('CS Agent Error:', err);
      return 'Maaf, sistem kami sedang mengalami gangguan. Saya akan hubungkan dengan tim kami.';
    }
  }

  async generateDailySummary(events) {
    try {
      const response = await openai.chat.completions.create({
        model: 'minimax/minimax-01',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Buatkan rangkuman operasional harian untuk admin berdasarkan data event hari ini: ${JSON.stringify(events)}` }
        ]
      });

      return response.choices[0].message.content;
    } catch (err) {
      console.error('CS Agent Summary Error:', err);
      return 'Gagal membuat rangkuman harian.';
    }
  }
}

export const csAgent = new CSAgent();
