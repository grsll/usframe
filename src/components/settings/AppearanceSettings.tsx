import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sun, Moon, Laptop, LogOut, RotateCcw, ShieldCheck, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { storage } from '../../lib/storage';

interface AppearanceSettingsProps {
  onOpenInviteModal: () => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ onOpenInviteModal }) => {
  const { theme, setTheme } = useTheme();
  const { logout, couple } = useAuth();
  const { success } = useToast();

  const handleResetData = () => {
    if (confirm('Kembalikan data demo ke setelan awal?')) {
      storage.resetAll();
      success('Data ruang pasangan dikembalikan ke setelan awal.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Theme Appearance Card */}
      <div className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft space-y-3.5 sm:space-y-4">
        <h3 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">Tampilan & Tema</h3>
        <p className="text-xs sm:text-sm text-foreground-muted">Pilih suasana visual yang paling nyaman untuk kalian berdua.</p>
        
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
          {[
            { id: 'light', label: 'Terang', icon: Sun },
            { id: 'dark', label: 'Gelap', icon: Moon },
            { id: 'system', label: 'Sistem', icon: Laptop },
          ].map(opt => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id as any)}
                className={`p-3 sm:p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/80 text-terracotta-700 dark:text-terracotta-300 font-semibold ring-2 ring-terracotta-500/20'
                    : 'border-border bg-surface hover:bg-surface-subtle text-foreground-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Share & Pairing Card */}
      <div className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h3 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">Undangan Pasangan</h3>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Kode ruangan: <strong className="font-mono text-terracotta-600 dark:text-terracotta-400 font-bold text-base">{couple?.invite_code || 'US7788'}</strong>
          </p>
        </div>
        <Button onClick={onOpenInviteModal} variant="warm" size="md" className="w-full sm:w-auto">
          <Share2 className="w-4 h-4 mr-1.5" />
          <span>Undang Pasangan</span>
        </Button>
      </div>

      {/* Privacy Guarantee */}
      <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border flex items-start gap-3 sm:gap-4 text-xs sm:text-sm text-foreground-muted shadow-soft">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-foreground text-sm">Privat Khusus Berdua Sejak Awal</h4>
          <p className="leading-relaxed">
            Foto, surat cinta, dan lini masa kalian 100% privat hanya untuk ruangan ini. Kami tidak pernah mempublikasikan kenangan kalian ke publik.
          </p>
        </div>
      </div>

      {/* Account Management Actions */}
      <div className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          onClick={handleResetData}
          variant="outline"
          size="sm"
          className="text-foreground-muted w-full sm:w-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          <span>Reset Data Demo</span>
        </Button>

        <Button
          onClick={logout}
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 w-full sm:w-auto"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Keluar Akun</span>
        </Button>
      </div>

    </div>
  );
};
