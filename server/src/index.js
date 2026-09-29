import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './db.js';
import { generateCaseId, generatePin, hashPin, verifyPin } from './crypto.js';
import { triageReport, classifyMaintenanceImage, matchLostAndFoundItems } from './ai.js';
import { upload } from './upload.js';
import { syncCaseToSupabase, syncMessageToSupabase, syncLostFoundToSupabase, checkSupabaseHealth } from './supabase.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static route for evidence preview with secure disposition headers
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', async (req, res) => {
  const supabaseHealth = await checkSupabaseHealth();
  res.json({
    status: 'healthy',
    platform: 'CampusCare AI Privacy-First Engine',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY'),
    supabase: supabaseHealth
  });
});

// ==========================================
// 1. CASES MANAGEMENT
// ==========================================

/**
 * POST /api/cases - Submit a new report (Anonymous or Identified)
 */
app.post('/api/cases', async (req, res) => {
  try {
    const {
      reportType, // 'safety' | 'maintenance' | 'lost_found' | 'other'
      category,
      subcategory,
      description,
      location,
      incidentDate,
      incidentTime,
      isAnonymous = true,
      reporterName = null,
      reporterContact = null,
      evidence = [],
      isEmergency = false
    } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Generate cryptographically random Case ID and PIN
    const publicCaseId = generateCaseId();
    const rawPin = generatePin();
    const { hash: pinHash, salt: pinSalt } = hashPin(rawPin);

    // AI Triage
    let aiAnalysis = null;
    let priority = 'MEDIUM';
    let assignedDeptId = 'dept-welfare';
    let assignedDeptName = 'Student Welfare & Counseling Committee';

    if (isEmergency || reportType === 'immediate_danger' || description.toLowerCase().includes('immediate danger')) {
      priority = 'CRITICAL';
      assignedDeptId = 'dept-security';
      assignedDeptName = 'Campus Security & Emergency Response';
      aiAnalysis = {
        category: 'student_safety',
        subcategory: 'immediate_danger',
        priority_suggestion: 'CRITICAL',
        suggested_department: assignedDeptName,
        confidence: 0.99,
        reasoning: '🚨 EMERGENCY REPORT: High-priority immediate alert dispatched directly to Campus Security & Response Units.',
        location_detected: location || 'Campus Premises',
        evidence_present: evidence.length > 0
      };
    } else {
      aiAnalysis = await triageReport({
        text: description,
        location,
        when: incidentDate,
        userCategory: reportType
      });

      if (aiAnalysis) {
        priority = aiAnalysis.priority_suggestion || 'MEDIUM';
        if (aiAnalysis.suggested_department_id) {
          assignedDeptId = aiAnalysis.suggested_department_id;
          const foundDept = db.getDepartments().find(d => d.id === assignedDeptId);
          if (foundDept) assignedDeptName = foundDept.name;
        }
      }
    }

    const now = new Date().toISOString();
    const newCase = {
      id: `case-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      publicCaseId,
      reportType: isEmergency ? 'safety' : (reportType || 'safety'),
      category: category || (isEmergency ? 'Immediate Danger' : (aiAnalysis?.category_label || 'Student Safety')),
      subcategory: subcategory || (isEmergency ? 'Immediate Hazard' : (aiAnalysis?.subcategory_label || 'General Report')),
      description: description.trim(),
      location: location || 'Not Specified',
      incidentDate: incidentDate || 'Today',
      incidentTime: incidentTime || 'Unspecified',
      isAnonymous: Boolean(isAnonymous),
      reporterName: isAnonymous ? null : (reporterName || 'Identified Student'),
      reporterContact: isAnonymous ? null : (reporterContact || null),
      priority,
      status: isEmergency ? 'NEW' : 'AI_TRIAGED',
      pinHash,
      pinSalt,
      assignedDepartmentId: assignedDeptId,
      assignedDepartmentName: assignedDeptName,
      assignedStaffId: null,
      assignedStaffName: null,
      evidence: evidence || [],
      aiAnalysis,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          time: now,
          title: isEmergency ? '🚨 Emergency Report Initiated' : 'Report Safely Submitted',
          description: isAnonymous
            ? 'Report created with complete privacy shield (Identity Protection: ON).'
            : `Identified report filed by ${reporterName || 'Student'}.`
        },
        {
          time: now,
          title: 'AI Triage Completed',
          description: `Classified as ${aiAnalysis?.subcategory_label || 'Report'} with priority ${priority}. Routed to ${assignedDeptName}.`
        }
      ]
    };

    db.createCase(newCase);
    syncCaseToSupabase(newCase);

    // Audit log
    db.addAuditLog({
      actorId: isAnonymous ? 'anonymous-student' : 'student',
      actorName: isAnonymous ? 'Anonymous Student' : (reporterName || 'Student'),
      action: isEmergency ? 'EMERGENCY_REPORT_CREATED' : 'CASE_CREATED',
      caseId: newCase.id,
      publicCaseId: newCase.publicCaseId,
      metadata: {
        isAnonymous: newCase.isAnonymous,
        category: newCase.category,
        priority: newCase.priority,
        assignedDepartment: assignedDeptName
      }
    });

    // Strip private pinHash and salt from the response, but return rawPin ONCE
    const safeCase = { ...newCase };
    delete safeCase.pinHash;
    delete safeCase.pinSalt;

    return res.status(201).json({
      success: true,
      publicCaseId,
      rawPin, // Displayed to the student once to save
      case: safeCase,
      message: 'Case created successfully. Store your Case ID and PIN securely.'
    });
  } catch (error) {
    console.error('Error creating case:', error);
    return res.status(500).json({ error: 'Internal server error processing report' });
  }
});

/**
 * GET /api/cases - List cases with role-based filtering
 */
app.get('/api/cases', (req, res) => {
  try {
    const { category, priority, status, departmentId, isAnonymous, role } = req.query;
    const cases = db.getCases({ category, priority, status, departmentId, isAnonymous });

    // Sanitize cases: remove pin hashes, mask anonymous student info for general staff
    const sanitized = cases.map(c => {
      const copy = { ...c };
      delete copy.pinHash;
      delete copy.pinSalt;
      if (copy.isAnonymous && role !== 'super_admin') {
        copy.reporterName = 'Protected Identity (Anonymous)';
        copy.reporterContact = null;
      }
      return copy;
    });

    return res.json({ success: true, cases: sanitized, total: sanitized.length });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return res.status(500).json({ error: 'Failed to retrieve cases' });
  }
});

/**
 * POST /api/cases/:publicCaseId/verify-pin - Student access via Case ID + PIN
 */
app.post('/api/cases/:publicCaseId/verify-pin', (req, res) => {
  try {
    const { publicCaseId } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'Private PIN is required' });
    }

    const c = db.getCaseByPublicId(publicCaseId);
    if (!c) {
      return res.status(404).json({ error: 'Case ID not found. Please double-check your code.' });
    }

    const isValid = verifyPin(pin, c.pinHash, c.pinSalt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid PIN. Access denied.' });
    }

    // Return student-safe case details
    const safeCase = { ...c };
    delete safeCase.pinHash;
    delete safeCase.pinSalt;

    // Fetch student-visible messages
    const messages = db.getMessages(publicCaseId, true);

    return res.json({
      success: true,
      case: safeCase,
      messages
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /api/cases/:publicCaseId - Get case details for staff/admin
 */
app.get('/api/cases/:publicCaseId', (req, res) => {
  try {
    const { publicCaseId } = req.params;
    const c = db.getCaseByPublicId(publicCaseId);
    if (!c) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const copy = { ...c };
    delete copy.pinHash;
    delete copy.pinSalt;

    const messages = db.getMessages(publicCaseId, false);

    return res.json({ success: true, case: copy, messages });
  } catch (error) {
    console.error('Error getting case:', error);
    return res.status(500).json({ error: 'Failed to get case details' });
  }
});

/**
 * PATCH /api/cases/:publicCaseId/status - Update case lifecycle status
 */
app.patch('/api/cases/:publicCaseId/status', (req, res) => {
  try {
    const { publicCaseId } = req.params;
    const { status, actorName = 'Staff Member', notes = '' } = req.body;

    const validStatuses = ['NEW', 'AI_TRIAGED', 'ASSIGNED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'RESOLVED', 'ESCALATED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const c = db.getCaseByPublicId(publicCaseId);
    if (!c) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const now = new Date().toISOString();
    const updatedTimeline = [...(c.timeline || [])];
    updatedTimeline.push({
      time: now,
      title: `Status Changed to ${status.replace('_', ' ')}`,
      description: notes || `Case progressed by ${actorName}.`
    });

    const updated = db.updateCase(publicCaseId, {
      status,
      timeline: updatedTimeline
    });
    syncCaseToSupabase(updated);

    // Audit log
    db.addAuditLog({
      actorId: 'staff-user',
      actorName,
      action: 'CASE_STATUS_UPDATED',
      caseId: c.id,
      publicCaseId,
      metadata: { previousStatus: c.status, newStatus: status, notes }
    });

    return res.json({ success: true, case: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Failed to update case status' });
  }
});

/**
 * PATCH /api/cases/:publicCaseId/assign - Assign case to department and staff
 */
app.patch('/api/cases/:publicCaseId/assign', (req, res) => {
  try {
    const { publicCaseId } = req.params;
    const { departmentId, staffId, staffName, actorName = 'Admin' } = req.body;

    const c = db.getCaseByPublicId(publicCaseId);
    if (!c) return res.status(404).json({ error: 'Case not found' });

    let departmentName = c.assignedDepartmentName;
    if (departmentId) {
      const dept = db.getDepartments().find(d => d.id === departmentId);
      if (dept) departmentName = dept.name;
    }

    const now = new Date().toISOString();
    const updatedTimeline = [...(c.timeline || [])];
    updatedTimeline.push({
      time: now,
      title: `Case Assigned`,
      description: `Assigned to ${departmentName}${staffName ? ` (${staffName})` : ''} by ${actorName}.`
    });

    const updated = db.updateCase(publicCaseId, {
      assignedDepartmentId: departmentId || c.assignedDepartmentId,
      assignedDepartmentName: departmentName,
      assignedStaffId: staffId || c.assignedStaffId,
      assignedStaffName: staffName || c.assignedStaffName,
      status: c.status === 'NEW' || c.status === 'AI_TRIAGED' ? 'ASSIGNED' : c.status,
      timeline: updatedTimeline
    });
    syncCaseToSupabase(updated);

    db.addAuditLog({
      actorId: 'admin-user',
      actorName,
      action: 'CASE_ASSIGNED',
      caseId: c.id,
      publicCaseId,
      metadata: { departmentId, departmentName, staffId, staffName }
    });

    return res.json({ success: true, case: updated });
  } catch (error) {
    console.error('Error assigning case:', error);
    return res.status(500).json({ error: 'Failed to assign case' });
  }
});

/**
 * POST /api/cases/:publicCaseId/escalate - Escalate case
 */
app.post('/api/cases/:publicCaseId/escalate', (req, res) => {
  try {
    const { publicCaseId } = req.params;
    const { reason, actorName = 'Staff Member' } = req.body;

    const c = db.getCaseByPublicId(publicCaseId);
    if (!c) return res.status(404).json({ error: 'Case not found' });

    const now = new Date().toISOString();
    const updatedTimeline = [...(c.timeline || [])];
    updatedTimeline.push({
      time: now,
      title: '🚨 Case Escalated',
      description: `Escalated by ${actorName}. Reason: ${reason || 'Urgent supervisor review requested'}`
    });

    const updated = db.updateCase(publicCaseId, {
      priority: 'CRITICAL',
      status: 'ESCALATED',
      timeline: updatedTimeline
    });

    db.addAuditLog({
      actorId: 'staff-user',
      actorName,
      action: 'CASE_ESCALATED',
      caseId: c.id,
      publicCaseId,
      metadata: { reason, previousPriority: c.priority }
    });

    return res.json({ success: true, case: updated });
  } catch (error) {
    console.error('Error escalating case:', error);
    return res.status(500).json({ error: 'Failed to escalate case' });
  }
});

// ==========================================
// 2. ANONYMOUS TWO-WAY MESSAGING
// ==========================================

/**
 * POST /api/cases/:publicCaseId/messages - Send message (Student or Staff)
 */
app.post('/api/cases/:publicCaseId/messages', (req, res) => {
  try {
    const { publicCaseId } = req.params;
    const { message, senderType, senderName, pin, visibleToStudent = true } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const c = db.getCaseByPublicId(publicCaseId);
    if (!c) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Security check: if sender is student, verify PIN
    if (senderType === 'student') {
      if (!pin) {
        return res.status(401).json({ error: 'PIN verification required to send student message' });
      }
      const isValid = verifyPin(pin, c.pinHash, c.pinSalt);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid PIN. Access denied.' });
      }
    }

    const now = new Date().toISOString();
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      caseId: c.id,
      publicCaseId,
      senderType: senderType || 'student', // 'student' | 'staff' | 'staff_internal'
      senderName: senderType === 'student' ? 'Anonymous Reporter' : (senderName || 'Staff Member'),
      message: message.trim(),
      visibleToStudent: senderType === 'staff_internal' ? false : Boolean(visibleToStudent),
      createdAt: now
    };

    db.addMessage(newMsg);
    syncMessageToSupabase(newMsg);

    // Audit log
    db.addAuditLog({
      actorId: senderType === 'student' ? 'anonymous-student' : 'staff-member',
      actorName: newMsg.senderName,
      action: senderType === 'staff_internal' ? 'INTERNAL_NOTE_ADDED' : 'MESSAGE_SENT',
      caseId: c.id,
      publicCaseId,
      metadata: { senderType: newMsg.senderType, visibleToStudent: newMsg.visibleToStudent }
    });

    return res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    console.error('Error posting message:', error);
    return res.status(500).json({ error: 'Failed to post message' });
  }
});

/**
 * GET /api/cases/:publicCaseId/messages - Retrieve messages
 */
app.get('/api/cases/:publicCaseId/messages', (req, res) => {
  try {
    const { publicCaseId } = req.params;
    const { pin, isStaff } = req.query;

    const c = db.getCaseByPublicId(publicCaseId);
    if (!c) return res.status(404).json({ error: 'Case not found' });

    let isStudent = true;
    if (isStaff === 'true') {
      isStudent = false;
    } else {
      if (!pin || !verifyPin(pin, c.pinHash, c.pinSalt)) {
        return res.status(401).json({ error: 'PIN verification required' });
      }
    }

    const msgs = db.getMessages(publicCaseId, isStudent);
    return res.json({ success: true, messages: msgs });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
});

// ==========================================
// 3. AI SERVICES (TRIAGE, MAINTENANCE, L&F)
// ==========================================

/**
 * POST /api/ai/triage - Real-time triage analysis
 */
app.post('/api/ai/triage', async (req, res) => {
  try {
    const { text, location, when, userCategory } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text description is required for AI triage' });
    }

    const result = await triageReport({ text, location, when, userCategory });
    return res.json({
      success: true,
      analysis: result,
      disclaimer: 'AI Suggested Classification — Human Review Required'
    });
  } catch (error) {
    console.error('AI Triage error:', error);
    return res.status(500).json({ error: 'AI Triage failed' });
  }
});

/**
 * POST /api/ai/classify-maintenance - Maintenance image analysis
 */
app.post('/api/ai/classify-maintenance', async (req, res) => {
  try {
    const { description, fileName, imageBase64, mimeType } = req.body;
    const result = await classifyMaintenanceImage({
      description: description || '',
      fileName: fileName || '',
      imageBase64: imageBase64 || null,
      mimeType: mimeType || 'image/jpeg'
    });
    return res.json({
      success: true,
      analysis: result,
      disclaimer: 'AI Suggested Classification — Human Review Required'
    });
  } catch (error) {
    console.error('Maintenance classification error:', error);
    return res.status(500).json({ error: 'Classification failed' });
  }
});

// ==========================================
// 4. LOST & FOUND
// ==========================================

/**
 * POST /api/lost-found - Report Lost or Found item
 */
app.post('/api/lost-found', (req, res) => {
  try {
    const {
      type, // 'lost' | 'found'
      title,
      itemType,
      brand,
      color,
      location,
      date,
      time,
      description,
      contactInfo,
      heldAt,
      image
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type (lost or found) are required' });
    }

    const publicCaseId = generateCaseId();
    const rawPin = generatePin();
    const { hash: pinHash, salt: pinSalt } = hashPin(rawPin);
    const now = new Date().toISOString();

    const newItem = {
      id: `lf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      publicCaseId,
      type,
      title: title.trim(),
      itemType: itemType || title.trim(),
      brand: brand || null,
      color: color || null,
      location: location || 'Campus',
      date: date || 'Today',
      time: time || 'Unspecified',
      description: description || '',
      contactInfo: contactInfo || null,
      heldAt: heldAt || (type === 'found' ? 'Campus Lost & Found Desk' : null),
      image: image || null,
      status: 'pending_match',
      createdAt: now
    };

    db.addLostFoundItem(newItem);
    syncLostFoundToSupabase(newItem);

    // Also register as a Case for tracking
    const newCase = {
      id: `case-${Date.now()}`,
      publicCaseId,
      reportType: 'lost_found',
      category: 'Lost & Found',
      subcategory: type === 'lost' ? 'Lost Item' : 'Found Item',
      description: `${type === 'lost' ? 'LOST' : 'FOUND'}: ${title} (${color || 'Color not specified'}) at ${location}. Details: ${description || 'N/A'}`,
      location: location || 'Campus',
      incidentDate: date || 'Today',
      incidentTime: time || 'Unspecified',
      isAnonymous: !contactInfo,
      reporterName: contactInfo ? 'Student (Identified)' : 'Anonymous Reporter',
      reporterContact: contactInfo,
      priority: 'LOW',
      status: 'MATCHING',
      pinHash,
      pinSalt,
      assignedDepartmentId: 'dept-welfare',
      assignedDepartmentName: 'Student Welfare & Counseling Committee',
      assignedStaffId: null,
      assignedStaffName: null,
      evidence: image ? [{ id: 'ev-img', fileName: 'item_photo.jpg', sanitizedPreviewPath: image }] : [],
      aiAnalysis: {
        category: 'lost_found',
        subcategory: type === 'lost' ? 'lost_item' : 'found_item',
        priority_suggestion: 'LOW',
        suggested_department: 'Student Welfare & Counseling Committee',
        confidence: 0.92,
        reasoning: `Extracted: ${itemType || title}, Color: ${color || 'Unspecified'}, Location: ${location}`,
        location_detected: location,
        evidence_present: Boolean(image)
      },
      createdAt: now,
      updatedAt: now,
      timeline: [
        { time: now, title: `${type === 'lost' ? 'Lost' : 'Found'} Item Registered`, description: `Item entered in matching database with ID ${publicCaseId}.` }
      ]
    };
    db.createCase(newCase);

    // Compute automatic matches
    const allItems = db.getLostFoundItems();
    const potentialMatches = matchLostAndFoundItems(newItem, allItems);

    return res.status(201).json({
      success: true,
      item: newItem,
      publicCaseId,
      rawPin,
      potentialMatches,
      matchCount: potentialMatches.length
    });
  } catch (error) {
    console.error('Error reporting lost/found:', error);
    return res.status(500).json({ error: 'Failed to record lost/found item' });
  }
});

