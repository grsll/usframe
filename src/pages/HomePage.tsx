import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { roomService } from '../lib/roomService';
import { Memory, Countdown } from '../types';
import { CoupleHeader } from '../components/home/CoupleHeader';
import { CouplePetCard } from '../components/home/CouplePetCard';
import { FeaturedMemory } from '../components/home/FeaturedMemory';
import { QuickActions } from '../components/home/QuickActions';
import { NextMeetCountdown } from '../components/home/NextMeetCountdown';
import { RecentMemories } from '../components/home/RecentMemories';
import { AddMemoryModal } from '../components/memories/AddMemoryModal';
import { MemoryModal } from '../components/memories/MemoryModal';

export const HomePage: React.FC = () => {
  const { couple } = useAuth();
  
  const [memories, setMemories] = useState<Memory[]>(() => storage.getMemories(couple?.id));
  const [countdowns, setCountdowns] = useState<Countdown[]>(() => storage.getCountdowns(couple?.id));
  
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const loadData = useCallback(async () => {
    const [freshMemories, freshCountdowns] = await Promise.all([
      roomService.fetchMemories(couple?.id),
      roomService.fetchCountdowns(couple?.id)
    ]);
    setMemories(freshMemories);
    setCountdowns(freshCountdowns);
  }, [couple?.id]);

  useEffect(() => {
    loadData();
    const unsubMemories = roomService.subscribeToMemories(couple?.id, loadData);
    const unsubCountdowns = roomService.subscribeToCountdowns(couple?.id, loadData);

    return () => {
      unsubMemories();
      unsubCountdowns();
    };
  }, [loadData, couple?.id]);

  // Pick today's featured memory or favorite
  const featuredMemory = memories.find(m => m.is_favorite) || memories[0];

  const handleAddMemory = async (newMem: Memory) => {
    const created = await roomService.createMemory({
      coupleId: couple?.id || 'couple_main',
      uploaderId: newMem.created_by,
      creatorName: newMem.creator_name,
      title: newMem.title,
      caption: newMem.caption,
      location: newMem.location,
      mediaUrl: newMem.media_url,
      mediaType: newMem.media_type,
      category: newMem.category,
      isFavorite: newMem.is_favorite,
      date: newMem.date
    });
    setMemories(prev => [created, ...prev.filter(m => m.id !== created.id)]);
  };

  const handleToggleFavorite = async (id: string) => {
    const target = memories.find(m => m.id === id);
    if (!target) return;
    const nextFavorite = !target.is_favorite;

    setMemories(prev => prev.map(m => m.id === id ? { ...m, is_favorite: nextFavorite } : m));
    if (selectedMemory && selectedMemory.id === id) {
      setSelectedMemory(prev => prev ? { ...prev, is_favorite: nextFavorite } : null);
    }
    await roomService.toggleMemoryFavorite(id, nextFavorite, couple?.id);
  };

  const handleDeleteMemory = async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    if (selectedMemory && selectedMemory.id === id) {
      setSelectedMemory(null);
    }
    await roomService.deleteMemory(id, couple?.id);
  };

  const refreshCountdowns = async () => {
    const fresh = await roomService.fetchCountdowns(couple?.id);
    setCountdowns(fresh);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {/* Couple Header Hero */}
      <CoupleHeader />

      {/* Virtual Couple Pet & Streak System */}
      <CouplePetCard />

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
