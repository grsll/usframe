import React, { useState, useEffect, useCallback } from 'react';
import { Memory } from '../types';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { roomService } from '../lib/roomService';
import { MemoryGrid } from '../components/memories/MemoryGrid';
import { MemoryModal } from '../components/memories/MemoryModal';
import { AddMemoryModal } from '../components/memories/AddMemoryModal';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const MemoriesPage: React.FC = () => {
  const { couple } = useAuth();
  const [memories, setMemories] = useState<Memory[]>(() => storage.getMemories(couple?.id));
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const loadMemories = useCallback(async () => {
    const list = await roomService.fetchMemories(couple?.id);
    setMemories(list);
  }, [couple?.id]);

  useEffect(() => {
    loadMemories();
    const unsubscribe = roomService.subscribeToMemories(couple?.id, () => {
      loadMemories();
    });
    return () => {
      unsubscribe();
    };
  }, [loadMemories, couple?.id]);

  const handleAddMemory = async (newMem: Memory) => {
    // If memory wasn't created through roomService directly
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

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 sm:p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h1 className="font-serif text-xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Brankas Kenangan Berdua
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Semua foto, strip photobooth, dan cerita privat tersimpan aman hanya untuk kalian berdua.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} variant="primary" size="md" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Tambah Kenangan</span>
        </Button>
      </div>

      {/* Grid */}
      <MemoryGrid
        memories={memories}
        onSelectMemory={(m) => setSelectedMemory(m)}
        onToggleFavorite={handleToggleFavorite}
        onOpenAddMemory={() => setIsAddOpen(true)}
      />

      {/* Modals */}
      <AddMemoryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
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
