import React, { useState } from 'react';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { CoupleShareModal } from '../components/settings/CoupleShareModal';

export const SettingsPage: React.FC = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-4xl mx-auto">
      
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight">
          Settings & Couple Space
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1">
          Manage your personal identity, couple connection, and interface preferences.
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
