import TelegramBot from 'node-telegram-bot-api';
import prisma from '../database/db.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new TelegramBot(token, { polling: true }) : null;

if (bot) {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    // Simple command routing
    if (text.startsWith('/start')) {
      bot.sendMessage(chatId, 'Selamat datang di Yes Logistics Driver Bot. Silakan lapor status dengan format:\n/lapor [shipment_id] [status] [keterangan]');
    } else if (text.startsWith('/lapor')) {
      const parts = text.split(' ');
      if (parts.length < 3) {
        return bot.sendMessage(chatId, 'Format salah. Gunakan: /lapor [shipment_id] [depart|arrive|issue] [keterangan]');
      }
      
      const shipmentId = parts[1];
      const status = parts[2];
      const desc = parts.slice(3).join(' ');

      try {
        await prisma.tripEvent.create({
          data: {
            shipment_id: shipmentId,
            driver_id: msg.from.username || msg.from.id.toString(), // Mock driver id
            event_type: status,
            description: desc
          }
        });
        
        bot.sendMessage(chatId, '✅ Laporan berhasil dicatat.');

        // LOAD MATCHING LOGIC (Looping)
        // If status is 'arrive', system checks if there are pending shipments nearby
        if (status === 'arrive') {
          // Dummy logic for load matching
          bot.sendMessage(chatId, '🤖 Info Sistem: Anda berada di dekat lokasi Customer X. Ada muatan kosong searah jalan pulang. Mohon ambil di Gudang X sebelum kembali.');
        }

      } catch (err) {
        console.error('Bot Error:', err);
        bot.sendMessage(chatId, 'Gagal mencatat laporan. Pastikan ID Shipment benar.');
      }
    }
  });

  console.log('✅ Telegram Bot Started');
} else {
  console.log('⚠️ TELEGRAM_BOT_TOKEN not provided, skipping Telegram Bot initialization.');
}
