import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../database/db.js';
import { ownerAgent } from '../agents/owner-agent.js';
import '../handlers/scheduler.js';
import { connectToWhatsApp } from '../bot/whatsapp.js';
import '../bot/telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Endpoints ───

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const activeShipments = await prisma.shipment.count({ where: { status: 'in_transit' } });
    const vehicles = await prisma.vehicle.count();
    const drivers = await prisma.driver.count();
    const pendingApprovals = await prisma.pendingAdjustment.count({ where: { status: 'pending' } });
    
    res.json({ activeShipments, vehicles, drivers, pendingApprovals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fleet', async (req, res) => {
  try {
    const fleet = await prisma.vehicle.findMany({
      include: { drivers: true }
    });
    res.json(fleet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const activeShipments = await prisma.shipment.count({ where: { status: 'in_transit' } });
    const vehicles = await prisma.vehicle.count();
    const drivers = await prisma.driver.count();
    res.json({
      orders: { active: activeShipments },
      fleet: { vehicles, drivers },
      revenue: { total_revenue: 6955000000 }, // Mock
      ai: { savings: 2800000 } // Mock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/revenue', (req, res) => {
  // Mock data for Chart.js
  res.json([
    { fiscal_month: '2025-01', revenue: 500000000, net_profit: 40000000 },
    { fiscal_month: '2025-02', revenue: 520000000, net_profit: 45000000 },
    { fiscal_month: '2025-03', revenue: 490000000, net_profit: 38000000 },
    { fiscal_month: '2025-04', revenue: 550000000, net_profit: 50000000 }
  ]);
});

app.get('/api/dashboard/revenue-by-category', (req, res) => {
  res.json([
    { category: 'Distribusi Retail', revenue: 3000000000 },
    { category: 'Same-day', revenue: 2000000000 },
    { category: 'Proyek', revenue: 1955000000 }
  ]);
});

app.get('/api/orders', async (req, res) => {
  const shipments = await prisma.shipment.findMany({ take: 20, orderBy: { created_at: 'desc' } });
  // Map Prisma Shipment to Order structure expected by UI
  res.json(shipments.map(s => ({
    id: s.id,
    date: s.created_at,
    customer_name: s.customer_id,
    revenue_excl_ppn: s.distance_km * 10000,
    direct_costs: s.fuel_cost + s.toll_parking,
    gross_margin: s.margin_pct
  })));
});

// DeepSeek Owner Agent Chat Endpoint
app.post('/api/chat/owner', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Fetch context data to feed the agent
    const shipments = await prisma.shipment.findMany({ take: 10, orderBy: { created_at: 'desc' } });
    const events = await prisma.tripEvent.findMany({ take: 10, orderBy: { created_at: 'desc' } });
    const pending = await prisma.pendingAdjustment.findMany({ where: { status: 'pending' } });

    const contextData = { shipments, events, pending };
    
    const reply = await ownerAgent.handleOwnerQuery(message, contextData);
    
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approval Endpoints
app.get('/api/approvals/pending', async (req, res) => {
  try {
    const pending = await prisma.pendingAdjustment.findMany({ where: { status: 'pending' } });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/lessons', async (req, res) => {
  res.json([
    { category: 'Rerouting', rule: 'Delay > 30 menit di rute X, hindari jam sibuk.', confidence: 0.85 },
    { category: 'Margin', rule: 'Pelanggan retail menghasilkan margin 12% lebih tinggi.', confidence: 0.92 }
  ]);
});

app.get('/api/chat/messages', async (req, res) => {
  res.json([
    { id: 1, sender: '08123456789', message: 'Halo, saya mau order.', timestamp: new Date() },
    { id: 2, sender: 'system', message: 'Baik, akan kami hubungkan ke Owner.', timestamp: new Date() }
  ]);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  console.log(`🚀 Owner Dashboard Server running on http://localhost:${PORT}`);
  
  // Start bots
  try {
    await connectToWhatsApp();
  } catch (err) {
    console.log('⚠️ Failed to start WhatsApp:', err.message);
  }
});

// Setup WebSocket for Live Feed
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ server, path: '/ws/live' });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  // Send a dummy event to confirm connection
  ws.send(JSON.stringify({
    type: 'ops_update',
    data: { message: 'System connected and monitoring live operations.' },
    timestamp: new Date()
  }));
});
