# LabAssist — ระบบจัดการผู้ช่วยปฏิบัติการ

ระบบบริหารจัดการการสมัคร TA (Teaching Assistant) และ Lab Boy สำหรับภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยศิลปากร

---

## Architecture

```
labassist-frontend/   React 19 + Vite + TypeScript
labassist-backend/    Go 1.21 + Gin + GORM
database/             PostgreSQL 16
```

**Frontend:** React, React Router v6, TanStack Query v5, Zustand, Axios, @react-oauth/google

**Backend:** Gin, GORM, JWT (golang-jwt/jwt), bcrypt, Google ID Token validation

**Auth flows:**
- นักศึกษา → Google OAuth (บังคับใช้ @silpakorn.edu)
- อาจารย์ / เจ้าหน้าที่ / Admin → Username + Password → JWT Bearer token

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 หรือสูงกว่า |
| Go | 1.21 หรือสูงกว่า |
| PostgreSQL | 16 |
| Docker & Docker Compose | สำหรับ containerized run |

---

## Setup (Local Development)

### 1. Clone

```bash
git clone <repo-url>
cd TAweb-test
```

### 2. Database

```bash
psql -U postgres -c "CREATE DATABASE labassist;"
psql -U postgres -d labassist -f labassist-backend/database/migrations/schema.sql
psql -U postgres -d labassist -f labassist-backend/database/migrations/seed.sql
```

### 3. Backend

```bash
cd labassist-backend
```

สร้างไฟล์ `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=labassist
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
CLIENT_URL=http://localhost:5173
PORT=8080
```

```bash
go mod download
go run main.go
# API พร้อมใช้งานที่ http://localhost:8080
```

### 4. Frontend

```bash
cd labassist-frontend
```

สร้างไฟล์ `.env.local`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

```bash
npm install
npm run dev
# UI พร้อมใช้งานที่ http://localhost:5173
```

---

## Setup (Docker Compose)

```bash
# สร้าง .env ที่ root
cat > .env << 'EOF'
DB_USER=labassist
DB_PASSWORD=labassist123
DB_NAME=labassist
JWT_SECRET=change-me-in-production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
CLIENT_URL=http://localhost:3000
EOF

docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api/v1 |
| PostgreSQL | localhost:5432 |

---

## Google OAuth Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. สร้าง **OAuth 2.0 Client ID** → ประเภท **Web application**
3. เพิ่ม **Authorized JavaScript origins:**
   - `http://localhost:5173` (local dev)
   - `http://localhost:3000` (docker)
   - URL production ของคุณ
4. คัดลอก **Client ID** → ใส่ใน `VITE_GOOGLE_CLIENT_ID` (frontend) และ `GOOGLE_CLIENT_ID` (backend)

> ระบบบังคับให้นักศึกษาใช้อีเมล `@silpakorn.edu` เท่านั้น (ตรวจสอบใน backend `handlers/auth.go`)

---

## Default Accounts

| บทบาท | Username | Password | วิธี Login |
|--------|----------|----------|-----------|
| อาจารย์ | `somchai` | `password123` | Username/Password |
| เจ้าหน้าที่ | `parinya` | `password123` | Username/Password |
| Admin | `admin` | `password123` | Username/Password |
| นักศึกษา | — | — | Google Sign-In |

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | — | Login username/password |
| POST | `/api/v1/auth/google` | — | Login Google credential |
| GET | `/api/v1/auth/me` | JWT | ข้อมูลผู้ใช้ปัจจุบัน |
| POST | `/api/v1/auth/logout` | JWT | Logout |

### Courses
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/courses` | — | รายวิชาทั้งหมด (`?status=`, `?q=`) |
| GET | `/api/v1/courses/:id` | — | รายละเอียดวิชา |

### Student
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/student/dashboard` | student | Dashboard |
| GET | `/api/v1/student/applications` | student | ใบสมัครของฉัน |
| POST | `/api/v1/student/applications` | student | สมัคร TA/Lab Boy |
| PUT | `/api/v1/student/applications/:id/withdraw` | student | ถอนใบสมัคร |
| GET | `/api/v1/student/profile` | student | ดูโปรไฟล์ |
| PUT | `/api/v1/student/profile` | student | แก้ไขโปรไฟล์ (full_name, year, faculty) |

### Instructor
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/instructor/courses` | instructor | รายวิชาของอาจารย์ |
| POST | `/api/v1/instructor/courses` | instructor | สร้างวิชา |
| PUT | `/api/v1/instructor/courses/:id` | instructor | แก้ไขวิชา |
| PUT | `/api/v1/instructor/courses/:id/status` | instructor | เปลี่ยนสถานะวิชา |
| GET | `/api/v1/instructor/courses/:id/applicants` | instructor/staff | รายชื่อผู้สมัคร (`?role_applied=`, `?status=`, `?search=`) |
| PUT | `/api/v1/instructor/applications/:id/review` | instructor | พิจารณาใบสมัคร |
| PUT | `/api/v1/instructor/applications/bulk-review` | instructor | พิจารณาหลายใบพร้อมกัน |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/stats` | admin | สถิติภาพรวม |
| GET | `/api/v1/admin/users` | admin | รายชื่อผู้ใช้ (`?limit=`, `?offset=`, `?role=`, `?search=`) |
| POST | `/api/v1/admin/users` | admin | สร้างบัญชี |
| PUT | `/api/v1/admin/users/:id/status` | admin | เปิด/ปิดบัญชี |
| GET | `/api/v1/admin/logs` | admin | Activity logs |

---

## Project Structure

```
TAweb-test/
├── docker-compose.yml
├── README.md
├── labassist-backend/
│   ├── main.go
│   ├── Dockerfile
│   ├── config/           — Environment config
│   ├── database/
│   │   └── migrations/   — schema.sql, seed.sql
│   ├── handlers/         — HTTP handlers (auth, courses, applications, admin)
│   ├── middleware/        — Auth JWT, CORS, activity logger
│   ├── models/           — GORM models (User, Course, Application)
│   └── routes/           — Route registration
└── labassist-frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── components/
        │   ├── course/   — CourseCard
        │   ├── layout/   — AppShell, Sidebar, Topbar
        │   └── ui/       — Button, Modal, Table, Badge, Input, Select...
        ├── hooks/        — useAuth, useBreakpoint, useOnlineStatus, useToast
        ├── pages/
        │   ├── auth/     — LoginPage, AuthCallback
        │   ├── student/  — Home, Apply, Status, Profile
        │   ├── instructor/ — Home, Announce, Select
        │   ├── staff/    — Home, Docs
        │   └── admin/    — Overview, Users, Courses
        ├── router/       — AppRouter + role-based ProtectedRoute
        ├── services/     — api.ts (axios client + all API calls)
        ├── store/        — authStore (Zustand + persist)
        └── types/        — TypeScript interfaces
```

---

## Role Permissions

| หน้า | Student | Instructor | Staff | Admin |
|------|---------|-----------|-------|-------|
| Student pages | ✅ | — | — | — |
| Instructor Announce/Select | — | ✅ | ✅ | ✅ |
| Staff Docs | — | — | ✅ | ✅ |
| Admin pages | — | — | — | ✅ |
