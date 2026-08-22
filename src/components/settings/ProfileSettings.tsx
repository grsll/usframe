import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { User } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, partner, couple, updateUser, updateCoupleSettings } = useAuth();
  const { success } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [userCity, setUserCity] = useState(couple?.user_city || 'Tokyo');
  const [partnerCity, setPartnerCity] = useState(couple?.partner_city || 'Paris');
  const [startDate, setStartDate] = useState(couple?.relationship_start_date || '2025-06-10');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80'
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, avatar });
    updateCoupleSettings({
      user_city: userCity,
      partner_city: partnerCity,
      relationship_start_date: startDate
    });
    success('Pengaturan profil dan pasangan berhasil diperbarui! ✨');
  };

  return (
    <form onSubmit={handleSave} className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft space-y-4 sm:space-y-6">
      
      <div className="flex items-center gap-2.5 border-b border-border pb-3 sm:pb-4">
        <span className="p-1.5 sm:p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
        <div>
          <h3 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">Profil Pribadi & Pasangan</h3>
          <p className="text-xs sm:text-sm text-foreground-muted">Perbarui nama, avatar, dan awal mula hubungan kalian.</p>
        </div>
      </div>

      {/* Avatar Presets & Custom */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Foto Profil Kamu
        </label>
        <div className="flex items-center gap-3">
          <img
            src={avatar || avatarPresets[0]}
            alt="Avatar Saat Ini"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-terracotta-500 shadow-sm shrink-0"
          />
          <div className="flex gap-2 overflow-x-auto">
            {avatarPresets.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setAvatar(preset)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  avatar === preset ? 'border-terracotta-500 ring-2 ring-terracotta-500/20 scale-105' : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <img src={preset} alt="Pilihan" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <Input
          label="Nama Kamu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Nama Pasangan"
          value={partner?.name || ''}
          disabled
          helperText="Terhubung dengan profil pasanganmu"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <Input
          label="Kota Asal Kamu"
          value={userCity}
          onChange={(e) => setUserCity(e.target.value)}
          placeholder="contoh: Tokyo, Jakarta"
        />
        <Input
          label="Kota Asal Pasangan"
          value={partnerCity}
          onChange={(e) => setPartnerCity(e.target.value)}
          placeholder="contoh: Paris, London"
        />
      </div>

      <Input
        label="Tanggal Awal Jadian / Menikah"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />

      <div className="pt-3 border-t border-border flex justify-end">
        <Button type="submit" variant="primary" className="w-full sm:w-auto">
          Simpan Perubahan Profil
        </Button>
      </div>

    </form>
  );
};
