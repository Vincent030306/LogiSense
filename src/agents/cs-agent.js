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
1. Melayani customer yang ingin mengirim barang.
2. JANGAN membuatkan resi atau menjanjikan harga. Harga akan diurus oleh Tim Sales/Owner.
3. Kumpulkan informasi ini dari customer secara bertahap (jangan ditanya sekaligus):
   - Nama Pengirim & Alamat (Tanya ini dulu)
   - Nama Penerima & Alamat & No HP (Tanya ini setelahnya)
   - Detail Barang & Berat (Terakhir)

PENTING: Jika SEMUA informasi di atas sudah lengkap dan customer setuju untuk di-follow up, maka pada bagian AKHIR balasanmu, WAJIB tuliskan teks berikut persis seperti ini:

[ORDER_READY]
Pengirim: [Nama & Alamat Pengirim]
Penerima: [Nama, Alamat, No HP Penerima]
Barang: [Detail Barang & Berat]
Layanan: Reguler

Gunakan bahasa Indonesia yang ramah, singkat, dan profesional.
`;

// In-memory chat history per customer (max 10 messages)
const chatMemory = new Map();
const mutedCustomers = new Set();

export class CSAgent {
  
  muteCustomer(customerId) {
    mutedCustomers.add(customerId);
  }

  isMuted(customerId) {
    return mutedCustomers.has(customerId);
  }

  unmuteCustomer(customerId) {
    mutedCustomers.delete(customerId);
  }

  async handleCustomerMessage(customerName, customerId, message, contextData = {}) {
    if (this.isMuted(customerId)) return null;

    try {
      // Retrieve or initialize memory
      let history = chatMemory.get(customerId) || [];
      
      // Add new user message to history
      history.push({ role: 'user', content: `[${customerName}]: ${message}` });

      // Keep only last 8 messages to prevent token overflow
      if (history.length > 8) history = history.slice(history.length - 8);

      const response = await openai.chat.completions.create({
        model: 'minimax/minimax-m2.7',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: `Context Data Database saat ini: ${JSON.stringify(contextData)}` },
          ...history
        ]
      });

      const reply = response.choices[0].message.content;
      
      // Add assistant reply to history
      history.push({ role: 'assistant', content: reply });
      chatMemory.set(customerId, history);

      return reply;
    } catch (err) {
      console.error('CS Agent Error:', err);
      // Return the actual error message to WA for easy debugging
      return `Maaf, sistem AI sedang mengalami gangguan API.\n\nDetail Error: ${err.message || err}\n\n(Catatan untuk Owner: Pastikan OPENROUTER_API_KEY valid dan memiliki kredit, atau ganti ID Model MiniMax di cs-agent.js)`;
    }
  }

  async generateDailySummary(events) {
    try {
      const response = await openai.chat.completions.create({
        model: 'minimax/minimax-m2.7',
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
