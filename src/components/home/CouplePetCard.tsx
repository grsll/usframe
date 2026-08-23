import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CoupleStreak, CouplePet, PetType } from '../../types';
import { streakService } from '../../lib/streakService';
import { PET_DEFINITIONS, getPetLevelInfo } from '../../lib/petConstants';
import { PetCustomizerModal } from './PetCustomizerModal';
import { StreakMilestoneModal } from './StreakMilestoneModal';
import { Flame, Sparkles, Trophy, Settings, Heart, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CouplePetCard: React.FC = () => {
  const { couple, user } = useAuth();
  const { success } = useToast();

  const [streak, setStreak] = useState<CoupleStreak>({
    currentStreak: 1,
    longestStreak: 1,
    lastActivityDate: new Date().toISOString().split('T')[0],
    streakStartedAt: new Date().toISOString(),
    streakBrokenAt: null,
    unlockedMilestones: []
  });

  const [pet, setPet] = useState<CouplePet>({
    name: 'Mochi',
    type: 'cat',
    level: 1,
    xp: 50,
    totalXp: 50,
    lastInteraction: new Date().toISOString(),
    statusText: 'Mochi siap menjaga api cinta kalian! 🤍'
  });

  const [dialogue, setDialogue] = useState<string>('Halo! Mochi siap menemani kalian berdua hari ini! 🤍✨');
  const [isPetting, setIsPetting] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);

  // Initial load & sync
  useEffect(() => {
    if (couple?.id) {
      streakService.getStreakAndPet(couple.id).then(({ streak: s, pet: p }) => {
        setStreak(s);
        setPet(p);
      });

      const unsub = streakService.subscribeToStreakAndPet(couple.id, ({ streak: s, pet: p }) => {
        setStreak(s);
        setPet(p);
      });

      return () => unsub();
    }
  }, [couple?.id]);

  const levelInfo = getPetLevelInfo(pet.totalXp);
  const petDef = PET_DEFINITIONS[pet.type] || PET_DEFINITIONS.cat;

  const handlePetInteraction = async () => {
    if (!couple?.id || isPetting) return;

    setIsPetting(true);
    // Add floating heart
    const newHeartId = Date.now();
    setFloatingHearts(prev => [...prev, { id: newHeartId, x: Math.random() * 40 - 20, y: -20 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeartId));
    }, 1200);

    try {
      const res = await streakService.petMochi(couple.id);
      setPet(res.pet);
      setDialogue(res.dialogue);
    } finally {
      setTimeout(() => setIsPetting(false), 300);
    }
  };

  const handleSavePetSettings = async (params: { name: string; type: PetType }) => {
    if (!couple?.id) return;
    const updated = await streakService.updatePetProfile(couple.id, params);
    setPet(updated);
    success(`Peliharaan cinta diperbarui menjadi "${updated.name}"! ✨`);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-border p-4 sm:p-6 shadow-soft transition-all grain-overlay">
        
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border/80">
          
          {/* Streak Flame Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-amber-500/15 via-rose-500/15 to-terracotta-500/15 border border-terracotta-300 dark:border-terracotta-700/60 shadow-2xs">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span className="font-bold text-xs sm:text-sm text-foreground">
                {streak.currentStreak} Hari Streak
              </span>
            </div>
            <span className="text-[11px] text-foreground-muted hidden xs:inline">
              ⭐ Rekor: {streak.longestStreak} hari
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMilestoneOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-surface-subtle hover:bg-surface border border-border text-[11px] font-semibold text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              title="Lihat Tonggak Pencapaian"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Milestone</span>
            </button>

            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="p-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              title="Ganti Nama atau Karakter Pet"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Pet Presentation */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          
          {/* Interactive Pet Character Avatar with Floating Hearts */}
          <div className="relative shrink-0 flex flex-col items-center">
            <button
              onClick={handlePetInteraction}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-b from-terracotta-500/10 to-amber-500/10 border-2 border-terracotta-300 dark:border-terracotta-700/60 shadow-soft flex items-center justify-center text-4xl sm:text-5xl cursor-pointer select-none transition-all active:scale-95 group hover:border-terracotta-500 ${
                isPetting ? 'scale-110' : 'animate-bounce-subtle'
              }`}
              title="Klik untuk mengelus peliharaan cinta kalian!"
            >
              <span>{petDef.avatarEmoji}</span>
              
              {/* Petting heart hover indicator */}
              <span className="absolute -bottom-1.5 px-2 py-0.5 rounded-full bg-surface border border-border text-[9px] font-bold text-terracotta-600 dark:text-terracotta-400 shadow-2xs group-hover:scale-105 transition-transform flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5 fill-current text-rose-500" />
                <span>Elus</span>
              </span>
            </button>

            {/* Floating Heart Animations on Click */}
            {floatingHearts.map((h) => (
              <span
                key={h.id}
                style={{ transform: `translate(${h.x}px, ${h.y}px)` }}
                className="absolute top-0 text-rose-500 text-base animate-float-up pointer-events-none"
              >
                🤍
              </span>
            ))}
          </div>

          {/* Dialogue & Progress Bars */}
          <div className="flex-1 w-full space-y-3 text-center sm:text-left">
            
            {/* Dynamic Romantic Dialogue Speech Bubble */}
            <div className="relative p-3 rounded-2xl bg-surface-subtle/80 border border-border text-xs sm:text-sm text-foreground leading-relaxed shadow-2xs">
              <span className="font-bold text-terracotta-600 dark:text-terracotta-400 mr-1.5">{pet.name}:</span>
              <span>"{dialogue}"</span>
            </div>

            {/* Level & XP Progress Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Level {levelInfo.level} • {levelInfo.levelName}</span>
                </span>
                <span className="text-foreground-muted font-medium">
                  {levelInfo.currentLevelXp} / {levelInfo.requiredLevelXp} XP ({levelInfo.progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-linear-to-r from-terracotta-500 via-rose-500 to-amber-500 transition-all duration-500 rounded-full"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                <span>Tahap: {levelInfo.statusBadge}</span>
                <span>Total XP: {pet.totalXp} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PetCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pet={pet}
        onSave={handleSavePetSettings}
      />

      <StreakMilestoneModal
        isOpen={isMilestoneOpen}
        onClose={() => setIsMilestoneOpen(false)}
        streak={streak}
        pet={pet}
      />
    </>
  );
};
