/**
 * CampusCare Browser Web Notification Service
 * Manages desktop notifications for real-time case updates, student messages, and admin new case alerts.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return Notification.permission;
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  onClick?: () => void;
}

export function sendDesktopNotification(payload: NotificationPayload): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notif = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.tag || 'campuscare-alert',
      data: payload.data
    });

    notif.onclick = () => {
      window.focus();
      if (payload.onClick) {
        payload.onClick();
      }
      notif.close();
    };

    // Auto close notification after 7 seconds
    setTimeout(() => {
      try {
        notif.close();
      } catch {
        // ignore
      }
    }, 7000);

    return notif;
  } catch (err) {
    console.warn('Desktop notification display error:', err);
    return null;
  }
}
