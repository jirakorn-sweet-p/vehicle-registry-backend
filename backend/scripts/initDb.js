// scripts/initDb.js
// รันคำสั่ง: npm run init-db
// ใช้สำหรับสร้างตารางในฐานข้อมูล Neon ครั้งแรก
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ สร้างตารางฐานข้อมูลสำเร็จ');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างตาราง:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
