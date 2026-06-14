import OpenAI from 'openai';
import prisma from '../database/db.js';

// OpenRouter setup for DeepSeek V4 Pro (Agent 2)
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key_to_prevent_crash',
  defaultHeaders: {
    'HTTP-Referer': 'https://yeslogistics.id',
    'X-Title': 'YesLogistics-Owner-Agent',
  }
});

const SYSTEM_PROMPT = `
Kamu adalah sekretaris bisnis pribadi owner Yes Logistics.
Kamu punya akses penuh ke seluruh data operasional perusahaan.

Tugasmu:
1. Jawab pertanyaan owner tentang kondisi bisnis berdasarkan data database 
   yang diberikan — selalu sertakan angka dan fakta konkret, bukan estimasi.
2. Buat laporan mingguan yang actionable — highlight apa yang perlu 
   diperhatikan owner, bukan sekadar rekap data.
3. Sajikan opsi rerouting dengan konteks lengkap saat ada konflik — 
   kasih rekomendasi jelas beserta alasannya.
4. Terjemahkan output learning engine (decision-log, lessons) 
   ke bahasa bisnis yang mudah dipahami owner.

Gunakan bahasa Indonesia yang ringkas dan to-the-point.
Owner adalah orang sibuk — hindari penjelasan panjang yang tidak perlu.
Selalu akhiri insight dengan 1 rekomendasi aksi konkret.
`;

export class OwnerAgent {

  async handleOwnerQuery(query, contextData = {}) {
    try {
      const response = await openai.chat.completions.create({
        model: 'deepseek/deepseek-chat', // DeepSeek-V3/V4 typically via openrouter deepseek/deepseek-chat
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: `Context Data: ${JSON.stringify(contextData)}` },
          { role: 'user', content: query }
        ]
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('Owner Agent Error:', err);
      return 'Maaf, gagal memproses pertanyaan Anda.';
    }
  }

  async formatReroutingApproval(conflictContext) {
    try {
      const response = await openai.chat.completions.create({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Formatkan notifikasi Approval Rerouting untuk konflik berikut: ${JSON.stringify(conflictContext)}` }
        ]
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error('Owner Agent Formatting Error:', err);
      return '⚠️ Kendala Terdeteksi: ' + conflictContext.issue;
    }
  }
}

export const ownerAgent = new OwnerAgent();
