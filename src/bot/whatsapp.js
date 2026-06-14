import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { csAgent } from '../agents/cs-agent.js';

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('✅ Silakan scan QR Code WhatsApp di bawah ini:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = true;
      console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp Baileys Connected');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    
    if (!text) return;

    // Is it a group?
    const isGroup = jid.endsWith('@g.us');

    if (!isGroup) {
      // 1. Customer facing message
      // Call CS Agent to handle it
      console.log(`[WA] Message from ${jid}: ${text}`);
      
      const reply = await csAgent.handleCustomerMessage("Customer", jid, text, { status: "Online" });
      
      await sock.sendMessage(jid, { text: reply });

      // If it looks like a new order, agent would have formatted something or we trigger a handoff.
      // Mock Handoff logic:
      if (text.toLowerCase().includes('order') || text.toLowerCase().includes('kirim')) {
        const ownerGroupId = process.env.WA_OWNER_GROUP_ID; // Define in .env
        if (ownerGroupId) {
          await sock.sendMessage(ownerGroupId, { 
            text: `🔔 ORDER BARU DARI: ${jid}\n\nDetail: ${text}\n\n[Mohon Owner follow-up manual]` 
          });
        }
      }
    }
  });
}
