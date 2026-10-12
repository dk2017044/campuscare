import { Case, CaseMessage, Department, StaffUser, LostFoundItem, LostFoundMatch, SystemStats, AuditLog, AITriageAnalysis } from '../types';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
    ? 'https://campuscare-api-bvyl.onrender.com/api'
    : '/api';

/**
 * Robust fetch wrapper with automatic rate-limit (429) handling,
 * network dropout detection, and admin authentication injection.
 */
async function fetchSafe(input: string, init?: RequestInit): Promise<Response> {
  const isAdmin = typeof localStorage !== 'undefined' && localStorage.getItem('campuscare_admin_auth') === 'true';
  const headers = new Headers(init?.headers || {});
  if (isAdmin && !headers.has('x-admin-auth')) {
    headers.set('x-admin-auth', 'true');
  }

  try {
    const res = await fetch(input, { ...init, headers });
    // Catch rate limit throttles (HTTP 429)
    if (res.status === 429) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Rate limit reached: Please wait a moment before trying again.');
    }

    // Detect if server or CDN returned an HTML document instead of API data
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Backend server returned an HTML page instead of JSON. The backend server might be offline or the API route is misconfigured.');
    }

    return res;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Network Offline: You appear to be disconnected from the internet. Please reconnect and try again.');
      }
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocalhost) {
        throw new Error('Local backend server is offline (port 5000 not reachable). Please start the backend server.');
      }
      throw new Error('Unable to connect to CampusCare Cloud. Please check your network connection or try again in a moment.');
    }
    throw err;
  }
}

