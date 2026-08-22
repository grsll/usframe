import React, { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Milestone } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Upload } from 'lucide-react';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMilestone: (m: Milestone) => void;
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  isOpen,
  onClose,
  onAddMilestone
}) => {
  const { couple } = useAuth();
  const { success } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date) return;

    const newMilestone: Milestone = {
      id: 'mile_' + Math.random().toString(36).substring(2, 9),
      couple_id: couple?.id || 'couple_main',
      title,
      description,
      date,
      location,
      image_url: imageUrl || undefined,
      category: 'dating',
      created_at: new Date().toISOString()
    };

    onAddMilestone(newMilestone);
    success('Momen berharga baru berhasil ditambahkan ke kisah kalian! ✨');
    onClose();

    // Reset
    setTitle('');
    setDescription('');
    setLocation('');
    setImageUrl('');
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
          {imageUrl ? (
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-900 border border-border">
              <img src={imageUrl} alt="Milestone preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-medium backdrop-blur-md cursor-pointer"
              >
                Ganti Foto
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-5 sm:p-6 border-2 border-dashed border-border hover:border-terracotta-400 rounded-2xl bg-surface-subtle/50 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 text-terracotta-500" />
              <span className="text-xs font-medium text-foreground">Unggah foto momen</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={!title || !description}>
            Simpan Momen
          </Button>
        </div>
      </form>
    </Modal>
  );
};