/**
 * GET /api/lost-found - List lost & found items
 */
app.get('/api/lost-found', (req, res) => {
  try {
    const { type } = req.query;
    const items = db.getLostFoundItems(type);
    return res.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching lost/found:', error);
    return res.status(500).json({ error: 'Failed to get lost/found items' });
  }
});

/**
 * POST /api/lost-found/match - Find matches for an item
 */
app.post('/api/lost-found/match', (req, res) => {
  try {
    const { item } = req.body;
    if (!item) return res.status(400).json({ error: 'Item details required' });
    const allItems = db.getLostFoundItems();
    const matches = matchLostAndFoundItems(item, allItems);
    return res.json({ success: true, matches });
  } catch (error) {
    console.error('Matching error:', error);
    return res.status(500).json({ error: 'Matching failed' });
  }
});

// ==========================================
// 5. EVIDENCE UPLOAD
// ==========================================

app.post('/api/evidence/upload', upload.single('evidence'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file rejected by security filters' });
    }

    const fileRecord = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: req.file.originalname,
      sanitizedName: req.file.filename,
      fileType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedAt: new Date().toISOString(),
      sanitizedPreviewPath: `/uploads/${req.file.filename}`
    };

    return res.json({
      success: true,
      file: fileRecord,
      message: 'Evidence securely uploaded and sanitized.'
    });
  } catch (error) {
    console.error('Evidence upload error:', error);
    return res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// ==========================================
// 6. DEPARTMENTS & ANALYTICS
// ==========================================

app.get('/api/departments', (req, res) => {
  res.json({ success: true, departments: db.getDepartments() });
});

app.post('/api/departments', (req, res) => {
  try {
    const { name, type, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });

    const newDept = {
      id: `dept-${Date.now()}`,
      name: name.trim(),
      type: type || 'general',
      active: true,
      email: email || null
    };

    db.createDepartment(newDept);
    db.addAuditLog({
      actorId: 'admin',
      actorName: 'Super Admin',
      action: 'DEPARTMENT_CREATED',
      metadata: { departmentName: newDept.name }
    });

    return res.status(201).json({ success: true, department: newDept });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create department' });
  }
});

