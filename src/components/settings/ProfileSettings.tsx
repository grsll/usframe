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

  const isFirstMember = !couple?.member_ids || couple.member_ids.length === 0 || couple.member_ids[0] === user?.id;
  const myInitialCity = user?.location_name || (isFirstMember ? couple?.user_city : couple?.partner_city) || '';
  const partnerCity = partner?.location_name || (isFirstMember ? couple?.partner_city : couple?.user_city) || '';

  const [name, setName] = useState(user?.name || '');
  const [userCity, setUserCity] = useState(myInitialCity);
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
      if (user?.id) {
        const { cloudStorage } = await import('../../lib/cloudStorage');
        const cloudUrl = await cloudStorage.uploadAvatarImage(file, user.id);
        setAvatar(cloudUrl);
        success('Foto profil berhasil diunggah ke cloud! Klik Simpan untuk memperbarui.');
      } else {
        const compressed = await compressImage(file, 400, 0.85);
        setAvatar(compressed);
        success('Foto profil berhasil dimuat! Klik Simpan untuk memperbarui.');
      }
    } catch (err: any) {
      error(err.message || 'Gagal memproses foto profil. Silakan gunakan format JPG atau PNG.');
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
    updateUser({ name, avatar, location_name: userCity.trim() });
    if (couple) {
      updateCoupleSettings({
        user_city: userCity.trim(),
        relationship_start_date: startDate
      });
    }
    success('Pengaturan profil dan kota domisili berhasil diperbarui! ✨');
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
            label="Kota Domisili Kamu"
            value={userCity}
            onChange={(e) => setUserCity(e.target.value)}
            placeholder="contoh: Malang, Depok, Bandung"
            helperText={partnerCity 
              ? `Kota pasanganmu (${partner?.name || 'Pasangan'}): "${partnerCity}". Beranda akan menampilkan "${userCity.trim() || 'Kota Kamu'} × ${partnerCity}".` 
              : 'Kota pasanganmu tidak akan tertimpa dan akan tampil berdampingan di beranda.'}
          />

          <Input
            label="Tanggal Awal Jadian / Menikah"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        {/* Device Notification Settings */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <span>🔔 Notifikasi Perangkat (Native Device Push)</span>
              </h4>
              <p className="text-xs text-foreground-muted">
                Munculkan pesan cinta, sinyal rindu, dan ajakan foto langsung di layar HP/Laptopmu.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                const granted = await (await import('../../lib/deviceNotification')).deviceNotification.requestPermission();
                if (granted) {
                  success('Izin notifikasi perangkat aktif! 🔔');
                  (await import('../../lib/deviceNotification')).deviceNotification.send('USFRAME Terhubung 🤍', {
                    body: 'Notifikasi perangkatmu siap menerima sinyal dari pasangan.'
                  });
                } else {
                  error('Izin notifikasi tidak diaktifkan.');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              Tes / Aktifkan Notifikasi 🔔
            </button>
          </div>
        </div>

        {/* PWA App Install Settings */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <span>📲 Pasang Aplikasi ke Beranda (PWA)</span>
              </h4>
              <p className="text-xs text-foreground-muted">
                Jadikan USFRAME sebagai aplikasi mandiri di layar utama HP / Desktop tanpa bilah browser.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
                if (isIOS) {
                  alert("Untuk memasang di iPhone/iPad:\n1. Ketuk tombol Bagikan (Share) di Safari\n2. Pilih 'Tambahkan ke Layar Utama' (Add to Home Screen) 📲");
                } else {
                  alert("Untuk memasang di Android/Desktop:\nKetuk ikon menu browser (titik tiga) lalu pilih 'Pasang Aplikasi' atau 'Tambahkan ke Layar Utama' 📲");
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border hover:bg-terracotta-50 dark:hover:bg-terracotta-950/60 text-foreground text-xs font-semibold transition-colors cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5 justify-center"
            >
              <span>📲 Petunjuk Pasang ke HP</span>
            </button>
          </div>
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

