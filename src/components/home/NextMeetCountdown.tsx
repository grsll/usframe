import React, { useState } from 'react';
import { Countdown } from '../../types';
import { getDaysUntil, formatDatePretty } from '../../lib/utils';
import { Clock, Plus } from 'lucide-react';
import { Modal } from '../layout/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { storage } from '../../lib/storage';
import { roomService } from '../../lib/roomService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface NextMeetCountdownProps {
  countdowns: Countdown[];
  onUpdate: () => void;
}

export const NextMeetCountdown: React.FC<NextMeetCountdownProps> = ({ countdowns, onUpdate }) => {
  const { couple, user } = useAuth();
  const { success } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('✈️');

  const mainCountdown = countdowns.find(c => c.is_pinned) || countdowns[0];
  const { days, isToday, isPast } = mainCountdown 
    ? getDaysUntil(mainCountdown.target_date) 
    : { days: 0, isToday: false, isPast: false };

  const handleSaveCountdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;

    await roomService.createCountdown({
      coupleId: couple?.id || 'couple_main',
      createdBy: user?.id,
      title,
      targetDate,
      icon: icon || '⏳',
      isPinned: true
    });

    success('Hitung mundur momen baru berhasil dibuat!');
    setIsAddOpen(false);
    setTitle('');
    setTargetDate('');
    onUpdate();
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-3xl p-5 sm:p-7 shadow-soft flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 sm:p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-base sm:text-lg font-semibold text-foreground">Target Momen Berikutnya</h3>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-xs text-terracotta-600 dark:text-terracotta-400 hover:text-terracotta-700 font-medium flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        {mainCountdown ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{mainCountdown.icon || '✈️'}</span>
              <div>
                <h4 className="font-medium text-foreground text-sm sm:text-base leading-tight">
                  {mainCountdown.title}
                </h4>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Target: {formatDatePretty(mainCountdown.target_date)}
                </p>
              </div>
            </div>

            <div className="py-3 px-4 rounded-2xl bg-surface-subtle/80 border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle block">
                  Tersisa
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-terracotta-600 dark:text-terracotta-400">
                  {isToday ? 'Hari Ini! 🎉' : `${days} Hari`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-foreground-muted">
                  {isPast ? 'Momen telah lewat' : isToday ? 'Hari yang dinanti tiba!' : 'menuju kita bertemu'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-foreground-muted text-xs">
            Belum ada hitung mundur. Klik + untuk menambahkan jadwal penerbangan atau hari jadi!
          </div>
        )}
      </div>

      {/* Add Countdown Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Buat Hitung Mundur Pasangan"
        subtitle="Pantau hari menuju pertemuan, penerbangan, atau hari jadi kalian."
      >
        <form onSubmit={handleSaveCountdown} className="space-y-3.5">
          <Input
            label="Judul Momen"
            placeholder="contoh: Terbang ke Paris ✈️, Hari Jadi ke-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Tanggal Target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Pilih Ikon Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {['✈️', '🎂', '🌸', '☕', '🏠', '💍', '🏝️'].map(emoji => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-lg flex items-center justify-center transition-all cursor-pointer ${
                    icon === emoji ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/80 scale-105' : 'border-border bg-surface'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Pasang Hitung Mundur
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
