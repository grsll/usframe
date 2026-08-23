// Native Browser & Device System Notification Utility

export const deviceNotification = {
  // Check if browser supports system notifications
  isSupported: (): boolean => {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  // Check current permission status
  getPermission: (): NotificationPermission => {
    if (!deviceNotification.isSupported()) return 'denied';
    return Notification.permission;
  },

  // Request user permission for native device notifications
  requestPermission: async (): Promise<boolean> => {
    if (!deviceNotification.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  },

  // Play audio chime for alerts
  playNotificationSound: () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio context might be blocked if no user interaction yet
    }
  },

  // Trigger device vibration on mobile (Android/supported browsers)
  vibrate: (pattern: number[] = [200, 100, 200]) => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  },

  // Dispatch native OS / Device notification (Works via ServiceWorker or Notification API)
  send: (title: string, options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    onClick?: () => void;
  }) => {
    // 1. Play sound & vibrate
    deviceNotification.playNotificationSound();
    deviceNotification.vibrate([300, 100, 300, 100, 300]);

    // 2. If supported and granted, trigger native device / PWA notification
    if (deviceNotification.isSupported() && Notification.permission === 'granted') {
      const notifOptions: any = {
        body: options?.body || 'Sentuhan cinta dari pasanganmu 🤍',
        icon: options?.icon || '/icon-192.png',
        badge: options?.badge || '/icon-192.png',
        tag: options?.tag || `usframe_${Date.now()}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        silent: false,
        data: options?.data || { url: '/' }
      };

      // Try Service Worker registration first (vital for Android / Mobile PWA background notifications)
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            return registration.showNotification(title, notifOptions);
          })
          .catch(() => {
            try {
              const notif = new Notification(title, notifOptions);
              if (options?.onClick) {
                notif.onclick = () => {
                  window.focus();
                  options.onClick!();
                  notif.close();
                };
              }
            } catch (err) {
              console.warn('Fallback notification error:', err);
            }
          });
      } else {
        try {
          const notif = new Notification(title, notifOptions);
          if (options?.onClick) {
            notif.onclick = () => {
              window.focus();
              options.onClick!();
              notif.close();
            };
          }
        } catch (err) {
          console.warn('Native notification error:', err);
        }
      }
    }
  }
};
