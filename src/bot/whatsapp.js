import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { csAgent } from '../agents/cs-agent.js';
import prisma from '../database/db.js';

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['LogiSense', 'Chrome', '1.0.0']
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
    
    // Selalu log pesan masuk agar Owner bisa melihat Group ID di VPS
    console.log(`[WA] Message from ${jid}: ${text}`);

    if (!isGroup) {
      // 1. Customer facing message
      // Call CS Agent to handle it
      console.log(`[WA] Message from ${jid}: ${text}`);
      
      const reply = await csAgent.handleCustomerMessage("Customer", jid, text, { status: "Online" });
      
      if (!reply) return; // Muted

      if (reply.includes('[ORDER_READY]')) {
        // 1. Extract Summary (everything after [ORDER_READY])
        const summaryParts = reply.split('[ORDER_READY]');
        const summaryText = summaryParts[1] ? summaryParts[1].trim() : "Data pesanan terlampir.";

        // 2. Insert to Database (Draft Mode)
        const customerPhone = jid.split('@')[0];
        const resi = `SHP-${Date.now().toString().slice(-6)}`;

        try {
          // Upsert Customer
          await prisma.customer.upsert({
            where: { id: customerPhone },
            update: {},
            create: { id: customerPhone, name: `WA ${customerPhone}`, payment_terms: 0, total_trips: 1 }
          });

          // Create Shipment Draft
          await prisma.shipment.create({
            data: {
              id: resi,
              customer_id: customerPhone,
              origin: "Menunggu Update Owner",
              destination: "Menunggu Update Owner",
              distance_km: 0,
              service_type: "Reguler",
              status: "new"
            }
          });

          // 3. Send Notification to Owner Group
          const ownerGroupId = process.env.WA_OWNER_GROUP_ID;
          if (ownerGroupId) {
            const handoffMsg = `🚨 *DRAFT ORDER BARU (Butuh Dealing Harga)* 🚨\nNo. Resi: *${resi}*\nDari WA: wa.me/${customerPhone}\n\n*Rangkuman AI:*\n${summaryText}\n\n_Mohon Owner segera hubungi customer untuk nego harga, lalu update jarak/harga di Web Dashboard._`;
            await sock.sendMessage(ownerGroupId, { text: handoffMsg });
          }

          // 4. Send Confirmation to Customer
          const customerMsg = `✅ Data pesanan Anda telah dirangkum dan masuk ke sistem kami dengan nomor Resi Draft: *${resi}*.\n\nTim kami (Owner) akan segera menghubungi Anda melalui nomor ini untuk konfirmasi harga dan jadwal penjemputan. Mohon ditunggu ya! 🙏`;
          await sock.sendMessage(jid, { text: customerMsg });

          // 5. Mute Bot for this customer so it doesn't interrupt Owner dealing
          csAgent.muteCustomer(jid);

        } catch (dbErr) {
          console.error("Failed to save draft order or send message:", dbErr);
          await sock.sendMessage(jid, { text: `Maaf, terjadi kesalahan teknis (System Error: ${dbErr.message || dbErr}). Mohon hubungi admin manual.` });
        }
      } else {
        // Normal conversation reply
        await sock.sendMessage(jid, { text: reply });
      }
    }
  });
}
