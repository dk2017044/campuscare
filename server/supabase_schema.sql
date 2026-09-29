-- ==========================================================
-- CampusCare Supabase PostgreSQL Schema
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pvxgbrjzjrnwkocggqen/sql/new
-- ==========================================================

-- 1. Cases Table
CREATE TABLE IF NOT EXISTS public.cases (
  id TEXT PRIMARY KEY,
  public_case_id TEXT UNIQUE NOT NULL,
  report_type TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  location TEXT,
  incident_date TEXT,
  incident_time TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  reporter_name TEXT,
  reporter_contact TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'NEW',
  pin_hash TEXT,
  pin_salt TEXT,
  assigned_department_id TEXT,
  assigned_department_name TEXT,
  evidence JSONB DEFAULT '[]'::jsonb,
  ai_analysis JSONB,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Messages Table (Two-Way Anonymous Communication)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  public_case_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  visible_to_student BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  active BOOLEAN DEFAULT true,
  email TEXT
);

-- Pre-populate Campus Departments
INSERT INTO public.departments (id, name, type, active, email)
VALUES
  ('dept-security', 'Campus Security & Emergency Response', 'safety', true, 'security@campuscare.edu'),
  ('dept-welfare', 'Student Welfare & Counseling Committee', 'welfare', true, 'welfare@campuscare.edu'),
  ('dept-electrical', 'Electrical & Power Maintenance', 'maintenance', true, 'electrical@campuscare.edu'),
  ('dept-plumbing', 'Plumbing & Water Systems', 'maintenance', true, 'plumbing@campuscare.edu'),
  ('dept-civil', 'Civil & Infrastructure Maintenance', 'maintenance', true, 'civil@campuscare.edu'),
  ('dept-hostel', 'Hostel Administration', 'hostel', true, 'hostel@campuscare.edu'),
  ('dept-it-labs', 'IT Infrastructure & Labs', 'it', true, 'itlabs@campuscare.edu')
ON CONFLICT (id) DO NOTHING;

-- 4. Lost & Found Items Table
CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id TEXT PRIMARY KEY,
  public_case_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT,
  brand TEXT,
  color TEXT,
  location TEXT,
  date TEXT,
  time TEXT,
  description TEXT,
  contact_info TEXT,
  held_at TEXT,
  image TEXT,
  status TEXT DEFAULT 'pending_match',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Audit Logs Table (Tamper-Evident System Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_name TEXT,
  action TEXT NOT NULL,
  case_id TEXT,
  public_case_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  metadata JSONB
);

-- Enable Row Level Security (RLS) and public access for demo
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read cases" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert cases" ON public.cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update cases" ON public.cases FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert departments" ON public.departments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read lost_found" ON public.lost_found_items FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert lost_found" ON public.lost_found_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read audit" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert audit" ON public.audit_logs FOR INSERT WITH CHECK (true);
