import React from 'react';
import { Memory } from '../../types';
import { Modal } from '../layout/Modal';
import { formatDateFull } from '../../lib/utils';
import { Heart, MapPin, Calendar, Download, Trash2, Camera } from 'lucide-react';
import { Button } from '../ui/Button';

interface MemoryModalProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memory,
  isOpen,
  onClose,
  onToggleFavorite,
  onDelete
}) => {
  if (!memory) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `${memory.title.replace(/\s+/g, '_')}.jpg`;
    link.href = memory.media_url;
    link.target = '_blank';
    link.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
    >
      <div className="space-y-4 sm:space-y-6">
        
        {/* Large Media Image */}
        <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh] sm:max-h-[65vh]">
          <img
            src={memory.media_url}
            alt={memory.title}
            className="max-h-[60vh] sm:max-h-[65vh] w-auto object-contain rounded-xl"
          />
          {memory.category === 'Photobooth' && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Strip Photobooth USFRAME</span>
            </div>
          )}
        </div>

        {/* Content & Metadata */}
        <div className="space-y-3.5 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 sm:pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-terracotta-500" />
                  {formatDateFull(memory.date)}
                </span>
                {memory.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                      {memory.location}
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-serif text-xl sm:text-3xl font-medium text-foreground tracking-tight">
                {memory.title}
              </h2>
            </div>

            {/* Favorite & Category */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-surface-subtle text-xs font-medium text-foreground-muted border border-border">
                {memory.category}
              </span>
              <button
                onClick={() => onToggleFavorite(memory.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  memory.is_favorite
                    ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 text-rose-600'
                    : 'bg-surface border-border text-foreground-muted hover:text-foreground'
                }`}
                title="Tandai favorit"
              >
                <Heart className={`w-4 h-4 ${memory.is_favorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <p className="text-sm sm:text-base text-foreground leading-relaxed italic bg-surface-subtle/60 p-3.5 sm:p-4 rounded-2xl border border-border/80">
            "{memory.caption}"
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-xs text-foreground-subtle">
              Ditambahkan oleh <strong>{memory.creator_name || 'Kai'}</strong>
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1 sm:flex-initial"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Unduh Foto
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Apakah kamu yakin ingin menghapus kenangan ini dari brankas pasangan?')) {
                    onDelete(memory.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex-1 sm:flex-initial"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus
              </Button>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};
