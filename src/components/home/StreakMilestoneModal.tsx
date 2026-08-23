import React from 'react';
import { Modal } from '../layout/Modal';
import { Button } from '../ui/Button';
import { CoupleStreak, CouplePet } from '../../types';
import { STREAK_MILESTONES } from '../../lib/petConstants';
import { Flame, Trophy, Sparkles, Check, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StreakMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: CoupleStreak;
  pet: CouplePet;
}

export const StreakMilestoneModal: React.FC<StreakMilestoneModalProps> = ({
  isOpen,
  onClose,
  streak,
  pet
}) => {
  const currentStreakDays = streak.currentStreak || 1;
  const unlockedSet = new Set(streak.unlockedMilestones || []);

  const handleCelebrate = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tonggak & Pencapaian Streak 🔥"
      subtitle="Semakin konsisten kalian terhubung, semakin banyak cinta & reward untuk peliharaan kalian."
      maxWidth="lg"
    >
      <div className="space-y-6">
        
        {/* Streak Summary Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-terracotta-500 via-rose-500 to-amber-500 text-white p-5 sm:p-6 shadow-medium flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left z-10">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white/90 text-xs font-semibold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
              <span>Api Cinta Berdua</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              {currentStreakDays} Hari Berturut-turut!
            </h3>
            <p className="text-xs text-white/80">
              Rekor terlama kalian: <b>{streak.longestStreak || currentStreakDays} hari</b>. Terus jaga apinya menyala!
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-center">
            <Trophy className="w-6 h-6 text-amber-300" />
            <div className="text-left">
              <span className="block text-[10px] uppercase font-bold text-white/80">Total Milestone</span>
              <span className="font-bold text-lg leading-none">{unlockedSet.size} / {STREAK_MILESTONES.length}</span>
            </div>
          </div>
        </div>

        {/* Milestones List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Daftar Tonggak Hubungan
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STREAK_MILESTONES.map((m) => {
              const isUnlocked = currentStreakDays >= m.days;
              const isClaimed = unlockedSet.has(m.days);

              return (
                <div
                  key={m.days}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isUnlocked
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60 shadow-2xs'
                      : 'bg-surface-subtle/50 border-border opacity-70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground flex items-center gap-1">
                        {isUnlocked ? '🔥' : '🔒'} {m.days} Hari
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-terracotta-100 dark:bg-terracotta-900/60 text-terracotta-700 dark:text-terracotta-300">
                        +{m.rewardXp} XP
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{m.title}</p>
                    <p className="text-[11px] text-foreground-muted leading-tight">{m.description}</p>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {isUnlocked ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-surface border border-border text-foreground-subtle flex items-center justify-center text-xs">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center justify-end">
          <Button variant="primary" size="md" onClick={() => { handleCelebrate(); onClose(); }}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>Tutup & Rayakan ✨</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
