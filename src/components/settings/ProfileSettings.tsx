import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { User, Upload, X, UserPlus, Unlink } from 'lucide-react';
import { compressImage, generateInitialsAvatar } from '../../lib/utils';
import { CoupleShareModal } from './CoupleShareModal';

export const ProfileSettings: React.FC = () => {
  const { user, partner, couple, updateUser, updateCoupleSettings, leaveCoupleRoom, setCurrentView } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [userCity, setUserCity] = useState(couple?.user_city || 'Jakarta');
  const [startDate, setStartDate] = useState(couple?.relationship_start_date || new Date().toISOString().split('T')[0]);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = !partner || couple?.status === 'pending';
  const previewAvatar = avatar || generateInitialsAvatar(name || user?.name || 'Kamu');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400, 0.85);
      setAvatar(compressed);
      success('Foto profil berhasil dimuat! Klik Simpan untuk memperbarui.');
    } catch (err) {
      error('Gagal memproses file foto. Coba gambar lain.');
    }
  };

  const handleRemovePhoto = () => {
    const defaultInitial = generateInitialsAvatar(name || user?.name || 'Kamu');
    setAvatar(defaultInitial);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    success('Foto profil dihapus (menggunakan inisial nama).');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, avatar });
    if (couple) {
      updateCoupleSettings({
        user_city: userCity,
        relationship_start_date: startDate
      });
    }
    success('Pengaturan profil dan ruangan berhasil diperbarui! ✨');
  };

  const handleLeaveRoom = () => {
    if (confirm('Apakah kamu yakin ingin melepaskan/keluar dari ruangan ini?')) {
      leaveCoupleRoom();
      success('Berhasil keluar dari ruangan.');
    }
  };

  return (
    <>
      <form onSubmit={handleSave} className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft space-y-5 sm:space-y-6">
        
        <div className="flex items-center gap-2.5 border-b border-border pb-3 sm:pb-4">
          <span className="p-1.5 sm:p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div>
            <h3 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">Profil Pribadi & Ruang Pasangan</h3>
            <p className="text-xs sm:text-sm text-foreground-muted">Kelola foto profil yang diunggah, nama, dan pengaturan ruang kalian.</p>
          </div>
        </div>

        {/* Dedicated Photo Upload Zone */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Foto Profil Kamu (Dari Hasil Unggahan Sendiri)
          </label>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="relative shrink-0">
              <img
                src={previewAvatar}
                alt="Foto Profil"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-3 border-terracotta-500 shadow-sm bg-surface"
              />
              {avatar && avatar !== generateInitialsAvatar(name || user?.name || '') && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm cursor-pointer"
                  title="Hapus foto profil"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="profile-photo-file-input"
                />
                <label
                  htmlFor="profile-photo-file-input"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-border text-xs font-medium text-foreground transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4 text-terracotta-500" />
                  <span>Pilih Foto Baru dari Galeri</span>
                </label>

                {avatar && avatar !== generateInitialsAvatar(name || user?.name || '') && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-2 rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Gunakan Inisial
                  </button>
                )}
              </div>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                Foto profil 100% diambil dari file gambar yang kamu unggah sendiri tanpa foto preset orang asing.
              </p>
            </div>
          </div>
        </div>

        {/* User & Partner Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Input
            label="Nama Kamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {isPending ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Status Pasangan
              </label>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-200 font-medium">Menunggu pasangan bergabung</span>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-amber-700 dark:text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Undang</span>
                </button>
              </div>
            </div>
          ) : (
            <Input
              label="Nama Pasangan (Terhubung)"
              value={partner?.name || ''}
              disabled
              helperText={`Terhubung dengan akun ${partner?.email || ''}`}
            />
          )}
        </div>

        {/* City & Relationship Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Input
            label="Kota Asal Kamu"
            value={userCity}
            onChange={(e) => setUserCity(e.target.value)}
            placeholder="contoh: Jakarta, Surabaya, Tokyo"
          />

          <Input
            label="Tanggal Awal Jadian / Menikah"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentView('onboarding')}
              className="text-xs text-terracotta-600 dark:text-terracotta-400 hover:underline flex items-center gap-1.5 px-3 py-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-800 transition-colors cursor-pointer font-medium"
            >
              <span>📂 Hub & Riwayat Ruangan</span>
            </button>

            {couple && (
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Tinggalkan Ruang</span>
              </button>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full sm:w-auto ml-auto">
            Simpan Perubahan Profil
          </Button>
        </div>

      </form>

      <CoupleShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};

