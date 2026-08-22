import React from 'react';
import { Memory } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDatePretty } from '../../lib/utils';
import { ArrowRight, Camera } from 'lucide-react';

interface RecentMemoriesProps {
  memories: Memory[];
  onSelectMemory: (mem: Memory) => void;
}

export const RecentMemories: React.FC<RecentMemoriesProps> = ({ memories, onSelectMemory }) => {
  const { setCurrentView } = useAuth();
  const recent = memories.slice(0, 5);

  return (
    <section className="space-y-3.5 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-foreground tracking-tight">
            Momen Terbaru
          </h3>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Kepingan kenangan yang membangun kisah kita.
          </p>
        </div>
        <button
          onClick={() => setCurrentView('memories')}
          className="text-xs sm:text-sm font-semibold text-terracotta-600 dark:text-terracotta-400 hover:text-terracotta-700 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Lihat Semua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Filmstrip Gallery */}
      {recent.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-6 text-center shadow-soft">
          <p className="text-xs text-foreground-muted">Belum ada kenangan yang diunggah. Abadikan momen pertama kalian melalui photobooth USFRAME atau tombol Tambah Kenangan!</p>
        </div>
      ) : (
        <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          {recent.map(memory => (
            <div
              key={memory.id}
              onClick={() => onSelectMemory(memory)}
              className="flex-shrink-0 w-60 sm:w-72 bg-surface border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
              <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-stone-900">
                <img
                  src={memory.media_url}
                  alt={memory.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {memory.category === 'Photobooth' && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Camera className="w-3 h-3 text-terracotta-400" />
                    Strip
                  </span>
                )}
              </div>
              <div className="p-3.5 sm:p-4 space-y-1">
                <span className="text-[11px] text-foreground-subtle font-medium block">
                  {formatDatePretty(memory.date)} {memory.location ? `• ${memory.location}` : ''}
                </span>
                <h4 className="font-serif text-sm sm:text-base font-semibold text-foreground truncate group-hover:text-terracotta-600 transition-colors">
                  {memory.title}
                </h4>
                <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                  {memory.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
