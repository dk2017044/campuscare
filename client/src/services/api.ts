import { Case, CaseMessage, Department, StaffUser, LostFoundItem, LostFoundMatch, SystemStats, AuditLog, AITriageAnalysis } from '../types';

const API_BASE = '/api';

export const api = {
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
    const res = await fetch(`${API_BASE}/cases`, {
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
    isAnonymous?: string | boolean;
    role?: string;
  } = {}): Promise<{ success: boolean; cases: Case[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.departmentId && filters.departmentId !== 'all') params.append('departmentId', filters.departmentId);
    if (filters.isAnonymous !== undefined && filters.isAnonymous !== 'all') params.append('isAnonymous', String(filters.isAnonymous));
    if (filters.role) params.append('role', filters.role);

    const res = await fetch(`${API_BASE}/cases?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch cases');
    return res.json();
  },

  async getCaseDetails(publicCaseId: string): Promise<{ success: boolean; case: Case; messages: CaseMessage[] }> {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}`);
    if (!res.ok) throw new Error('Case not found');
    return res.json();
  },

  async verifyCasePin(publicCaseId: string, pin: string): Promise<{ success: boolean; case: Case; messages: CaseMessage[] }> {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/verify-pin`, {
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

  async updateCaseStatus(publicCaseId: string, status: string, actorName = 'Staff Member', notes = ''): Promise<{ success: boolean; case: Case }> {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actorName, notes })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async assignCase(publicCaseId: string, departmentId: string, staffId?: string, staffName?: string, actorName = 'Admin'): Promise<{ success: boolean; case: Case }> {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId, staffId, staffName, actorName })
    });
    if (!res.ok) throw new Error('Failed to assign case');
    return res.json();
  },

  async escalateCase(publicCaseId: string, reason: string, actorName = 'Staff Member'): Promise<{ success: boolean; case: Case }> {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/escalate`, {
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

    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/messages?${params.toString()}`);
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
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(publicCaseId)}/messages`, {
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
    const res = await fetch(`${API_BASE}/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('AI Triage failed');
    return res.json();
  },

  async classifyMaintenance(description: string, fileName?: string, imageBase64?: string, mimeType?: string): Promise<{ success: boolean; analysis: any; disclaimer: string }> {
    const res = await fetch(`${API_BASE}/ai/classify-maintenance`, {
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
    const res = await fetch(url);
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
    const res = await fetch(`${API_BASE}/lost-found`, {
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

    const res = await fetch(`${API_BASE}/evidence/upload`, {
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
    const res = await fetch(`${API_BASE}/departments`);
    if (!res.ok) throw new Error('Failed to load departments');
    return res.json();
  },

  async createDepartment(data: { name: string; type?: string; email?: string }): Promise<{ success: boolean; department: Department }> {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create department');
    return res.json();
  },

  async deleteDepartment(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/departments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete department');
    return res.json();
  },

  // Staff & Faculty Management
  async loginStaff(data: { name: string; email: string; departmentId?: string; title?: string }): Promise<{ success: boolean; user: StaffUser }> {
    const res = await fetch(`${API_BASE}/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Staff authorization failed' }));
      throw new Error(err.error || 'Staff authorization failed');
    }
    return res.json();
  },

  async getStaff(): Promise<{ success: boolean; staff: StaffUser[] }> {
    const res = await fetch(`${API_BASE}/staff`);
    if (!res.ok) throw new Error('Failed to load staff directory');
    return res.json();
  },

  async deleteStaff(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete staff member');
    return res.json();
  },

  async getStats(): Promise<{ success: boolean; stats: SystemStats }> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to load statistics');
    return res.json();
  },

  async getAuditLogs(limit = 100): Promise<{ success: boolean; logs: AuditLog[] }> {
    const res = await fetch(`${API_BASE}/audit?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
    return res.json();
  }
};
