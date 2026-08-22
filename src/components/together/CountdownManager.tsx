import React, { useState } from 'react';
import { Countdown } from '../../types';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../lib/storage';
import { getDaysUntil, formatDatePretty } from '../../lib/utils';
import { Clock, Plus, Trash2, Pin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../layout/Modal';
import { Input } from '../ui/Input';

interface CountdownManagerProps {
  countdowns: Countdown[];
  onUpdate: () => void;
}

export const CountdownManager: React.FC<CountdownManagerProps> = ({ countdowns, onUpdate }) => {
  const { success } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('✈️');

  const handleDelete = (id: string) => {
    const updated = countdowns.filter(c => c.id !== id);
    storage.setCountdowns(updated);
    success('Countdown removed');
    onUpdate();
  };

  const handlePin = (id: string) => {
    const updated = countdowns.map(c => ({
      ...c,
      is_pinned: c.id === id
    }));
    storage.setCountdowns(updated);
    success('Pinned countdown updated for Home screen');
    onUpdate();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;

    const newC: Countdown = {
      id: 'count_' + Math.random().toString(36).substring(2, 9),
      couple_id: 'couple_main',
      title,
      target_date: targetDate,
      icon,
      is_pinned: countdowns.length === 0,
      created_by: 'user_me',
      created_at: new Date().toISOString()
    };

    storage.addCountdown(newC);
    success('Countdown created! ⏳');
    setIsAddOpen(false);
    setTitle('');
    setTargetDate('');
    onUpdate();
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft space-y-4 sm:space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5 sm:pb-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="p-1.5 sm:p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground">Relationship Countdowns</h3>
            <p className="text-xs text-foreground-muted">Track all upcoming flights, anniversaries, and visits.</p>
          </div>
        </div>

        <Button onClick={() => setIsAddOpen(true)} variant="primary" size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" />
          <span>Add Countdown</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {countdowns.map(c => {
          const { days, isToday, isPast } = getDaysUntil(c.target_date);
          return (
            <div
              key={c.id}
              className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3.5 ${
                c.is_pinned
                  ? 'bg-terracotta-50/50 dark:bg-terracotta-950/40 border-terracotta-300 dark:border-terracotta-800 shadow-soft'
                  : 'bg-surface border-border shadow-xs'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{c.icon || '⏳'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePin(c.id)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        c.is_pinned
                          ? 'bg-terracotta-500 text-white border-terracotta-600'
                          : 'bg-surface border-border text-foreground-muted hover:text-foreground'
                      }`}
                      title={c.is_pinned ? 'Pinned to Home' : 'Pin to Home'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg text-foreground-muted hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif text-base font-semibold text-foreground leading-snug">
                  {c.title}
                </h4>
                <p className="text-xs text-foreground-muted">
                  {formatDatePretty(c.target_date)}
                </p>
              </div>

              <div className="pt-2.5 border-t border-border/80 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                  {isPast ? 'Passed' : isToday ? 'Today!' : 'Remaining'}
                </span>
                <span className="font-serif text-2xl font-bold text-terracotta-600 dark:text-terracotta-400">
                  {isToday ? 'Today! 🎉' : `${days}d`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="New Countdown"
        subtitle="Keep a special milestone in sight."
        maxWidth="md"
      >
        <form onSubmit={handleAdd} className="space-y-3.5">
          <Input
            label="Title"
            placeholder="e.g. Next Flight to Paris ✈️"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Target Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Choose Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {['✈️', '🎂', '🌸', '💍', '🏝️', '🏠', '🎬', '☕'].map(emoji => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-lg flex items-center justify-center cursor-pointer ${
                    icon === emoji ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/80' : 'border-border bg-surface'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Countdown
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
