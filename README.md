# 🛡️ CampusCare — AI Privacy-First Campus Safety & Grievance Platform

![CampusCare Banner](https://img.shields.io/badge/CampusCare-v1.0.0-blue?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)
![Vite 8](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite)
![NodeJS](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)

> **CampusCare** is a next-generation, zero-telemetry campus grievance, emergency response, and maintenance coordination platform built for modern universities and colleges. It bridges students and campus administration with end-to-end privacy, AI incident classification, cryptographic tracking PINs, and real-time emergency dispatching.

---

## ✨ Key Features

### 🔒 1. Cryptographic Privacy & Zero Telemetry
- **100% Anonymous Reporting:** Students can file sensitive reports (harassment, ragging, counseling, safety) without providing their name, email, or student ID.
- **Salted HMAC-SHA256 Secret PINs:** Every filed complaint generates a unique Case ID (e.g. `CC-RSFNA3B`) and a private cryptographic PIN. Only the student who holds the PIN can track progress or converse with the committee.
- **Zero Tracking Cookies:** No surveillance scripts, fingerprinting, or tracking cookies.

### 🚨 2. Instant SOS Emergency Siren & Strobe Dispatch
- **1-Click Emergency Beacon:** Instant dispatch for medical emergencies, active security threats, or distress.
- **Audio Synthesizer Siren:** Built-in Web Audio API dual-tone synthesized police siren and flashing red alert strobe for immediate campus staff response.
- **Auto-Escalation:** Emergency cases automatically elevate to `CRITICAL` priority and dispatch directly to Campus Security & Response Units.

### 🎙️ 3. Multilingual Speech-to-Text Dictaphone
- Voice-enabled incident reporting supporting **English**, **Hindi (हिन्दी)**, and regional language speech recognition using the Web Speech API.

### 🤖 4. AI Incident Triage (Gemini 2.5)
- Automated semantic analysis of complaints:
  - Severity & priority rating (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - Automated department routing (`Security`, `Welfare`, `Hostel Admin`, `Electrical`, `Plumbing`, `Civil`, `IT Labs`).
  - Category and subcategory classification with confidence scoring.

### 🔄 5. Live Two-Way Anonymous Chat
- Real-time communication between anonymous students and assigned committee officers.
- Officers can request clarifying details without ever exposing the reporter's true identity.

### ⚡ 6. Dual-Mode Storage: Local + Supabase Cloud
- Seamless fallback and cloud sync with Supabase PostgreSQL tables (`cases`, `messages`, `departments`, `lost_and_found`, `audit_logs`).

### 👥 7. 1-Click Institutional Role Switcher
- Instantly switch between **Student View**, **Staff / Committee Portal**, and **Super Admin Dashboard** directly from the header navigation for rapid evaluation and testing.

---

## 🏛️ System Architecture

```
CampusCare/
├── client/                     # Frontend (React 19, Vite 8, Tailwind v4, Motion)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, VoiceDictaphone, Badges
│   │   ├── pages/
│   │   │   ├── student/        # StudentHome, ReportSafely, EmergencyReport,
│   │   │   │                   # MaintenanceReport, LostAndFound, TrackReport
│   │   │   ├── staff/          # StaffDashboard, StaffCaseDetail
│   │   │   └── admin/          # AdminDashboard
│   │   ├── services/           # API clients, Web Audio siren
│   │   └── types.ts            # TypeScript interfaces
│   ├── index.html              # Asynchronous non-blocking fonts & SEO meta
│   └── vite.config.ts          # Rollup manual chunks & performance tuning
│
├── server/                     # Backend API (Node.js, Express, Supabase, Multer)
│   ├── src/
│   │   ├── index.js            # Express REST endpoints
│   │   ├── db.js               # Dual-layer database adapter
│   │   ├── supabase.js         # Supabase PostgreSQL real-time sync
│   │   ├── ai.js               # Gemini AI incident triage engine
│   │   ├── crypto.js           # Salted HMAC-SHA256 verification
│   │   └── upload.js           # Sanitized multi-format file uploads
│   ├── data/                   # Local database storage (fallback)
│   ├── uploads/                # Sanitized user evidence (excluded from git)
│   └── supabase_schema.sql     # PostgreSQL cloud schema & RLS policies
│
└── package.json                # Root orchestrator scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/dk2017044/campuscare.git
cd campuscare
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 4. Configure Environment Variables

Create `.env` in `server/`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://pvxgbrjzjrnwkocggqen.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

Create `.env.local` in `client/`:
```env
VITE_SUPABASE_URL=https://pvxgbrjzjrnwkocggqen.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Application

In one terminal (Backend Server):
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

In another terminal (Frontend Client):
```bash
cd client
npm run dev
# Client will run on http://localhost:5173
```

---

## 🗄️ Database Setup (Supabase)

To enable cloud persistence and real-time syncing:
1. Open your project at [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor**.
3. Copy and run the SQL script located in:
   ```
   server/supabase_schema.sql
   ```
4. This will create:
   - `public.cases`
   - `public.messages`
   - `public.departments`
   - `public.lost_and_found`
   - `public.audit_logs`

---

## ⚡ Performance & Optimization
- **Lighthouse Optimized:** Asynchronous non-blocking Google Fonts with instant system font fallback.
- **Dynamic Micro-Chunking:** Secondary views (Staff Portal, Admin Portal, Emergency Form) are lazy-loaded via `React.lazy()` and `<Suspense>`, keeping the initial bundle to only ~52 kB.

---

## 📜 License
This project is licensed under the MIT License.
