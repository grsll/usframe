import React, { useState } from 'react';
import { Memory } from '../../types';
import { Calendar, MapPin, Sparkles, Maximize2 } from 'lucide-react';
import { formatDateFull } from '../../lib/utils';
import { Modal } from '../layout/Modal';

interface FeaturedMemoryProps {
  memory?: Memory;
}

export const FeaturedMemory: React.FC<FeaturedMemoryProps> = ({ memory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!memory) return null;

  return (
    <>
      <section className="bg-surface rounded-3xl border border-border overflow-hidden shadow-soft transition-all hover:shadow-medium group h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
          
          {/* Large Visual Photo */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full min-h-[280px] sm:min-h-[320px] overflow-hidden cursor-pointer bg-stone-900"
          >
            <img
              src={memory.media_url}
              alt={memory.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
            
            {/* Quick Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-[11px] font-semibold text-foreground flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-terracotta-500" />
                Ingat hari ini?
              </span>
            </div>

            <div className="absolute bottom-4 right-4 z-10 text-white/80 hover:text-white p-2 rounded-xl bg-black/40 backdrop-blur-sm transition-colors">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>

          {/* Editorial Story Details */}
          <div className="lg:col-span-5 p-5 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-terracotta-500" />
                  {formatDateFull(memory.date)}
                </span>
                {memory.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                      {memory.location}
                    </span>
                  </>
                )}
              </div>

              <h2 className="font-serif text-xl sm:text-3xl font-medium text-foreground tracking-tight leading-snug">
                {memory.title}
              </h2>

              <p className="text-xs sm:text-base text-foreground-muted leading-relaxed font-normal">
                "{memory.caption}"
              </p>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-foreground-subtle">
                Diabadikan oleh <strong className="text-foreground font-medium">{memory.creator_name || 'Kita'}</strong>
              </span>

              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-semibold text-terracotta-600 dark:text-terracotta-400 hover:text-terracotta-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Lihat Kenangan</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Full Screen Photo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center max-h-[65vh]">
            <img
              src={memory.media_url}
              alt={memory.title}
              className="max-h-[65vh] w-auto object-contain rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-foreground">{memory.title}</h3>
              <span className="text-xs text-foreground-muted">{formatDateFull(memory.date)}</span>
            </div>
            {memory.location && (
              <p className="text-xs text-foreground-subtle flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                {memory.location}
              </p>
            )}
            <p className="text-sm text-foreground-muted pt-2 leading-relaxed italic">
              "{memory.caption}"
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
