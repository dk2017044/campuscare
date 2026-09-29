import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Supabase Client initialized successfully:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not found. Operating in local-first database mode.');
}

export { supabase };

/**
 * Sync Case to Supabase Cloud
 */
export async function syncCaseToSupabase(caseItem) {
  if (!supabase) return null;
  try {
    const payload = {
      id: caseItem.id,
      public_case_id: caseItem.publicCaseId,
      report_type: caseItem.reportType,
      category: caseItem.category,
      subcategory: caseItem.subcategory,
      description: caseItem.description,
      location: caseItem.location,
      incident_date: caseItem.incidentDate,
      incident_time: caseItem.incidentTime,
      is_anonymous: Boolean(caseItem.isAnonymous),
      reporter_name: caseItem.reporterName || null,
      reporter_contact: caseItem.reporterContact || null,
      priority: caseItem.priority,
      status: caseItem.status,
      pin_hash: caseItem.pinHash,
      pin_salt: caseItem.pinSalt,
      assigned_department_id: caseItem.assignedDepartmentId,
      assigned_department_name: caseItem.assignedDepartmentName,
      evidence: caseItem.evidence || [],
      ai_analysis: caseItem.aiAnalysis || null,
      timeline: caseItem.timeline || [],
      created_at: caseItem.createdAt,
      updated_at: caseItem.updatedAt
    };

    const { data, error } = await supabase.from('cases').upsert(payload);
    if (error) {
      console.warn('Supabase case sync warning (table may not be created yet):', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase syncCase error:', err.message);
    return null;
  }
}

/**
 * Sync Message to Supabase Cloud
 */
export async function syncMessageToSupabase(msg) {
  if (!supabase) return null;
  try {
    const payload = {
      id: msg.id,
      case_id: msg.caseId,
      public_case_id: msg.publicCaseId,
      sender_type: msg.senderType,
      sender_name: msg.senderName,
      message: msg.message,
      visible_to_student: Boolean(msg.visibleToStudent),
      created_at: msg.createdAt
    };

    const { data, error } = await supabase.from('messages').upsert(payload);
    if (error) {
      console.warn('Supabase message sync warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase syncMessage error:', err.message);
    return null;
  }
}

/**
 * Sync Lost & Found Item to Supabase Cloud
 */
export async function syncLostFoundToSupabase(item) {
  if (!supabase) return null;
  try {
    const payload = {
      id: item.id,
      public_case_id: item.publicCaseId,
      type: item.type,
      title: item.title,
      item_type: item.itemType,
      brand: item.brand,
      color: item.color,
      location: item.location,
      date: item.date,
      time: item.time,
      description: item.description,
      contact_info: item.contactInfo,
      held_at: item.heldAt,
      image: item.image,
      status: item.status,
      created_at: item.createdAt
    };

    const { data, error } = await supabase.from('lost_found_items').upsert(payload);
    if (error) {
      console.warn('Supabase lost & found sync warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase syncLostFound error:', err.message);
    return null;
  }
}

/**
 * Test Connection
 */
export async function checkSupabaseHealth() {
  if (!supabase) return { connected: false, message: 'Supabase client not initialized' };
  try {
    const { error } = await supabase.from('cases').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: true, tablesReady: false, message: error.message };
    }
    return { connected: true, tablesReady: true, message: 'Connected to Supabase PostgreSQL' };
  } catch (e) {
    return { connected: false, message: e.message };
  }
}
