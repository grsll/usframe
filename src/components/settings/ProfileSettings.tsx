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
    success('Profile and couple settings updated! ✨');
  };

  return (
    <form onSubmit={handleSave} className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
      
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        <span className="p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
          <User className="w-5 h-5" />
        </span>
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Personal & Couple Profile</h3>
          <p className="text-xs sm:text-sm text-foreground-muted">Update names, avatars, and relationship origins.</p>
        </div>
      </div>

      {/* Avatar Presets & Custom */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Your Profile Photo
        </label>
        <div className="flex items-center gap-3">
          <img
            src={avatar || avatarPresets[0]}
            alt="Current Avatar"
            className="w-16 h-16 rounded-full object-cover border-2 border-terracotta-500 shadow-sm"
          />
          <div className="flex gap-2">
            {avatarPresets.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setAvatar(preset)}
                className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                  avatar === preset ? 'border-terracotta-500 ring-2 ring-terracotta-500/20 scale-105' : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <img src={preset} alt="Preset" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Partner's Name"
          value={partner?.name || ''}
          disabled
          helperText="Linked with your partner's profile"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Your City"
          value={userCity}
          onChange={(e) => setUserCity(e.target.value)}
          placeholder="e.g. Tokyo, New York"
        />
        <Input
          label="Partner's City"
          value={partnerCity}
          onChange={(e) => setPartnerCity(e.target.value)}
          placeholder="e.g. Paris, London"
        />
      </div>

      <Input
        label="Relationship Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />

      <div className="pt-3 border-t border-border flex justify-end">
        <Button type="submit" variant="primary">
          Save Profile Changes
        </Button>
      </div>

    </form>
  );
};
