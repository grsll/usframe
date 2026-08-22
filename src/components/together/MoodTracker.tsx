import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../../lib/utils';

export const MoodTracker: React.FC = () => {
  const { user, partner, updateUser, sendHeartPulse } = useAuth();
  const { success } = useToast();

  const moods = [
    { emoji: '🥰', label: 'Missing you & smiling' },
    { emoji: '✨', label: 'Peaceful & counting days' },
    { emoji: '☕', label: 'Working hard for us' },
    { emoji: '🥺', label: 'Need a warm hug' },
    { emoji: '🌙', label: 'Thinking of you' },
    { emoji: '🎉', label: 'Super excited today' }
  ];

  const handleSelectMood = (emoji: string, label: string) => {
    updateUser({ current_mood: emoji, mood_label: label });
    playSuccessChime();
    success(`Mood updated to: ${emoji} ${label}`);
  };

  const handleSendHug = () => {
    sendHeartPulse('Sending you the warmest virtual hug right now 🫂🤍');
    playSuccessChime();
    confetti({ particleCount: 35, spread: 60 });
    success('Virtual hug sent to your partner! 🫂');
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft space-y-4 sm:space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5 sm:pb-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 shrink-0">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </span>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground">Mood & Live Presence</h3>
            <p className="text-xs text-foreground-muted">Let your partner know how your heart is feeling today.</p>
          </div>
        </div>

        <Button onClick={handleSendHug} variant="warm" size="sm" className="w-full sm:w-auto">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          <span>Send Warm Hug</span>
        </Button>
      </div>

      {/* Mood Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {moods.map((m, idx) => {
          const isSelected = user?.current_mood === m.emoji;
          return (
            <button
              key={idx}
              onClick={() => handleSelectMood(m.emoji, m.label)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
                isSelected
                  ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/60 ring-2 ring-terracotta-500/20 shadow-xs'
                  : 'border-border bg-surface hover:bg-surface-subtle text-foreground-muted hover:text-foreground'
              }`}
            >
              <span className="text-2xl sm:text-3xl mb-1.5 sm:mb-2">{m.emoji}</span>
              <span className="text-xs font-semibold text-foreground leading-snug">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Current Couple Presence Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-foreground truncate">
            <strong>{partner?.name || 'Elena'}</strong>: {partner?.current_mood} {partner?.mood_label || 'Missing you'}
          </span>
        </div>
        <span className="text-foreground-subtle">
          Location: {partner?.location_name || 'Paris, France'}
        </span>
      </div>

    </div>
  );
};
