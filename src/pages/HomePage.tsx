import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { Memory, Countdown } from '../types';
import { CoupleHeader } from '../components/home/CoupleHeader';
import { FeaturedMemory } from '../components/home/FeaturedMemory';
import { QuickActions } from '../components/home/QuickActions';
import { NextMeetCountdown } from '../components/home/NextMeetCountdown';
import { RecentMemories } from '../components/home/RecentMemories';
import { AddMemoryModal } from '../components/memories/AddMemoryModal';
import { MemoryModal } from '../components/memories/MemoryModal';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  const [memories, setMemories] = useState<Memory[]>(() => storage.getMemories());
  const [countdowns, setCountdowns] = useState<Countdown[]>(() => storage.getCountdowns());
  
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Pick today's featured memory or favorite
  const featuredMemory = memories.find(m => m.is_favorite) || memories[0];

  const handleAddMemory = (newMem: Memory) => {
    const updated = storage.addMemory(newMem);
    setMemories(updated);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = memories.map(m => m.id === id ? { ...m, is_favorite: !m.is_favorite } : m);
    storage.setMemories(updated);
    setMemories(updated);
    if (selectedMemory && selectedMemory.id === id) {
      setSelectedMemory((prev: Memory | null) => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
    }
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    storage.setMemories(updated);
    setMemories(updated);
  };

  const refreshCountdowns = () => {
    setCountdowns(storage.getCountdowns());
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {/* Couple Header Hero */}
      <CoupleHeader />

      {/* Quick Action Buttons */}
      <QuickActions onOpenAddMemory={() => setIsAddMemoryOpen(true)} />

      {/* Grid: Featured Memory (Remember This Day?) + Next Meet Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8">
          <FeaturedMemory memory={featuredMemory} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <NextMeetCountdown
            countdowns={countdowns}
            onUpdate={refreshCountdowns}
          />
        </div>
      </div>

      {/* Recent Memories Filmstrip */}
      <RecentMemories
        memories={memories}
        onSelectMemory={(m) => setSelectedMemory(m)}
      />

      {/* Modals */}
      <AddMemoryModal
        isOpen={isAddMemoryOpen}
        onClose={() => setIsAddMemoryOpen(false)}
        onAddMemory={handleAddMemory}
      />

      <MemoryModal
        memory={selectedMemory}
        isOpen={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteMemory}
      />

    </div>
  );
};
