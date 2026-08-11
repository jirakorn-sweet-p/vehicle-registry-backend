// db.js
// เชื่อมต่อฐานข้อมูล PostgreSQL (Neon)
require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[WARN] ไม่พบ DATABASE_URL ใน environment variables');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Neon ต้องใช้ SSL เสมอ
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
