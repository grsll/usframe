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

  // Dispatch native OS / Device notification
  send: (title: string, options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
    onClick?: () => void;
  }) => {
    // 1. Play sound & vibrate
    deviceNotification.playNotificationSound();
    deviceNotification.vibrate();

    // 2. If supported and granted, trigger native device notification
    if (deviceNotification.isSupported() && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: options?.body || 'Sentuhan cinta dari pasanganmu 🤍',
          icon: options?.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: options?.tag || 'usframe_pulse',
          silent: false
        });

        if (options?.onClick) {
          notif.onclick = () => {
            window.focus();
            options.onClick!();
            notif.close();
          };
        } else {
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        }
      } catch (err) {
        console.warn('Native notification dispatch error:', err);
      }
    }
  }
};
