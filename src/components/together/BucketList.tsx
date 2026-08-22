import React, { useState } from 'react';
import { BucketListItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../lib/storage';
import { CheckCircle2, Circle, Plus, Compass, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../layout/Modal';
import { Input } from '../ui/Input';
import confetti from 'canvas-confetti';

interface BucketListProps {
  items: BucketListItem[];
  onUpdate: () => void;
}

export const BucketList: React.FC<BucketListProps> = ({ items, onUpdate }) => {
  const { couple, user } = useAuth();
  const { success } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [category, setCategory] = useState<'trip' | 'food' | 'activity' | 'future'>('trip');

  const toggleItem = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        if (nextState) {
          confetti({ particleCount: 30, spread: 40 });
          success('Milestone completed together! 🎉');
        }
        return {
          ...item,
          completed: nextState,
          completed_at: nextState ? new Date().toISOString().split('T')[0] : null
        };
      }
      return item;
    });

    storage.setBucketList(updated);
    onUpdate();
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newItem: BucketListItem = {
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      couple_id: couple?.id || 'couple_main',
      title,
      category,
      completed: false,
      target_location: targetLocation || undefined,
      completed_at: null,
      created_by: user?.id || 'user_me'
    };

    const updated = [...items, newItem];
    storage.setBucketList(updated);
    success('Added to couple bucket list! ✨');
    setIsAddOpen(false);
    setTitle('');
    setTargetLocation('');
    onUpdate();
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft space-y-4 sm:space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5 sm:pb-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground">Our Shared Bucket List</h3>
            <p className="text-xs text-foreground-muted">Adventures, meals, and dreams to experience together.</p>
          </div>
        </div>

        <Button onClick={() => setIsAddOpen(true)} variant="primary" size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" />
          <span>Add Plan</span>
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2 sm:space-y-2.5">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              item.completed
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/60 text-foreground-muted line-through'
                : 'bg-surface hover:bg-surface-subtle border-border text-foreground shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 truncate">
              <button
                type="button"
                className="text-terracotta-500 shrink-0 cursor-pointer"
                aria-label="Toggle bucket list item"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-current" />
                ) : (
                  <Circle className="w-5 h-5 text-foreground-subtle" />
                )}
              </button>
              <div className="truncate">
                <span className="text-xs sm:text-sm font-medium block truncate">{item.title}</span>
                {item.target_location && (
                  <span className="text-[11px] text-foreground-subtle flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-terracotta-500 shrink-0" />
                    {item.target_location}
                  </span>
                )}
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-surface-subtle border border-border text-foreground-muted capitalize shrink-0">
              {item.category}
            </span>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add to Couple Bucket List"
        subtitle="Dream up a future memory to create together."
        maxWidth="md"
      >
        <form onSubmit={handleAddItem} className="space-y-3.5">
          <Input
            label="Plan / Activity"
            placeholder="e.g. Rent a seaside cabin in Brittany, Eat matcha parfait"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Location (Optional)"
            placeholder="e.g. Kyoto, Paris, Coast"
            value={targetLocation}
            onChange={(e) => setTargetLocation(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-terracotta-500"
            >
              <option value="trip">Trip & Travel ✈️</option>
              <option value="food">Food & Dining ☕</option>
              <option value="activity">Fun Activity 🎨</option>
              <option value="future">Future Dream 🏠</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!title}>
              Add to List
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