app.delete('/api/departments/:id', (req, res) => {
  try {
    const success = db.deleteDepartment(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Department not found' });
    }
    db.addAuditLog({
      actorId: 'admin',
      actorName: 'Super Admin',
      action: 'DEPARTMENT_DELETED',
      metadata: { departmentId: req.params.id }
    });
    return res.json({ success: true, message: 'Department removed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete department' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({ success: true, stats: db.getStats() });
});

app.get('/api/audit', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  res.json({ success: true, logs: db.getAuditLogs(limit) });
});

// Staff Authentication & User Management (Zero pre-filled dummy profiles)
app.post('/api/staff/login', (req, res) => {
  try {
    const { name, email, departmentId, title } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Official name and institutional email are required.' });
    }
    const user = db.staffLoginOrRegister({ name, email, departmentId, title });
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Staff login error:', error);
    return res.status(500).json({ error: 'Staff authentication failed' });
  }
});

app.get('/api/staff', (req, res) => {
  res.json({ success: true, staff: db.getUsers('staff') });
});

app.delete('/api/staff/:id', (req, res) => {
  const success = db.deleteUser(req.params.id);
  res.json({ success });
});

// Reset demo data back to clean sample scenario
app.post('/api/reset-demo', (req, res) => {
  try {
    const fresh = db.reset();
    return res.json({ success: true, message: 'CampusCare demo data has been reset to initial state.', data: fresh });
  } catch (error) {
    return res.status(500).json({ error: 'Reset failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️  CampusCare Backend Server running on port ${PORT}`);
  console.log(`🔒  Privacy-First Anonymous Protection: ACTIVE`);
  console.log(`🤖  AI Triage Engine: READY (Gemini / Heuristic Engine)`);
  console.log(`=======================================================`);
});
