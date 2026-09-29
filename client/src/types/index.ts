export type ReportType = 'safety' | 'maintenance' | 'lost_found' | 'other';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CaseStatus =
  | 'NEW'
  | 'AI_TRIAGED'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'ACTION_TAKEN'
  | 'RESOLVED'
  | 'ESCALATED'
  | 'MATCHING';

export type Role = 'student' | 'staff' | 'super_admin';

export interface EvidenceItem {
  id: string;
  fileName: string;
  sanitizedName?: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
  sanitizedPreviewPath: string;
}

export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
}

export interface AITriageAnalysis {
  category: string;
  category_label?: string;
  subcategory: string;
  subcategory_label?: string;
  priority_suggestion: PriorityLevel;
  suggested_department_id?: string;
  suggested_department_name: string;
  confidence: number;
  reasoning: string;
  location_detected?: string;
  evidence_needed?: boolean;
  evidence_present?: boolean;
}

export interface Case {
  id: string;
  publicCaseId: string;
  reportType: ReportType;
  category: string;
  subcategory: string;
  description: string;
  location: string;
  incidentDate: string;
  incidentTime: string;
  isAnonymous: boolean;
  reporterName?: string | null;
  reporterContact?: string | null;
  priority: PriorityLevel;
  status: CaseStatus;
  assignedDepartmentId?: string | null;
  assignedDepartmentName?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  evidence: EvidenceItem[];
  aiAnalysis?: AITriageAnalysis | null;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface CaseMessage {
  id: string;
  caseId: string;
  publicCaseId: string;
  senderType: 'student' | 'staff' | 'staff_internal';
  senderName: string;
  message: string;
  visibleToStudent: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  type: string;
  active: boolean;
  email?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'staff';
  departmentId: string;
  title: string;
  createdAt: string;
}

export interface LostFoundItem {
  id: string;
  publicCaseId?: string;
  type: 'lost' | 'found';
  title: string;
  itemType: string;
  brand?: string | null;
  color?: string | null;
  location: string;
  date: string;
  time: string;
  description: string;
  contactInfo?: string | null;
  heldAt?: string | null;
  image?: string | null;
  status: string;
  createdAt: string;
}

export interface LostFoundMatch {
  candidateItem: LostFoundItem;
  confidence: number;
  matchReasons: string[];
  isHighConfidence: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  caseId?: string;
  publicCaseId?: string;
  timestamp: string;
  metadata?: any;
}

export interface SystemStats {
  totalCases: number;
  newCases: number;
  underReview: number;
  critical: number;
  resolved: number;
  escalated: number;
  anonymousCount: number;
  identifiedCount: number;
  anonymousPercentage: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byDepartment: Record<string, number>;
  averageResolutionHours: number;
}
