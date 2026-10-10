import dotenv from 'dotenv';
dotenv.config();

/**
 * CampusCare Cloud & Supabase Anti-Pause Keep-Alive Service
 * 
 * 1. Supabase Free-Tier Auto-Pause Prevention:
 *    Supabase Free projects auto-pause after 7 days of inactivity.
 *    This service regularly pings Supabase PostgreSQL/REST endpoint 
 *    so it registers activity and NEVER pauses.
 * 
 * 2. Free Cloud Server Sleep Prevention (Render, Railway, Koyeb, Glitch):
 *    Free web instances spin down after 15 minutes of inactivity.
 *    This service self-pings the server public URL every 10 minutes to stay awake.
 */

let keepAliveState = {
  serviceStartedAt: new Date().toISOString(),
  lastSupabasePing: null,
  lastSupabaseStatus: 'idle',
  lastSupabaseMessage: null,
  supabasePingCount: 0,
  lastServerSelfPing: null,
  serverSelfPingCount: 0,
  supabaseIntervalHours: 6,
  serverSelfIntervalMinutes: 10
};

let supabaseIntervalTimer = null;
let serverSelfIntervalTimer = null;

/**
 * Ping Supabase to register database activity and prevent auto-pause
 */
export async function pingSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://pvxgbrjzjrnwkocggqen.supabase.co';
  const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_Ktw2XK5d8x7wUMYs-E38UQ_0tvSWTUV';

  if (!supabaseUrl || !supabaseKey) {
    keepAliveState.lastSupabaseStatus = 'not_configured';
    keepAliveState.lastSupabaseMessage = 'Supabase URL or Key not set in environment.';
    return { success: false, ...keepAliveState };
  }

  const now = new Date().toISOString();
  keepAliveState.lastSupabasePing = now;
  keepAliveState.supabasePingCount += 1;

  try {
    // Ping Supabase REST API endpoint
    const res = await fetch(`${supabaseUrl}/rest/v1/cases?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (res.ok || res.status === 404 || res.status === 401) {
      // Any HTTP response from the Supabase infrastructure means the project is alive and active!
      keepAliveState.lastSupabaseStatus = 'active';
      keepAliveState.lastSupabaseMessage = `Supabase responded with HTTP ${res.status}. Anti-pause heartbeat active.`;
      console.log(`[Keep-Alive 💓] Supabase pinged successfully (${res.status}). Anti-pause active.`);
      return { success: true, status: 'active', message: keepAliveState.lastSupabaseMessage };
    } else {
      keepAliveState.lastSupabaseStatus = 'warning';
      keepAliveState.lastSupabaseMessage = `Supabase returned HTTP ${res.status}: ${res.statusText}`;
      return { success: false, status: 'warning', message: keepAliveState.lastSupabaseMessage };
    }
  } catch (err) {
    const isPaused = err?.message?.includes('fetch failed') || 
                     err?.code === 'ENOTFOUND' || 
                     err?.cause?.code === 'ENOTFOUND';

    if (isPaused) {
      keepAliveState.lastSupabaseStatus = 'paused';
      keepAliveState.lastSupabaseMessage = `⚠️ Supabase project is PAUSED on Free Tier. Unpause at https://supabase.com/dashboard/project/pvxgbrjzjrnwkocggqen`;
      console.warn(`[Keep-Alive ⚠️] Supabase is PAUSED due to free tier inactivity. Please click 'Restore Project' in Supabase dashboard.`);
      return { success: false, status: 'paused', message: keepAliveState.lastSupabaseMessage };
    }

    keepAliveState.lastSupabaseStatus = 'error';
    keepAliveState.lastSupabaseMessage = `Supabase ping error: ${err.message}`;
    return { success: false, status: 'error', message: keepAliveState.lastSupabaseMessage };
  }
}

/**
 * Self-ping public server to prevent free cloud hosts (Render/Railway) from sleeping
 */
export async function pingServerSelf() {
  const publicUrl = process.env.SERVER_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (!publicUrl) {
    return { skipped: true, reason: 'No SERVER_PUBLIC_URL or RENDER_EXTERNAL_URL defined' };
  }

  const now = new Date().toISOString();
  keepAliveState.lastServerSelfPing = now;
  keepAliveState.serverSelfPingCount += 1;

  try {
    const targetUrl = publicUrl.endsWith('/') ? `${publicUrl}api/health` : `${publicUrl}/api/health`;
    const res = await fetch(targetUrl);
    console.log(`[Keep-Alive ⚡] Self-pinged server at ${targetUrl} (Status: ${res.status})`);
    return { success: true, status: res.status };
  } catch (err) {
    console.warn(`[Keep-Alive ⚠️] Server self-ping error:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Start automated recurring keep-alive timers
 */
export function startKeepAliveService() {
  console.log('🚀 Starting CampusCare Anti-Pause & Keep-Alive Service...');

  // 1. Initial Ping immediately on startup
  pingSupabase().catch(() => {});

  // 2. Schedule Supabase Anti-Pause Ping every 6 hours (Supabase pauses after 7 days)
  const supabaseIntervalMs = (process.env.SUPABASE_PING_INTERVAL_HOURS 
    ? Number(process.env.SUPABASE_PING_INTERVAL_HOURS) 
    : 6) * 60 * 60 * 1000;

  if (supabaseIntervalTimer) clearInterval(supabaseIntervalTimer);
  supabaseIntervalTimer = setInterval(() => {
    pingSupabase().catch(() => {});
  }, supabaseIntervalMs);

  // 3. Schedule Server Anti-Sleep Ping every 10 minutes (if public host URL is provided)
  const publicUrl = process.env.SERVER_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (publicUrl) {
    const serverIntervalMs = 10 * 60 * 1000; // 10 minutes
    if (serverSelfIntervalTimer) clearInterval(serverSelfIntervalTimer);
    serverSelfIntervalTimer = setInterval(() => {
      pingServerSelf().catch(() => {});
    }, serverIntervalMs);
    console.log(`⚡ Auto Server Self-Ping enabled every 10m for: ${publicUrl}`);
  }

  return keepAliveState;
}

/**
 * Get current keep-alive diagnostics
 */
export function getKeepAliveStatus() {
  return {
    ...keepAliveState,
    currentTime: new Date().toISOString(),
    isServerSelfPingActive: Boolean(process.env.SERVER_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL)
  };
}
