-- schema.sql
-- โครงสร้างฐานข้อมูลสำหรับระบบเก็บข้อมูลกำลังพลและยานพาหนะ

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personnel (
    id SERIAL PRIMARY KEY,
    rank VARCHAR(20) NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- vehicle_type: 'car' หรือ 'motorcycle'
-- owner_type: 'self' (เจ้าของเอง) หรือ 'other' (ผู้อื่น ระบุชื่อใน owner_name)
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle')),
    brand VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    plate VARCHAR(50) NOT NULL,
    province VARCHAR(100) NOT NULL,
    owner_type VARCHAR(10) NOT NULL CHECK (owner_type IN ('self', 'other')),
    owner_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_personnel_id ON vehicles(personnel_id);
