const express = require('express');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3088;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // limit גדול בשביל תמונות base64

// ============================================
// DATABASE - החיבור לקובץ car-maintenance.db
// ============================================
const db = new Database(path.join(__dirname, 'car_maintenance.db'));
console.log('✅ Database connected');

// יצירת טבלאות אם לא קיימות (לא מוחק נתונים קיימים)
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_plate TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    vin TEXT,
    current_mileage INTEGER DEFAULT 0,
    insurance_expiry TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    category TEXT,
    description TEXT,
    cost REAL,
    mileage INTEGER,
    service_date TEXT,
    workshop_name TEXT,
    next_due_km INTEGER,
    next_due_date TEXT,
    notes TEXT,
    image_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
  );
`);

// ============================================
// EMAIL (מושבת זמנית - Yahoo חוסם)
// ============================================
const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// אימות מייל מושבת - הוא היה מעיף שגיאות בכל הפעלה
// transporter.verify((error) => {
//   console.log('Email:', error ? '❌ Failed' : '✅ Ready');
// });

// ============================================
// VEHICLES ROUTES
// ============================================

// כל הרכבים + הטיפול האחרון של כל אחד
app.get('/api/vehicles', (req, res) => {
    try {
        const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY id DESC').all();

        const getMaintenance = db.prepare(
            'SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY service_date DESC'
        );

        const result = vehicles.map(v => ({
            ...v,
            maintenance: getMaintenance.all(v.id)
        }));

        console.log(`✅ Fetched ${result.length} vehicles`);
        res.json(result);
    } catch (error) {
        console.error('❌ Error fetching vehicles:', error);
        res.status(500).json({ error: error.message });
    }
});

// רכב בודד
app.get('/api/vehicles/:id', (req, res) => {
    try {
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

        vehicle.maintenance = db.prepare(
            'SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY service_date DESC'
        ).all(vehicle.id);

        res.json(vehicle);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// חיפוש לפי מספר רישום
app.get('/api/vehicles/search/:licensePlate', (req, res) => {
    try {
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE license_plate = ?')
            .get(req.params.licensePlate);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// הוספת רכב
app.post('/api/vehicles', (req, res) => {
    try {
        const { license_plate, make, model, year, vin, current_mileage } = req.body;

        if (!license_plate || !make || !model) {
            return res.status(400).json({ error: 'חסרים שדות חובה: רישום, מותג, דגם' });
        }

        const info = db.prepare(`
      INSERT INTO vehicles (license_plate, make, model, year, vin, current_mileage)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(license_plate, make, model, year || null, vin || null, current_mileage || 0);

        const newVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(info.lastInsertRowid);
        newVehicle.maintenance = [];

        console.log('✅ Vehicle added:', license_plate);
        res.json(newVehicle);
    } catch (error) {
        console.error('❌ Error adding vehicle:', error);
        if (error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'רכב עם מספר רישום זה כבר קיים' });
        }
        res.status(500).json({ error: error.message });
    }
});

// עדכון רכב
app.put('/api/vehicles/:id', (req, res) => {
    try {
        const { license_plate, make, model, year, vin, current_mileage, insurance_expiry } = req.body;

        db.prepare(`
      UPDATE vehicles
      SET license_plate = ?, make = ?, model = ?, year = ?,
          vin = ?, current_mileage = ?, insurance_expiry = ?
      WHERE id = ?
    `).run(license_plate, make, model, year, vin, current_mileage, insurance_expiry || null, req.params.id);

        const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
        console.log('✅ Vehicle updated:', req.params.id);
        res.json(updated);
    } catch (error) {
        console.error('❌ Error updating vehicle:', error);
        res.status(500).json({ error: error.message });
    }
});

