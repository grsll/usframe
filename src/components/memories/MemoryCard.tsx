import React from 'react';
import { Memory } from '../../types';
import { formatDatePretty } from '../../lib/utils';
import { Heart, MapPin, Camera } from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onClick,
  onToggleFavorite
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-surface border border-border rounded-3xl overflow-hidden shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Media Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
        <img
          src={memory.media_url}
          alt={memory.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category & Strip Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {memory.category === 'Photobooth' && (
            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Camera className="w-3 h-3 text-terracotta-400" />
              USFRAME
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-[11px] font-medium text-foreground shadow-sm">
            {memory.category}
          </span>
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => onToggleFavorite(e, memory.id)}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
            memory.is_favorite
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/40 text-white/80 hover:text-white hover:bg-black/60'
          }`}
          aria-label="Toggle favorite"
        >
          <Heart className={`w-4 h-4 ${memory.is_favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span>{formatDatePretty(memory.date)}</span>
            {memory.location && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-terracotta-500 shrink-0" />
                  {memory.location}
                </span>
              </>
            )}
          </div>

          <h3 className="font-serif text-lg font-semibold text-foreground leading-snug group-hover:text-terracotta-600 transition-colors">
            {memory.title}
          </h3>

          <p className="text-xs sm:text-sm text-foreground-muted line-clamp-2 leading-relaxed">
            {memory.caption}
          </p>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-subtle">
          <span>By {memory.creator_name || 'Us'}</span>
          <span className="font-semibold text-terracotta-600 dark:text-terracotta-400 group-hover:translate-x-0.5 transition-transform">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};
