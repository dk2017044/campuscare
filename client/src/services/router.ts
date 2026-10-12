import { Role } from '../types';

export interface RouteResolution {
  tab: string;
  role: Role;
  params: URLSearchParams;
}

/**
 * Returns canonical URL path for a given tab and role
 */
export function getPathForTab(tab: string, userRole?: Role): string {
  switch (tab) {
    case 'student_home':
      return '/';
    case 'report_safely':
      return '/report';
    case 'emergency':
      return '/emergency';
    case 'maintenance':
      return '/services';
    case 'lost_found':
      return userRole === 'staff' ? '/staff/lost-found' : '/lost-found';
    case 'track_report':
      return '/track';
    case 'staff_dashboard':
      return '/staff';
    case 'admin_dashboard':
      return '/admin';
    case 'admin_queue':
      return '/admin/queue';
    case 'admin_analytics':
      return '/admin/analytics';
    case 'admin_departments':
      return '/admin/departments';
    case 'admin_staff':
      return '/admin/staff';
    case 'admin_audit':
      return '/admin/audit';
    default:
      if (tab.startsWith('admin_')) {
        return `/admin/${tab.replace('admin_', '')}`;
      }
      return '/';
  }
}

/**
 * Returns dynamic document page title for browser history and tab title
 */
export function getTitleForTab(tab: string): string {
  switch (tab) {
    case 'student_home':
      return 'CampusCare — Safe & Anonymous Campus Grievance Platform';
    case 'report_safely':
      return 'Confidential Report | CampusCare';
    case 'emergency':
      return 'Emergency SOS Beacon | CampusCare';
    case 'maintenance':
      return 'Campus Repairs & Maintenance | CampusCare';
    case 'lost_found':
      return 'Lost & Found Registry | CampusCare';
    case 'track_report':
      return 'Track Incident Status | CampusCare';
    case 'staff_dashboard':
      return 'Staff Incident Management | CampusCare';
    case 'admin_dashboard':
      return 'Executive Administration | CampusCare';
    case 'admin_queue':
      return 'Admin Incident Queue | CampusCare';
    case 'admin_analytics':
      return 'Campus Safety Analytics | CampusCare';
    case 'admin_departments':
      return 'Department Management | CampusCare';
    case 'admin_staff':
      return 'Staff & Faculty Accounts | CampusCare';
    case 'admin_audit':
      return 'Audit Trail Logs | CampusCare';
    default:
      return 'CampusCare — Campus Safety Platform';
  }
}

/**
 * Parses the current window.location (supporting both HTML5 pathname and hash fallback)
 * to determine the active tab, role, and query parameters.
 */
export function parseCurrentLocation(): RouteResolution {
  if (typeof window === 'undefined') {
    return { tab: 'student_home', role: 'student', params: new URLSearchParams() };
  }

  // Support both standard pathname and hash routes (e.g., #/track or #/admin)
  let rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  let searchStr = window.location.search;

  if (window.location.hash && window.location.hash.length > 1) {
    const hashClean = window.location.hash.replace(/^#\/?/, '/');
    const [hPath, hQuery] = hashClean.split('?');
    if (hPath) {
      rawPath = hPath.toLowerCase().replace(/\/$/, '') || '/';
    }
    if (hQuery) {
      searchStr = `?${hQuery}`;
    }
  }

  const params = new URLSearchParams(searchStr);
  const savedRole = (localStorage.getItem('campuscare_role') as Role) || 'student';
  const isAdminAuth = localStorage.getItem('campuscare_admin_auth') === 'true';

  // 1. Report Safely
  if (rawPath === '/report' || rawPath === '/report-safely' || rawPath === '/report_safely') {
    return { tab: 'report_safely', role: 'student', params };
  }

  // 2. Emergency SOS
  if (rawPath === '/emergency' || rawPath === '/sos' || rawPath === '/alert') {
    return { tab: 'emergency', role: 'student', params };
  }

  // 3. Maintenance / Campus Services
  if (rawPath === '/services' || rawPath === '/maintenance' || rawPath === '/repairs') {
    return { tab: 'maintenance', role: 'student', params };
  }

  // 4. Lost & Found
  if (rawPath === '/lost-found' || rawPath === '/lost_found' || rawPath === '/lostfound') {
    return { tab: 'lost_found', role: savedRole === 'staff' ? 'staff' : 'student', params };
  }

  // 5. Track Case Status
  if (rawPath === '/track' || rawPath === '/track-report' || rawPath === '/track_report' || rawPath === '/status') {
    return { tab: 'track_report', role: 'student', params };
  }

  // 6. Staff Portal
  if (rawPath === '/staff' || rawPath === '/staff/dashboard' || rawPath === '/staff-login') {
    return { tab: 'staff_dashboard', role: 'staff', params };
  }
  if (rawPath === '/staff/lost-found') {
    return { tab: 'lost_found', role: 'staff', params };
  }

  // 7. Admin Portal Sub-routes
  if (rawPath.startsWith('/admin')) {
    if (rawPath.includes('/analytics')) {
      return { tab: 'admin_analytics', role: 'super_admin', params };
    }
    if (rawPath.includes('/department')) {
      return { tab: 'admin_departments', role: 'super_admin', params };
    }
    if (rawPath.includes('/staff')) {
      return { tab: 'admin_staff', role: 'super_admin', params };
    }
    if (rawPath.includes('/audit')) {
      return { tab: 'admin_audit', role: 'super_admin', params };
    }
    if (rawPath.includes('/queue')) {
      return { tab: 'admin_queue', role: 'super_admin', params };
    }
    // Default admin root: if already authenticated go to queue, else admin login
    return { tab: isAdminAuth ? 'admin_queue' : 'admin_dashboard', role: 'super_admin', params };
  }

  // 8. Root or Home
  if (rawPath === '/' || rawPath === '/home' || rawPath === '/student_home') {
    return { tab: 'student_home', role: 'student', params };
  }

  // Fallback according to saved role
  if (savedRole === 'staff') {
    return { tab: 'staff_dashboard', role: 'staff', params };
  }
  if (savedRole === 'super_admin') {
    return { tab: isAdminAuth ? 'admin_queue' : 'admin_dashboard', role: 'super_admin', params };
  }

  return { tab: 'student_home', role: 'student', params };
}

/**
 * Pushes a new entry to the browser history stack and synchronizes the URL
 */
export function pushRoute(tab: string, userRole: Role, extraParams?: Record<string, string>) {
  if (typeof window === 'undefined') return;

  const targetPath = getPathForTab(tab, userRole);
  const url = new URL(window.location.origin + targetPath);

  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  const currentFull = window.location.pathname + window.location.search;
  const targetFull = url.pathname + url.search;
  const pageTitle = getTitleForTab(tab);
  document.title = pageTitle;

  if (currentFull !== targetFull) {
    window.history.pushState({ tab, role: userRole }, pageTitle, targetFull);
  }
}

/**
 * Replaces the current browser history entry without creating a new back-step
 */
export function replaceRoute(tab: string, userRole: Role, extraParams?: Record<string, string>) {
  if (typeof window === 'undefined') return;

  const targetPath = getPathForTab(tab, userRole);
  const url = new URL(window.location.origin + targetPath);

  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  const currentFull = window.location.pathname + window.location.search;
  const targetFull = url.pathname + url.search;
  const pageTitle = getTitleForTab(tab);
  document.title = pageTitle;

  if (currentFull !== targetFull) {
    window.history.replaceState({ tab, role: userRole }, pageTitle, targetFull);
  }
}
