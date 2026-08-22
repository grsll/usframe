import React, { useState } from 'react';
import { Memory } from '../types';
import { storage } from '../lib/storage';
import { MemoryGrid } from '../components/memories/MemoryGrid';
import { MemoryModal } from '../components/memories/MemoryModal';
import { AddMemoryModal } from '../components/memories/AddMemoryModal';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const MemoriesPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>(() => storage.getMemories());
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Couple Memory Vault
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            All your photos, photobooth strips, and private moments safely stored for two.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Memory</span>
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