export const api = {
  // Health & Diagnostics
  async checkHealth(): Promise<{
    status: string;
    platform?: string;
    geminiConfigured?: boolean;
    supabase?: { connected: boolean; tablesReady?: boolean; message?: string };
    keepAlive?: any;
  }> {
    const res = await fetchSafe(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },
  // Cases
  async createCase(data: {
    reportType: string;
    category?: string;
    subcategory?: string;
    description: string;
    location?: string;
    incidentDate?: string;
    incidentTime?: string;
    isAnonymous?: boolean;
    reporterName?: string | null;
    reporterContact?: string | null;
    evidence?: any[];
    isEmergency?: boolean;
  }): Promise<{ success: boolean; publicCaseId: string; rawPin: string; case: Case }> {
    const res = await fetchSafe(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create case' }));
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },

  async getCases(filters: {
    category?: string;
    priority?: string;
    status?: string;
    departmentId?: string;
    fieldScope?: string;
    isAnonymous?: string | boolean;
    role?: string;
  } = {}): Promise<{ success: boolean; cases: Case[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.departmentId && filters.departmentId !== 'all') params.append('departmentId', filters.departmentId);
    if (filters.fieldScope && filters.fieldScope !== 'all') params.append('fieldScope', filters.fieldScope);
    if (filters.isAnonymous !== undefined && filters.isAnonymous !== 'all') params.append('isAnonymous', String(filters.isAnonymous));
    if (filters.role) params.append('role', filters.role);

    const res = await fetchSafe(`${API_BASE}/cases?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch cases');
    return res.json();
  },

  async getCaseDetails(publicCaseId: string, staffDeptId?: string, role?: string): Promise<{ success: boolean; case: Case; messages: CaseMessage[] }> {
    const params = new URLSearchParams();
    if (staffDeptId) params.append('staffDeptId', staffDeptId);
    if (role) params.append('role', role);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}${qs}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Case not found' }));
      throw new Error(err.error || 'Case not found or access restricted.');
    }
    return res.json();
  },

  async verifyCasePin(publicCaseId: string, pin: string): Promise<{ success: boolean; case: Case; messages: CaseMessage[] }> {
    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid Case ID or PIN' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    return res.json();
  },

  async deleteCase(publicCaseId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete case');
    return res.json();
  },

  async updateCaseStatus(publicCaseId: string, status: string, actorName = 'Staff Member', notes = ''): Promise<{ success: boolean; case: Case }> {
    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actorName, notes })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async assignCase(publicCaseId: string, departmentId: string, staffId?: string, staffName?: string, actorName = 'Admin'): Promise<{ success: boolean; case: Case }> {
    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId, staffId, staffName, actorName })
    });
    if (!res.ok) throw new Error('Failed to assign case');
    return res.json();
  },

  async escalateCase(publicCaseId: string, reason: string, actorName = 'Staff Member'): Promise<{ success: boolean; case: Case }> {
    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, actorName })
    });
    if (!res.ok) throw new Error('Failed to escalate case');
    return res.json();
  },

  // Messages
  async getCaseMessages(publicCaseId: string, pin?: string, isStaff = false): Promise<{ success: boolean; messages: CaseMessage[] }> {
    const params = new URLSearchParams();
    if (pin) params.append('pin', pin);
    if (isStaff) params.append('isStaff', 'true');

    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/messages?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async sendCaseMessage(publicCaseId: string, data: {
    message: string;
    senderType: 'student' | 'staff' | 'staff_internal';
    senderName?: string;
    pin?: string;
    visibleToStudent?: boolean;
  }): Promise<{ success: boolean; message: CaseMessage }> {
    const res = await fetchSafe(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to send message' }));
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  // AI Services
  async requestAITriage(payload: { text: string; location?: string; when?: string; userCategory?: string }): Promise<{ success: boolean; analysis: AITriageAnalysis; disclaimer: string }> {
    const res = await fetchSafe(`${API_BASE}/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('AI Triage failed');
    return res.json();
  },

  async classifyMaintenance(description: string, fileName?: string, imageBase64?: string, mimeType?: string): Promise<{ success: boolean; analysis: any; disclaimer: string }> {
    const res = await fetchSafe(`${API_BASE}/ai/classify-maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, fileName, imageBase64, mimeType })
    });
    if (!res.ok) throw new Error('Classification failed');
    return res.json();
  },

  // Lost & Found
  async getLostFoundItems(type?: 'lost' | 'found' | 'all'): Promise<{ success: boolean; items: LostFoundItem[] }> {
    const url = type ? `${API_BASE}/lost-found?type=${type}` : `${API_BASE}/lost-found`;
    const res = await fetchSafe(url);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  async reportLostFound(item: any): Promise<{
    success: boolean;
    item: LostFoundItem;
    publicCaseId: string;
    rawPin: string;
    potentialMatches: LostFoundMatch[];
  }> {
    const res = await fetchSafe(`${API_BASE}/lost-found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to report item');
    return res.json();
  },

  // Upload
  async uploadEvidence(file: File): Promise<{ success: boolean; file: any; message: string }> {
    const formData = new FormData();
    formData.append('evidence', file);

    const res = await fetchSafe(`${API_BASE}/evidence/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload file');
    }
    return res.json();
  },

  // Departments & Stats
  async getDepartments(): Promise<{ success: boolean; departments: Department[] }> {
    const res = await fetchSafe(`${API_BASE}/departments`);
    if (!res.ok) throw new Error('Failed to load departments');
    return res.json();
  },

  async createDepartment(data: { name: string; type?: string; email?: string }): Promise<{ success: boolean; department: Department }> {
    const res = await fetchSafe(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create department');
    return res.json();
  },

  async deleteDepartment(id: string): Promise<{ success: boolean }> {
    const res = await fetchSafe(`${API_BASE}/departments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete department');
    return res.json();
  },

  // Staff & Faculty Management
  async createStaff(data: {
    name: string;
    staffId: string;
    email?: string;
    password: string;
    departmentId: string;
    fieldScope?: string;
    title: string;
  }): Promise<{ success: boolean; user: StaffUser }> {
    const res = await fetchSafe(`${API_BASE}/staff/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create staff account' }));
      throw new Error(err.error || 'Failed to create staff account');
    }
    return res.json();
  },

  async loginStaff(data: { staffId: string; password: string }): Promise<{ success: boolean; user: StaffUser }> {
    const res = await fetchSafe(`${API_BASE}/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid Staff ID or Password' }));
      throw new Error(err.error || 'Invalid Staff ID or Password');
    }
    return res.json();
  },

  async changeStaffPassword(data: { staffId: string; oldPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetchSafe(`${API_BASE}/staff/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update password' }));
      throw new Error(err.error || 'Failed to update password');
    }
    return res.json();
  },

  async loginAdmin(data: { username: string; password: string }): Promise<{ success: boolean; username: string }> {
    const res = await fetchSafe(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid Administrator credentials' }));
      throw new Error(err.error || 'Invalid Administrator credentials');
    }
    return res.json();
  },

  async changeAdminPassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetchSafe(`${API_BASE}/admin/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update administrator password' }));
      throw new Error(err.error || 'Failed to update administrator password');
    }
    return res.json();
  },

  async getStaff(): Promise<{ success: boolean; staff: StaffUser[] }> {
    const res = await fetchSafe(`${API_BASE}/staff`);
    if (!res.ok) throw new Error('Failed to load staff directory');
    return res.json();
  },

  async deleteStaff(id: string): Promise<{ success: boolean }> {
    const res = await fetchSafe(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete staff member');
    return res.json();
  },

  // 100% Free Email & Gmail Verification
  async verifyEmail(email: string): Promise<{
    isValid: boolean;
    cleanEmail?: string;
    error?: string;
    details?: {
      domain?: string;
      isGmail?: boolean;
      mxRecordsCount?: number;
      primaryServer?: string;
      warning?: string;
    };
  }> {
    const res = await fetchSafe(`${API_BASE}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async sendEmailOtp(email: string): Promise<{ success: boolean; message: string; demoOtp?: string; error?: string }> {
    const res = await fetchSafe(`${API_BASE}/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async verifyEmailOtp(email: string, otp: string): Promise<{ verified: boolean; message?: string; error?: string }> {
    const res = await fetchSafe(`${API_BASE}/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },

  async getStats(): Promise<{ success: boolean; stats: SystemStats }> {
    const res = await fetchSafe(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to load statistics');
    return res.json();
  },

  async getAuditLogs(limit = 100): Promise<{ success: boolean; logs: AuditLog[] }> {
    const res = await fetchSafe(`${API_BASE}/audit?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  }
};
