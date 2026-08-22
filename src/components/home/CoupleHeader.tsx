import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { calculateRelationshipDuration, generateInitialsAvatar } from '../../lib/utils';
import { Sparkles, Heart, MapPin, Smile, UserPlus, Copy, Check, Share2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CoupleShareModal } from '../settings/CoupleShareModal';
import { useToast } from '../../context/ToastContext';

export const CoupleHeader: React.FC = () => {
  const { user, partner, couple, updateUser } = useAuth();
  const { success } = useToast();
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const duration = calculateRelationshipDuration(couple?.relationship_start_date || new Date().toISOString());
  const isPending = !partner || couple?.status === 'pending';
  const inviteCode = couple?.invite_code || 'US7788';

  const userAvatar = user?.avatar || generateInitialsAvatar(user?.name || 'Kamu');
  const partnerAvatar = partner?.avatar || (partner?.name ? generateInitialsAvatar(partner.name) : '');

  const moods = [
    { emoji: '🥰', label: 'Sedang rindu & tersenyum' },
    { emoji: '✨', label: 'Tenang & menghitung hari' },
    { emoji: '☕', label: 'Semangat kerja untuk kita' },
    { emoji: '🥺', label: 'Butuh pelukan hangat' },
    { emoji: '🌙', label: 'Kepikiran kamu malam ini' },
    { emoji: '🎉', label: 'Lagi senang banget hari ini' },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    success(`Kode undangan "${inviteCode}" berhasil disalin!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-surface border border-border p-4 sm:p-8 shadow-soft grain-overlay space-y-4">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        
        {/* Couple Avatars & Editorial Names */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left w-full sm:w-auto">
          
          {/* Linked Circular Avatars */}
          <div className="relative flex items-center shrink-0">
            {/* User Avatar */}
            <div className="relative group">
              <img
                src={userAvatar}
                alt={user?.name || 'Kamu'}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-3 sm:border-4 border-surface shadow-medium ring-2 ring-terracotta-500/30 bg-surface"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] sm:text-xs shadow-sm">
                {user?.current_mood || '😊'}
              </span>
            </div>

            {/* Connecting Heart Emblem */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 -mx-2.5 sm:-mx-3 z-10 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-md border-2 border-surface animate-pulse-subtle">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>

            {/* Partner Avatar or Invite Placeholder */}
            {isPending ? (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="relative group w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 sm:border-3 border-dashed border-terracotta-400 dark:border-terracotta-600 bg-terracotta-50/50 dark:bg-terracotta-950/40 flex flex-col items-center justify-center text-terracotta-600 dark:text-terracotta-300 hover:bg-terracotta-100 hover:scale-105 transition-all cursor-pointer shadow-sm"
                title="Klik untuk mengundang pasanganmu"
              >
                <UserPlus className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-[9px] sm:text-[10px] font-semibold mt-0.5">Undang</span>
              </button>
            ) : (
              <div className="relative group">
                <img
                  src={partnerAvatar}
                  alt={partner?.name || 'Pasangan'}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-3 sm:border-4 border-surface shadow-medium ring-2 ring-terracotta-500/30 bg-surface"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] sm:text-xs shadow-sm">
                  {partner?.current_mood || '🥰'}
                </span>
              </div>
            )}
          </div>

          {/* Names & Locations */}
          <div className="space-y-1 sm:space-y-1.5 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <h1 className="font-serif text-xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {user?.name || 'Kamu'} {isPending ? '' : <><span className="text-terracotta-500 font-sans font-light">×</span> {partner?.name}</>}
              </h1>
              <Badge variant={isPending ? 'amber' : 'terracotta'} size="sm">
                <Sparkles className="w-3 h-3 text-terracotta-500" />
                <span>{isPending ? 'Menunggu Pasangan' : (couple?.couple_name || 'Ruang Kita')}</span>
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-foreground-muted">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                {couple?.user_city || 'Jakarta'} {isPending ? '' : `⇄ ${couple?.partner_city || 'Kota Pasangan'}`}
              </span>
              <span>•</span>
              <span>Sejak {new Date(couple?.relationship_start_date || new Date().toISOString()).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {/* Quick Mood Status Preview */}
            <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowMoodPicker(!showMoodPicker)}
                className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-surface-subtle hover:bg-surface border border-border text-foreground-muted hover:text-foreground transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Smile className="w-3.5 h-3.5 text-terracotta-500" />
                <span>Kamu: <b>{user?.mood_label || 'Bahagia'}</b></span>
              </button>

              {!isPending && (
                <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  {partner?.name}: <b>{partner?.mood_label || 'Sedang rindu'}</b>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Duration Counter Widget */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-end justify-center bg-surface-subtle/80 border border-border rounded-2xl p-4 sm:p-5 text-center md:text-right">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-foreground-subtle mb-0.5">
            Waktu Bersama
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-terracotta-600 dark:text-terracotta-400">
            {duration.totalDays.toLocaleString('id-ID')} Hari
          </div>
          <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5">
            {duration.formattedString}
          </p>
        </div>

      </div>

      {/* Pending Partner Invite Box */}
      {isPending && (
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-terracotta-50/70 dark:bg-terracotta-950/40 border-terracotta-200 dark:border-terracotta-800/80 rounded-2xl p-3.5 sm:p-4 text-xs">
          <div className="flex items-center gap-2 text-terracotta-900 dark:text-terracotta-100 text-center sm:text-left">
            <UserPlus className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400 shrink-0 hidden sm:block" />
            <span>
              Ruang siap! Bagikan kode undangan <strong>{inviteCode}</strong> ke pasanganmu agar bisa bergabung.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border text-foreground font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Tautan</span>
            </button>
          </div>
        </div>
      )}

      {/* Mood Picker Dropdown / Bar */}
      {showMoodPicker && (
        <div className="pt-3.5 border-t border-border flex flex-wrap items-center gap-1.5 sm:gap-2 animate-fade-in">
          <span className="text-xs font-semibold text-foreground-muted w-full sm:w-auto mr-1">Perbarui perasaanmu:</span>
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

      {/* Share Modal */}
      <CoupleShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </section>
  );
};

