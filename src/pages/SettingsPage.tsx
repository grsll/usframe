import React, { useState } from 'react';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { CoupleShareModal } from '../components/settings/CoupleShareModal';

export const SettingsPage: React.FC = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-4xl mx-auto">
      
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Pengaturan & Ruang Pasangan
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1">
          Kelola profil pribadi, tautan pasangan, serta preferensi tampilan aplikasi.
        </p>
      </div>

      <ProfileSettings />

      <AppearanceSettings onOpenInviteModal={() => setIsInviteModalOpen(true)} />

      <CoupleShareModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

    </div>
  );
};
