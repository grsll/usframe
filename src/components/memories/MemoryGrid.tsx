import React, { useState, useMemo } from 'react';
import { Memory } from '../../types';
import { MemoryCard } from './MemoryCard';
import { Search, Heart, Sparkles } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

interface MemoryGridProps {
  memories: Memory[];
  onSelectMemory: (mem: Memory) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddMemory: () => void;
}

export const MemoryGrid: React.FC<MemoryGridProps> = ({
  memories,
  onSelectMemory,
  onToggleFavorite,
  onOpenAddMemory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const categories = ['All', 'Photobooth', 'Date', 'Travel', 'Everyday', 'Milestone'];

  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      const matchesFavorite = !onlyFavorites || m.is_favorite;
      const matchesSearch = 
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.date.includes(searchQuery);

      return matchesCategory && matchesFavorite && matchesSearch;
    });
  }, [memories, selectedCategory, onlyFavorites, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-3xl border border-border shadow-soft">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search memories, locations, dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-terracotta-500"
          />
        </div>

        {/* Filter Categories Pill Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-terracotta-500 text-white shadow-xs'
                  : 'bg-surface-subtle hover:bg-surface text-foreground-muted hover:text-foreground border border-border/80'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Favorite Toggle Button */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border cursor-pointer ${
              onlyFavorites
                ? 'bg-rose-500 text-white border-rose-600'
                : 'bg-surface-subtle text-foreground-muted hover:text-foreground border-border/80'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>

      </div>

      {/* Gallery Count & Active Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
        <span>Showing <strong>{filteredMemories.length}</strong> memories</span>
        {searchQuery && (
          <span>Filtering by "{searchQuery}"</span>
        )}
      </div>

      {/* Grid Display */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map(memory => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onClick={() => onSelectMemory(memory)}
              onToggleFavorite={(e) => {
                e.stopPropagation();
                onToggleFavorite(memory.id);
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No memories found"
          description="Try clearing your filters, or save your first memory together."
          actionLabel="Create a Memory"
          onAction={onOpenAddMemory}
        />
      )}

    </div>
  );
};
