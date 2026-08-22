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
    if (confirm('Reset demo data to initial defaults?')) {
      storage.resetAll();
      success('Workspace reset to defaults.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Theme Appearance Card */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-soft space-y-4">
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Appearance & Theme</h3>
        <p className="text-xs sm:text-sm text-foreground-muted">Choose your preferred visual atmosphere.</p>
        
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { id: 'light', label: 'Warm Light', icon: Sun },
            { id: 'dark', label: 'Midnight', icon: Moon },
            { id: 'system', label: 'System', icon: Laptop },
          ].map(opt => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id as any)}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/80 text-terracotta-700 dark:text-terracotta-300 font-semibold ring-2 ring-terracotta-500/20'
                    : 'border-border bg-surface hover:bg-surface-subtle text-foreground-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Share & Pairing Card */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Couple Invitation</h3>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Share code: <strong className="font-mono text-terracotta-600 dark:text-terracotta-400 font-bold text-base">{couple?.invite_code || 'US7788'}</strong>
          </p>
        </div>
        <Button onClick={onOpenInviteModal} variant="warm" size="md">
          <Share2 className="w-4 h-4 mr-1.5" />
          <span>Invite Partner</span>
        </Button>
      </div>

      {/* Privacy Guarantee */}
      <div className="p-6 rounded-3xl bg-surface border border-border flex items-start gap-4 text-xs sm:text-sm text-foreground-muted shadow-soft">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-foreground text-sm">Private for Two by Design</h4>
          <p className="leading-relaxed">
            Your photos, notes, and timeline are private to this couple room only. We never publish your memories on public feeds.
          </p>
        </div>
      </div>

      {/* Account Management Actions */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          onClick={handleResetData}
          variant="outline"
          size="sm"
          className="text-foreground-muted"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          <span>Reset Demo Data</span>
        </Button>

        <Button
          onClick={logout}
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Sign Out</span>
        </Button>
      </div>

    </div>
  );
};
