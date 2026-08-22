import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { calculateRelationshipDuration } from '../../lib/utils';
import { Sparkles, Heart, MapPin, Smile } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const CoupleHeader: React.FC = () => {
  const { user, partner, couple, updateUser } = useAuth();
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const duration = calculateRelationshipDuration(couple?.relationship_start_date || '2025-06-10');

  const moods = [
    { emoji: '🥰', label: 'Missing you' },
    { emoji: '✨', label: 'Peaceful' },
    { emoji: '☕', label: 'Working hard' },
    { emoji: '🥺', label: 'Need a hug' },
    { emoji: '🌙', label: 'Thinking of you' },
    { emoji: '🎉', label: 'Excited' },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-surface border border-border p-4 sm:p-8 shadow-soft grain-overlay">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        
        {/* Couple Avatars & Editorial Names */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left w-full sm:w-auto">
          
          {/* Linked Circular Avatars with Heart Badge */}
          <div className="relative flex items-center shrink-0">
            <div className="relative group">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                alt={user?.name || 'You'}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-3 sm:border-4 border-surface shadow-medium ring-2 ring-terracotta-500/30"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] sm:text-xs shadow-sm">
                {user?.current_mood || '😊'}
              </span>
            </div>

            {/* Connecting Heart Emblem */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 -mx-2.5 sm:-mx-3 z-10 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-md border-2 border-surface animate-pulse-subtle">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>

            <div className="relative group">
              <img
                src={partner?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300'}
                alt={partner?.name || 'Partner'}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-3 sm:border-4 border-surface shadow-medium ring-2 ring-terracotta-500/30"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] sm:text-xs shadow-sm">
                {partner?.current_mood || '🥰'}
              </span>
            </div>
          </div>

          {/* Names & Locations */}
          <div className="space-y-1 sm:space-y-1.5 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <h1 className="font-serif text-xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {user?.name || 'Kai'} <span className="text-terracotta-500 font-sans font-light">×</span> {partner?.name || 'Elena'}
              </h1>
              <Badge variant="terracotta" size="sm">
                <Sparkles className="w-3 h-3 text-terracotta-500" />
                <span>Our Space</span>
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-foreground-muted">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                {couple?.user_city || 'Tokyo'} ⇄ {couple?.partner_city || 'Paris'}
              </span>
              <span>•</span>
              <span>Since {new Date(couple?.relationship_start_date || '2025-06-10').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {/* Quick Mood Status Preview */}
            <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowMoodPicker(!showMoodPicker)}
                className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-surface-subtle hover:bg-surface border border-border text-foreground-muted hover:text-foreground transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Smile className="w-3.5 h-3.5 text-terracotta-500" />
                <span>You: <b>{user?.mood_label || 'Happy'}</b></span>
              </button>

              <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                {partner?.name || 'Elena'}: <b>{partner?.mood_label || 'Missing you'}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Duration Counter Widget */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-end justify-center bg-surface-subtle/80 border border-border rounded-2xl p-4 sm:p-5 text-center md:text-right">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle mb-0.5">
            Time Together
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-terracotta-600 dark:text-terracotta-400">
            {duration.totalDays.toLocaleString()} Days
          </div>
          <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5">
            {duration.formattedString}
          </p>
        </div>

      </div>

      {/* Mood Picker Dropdown / Bar */}
      {showMoodPicker && (
        <div className="mt-4 pt-3.5 border-t border-border flex flex-wrap items-center gap-1.5 sm:gap-2 animate-fade-in">
          <span className="text-xs font-semibold text-foreground-muted w-full sm:w-auto mr-1">Update your mood:</span>
          {moods.map((m, idx) => (
            <button
              key={idx}
              onClick={() => {
                updateUser({ current_mood: m.emoji, mood_label: m.label });
                setShowMoodPicker(false);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-terracotta-50 dark:hover:bg-terracotta-950/60 border border-border hover:border-terracotta-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            >
              <span>{m.emoji}</span>
              <span className="text-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
