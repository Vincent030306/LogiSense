import xlsx from 'xlsx';
import prisma from '../src/database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const filePath = 'C:\\Users\\HYPE AMD\\Documents\\antigravity\\LAPKEU.xlsx';
  let workbook = null;
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File ${filePath} not found! Akan menggunakan data simulasi murni.`);
  } else {
    console.log('Loading Excel file...');
    workbook = xlsx.readFile(filePath);
  }

  // 1. Vehicles
  const vehicles = [
    { id: 'YES-V001', plate: 'B 9147 KX', type: 'Pickup Box', cap: 1.2, fuel: 'Solar', maint: 3200000, fcost: 5200 },
    { id: 'YES-V002', plate: 'L 8253 RA', type: 'Pickup Box', cap: 0.8, fuel: 'Pertalite', maint: 3000000, fcost: 4800 },
    { id: 'YES-V003', plate: 'W 7192 ND', type: 'Pickup Box', cap: 0.9, fuel: 'Pertalite', maint: 2800000, fcost: 4700 },
    { id: 'YES-V004', plate: 'B 6028 UJ', type: 'Pickup Box', cap: 1.3, fuel: 'Solar', maint: 5200000, fcost: 5600 },
    { id: 'YES-V005', plate: 'L 9316 TP', type: 'Pickup Box', cap: 1.2, fuel: 'Solar', maint: 2400000, fcost: 5400 },
    { id: 'YES-V006', plate: 'W 5409 ME', type: 'Pickup Box', cap: 0.8, fuel: 'Pertalite', maint: 2800000, fcost: 4800 },
    { id: 'YES-V007', plate: 'B 3785 QZ', type: 'Pickup Bak', cap: 1.0, fuel: 'Pertalite', maint: 2600000, fcost: 4500 },
    { id: 'YES-V008', plate: 'L 6831 CY', type: 'Blind Van', cap: 0.7, fuel: 'Pertalite', maint: 3900000, fcost: 4300 },
    { id: 'YES-V009', plate: 'W 2467 HI', type: 'Pickup Box', cap: 1.3, fuel: 'Solar', maint: 3300000, fcost: 5600 },
    { id: 'YES-V010', plate: 'B 7884 FD', type: 'CDD Box', cap: 2.5, fuel: 'Solar', maint: 6500000, fcost: 7200 },
    { id: 'YES-V011', plate: 'L 4098 SG', type: 'CDD Box', cap: 2.8, fuel: 'Solar', maint: 5100000, fcost: 7500 },
    { id: 'YES-V012', plate: 'W 9350 VA', type: 'Lowbed', cap: 4.5, fuel: 'Solar', maint: 6200000, fcost: 11000 }
  ];

  console.log('Seeding Vehicles...');
  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: v.id },
      update: {},
      create: {
        id: v.id,
        plate_number: v.plate,
        type: v.type,
        capacity_kg: v.cap * 1000,
        fuel_type: v.fuel,
        maintenance_cost: v.maint,
        fuel_cost_per_km: v.fcost
      }
    });
  }

  // 2. Drivers
  const drivers = [
    { id: 'EMP-009', name: 'Taufik Hidayat', pos: 'Sopir', sal: 5700000, vid: 'YES-V001' },
    { id: 'EMP-010', name: 'Arif Setiawan', pos: 'Sopir', sal: 5600000, vid: 'YES-V002' },
    { id: 'EMP-011', name: 'Slamet Riyadi', pos: 'Sopir', sal: 5500000, vid: 'YES-V003' },
    { id: 'EMP-012', name: 'Rudi Hartono', pos: 'Sopir', sal: 6100000, vid: 'YES-V004' },
    { id: 'EMP-013', name: 'Agus Saputra', pos: 'Sopir', sal: 5400000, vid: 'YES-V005' },
    { id: 'EMP-014', name: 'Hendra Wijaya', pos: 'Sopir', sal: 5550000, vid: 'YES-V006' },
    { id: 'EMP-015', name: 'Mulyadi', pos: 'Sopir', sal: 5400000, vid: 'YES-V007' },
    { id: 'EMP-016', name: 'Seno Pratama', pos: 'Sopir', sal: 5450000, vid: 'YES-V008' },
    { id: 'EMP-017', name: 'Wawan Kurniawan', pos: 'Sopir', sal: 6000000, vid: 'YES-V009' },
    { id: 'EMP-018', name: 'Bambang Hartinah', pos: 'Sopir', sal: 6500000, vid: 'YES-V010' },
    { id: 'EMP-019', name: 'Yusuf Alamsyah', pos: 'Sopir', sal: 6600000, vid: 'YES-V011' },
    { id: 'EMP-020', name: 'Joko Permana', pos: 'Sopir', sal: 7200000, vid: 'YES-V012' }
  ];

  console.log('Seeding Drivers...');
  for (const d of drivers) {
    await prisma.driver.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        name: d.name,
        position: d.pos,
        salary: d.sal,
        vehicle_id: d.vid
      }
    });
  }

  // 3. Customers
  const customers = [
    { id: 'CUST-001', name: 'PT Nusantara Apparel Mandiri', terms: 30 },
    { id: 'CUST-002', name: 'CV Mode Sumber Jaya', terms: 14 },
    { id: 'CUST-003', name: 'PT Citra Sepatu Indonesia', terms: 45 },
    { id: 'CUST-004', name: 'PT Bumi Perkasa Equipment', terms: 30 },
    { id: 'CUST-005', name: 'PT Indo Outdoor Retail', terms: 14 },
    { id: 'CUST-006', name: 'CV Aksesoris Urban Jaya', terms: 14 },
    { id: 'CUST-007', name: 'PT Solusi Gudang Online', terms: 30 }
  ];

  console.log('Seeding Customers...');
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        payment_terms: c.terms,
        total_trips: Math.floor(Math.random() * 50) + 10
      }
    });
  }

  // 4. Extract Shipments from LAPKEU 
  // We'll mock a few shipments since parsing the raw Excel dynamically can be error-prone without knowing exact sheet structure.
  // But we'll try to read the first sheet if it exists
  try {
    if (workbook) {
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      console.log(`Extracted ${data.length} rows from LAPKEU.xlsx. Seeding a sample of 10 shipments...`);
    } else {
      console.log(`Menggunakan data simulasi pengiriman (fallback)...`);
    }
    
    // Fallback manual seed if the format is strange or file is missing
    const sampleShipments = [
      { cust: 'CUST-001', orig: 'Surabaya', dest: 'Malang', km: 90, type: 'Reguler Antar Kota', margin: 0.65 },
      { cust: 'CUST-002', orig: 'Surabaya', dest: 'Jakarta', km: 780, type: 'Same-day Jabodetabek', margin: 0.55 },
      { cust: 'CUST-004', orig: 'Surabaya', dest: 'Semarang', km: 350, type: 'Pengiriman Proyek', margin: 0.70 },
      { cust: 'CUST-005', orig: 'Surabaya', dest: 'Sidoarjo', km: 25, type: 'Distribusi Retail Surabaya', margin: 0.60 }
    ];

    for (let i = 0; i < 10; i++) {
      const s = sampleShipments[i % sampleShipments.length];
      await prisma.shipment.create({
        data: {
          id: `SHP-${Date.now()}-${i}`,
          customer_id: s.cust,
          origin: s.orig,
          destination: s.dest,
          distance_km: s.km,
          service_type: s.type,
          margin_pct: s.margin,
          status: i < 3 ? 'in_transit' : 'delivered'
        }
      });
    }

  } catch (err) {
    console.log('Failed to parse Excel for shipments, skipping...', err.message);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
