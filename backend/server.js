// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const personnelRoutes = require('./routes/personnel');

const app = express();
const PORT = process.env.PORT || 4000;

// อนุญาต origin ตามที่กำหนดใน env (คั่นด้วยจุลภาคได้หลายค่า) หรือ * ถ้าไม่ระบุ
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'vehicle-registry-backend' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/personnel', personnelRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'ไม่พบเส้นทางที่ร้องขอ' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
