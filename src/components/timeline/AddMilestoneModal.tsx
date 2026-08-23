import React, { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Milestone } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Upload, Sparkles, Loader2 } from 'lucide-react';
import { imageCompression, formatFileSize } from '../../lib/imageCompression';
import { generateUuid, isUuid } from '../../lib/utils';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMilestone: (m: Milestone) => Promise<void> | void;
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  isOpen,
  onClose,
  onAddMilestone
}) => {
  const { couple } = useAuth();
  const { success, error: errorToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        errorToast('Format file tidak didukung. Harap pilih gambar (JPG, PNG, WebP).');
        return;
      }

      setIsCompressing(true);
      setCompressionStats(null);

      try {
        // Centralized Auto Compression (max 1600x1600 px, WebP, quality ~80%)
        const res = await imageCompression.compress(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.80,
          format: 'image/webp'
        });

        setImageUrl(res.dataUrl);
        setCompressionStats({
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
          reductionPercent: res.reductionPercent
        });
      } catch (err: any) {
        console.error('Image compression error:', err);
        errorToast('Gagal memproses gambar. Menggunakan file asli.');
        const reader = new FileReader();
        reader.onload = () => setImageUrl(reader.result as string);
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || isSubmitting || isCompressing) return;

    setIsSubmitting(true);

    try {
      const newMilestone: Milestone = {
        id: isUuid(couple?.id) ? generateUuid() : 'mile_' + Math.random().toString(36).substring(2, 9),
        couple_id: couple?.id || 'couple_main',
        title,
        description,
        date,
        location,
        image_url: imageUrl || undefined,
        category: 'dating',
        created_at: new Date().toISOString()
      };

      await onAddMilestone(newMilestone);
      success('Momen berharga baru berhasil diabadikan ke lini masa! ✨');
      onClose();

      // Reset
      setTitle('');
      setDescription('');
      setLocation('');
      setImageUrl('');
      setCompressionStats(null);
    } catch (err: any) {
      console.error('Add milestone error:', err);
      errorToast(err.message || 'Gagal menyimpan momen ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Momen Kisah"
      subtitle="Abadikan babak penting atau kenangan tak terlupakan dalam lini masa."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        <Input
          label="Judul Momen"
          placeholder="contoh: Pertama Kali Terbang ke Paris, Tinggal Bersama"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
            placeholder="contoh: Bandara CDG Paris, Tokyo, Roma"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <Textarea
          label="Cerita / Kenangan Lengkap"
          placeholder="Ceritakan apa yang terjadi dan mengapa momen ini begitu spesial bagi kalian..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Image Attachment */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Foto Momen (Opsional)
          </label>

          {isCompressing ? (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-terracotta-300 rounded-2xl bg-terracotta-50/50 dark:bg-terracotta-950/20">
              <Loader2 className="w-7 h-7 text-terracotta-500 animate-spin mb-1.5" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">Mengoptimalkan foto momen...</span>
              <span className="text-[11px] text-foreground-muted mt-0.5">Menyesuaikan ukuran & mengompres ke WebP hemat storage</span>
            </div>
          ) : imageUrl ? (
            <div className="space-y-2">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-900 border border-border">
                <img src={imageUrl} alt="Milestone preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setCompressionStats(null);
                  }}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-medium backdrop-blur-md cursor-pointer hover:bg-black"
                >
                  Ganti Foto
                </button>
              </div>

              {compressionStats && compressionStats.reductionPercent > 0 && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Auto-Compressed:</span>
                    <span className="line-through text-emerald-600/70">{formatFileSize(compressionStats.originalSize)}</span>
                    <span>→</span>
                    <span className="font-bold">{formatFileSize(compressionStats.compressedSize)}</span>
                  </div>
                  <span className="font-bold px-1.5 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-800 text-[10px]">
                    Hemat {compressionStats.reductionPercent}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-5 sm:p-6 border-2 border-dashed border-border hover:border-terracotta-400 rounded-2xl bg-surface-subtle/50 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 text-terracotta-500" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground">Unggah foto momen</span>
                <span className="text-[10px] text-foreground-muted">Otomatis dikompres ke WebP hemat cloud</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isCompressing}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={!title || !description || !date || isSubmitting || isCompressing}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Momen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
