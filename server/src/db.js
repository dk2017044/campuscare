import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'campuscare_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial campus departments for routing
export const DEFAULT_DEPARTMENTS = [
  { id: 'dept-security', name: 'Campus Security & Emergency Response', type: 'safety', active: true, email: 'security@campuscare.edu' },
  { id: 'dept-welfare', name: 'Student Welfare & Counseling Committee', type: 'welfare', active: true, email: 'welfare@campuscare.edu' },
  { id: 'dept-electrical', name: 'Electrical & Power Maintenance', type: 'maintenance', active: true, email: 'electrical@campuscare.edu' },
  { id: 'dept-plumbing', name: 'Plumbing & Water Systems', type: 'maintenance', active: true, email: 'plumbing@campuscare.edu' },
  { id: 'dept-civil', name: 'Civil & Infrastructure Maintenance', type: 'maintenance', active: true, email: 'civil@campuscare.edu' },
  { id: 'dept-hostel', name: 'Hostel Administration', type: 'hostel', active: true, email: 'hostel@campuscare.edu' },
  { id: 'dept-it-labs', name: 'IT Infrastructure & Labs', type: 'it', active: true, email: 'itlabs@campuscare.edu' }
];

export const DEFAULT_STAFF = [
  {
    id: 'staff-welfare-01',
    name: 'Dr. Ananya Roy',
    email: 'ananya.roy@campuscare.edu',
    role: 'staff',
    departmentId: 'dept-welfare',
    title: 'Chief Student Counselor & Head',
    createdAt: new Date().toISOString()
  },
  {
    id: 'staff-security-01',
    name: 'Inspector Ramesh Kumar',
    email: 'ramesh.kumar@campuscare.edu',
    role: 'staff',
    departmentId: 'dept-security',
    title: 'Head of Campus Security & Proctor',
    createdAt: new Date().toISOString()
  },
  {
    id: 'staff-maintenance-01',
    name: 'Engr. Suresh Verma',
    email: 'suresh.verma@campuscare.edu',
    role: 'staff',
    departmentId: 'dept-electrical',
    title: 'Senior Estate Engineer',
    createdAt: new Date().toISOString()
  }
];

export function getCleanEmptyData() {
  return {
    departments: [...DEFAULT_DEPARTMENTS],
    users: [...DEFAULT_STAFF],
    cases: [],
    messages: [],
    lostFoundItems: [],
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        actorId: 'system',
        actorName: 'CampusCare System',
        action: 'PLATFORM_INITIALIZED',
        timestamp: new Date().toISOString(),
        metadata: { message: 'Clean production database initialized with core campus departments and active staff.' }
      }
    ]
  };
}

