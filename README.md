# 🛡️ CampusCare — AI Privacy-First Campus Platform

[![Live Demo](https://img.shields.io/badge/Demo-cmpscare.vercel.app-0066FF?style=for-the-badge&logo=vercel)](https://cmpscare.vercel.app)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

An AI-powered, privacy-first grievance management and emergency response system for campuses. Zero telemetry, 100% anonymous student reports, instant SOS dispatch, and role-based staff administration.

🔗 **Live Demo:** [https://cmpscare.vercel.app](https://cmpscare.vercel.app)

---

## ⚡ Core Features

- 🔒 **100% Anonymous Reporting:** Salted HMAC-SHA256 tracking PINs. Zero telemetry, cookies, or identity logs.
- 🤖 **AI Triage (Gemini 2.5):** Auto-evaluates priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and routes to the right department.
- 🚨 **1-Click SOS Beacon:** Real-time audio siren & strobe alert on security officers' screens.
- 💬 **Private Two-Way Chat:** Anonymous student-to-officer messaging with desktop notifications and resolution confirmation.
- 🌐 **Deep-Link SPA Routing:** Canonical URLs (`/report`, `/emergency`, `/services`, `/track`, `/staff`, `/admin/audit`) with full browser Back/Forward & refresh support.
- 📜 **Tri-Category Audit Trail:** Activity categorized across Student, Staff, and Admin security contexts.
- 🎙️ **Multilingual Voice Dictaphone:** Supports English and Hindi voice dictation via Web Speech API.
- 💾 **Dual-Layer Database:** Works zero-config with local JSON storage or connects with Supabase PostgreSQL.

---

## 👥 Portals & Access

| Portal | URL Route | Access Mode |
| :--- | :--- | :--- |
| **Student** | `/`, `/report`, `/track` | Public & 100% Anonymous (No login required) |
| **Staff Officer** | `/staff` | Role-based (Staff ID & Password assigned by Admin) |
| **Executive Admin** | `/admin/queue`, `/admin/audit` | Secure database-backed administrative access |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/dk2017044/campuscare.git
cd campuscare

# Install backend & frontend dependencies
cd server && npm install
cd ../client && npm install
```

### 2. Environment Variables (Optional)
Create `server/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_key    # Optional (heuristics fallback included)
SUPABASE_URL=your_supabase_url    # Optional (local JSON storage included)
SUPABASE_KEY=your_supabase_key    # Optional
```

### 3. Run Locally
```bash
# Terminal 1 - Backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd client && npm run dev
```

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion, Lucide Icons.
- **Backend:** Node.js, Express, OWASP security middleware, Multer.
- **Storage & AI:** Local JSON DB, Supabase PostgreSQL, Google Gemini 2.5.

---

## 📜 License

MIT License © 2026 CampusCare
