# 🛡️ CampusCare — AI Privacy-First Campus Safety & Grievance Platform

[![Live Demo](https://img.shields.io/badge/Demo-cmpscare.vercel.app-0066FF?style=for-the-badge&logo=vercel)](https://cmpscare.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![NodeJS Express](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **CampusCare** is a modern, zero-telemetry campus grievance management, emergency response dispatching, and facilities coordination system built for universities and colleges. It bridges students and campus administration through end-to-end anonymity, AI incident triage, cryptographic tracking PINs, and real-time emergency dispatching.

---

## 🌐 Live Deployment

Access the deployed application on Vercel:
👉 **[https://cmpscare.vercel.app](https://cmpscare.vercel.app)**

---

## ✨ Key Features & Capabilities

### 🔒 1. Cryptographic Privacy & Zero Telemetry
- **100% Anonymous Reporting:** Students can report harassment, ragging, counseling, safety concerns, or campus grievances without providing their name, email, or student roll number.
- **Salted HMAC-SHA256 Private PINs:** Submitting a report produces a unique Case ID (e.g., `CC-RSFNA3B`) and a private cryptographic PIN. Only the person holding the PIN can track progress or chat with the committee.
- **Zero Surveillance:** No tracking cookies, third-party analytics trackers, or browser fingerprinting.

### 🚨 2. Instant SOS Emergency Beacon & Synthesized Siren
- **1-Click Emergency Beacon:** Immediate alert for medical emergencies, active security threats, or acute student distress.
- **Web Audio API Dual-Tone Siren:** Synthesized emergency audio beacon and animated strobe banner alert on the officer dashboard for rapid response.
- **Auto-Escalation:** Emergency alerts automatically elevate to `CRITICAL` priority and dispatch directly to Campus Security and Emergency Officers.

### 🎙️ 3. Multilingual Voice Dictaphone (Speech-to-Text)
- Speech recognition supporting **English**, **Hindi (हिन्दी)**, and regional dialects using the Web Speech API.
- Live microphone waveform visualization and instant transcript insertion into incident reports.

### 🤖 4. AI-Powered Incident Triage (Gemini 2.5)
- Automated semantic classification of submitted grievances:
  - **Severity & Priority Assessment:** `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
  - **Intelligent Department Routing:** `Campus Security`, `Student Welfare`, `Hostel Administration`, `Civil & Infrastructure Maintenance`, `Electrical`, `Plumbing`, `IT & Labs`.
  - **Category Classification:** Detects category and subcategory with confidence scores.

### 👥 5. Dedicated Role-Based Access Portals (RBAC)

#### 🎓 Student Portal
- Anonymous grievance and safety report filing with optional image/document evidence.
- Maintenance & facilities issue reporting.
- Lost & Found item reporting and searchable database.
- Private case status tracking and two-way encrypted chat with investigating officers.

#### 👔 Staff Officer Incident Queue
- Clean, focused incident queue organized by department jurisdiction.
- Instant case filtering by status (`NEW`, `IN PROGRESS`, `RESOLVED`) and priority level.
- Encrypted officer reply thread to correspond with anonymous students without compromising identity.
- Dedicated user profile menu with self-service password updates and demo emergency SOS simulation.

#### 🛡️ Executive Administration Portal
- Protected administrative dashboard with secure authentication.
- **Staff Provisioning:** Dynamically create staff accounts, assign department scopes, and manage access credentials.
- **Department Orchestration:** Create, manage, and configure university departments.
- **Institutional Analytics:** Live breakdown of incident trends, resolution rates, and category statistics.
- **Real-Time Audit Trail:** Tamper-evident logging of all logins, status changes, and administrator actions.

### 📦 6. Dual-Layer Storage Engine
- **Local JSON Engine (`campuscare_db.json`):** Zero-configuration local database that works out of the box with automatic data persistence.
- **Supabase PostgreSQL Cloud Sync:** Real-time cloud sync with Supabase PostgreSQL tables and secure Row-Level Security (RLS) policies.

---

## 🏛️ System Architecture

```
CampusCare/
├── client/                     # Frontend Application (React 19, Vite 8, Tailwind v4, Motion)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, VoiceDictaphone, JioSkeletonLoader, Badges
│   │   ├── pages/
│   │   │   ├── student/        # StudentHome, ReportSafely, EmergencyReport,
│   │   │   │                   # MaintenanceReport, LostAndFound, TrackReport
│   │   │   ├── staff/          # StaffDashboard, StaffLogin, StaffCaseDetail
│   │   │   └── admin/          # AdminDashboard (Staff, Depts, Analytics, Audit)
│   │   ├── services/           # REST API client, Web Audio siren generator
│   │   └── types.ts            # Core TypeScript interfaces & types
│   ├── index.html              # Non-blocking web fonts & SEO metadata
│   └── vite.config.ts          # Rollup manual chunking & performance optimizations
│
├── server/                     # Backend REST API (Node.js Express, Supabase, Crypto)
│   ├── src/
│   │   ├── index.js            # Express API routes & middleware
│   │   ├── db.js               # Dual-layer database adapter (JSON + Supabase sync)
│   │   ├── supabase.js         # Supabase PostgreSQL client & table syncing
│   │   ├── ai.js               # Google Gemini AI triage & semantic classification
│   │   ├── crypto.js           # Salted HMAC-SHA256 tracking PIN generation & hashing
│   │   └── upload.js           # Sanitized multi-format file upload handler
│   ├── data/                   # Local database storage (campuscare_db.json)
│   ├── uploads/                # Sanitized user evidence attachments
│   └── supabase_schema.sql     # PostgreSQL cloud database schema & RLS policies
│
└── README.md                   # Comprehensive project documentation
```

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Next-generation declarative UI with type safety |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | High-performance build tool with manual chunk splitting |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS styling system |
| **Animations** | [Motion](https://motion.dev/) | Fluid micro-interactions and route transitions |
| **Icons** | [Lucide React](https://lucide.dev/) | Modern, clean feather-style icons |
| **Audio Engine** | Web Audio API | Client-side synthesized dual-tone emergency siren |
| **Speech Engine** | Web Speech API | Client-side multilingual speech recognition |
| **Backend API** | [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) | Fast RESTful API services |
| **Database** | Local JSON DB + [Supabase](https://supabase.com/) | Dual-mode persistence (Zero-config local + PostgreSQL cloud) |
| **AI Integration** | [Google Gemini 2.5](https://ai.google.dev/) | Semantic incident analysis and smart department triage |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/dk2017044/campuscare.git
cd campuscare
```

### 3. Install Dependencies
```bash
# Install backend server dependencies
cd server
npm install

# Install frontend client dependencies
cd ../client
npm install
```

### 4. Configure Environment Variables

#### Backend Server (`server/.env`)
Create a `.env` file in the `server/` directory:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```
*(Note: Supabase and Gemini keys are optional. If omitted, CampusCare runs in zero-config local mode using its internal engine!)*

#### Frontend Client (`client/.env.local`)
Create a `.env.local` file in the `client/` directory (optional for cloud mode):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Application

#### Start the Backend Server:
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

#### Start the Frontend Client:
In a separate terminal window:
```bash
cd client
npm run dev
# Frontend will run on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

## 🔐 Institutional Access & Role Portals

Use the role switcher in the header navigation or institutional authentication:

| Role | Portal Tab | Access Control & Security Model |
| :--- | :--- | :--- |
| **Student** | Student Portal | **Public & 100% Anonymous** — Zero credentials required |
| **Staff Officer** | Staff Portal | **Role-Based Access (RBAC)** — Staff ID & Password provisioned dynamically by Admin |
| **Administrator** | Executive Admin | **Database-Backed Authentication** — Verified securely via backend API & Database |

> 🔒 **Security Notice:** Administrative and officer authentication credentials are stored and verified securely within the institutional backend database. Plaintext secrets are never stored in client bundles or public documentation.

## 📡 Core API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/cases` | `GET` | Fetch incident cases (supports filters by status, priority, department) |
| `/api/cases` | `POST` | File a new anonymous grievance or maintenance report |
| `/api/cases/:id/verify-pin` | `POST` | Authenticate student access using Case ID and private PIN |
| `/api/cases/:id/messages` | `GET` | Retrieve encrypted message thread for an incident |
| `/api/cases/:id/messages` | `POST` | Post a message from student or investigating officer |
| `/api/cases/:id/status` | `PATCH` | Update incident status (`UNDER_REVIEW`, `RESOLVED`, etc.) |
| `/api/staff/login` | `POST` | Authenticate staff officer using Staff ID and password |
| `/api/staff/change-password` | `POST` | Self-service password update for staff officer |
| `/api/staff/create` | `POST` | Admin endpoint to create new staff officer accounts |
| `/api/departments` | `GET` / `POST` | Fetch or create campus administrative departments |
| `/api/lost-and-found` | `GET` / `POST` | Fetch or report lost and found items |
| `/api/audit-logs` | `GET` | Retrieve institutional audit trail logs |

---

## ⚡ Performance & Production Build

- **Lighthouse Score:** Non-blocking Google Fonts with system fallback fonts (`Outfit`, `Inter`).
- **Dynamic Chunking:** Large administrative views (`AdminDashboard`, `StaffDashboard`, `ReportSafely`) are dynamically loaded via `React.lazy()` and `<Suspense>`, keeping the initial bundle light and responsive.
- **Production Build:**
  ```bash
  cd client
  npm run build
  ```

---

## 📜 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute with attribution.