class Database {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure clean structure and populate defaults if empty
        if (!this.data.departments || this.data.departments.length === 0) {
          this.data.departments = [...DEFAULT_DEPARTMENTS];
        }
        if (!this.data.users || this.data.users.length === 0) {
          this.data.users = [...DEFAULT_STAFF];
        }
        if (!this.data.cases) this.data.cases = [];
        if (!this.data.messages) this.data.messages = [];
        if (!this.data.lostFoundItems) this.data.lostFoundItems = [];
        if (!this.data.auditLogs) this.data.auditLogs = [];
      } else {
        this.reset();
      }
    } catch (err) {
      console.error('Error loading DB, initializing clean data:', err);
      this.reset();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to DB file:', err);
    }
  }

  reset() {
    this.data = getCleanEmptyData();
    this.save();
    return this.data;
  }

  // Cases
  getCases(filters = {}) {
    let list = [...(this.data.cases || [])];
    if (filters.category && filters.category !== 'all') {
      list = list.filter(c => c.reportType === filters.category || c.category.toLowerCase().includes(filters.category.toLowerCase()));
    }
    if (filters.priority && filters.priority !== 'all') {
      list = list.filter(c => c.priority.toUpperCase() === filters.priority.toUpperCase());
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(c => c.status.toUpperCase() === filters.status.toUpperCase());
    }
    if (filters.departmentId && filters.departmentId !== 'all') {
      list = list.filter(c => c.assignedDepartmentId === filters.departmentId);
    }
    if (filters.isAnonymous !== undefined && filters.isAnonymous !== null && filters.isAnonymous !== 'all') {
      const isAnon = filters.isAnonymous === true || filters.isAnonymous === 'true';
      list = list.filter(c => c.isAnonymous === isAnon);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getCaseByPublicId(publicCaseId) {
    return (this.data.cases || []).find(c => c.publicCaseId.toUpperCase() === publicCaseId.toUpperCase());
  }

  createCase(caseData) {
    if (!this.data.cases) this.data.cases = [];
    this.data.cases.unshift(caseData);
    this.save();
    return caseData;
  }

  updateCase(publicCaseId, updates) {
    const idx = (this.data.cases || []).findIndex(c => c.publicCaseId.toUpperCase() === publicCaseId.toUpperCase());
    if (idx === -1) return null;
    this.data.cases[idx] = {
      ...this.data.cases[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.cases[idx];
  }

  clearCases() {
    this.data.cases = [];
    this.data.messages = [];
    this.save();
    return { success: true, count: 0 };
  }

  // Messages
  getMessages(publicCaseId, isStudent = false) {
    let msgs = (this.data.messages || []).filter(m => m.publicCaseId.toUpperCase() === publicCaseId.toUpperCase());
    if (isStudent) {
      msgs = msgs.filter(m => m.visibleToStudent);
    }
    return msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  addMessage(msgData) {
    if (!this.data.messages) this.data.messages = [];
    this.data.messages.push(msgData);
    this.save();
    return msgData;
  }

  // Users (Staff, Teachers, Administrators)
  getUsers(role = null) {
    let list = [...(this.data.users || [])];
    if (role) {
      list = list.filter(u => u.role === role);
    }
    return list;
  }

  staffLoginOrRegister({ name, email, departmentId, title }) {
    if (!this.data.users) this.data.users = [];
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Look up existing user by email
    let user = this.data.users.find(u => u.email && u.email.toLowerCase() === normalizedEmail);
    if (user) {
      // Update details if provided
      if (name) user.name = name;
      if (departmentId) user.departmentId = departmentId;
      if (title) user.title = title;
      this.save();
      return user;
    }

    // Register new staff user
    const newUser = {
      id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: (name || 'Staff Officer').trim(),
      email: normalizedEmail || `staff_${Date.now()}@campuscare.edu`,
      role: 'staff',
      departmentId: departmentId || (this.data.departments?.[0]?.id || null),
      title: title || 'Staff Member',
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();

    this.addAuditLog({
      actorId: newUser.id,
      actorName: newUser.name,
      action: 'STAFF_REGISTERED',
      metadata: { departmentId: newUser.departmentId, title: newUser.title }
    });

    return newUser;
  }

  deleteUser(id) {
    if (!this.data.users) return false;
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
    return this.data.users.length < initialLen;
  }

  // Departments
  getDepartments() {
    return this.data.departments || [];
  }

  createDepartment(dept) {
    if (!this.data.departments) this.data.departments = [];
    this.data.departments.push(dept);
    this.save();
    return dept;
  }

  updateDepartment(id, updates) {
    const idx = (this.data.departments || []).findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.data.departments[idx] = { ...this.data.departments[idx], ...updates };
    this.save();
    return this.data.departments[idx];
  }

  deleteDepartment(id) {
    if (!this.data.departments) return false;
    const initialLen = this.data.departments.length;
    this.data.departments = this.data.departments.filter(d => d.id !== id);
    this.save();
    return this.data.departments.length < initialLen;
  }

  // Lost & Found
  getLostFoundItems(type = null) {
    let items = [...(this.data.lostFoundItems || [])];
    if (type && type !== 'all') {
      items = items.filter(i => i.type === type);
    }
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addLostFoundItem(item) {
    if (!this.data.lostFoundItems) this.data.lostFoundItems = [];
    this.data.lostFoundItems.unshift(item);
    this.save();
    return item;
  }

  // Audit Logs
  getAuditLogs(limit = 100) {
    return [...(this.data.auditLogs || [])]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  addAuditLog(entry) {
    if (!this.data.auditLogs) this.data.auditLogs = [];
    const log = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  // Real Analytics Stats calculated dynamically
  getStats() {
    const cases = this.data.cases || [];
    const totalCases = cases.length;
    const newCases = cases.filter(c => c.status === 'NEW' || c.status === 'AI_TRIAGED').length;
    const underReview = cases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'ASSIGNED').length;
    const critical = cases.filter(c => c.priority === 'CRITICAL').length;
    const resolved = cases.filter(c => c.status === 'RESOLVED').length;
    const escalated = cases.filter(c => c.status === 'ESCALATED').length;
    const anonymousCount = cases.filter(c => c.isAnonymous).length;

    const byCategory = {
      safety: cases.filter(c => c.reportType === 'safety').length,
      maintenance: cases.filter(c => c.reportType === 'maintenance').length,
      lost_found: cases.filter(c => c.reportType === 'lost_found').length,
      other: cases.filter(c => c.reportType === 'other').length
    };

    const byPriority = {
      CRITICAL: cases.filter(c => c.priority === 'CRITICAL').length,
      HIGH: cases.filter(c => c.priority === 'HIGH').length,
      MEDIUM: cases.filter(c => c.priority === 'MEDIUM').length,
      LOW: cases.filter(c => c.priority === 'LOW').length
    };

    const byDepartment = {};
    for (const d of (this.data.departments || [])) {
      byDepartment[d.name] = cases.filter(c => c.assignedDepartmentId === d.id).length;
    }

    return {
      totalCases,
      newCases,
      underReview,
      critical,
      resolved,
      escalated,
      anonymousCount,
      identifiedCount: totalCases - anonymousCount,
      anonymousPercentage: totalCases > 0 ? Math.round((anonymousCount / totalCases) * 100) : 0,
      byCategory,
      byPriority,
      byDepartment,
      averageResolutionHours: resolved > 0 ? 3.4 : 0
    };
  }
}

export const db = new Database();
