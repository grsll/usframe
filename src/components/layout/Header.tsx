import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Sun, Moon, Laptop, Heart, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../../lib/utils';

export const Header: React.FC = () => {
  const { user, partner, couple, sendHeartPulse, setCurrentView } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success } = useToast();
  const [pulseSending, setPulseSending] = useState(false);

  const handlePulse = () => {
    setPulseSending(true);
    sendHeartPulse();
    playSuccessChime();
    
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.1, x: 0.8 },
      colors: ['#D95D39', '#F472B6', '#FDA4AF']
    });

    success(`Heartbeat signal sent to ${partner?.name || 'your partner'} 🤍`);
    setTimeout(() => setPulseSending(false), 2000);
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background/85 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Couple Identity */}
        <div className="flex items-center gap-2 sm:gap-4 truncate">
          <button 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-left group cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center font-serif text-base sm:text-lg font-bold shadow-sm group-hover:bg-terracotta-600 transition-colors">
              US
            </div>
            <div className="hidden xs:block truncate">
              <span className="font-serif font-semibold text-foreground text-sm sm:text-base tracking-tight block truncate">
                {couple?.couple_name || 'US'}
              </span>
              <span className="text-[10px] sm:text-[11px] text-foreground-subtle flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>
          </button>

          {/* City distance badge */}
          {couple && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-border text-[11px] text-foreground-muted">
              <Globe className="w-3.5 h-3.5 text-terracotta-500" />
              <span>{couple.user_city || 'Tokyo'}</span>
              <span className="text-foreground-subtle">⇄</span>
              <span>{couple.partner_city || 'Paris'}</span>
              <span className="text-foreground-subtle">({couple.distance_km?.toLocaleString() || '9,710'} km)</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* I Miss You Pulse Button */}
          <button
            onClick={handlePulse}
            disabled={pulseSending}
            title="Send gentle heartbeat pulse to partner"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              pulseSending
                ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 text-rose-700 animate-pulse-subtle'
                : 'bg-terracotta-50 dark:bg-terracotta-950/60 border-terracotta-200/80 dark:border-terracotta-800/80 text-terracotta-700 dark:text-terracotta-300 hover:bg-terracotta-100 active:scale-95'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 text-terracotta-500 fill-current ${pulseSending ? 'animate-bounce' : ''}`} />
            <span className="text-[11px] sm:text-xs">{pulseSending ? 'Sent! 🤍' : 'I Miss You'}</span>
          </button>

          {/* Theme Selector */}
          <button
            onClick={cycleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-subtle border border-transparent hover:border-border transition-colors cursor-pointer"
            title={`Theme: ${theme}`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Laptop className="w-4 h-4" />
            )}
          </button>

          {/* Partner & User Micro Avatars */}
          <button
            onClick={() => setCurrentView('settings')}
            className="flex items-center gap-1.5 pl-1 pr-1.5 sm:pr-2 py-1 rounded-full bg-surface-subtle hover:bg-surface border border-border transition-all cursor-pointer"
            title="Couple & Profile Settings"
          >
            <div className="flex -space-x-1.5 sm:-space-x-2">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.name || 'You'}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-background ring-1 ring-border"
              />
              <img
                src={partner?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100'}
                alt={partner?.name || 'Partner'}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-background ring-1 ring-border"
              />
            </div>
            <span className="text-xs font-medium text-foreground hidden sm:inline">
              {user?.name || 'You'} & {partner?.name || 'Elena'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
