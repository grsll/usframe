import React, { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Memory } from '../../types';
import { Upload, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isUuid, generateUuid } from '../../lib/utils';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMemory: (memory: Memory) => Promise<void> | void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onAddMemory
}) => {
  const { user, couple } = useAuth();
  const { success, error: errorToast } = useToast();

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string>('Kencan');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['Kencan', 'Perjalanan', 'Sehari-hari', 'Momen Spesial', 'Photobooth'];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mediaUrl || isUploading) return;

    setIsUploading(true);

    try {
      const newMem: Memory = {
        id: isUuid(couple?.id) ? generateUuid() : 'mem_' + Math.random().toString(36).substring(2, 9),
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

      await onAddMemory(newMem);
      success('Kenangan berhasil diunggah dan disimpan ke cloud brankas! 🤍');
      onClose();

      // Reset Form
      setTitle('');
      setCaption('');
      setLocation('');
      setMediaUrl('');
      setIsFavorite(false);
    } catch (err: any) {
      console.error('Add memory failed:', err);
      errorToast(err.message || 'Gagal mengunggah kenangan ke cloud storage.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Kenangan Baru"
      subtitle="Simpan foto dan cerita manis ke dalam brankas berdua."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        
        {/* Photo Upload / Preview */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Foto Kenangan
          </label>

          {mediaUrl ? (
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-stone-900 border border-border group">
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-medium backdrop-blur-md hover:bg-black cursor-pointer"
              >
                Ganti Foto
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-border hover:border-terracotta-400 rounded-2xl bg-surface-subtle/50 cursor-pointer transition-colors">
              <Upload className="w-7 h-7 text-terracotta-500 mb-1.5" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">Unggah foto dari perangkat</span>
              <span className="text-[11px] text-foreground-muted mt-0.5">JPG, PNG, WebP didukung</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

          {!mediaUrl && (
            <div className="pt-1">
              <Input
                placeholder="Atau tempel URL gambar langsung..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <Input
          label="Judul Kenangan"
          placeholder="contoh: Piknik Senja, Obrolan Ramen Jam 2 Pagi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Catatan / Cerita Berkesan"
          placeholder="Apa yang paling ingin kamu ingat dari hari ini?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Tanggal"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Lokasi (Opsional)"
            placeholder="contoh: Paris, Tokyo, Shibuya"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Kategori
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
        <div className="flex items-center gap-2 pt-1">
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
            <span>{isFavorite ? 'Ditandai sebagai Favorit 🤍' : 'Tandai sebagai Favorit'}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={!title || !mediaUrl || isUploading}>
            {isUploading ? 'Mengunggah ke Cloud Storage...' : 'Simpan Kenangan'}
          </Button>
        </div>

      </form>
    </Modal>
  );
};
