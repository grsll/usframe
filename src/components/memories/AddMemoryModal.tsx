import React, { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Memory, MemoryCategory } from '../../types';
import { Upload, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMemory: (memory: Memory) => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onAddMemory
}) => {
  const { user, couple } = useAuth();
  const { success } = useToast();

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('Date');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const categories: MemoryCategory[] = ['Date', 'Travel', 'Everyday', 'Milestone', 'Photobooth'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mediaUrl) return;

    const newMem: Memory = {
      id: 'mem_' + Math.random().toString(36).substring(2, 9),
      couple_id: couple?.id || 'couple_main',
      created_by: user?.id || 'user_me',
      creator_name: user?.name || 'Kai',
      title,
      caption,
      media_url: mediaUrl,
      media_type: category === 'Photobooth' ? 'usframe_strip' : 'image',
      date,
      location,
      category,
      is_favorite: isFavorite,
      created_at: new Date().toISOString()
    };

    onAddMemory(newMem);
    success('Memory saved to your couple vault! 🤍');
    onClose();

    // Reset Form
    setTitle('');
    setCaption('');
    setLocation('');
    setMediaUrl('');
    setIsFavorite(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Memory"
      subtitle="Save a quiet photo and reflection into your shared vault."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Photo Upload / Preview */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Memory Photo
          </label>

          {mediaUrl ? (
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-stone-900 border border-border group">
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-medium backdrop-blur-md hover:bg-black cursor-pointer"
              >
                Change Photo
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border hover:border-terracotta-400 rounded-2xl bg-surface-subtle/50 cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-terracotta-500 mb-2" />
              <span className="text-sm font-semibold text-foreground">Upload photo from device</span>
              <span className="text-xs text-foreground-muted mt-0.5">JPG, PNG, WebP supported</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

          {!mediaUrl && (
            <div className="pt-1">
              <Input
                placeholder="Or paste an image URL directly..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <Input
          label="Memory Title"
          placeholder="e.g. Sunset Picnic, 2 AM Ramen Talk"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Heartfelt Note / Caption"
          placeholder="What do you want to remember about this day?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Location (Optional)"
            placeholder="e.g. Paris, Tokyo, Shinjuku"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  category === cat
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/80 text-terracotta-700 dark:text-terracotta-300 font-semibold'
                    : 'border-border bg-surface text-foreground-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mark Favorite Toggle */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 text-rose-600'
                : 'bg-surface border-border text-foreground-muted'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            <span>{isFavorite ? 'Marked as Favorite 🤍' : 'Mark as Favorite'}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!title || !mediaUrl}>
            Save Memory
          </Button>
        </div>

      </form>
    </Modal>
  );
};
