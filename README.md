# ระบบเก็บข้อมูลกำลังพลและยานพาหนะ

ระบบประกอบด้วย 2 ส่วน แยกกัน deploy:

- **backend/** — Node.js + Express + PostgreSQL (Neon) : REST API
- **frontend/** — HTML/CSS/JS ล้วน (ไม่ต้อง build) : หน้าฟอร์ม (public) + หน้าดูข้อมูล (ต้อง login)

## โครงสร้างข้อมูล
1. ยศ (เลือกจาก ส.ต. ส.ท. ส.อ. จ.ส.ต. จ.ส.ท. จ.ส.อ. ร.ต. ร.ท. ร.อ.)
2. ชื่อ / นามสกุล / หน่วยสังกัด / เบอร์โทร
3. รถยนต์ — ระบุจำนวน แล้วกรอกยี่ห้อ/สี/ทะเบียน/จังหวัด/ผู้ครอบครอง (ตัวเอง หรือระบุชื่อผู้อื่น) ต่อคัน
4. รถจักรยานยนต์ — เช่นเดียวกับรถยนต์

หน้าฟอร์ม (`frontend/index.html`) เข้าถึงได้โดยไม่ต้อง login
หน้าดูข้อมูล (`frontend/admin/`) ต้อง login ก่อนจึงจะเห็นข้อมูล

---

## 1) ตั้งค่าฐานข้อมูล Neon

1. สมัคร/เข้าสู่ระบบที่ https://neon.tech แล้วสร้างโปรเจกต์ใหม่
2. คัดลอก **Connection String** (จะมีรูปแบบ `postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require`)
3. เก็บค่านี้ไว้ใช้เป็น `DATABASE_URL`

## 2) รันบนเครื่อง local (ทดสอบก่อน deploy)

```bash
cd backend
cp .env.example .env
# แก้ไข .env ใส่ DATABASE_URL, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD ให้เรียบร้อย

npm install
npm run init-db      # สร้างตารางในฐานข้อมูล
npm run seed-admin   # สร้างบัญชีผู้ดูแลระบบสำหรับ login
npm start             # รันเซิร์ฟเวอร์ที่ http://localhost:4000
```

เปิดไฟล์ `frontend/index.html` ด้วยเบราว์เซอร์ (หรือรันผ่าน live server ใดก็ได้)
เพื่อทดสอบหน้าฟอร์ม และ `frontend/admin/login.html` เพื่อทดสอบหน้าล็อกอิน
(ตรวจสอบว่า `frontend/assets/config.js` ชี้ไปที่ `http://localhost:4000`)

## 3) Deploy บน Render.com

### วิธีที่ 1: ใช้ Blueprint (render.yaml) — แนะนำ
1. Push โค้ดทั้งโฟลเดอร์นี้ขึ้น GitHub repository
2. เข้า Render Dashboard → **New** → **Blueprint** → เลือก repository นี้
3. Render จะอ่านไฟล์ `render.yaml` แล้วสร้าง 2 services ให้อัตโนมัติ:
   - `vehicle-registry-backend` (Web Service)
   - `vehicle-registry-frontend` (Static Site)
4. ใส่ค่า environment variables ที่ต้องกรอกเอง (`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`)
5. เมื่อ deploy backend เสร็จ ให้เปิด **Shell** ของ backend service แล้วรัน:
   ```bash
   npm run init-db
   npm run seed-admin
   ```
6. คัดลอก URL ของ backend (เช่น `https://vehicle-registry-backend.onrender.com`)
   แล้วแก้ไขไฟล์ `frontend/assets/config.js`:
   ```js
   window.API_BASE_URL = "https://vehicle-registry-backend.onrender.com";
   ```
   commit และ push อีกครั้งเพื่อให้ frontend build ใหม่
7. ตั้งค่า `CORS_ORIGIN` ใน backend service ให้เป็น URL ของ frontend
   (เช่น `https://vehicle-registry-frontend.onrender.com`) แล้ว redeploy backend

### วิธีที่ 2: สร้างทีละ Service ด้วยมือ

**Backend (Web Service):**
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`

**Frontend (Static Site):**
- Root Directory: `frontend`
- Build Command: (เว้นว่างไว้)
- Publish Directory: `.`

---

## API Endpoints (backend)

| Method | Path                    | Auth | คำอธิบาย                          |
|--------|--------------------------|------|-----------------------------------|
| POST   | /api/auth/login          | ไม่  | เข้าสู่ระบบ ได้รับ JWT token       |
| POST   | /api/personnel           | ไม่  | บันทึกข้อมูลจากฟอร์ม (public)      |
| GET    | /api/personnel           | ต้อง | ดึงรายชื่อทั้งหมด                  |
| GET    | /api/personnel/:id       | ต้อง | ดึงรายละเอียดรายบุคคล + ยานพาหนะ   |
| DELETE | /api/personnel/:id       | ต้อง | ลบข้อมูลรายบุคคล                   |

ส่ง JWT token ผ่าน header: `Authorization: Bearer <token>`

## หมายเหตุด้านความปลอดภัย
- รหัสผ่านผู้ดูแลระบบถูกเก็บแบบ hash ด้วย bcrypt เท่านั้น
- เปลี่ยน `JWT_SECRET` เป็นค่าสุ่มที่คาดเดายากก่อนใช้งานจริง
- แนะนำให้ตั้ง `CORS_ORIGIN` เป็น URL ของ frontend จริง แทนการใช้ `*` เมื่อใช้งานจริง
