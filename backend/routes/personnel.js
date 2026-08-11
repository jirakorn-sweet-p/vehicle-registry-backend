// routes/personnel.js
const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_RANKS = ['ส.ต.', 'ส.ท.', 'ส.อ.', 'จ.ส.ต.', 'จ.ส.ท.', 'จ.ส.อ.', 'ร.ต.', 'ร.ท.', 'ร.อ.'];
const VALID_VEHICLE_TYPES = ['car', 'motorcycle'];
const VALID_OWNER_TYPES = ['self', 'other'];

function validateVehicle(v, index, typeLabel) {
  const errors = [];
  if (!v.brand || !v.brand.trim()) errors.push(`${typeLabel} คันที่ ${index + 1}: กรุณากรอกยี่ห้อ`);
  if (!v.color || !v.color.trim()) errors.push(`${typeLabel} คันที่ ${index + 1}: กรุณากรอกสี`);
  if (!v.plate || !v.plate.trim()) errors.push(`${typeLabel} คันที่ ${index + 1}: กรุณากรอกทะเบียน`);
  if (!v.province || !v.province.trim()) errors.push(`${typeLabel} คันที่ ${index + 1}: กรุณากรอกจังหวัด`);
  if (!VALID_OWNER_TYPES.includes(v.ownerType)) {
    errors.push(`${typeLabel} คันที่ ${index + 1}: กรุณาระบุผู้ครอบครองรถ`);
  }
  if (v.ownerType === 'other' && (!v.ownerName || !v.ownerName.trim())) {
    errors.push(`${typeLabel} คันที่ ${index + 1}: กรุณาระบุชื่อผู้ครอบครองรถ`);
  }
  return errors;
}

// POST /api/personnel  (สาธารณะ ไม่ต้อง login) - บันทึกข้อมูลจากฟอร์ม
router.post('/', async (req, res) => {
  const {
    rank,
    firstName,
    lastName,
    unit,
    phone,
    cars = [],
    motorcycles = [],
  } = req.body || {};

  const errors = [];

  if (!VALID_RANKS.includes(rank)) errors.push('กรุณาเลือกยศให้ถูกต้อง');
  if (!firstName || !firstName.trim()) errors.push('กรุณากรอกชื่อ');
  if (!lastName || !lastName.trim()) errors.push('กรุณากรอกนามสกุล');
  if (!unit || !unit.trim()) errors.push('กรุณากรอกหน่วยสังกัด');
  if (!phone || !phone.trim()) errors.push('กรุณากรอกเบอร์โทร');
  if (!Array.isArray(cars)) errors.push('ข้อมูลรถยนต์ไม่ถูกต้อง');
  if (!Array.isArray(motorcycles)) errors.push('ข้อมูลรถจักรยานยนต์ไม่ถูกต้อง');

  if (Array.isArray(cars)) {
    cars.forEach((c, i) => errors.push(...validateVehicle(c, i, 'รถยนต์')));
  }
  if (Array.isArray(motorcycles)) {
    motorcycles.forEach((m, i) => errors.push(...validateVehicle(m, i, 'รถจักรยานยนต์')));
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: errors });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const personnelResult = await client.query(
      `INSERT INTO personnel (rank, first_name, last_name, unit, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [rank, firstName.trim(), lastName.trim(), unit.trim(), phone.trim()]
    );
    const personnelId = personnelResult.rows[0].id;
    const fullName = `${rank} ${firstName.trim()} ${lastName.trim()}`;

    const allVehicles = [
      ...cars.map((v) => ({ ...v, vehicle_type: 'car' })),
      ...motorcycles.map((v) => ({ ...v, vehicle_type: 'motorcycle' })),
    ];

    for (const v of allVehicles) {
      const ownerName = v.ownerType === 'self' ? fullName : v.ownerName.trim();
      await client.query(
        `INSERT INTO vehicles (personnel_id, vehicle_type, brand, color, plate, province, owner_type, owner_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [personnelId, v.vehicle_type, v.brand.trim(), v.color.trim(), v.plate.trim(), v.province.trim(), v.ownerType, ownerName]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'บันทึกข้อมูลสำเร็จ', id: personnelId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    client.release();
  }
});

// GET /api/personnel (ต้อง login) - ดึงรายชื่อทั้งหมดพร้อมจำนวนยานพาหนะ
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(SUM(CASE WHEN v.vehicle_type = 'car' THEN 1 ELSE 0 END), 0)::int AS car_count,
        COALESCE(SUM(CASE WHEN v.vehicle_type = 'motorcycle' THEN 1 ELSE 0 END), 0)::int AS motorcycle_count
      FROM personnel p
      LEFT JOIN vehicles v ON v.personnel_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// GET /api/personnel/:id (ต้อง login) - ดึงรายละเอียดรายบุคคลพร้อมยานพาหนะ
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const personnelResult = await pool.query('SELECT * FROM personnel WHERE id = $1', [id]);
    if (personnelResult.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }
    const vehiclesResult = await pool.query(
      'SELECT * FROM vehicles WHERE personnel_id = $1 ORDER BY vehicle_type, id',
      [id]
    );
    res.json({
      ...personnelResult.rows[0],
      vehicles: vehiclesResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// DELETE /api/personnel/:id (ต้อง login) - ลบข้อมูลรายบุคคล (และรถที่เกี่ยวข้อง)
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM personnel WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    }
    res.json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
});

module.exports = router;
