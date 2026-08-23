import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Sun, Moon, Laptop, Heart, Globe, UserPlus, MessageCircleHeart } from 'lucide-react';
import { HeartPulseModal } from '../home/HeartPulseModal';
import { generateInitialsAvatar } from '../../lib/utils';

export const Header: React.FC = () => {
  const { user, partner, couple, setCurrentView } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isPulseModalOpen, setIsPulseModalOpen] = useState(false);

  const isPending = !partner || couple?.status === 'pending';
  const userAvatar = user?.avatar || generateInitialsAvatar(user?.name || 'Kamu');
  const partnerAvatar = partner?.avatar || (partner?.name ? generateInitialsAvatar(partner.name) : '');

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background/90 backdrop-blur-md border-b border-border transition-colors pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
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
                {couple?.couple_name || (user?.name ? `Ruang ${user.name}` : 'US')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-foreground-subtle flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
                {isPending ? 'Menunggu Pasangan' : 'Dua Terhubung'}
              </span>
            </div>
          </button>

          {/* City distance badge */}
          {couple && !isPending && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-border text-[11px] text-foreground-muted">
              <Globe className="w-3.5 h-3.5 text-terracotta-500" />
              <span>{couple.user_city || 'Jakarta'}</span>
              <span className="text-foreground-subtle">⇄</span>
              <span>{couple.partner_city || 'Kota Pasangan'}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* I Miss You Pulse & Message Button */}
          <button
            onClick={() => setIsPulseModalOpen(true)}
            title="Kirim pesan rindu & lihat riwayat sinyal cinta"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-terracotta-50 dark:bg-terracotta-950/60 border-terracotta-200/80 dark:border-terracotta-800/80 text-terracotta-700 dark:text-terracotta-300 hover:bg-terracotta-100 dark:hover:bg-terracotta-900/60 active:scale-95 shadow-2xs"
          >
            <Heart className="w-3.5 h-3.5 text-terracotta-500 fill-current" />
            <span className="text-[11px] sm:text-xs">Aku Kangen 🤍</span>
          </button>

          {/* Theme Selector */}
          <button
            onClick={cycleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-subtle border border-transparent hover:border-border transition-colors cursor-pointer"
            title={`Tema: ${theme}`}
            aria-label="Ganti tema"
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
            title="Pengaturan Profil & Pasangan"
          >
            <div className="flex -space-x-1.5 sm:-space-x-2">
              <img
                src={userAvatar}
                alt={user?.name || 'Kamu'}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-background ring-1 ring-border bg-surface"
              />
              {isPending ? (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-dashed border-terracotta-400 bg-terracotta-50 dark:bg-terracotta-950 flex items-center justify-center text-terracotta-600 text-[10px]">
                  <UserPlus className="w-3 h-3" />
                </div>
              ) : (
                <img
                  src={partnerAvatar}
                  alt={partner?.name || 'Pasangan'}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-background ring-1 ring-border bg-surface"
                />
              )}
            </div>
            <span className="text-xs font-medium text-foreground hidden sm:inline">
              {user?.name || 'Kamu'} {isPending ? '(Menunggu Pasangan)' : `& ${partner?.name}`}
            </span>
          </button>
        </div>

      </div>

      {/* Heart Pulse & Love Message History Modal */}
      <HeartPulseModal
        isOpen={isPulseModalOpen}
        onClose={() => setIsPulseModalOpen(false)}
      />
    </header>
  );
};