// מחיקת רכב
app.delete('/api/vehicles/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM maintenance WHERE vehicle_id = ?').run(req.params.id);
        db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
        console.log('✅ Vehicle deleted:', req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// MAINTENANCE ROUTES
// ============================================

// טיפולים של רכב
app.get('/api/maintenance/:vehicleId', (req, res) => {
    try {
        const records = db.prepare(
            'SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY service_date DESC'
        ).all(req.params.vehicleId);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// הוספת טיפול
app.post('/api/maintenance', (req, res) => {
    try {
        const {
            vehicle_id, category, description, cost, mileage,
            service_date, workshop_name, next_due_km, next_due_date, notes, image_path
        } = req.body;

        if (!vehicle_id) return res.status(400).json({ error: 'חסר מזהה רכב' });

        const info = db.prepare(`
      INSERT INTO maintenance
        (vehicle_id, category, description, cost, mileage, service_date,
         workshop_name, next_due_km, next_due_date, notes, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            vehicle_id, category || null, description || null, cost || 0, mileage || 0,
            service_date || new Date().toISOString().split('T')[0],
            workshop_name || null, next_due_km || null, next_due_date || null,
            notes || null, image_path || null
        );

        const record = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(info.lastInsertRowid);
        console.log('✅ Maintenance added for vehicle:', vehicle_id);
        res.json(record);
    } catch (error) {
        console.error('❌ Error adding maintenance:', error);
        res.status(500).json({ error: error.message });
    }
});

// עדכון טיפול
app.put('/api/maintenance/:id', (req, res) => {
    try {
        const {
            category, description, cost, mileage, service_date,
            workshop_name, next_due_km, next_due_date, notes, image_path
        } = req.body;

        db.prepare(`
      UPDATE maintenance
      SET category = ?, description = ?, cost = ?, mileage = ?, service_date = ?,
          workshop_name = ?, next_due_km = ?, next_due_date = ?, notes = ?, image_path = ?
      WHERE id = ?
    `).run(
            category, description, cost, mileage, service_date,
            workshop_name, next_due_km, next_due_date, notes, image_path, req.params.id
        );

        const updated = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(req.params.id);
        console.log('✅ Maintenance updated:', req.params.id);
        res.json(updated);
    } catch (error) {
        console.error('❌ Error updating maintenance:', error);
        res.status(500).json({ error: error.message });
    }
});

// מחיקת טיפול
app.delete('/api/maintenance/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM maintenance WHERE id = ?').run(req.params.id);
        console.log('✅ Maintenance deleted:', req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// EMAIL ROUTES
// ============================================

app.get('/api/health', (req, res) => {
    const count = db.prepare('SELECT COUNT(*) as c FROM vehicles').get();
    res.json({ status: 'OK', vehicles: count.c });
});

app.post('/api/notifications/send-email', async (req, res) => {
    try {
        const { to, subject, message } = req.body;
        if (!to || !subject || !message) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: `<div style="direction: rtl; text-align: right; font-family: Arial;">
               <h2>${subject}</h2>
               <p>${message}</p>
               <hr>
               <p style="color: #666; font-size: 12px;">מערכת ניהול רכבים 🚗</p>
             </div>`
        });

        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('❌ Email error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// START
// ============================================

app.listen(PORT, () => {
    const count = db.prepare('SELECT COUNT(*) as c FROM vehicles').get();
    console.log(`
╔════════════════════════════════════════╗
║     🚗 Car Maintenance Backend 🚗      ║
║         Server is running! ✅          ║
╚════════════════════════════════════════╝

📍 Local:     http://localhost:${PORT}
🗄️  Database:  car_maintenance.db
🚗 Vehicles:  ${count.c} רכבים בדאטהבייס
🕐 Time:      ${new Date().toLocaleTimeString('he-IL')}

Endpoints:
  GET    /api/vehicles           GET    /api/maintenance/:vehicleId
  POST   /api/vehicles           POST   /api/maintenance
  PUT    /api/vehicles/:id       PUT    /api/maintenance/:id
  DELETE /api/vehicles/:id       DELETE /api/maintenance/:id

Press Ctrl+C to stop
  `);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});