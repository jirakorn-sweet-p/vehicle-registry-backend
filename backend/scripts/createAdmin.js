// scripts/createAdmin.js
// รันคำสั่ง: npm run seed-admin
// สร้างบัญชีผู้ดูแลระบบ (admin) โดยอ่าน username/password จาก environment variables:
//   ADMIN_USERNAME (ค่าเริ่มต้น: admin)
//   ADMIN_PASSWORD (จำเป็นต้องระบุ)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ กรุณาระบุ ADMIN_PASSWORD ใน environment variables ก่อนรันสคริปต์นี้');
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);

    if (existing.rows.length > 0) {
      await pool.query('UPDATE admins SET password_hash = $1 WHERE username = $2', [passwordHash, username]);
      console.log(`✅ อัปเดตรหัสผ่านของผู้ดูแลระบบ "${username}" เรียบร้อยแล้ว`);
    } else {
      await pool.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        [username, passwordHash]
      );
      console.log(`✅ สร้างบัญชีผู้ดูแลระบบ "${username}" เรียบร้อยแล้ว`);
    }
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
