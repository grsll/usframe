import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../layout/Modal';
import { Button } from '../ui/Button';
import { Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoupleShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoupleShareModal: React.FC<CoupleShareModalProps> = ({ isOpen, onClose }) => {
  const { couple } = useAuth();
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const inviteCode = couple?.invite_code || 'US7788';
  const inviteUrl = `${window.location.origin}/?invite=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    confetti({ particleCount: 25, spread: 40 });
    success('Invitation link copied to clipboard! 🤍');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    success(`Code "${inviteCode}" copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Your Partner"
      subtitle="Share your private digital space with your other half."
      maxWidth="md"
    >
      <div className="space-y-6 text-center">
        
        {/* Code Visual Card */}
        <div className="p-6 rounded-3xl bg-terracotta-50/60 dark:bg-terracotta-950/40 border border-terracotta-200 dark:border-terracotta-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-terracotta-800 dark:text-terracotta-200 block">
            Your Private Couple Code
          </span>
          <div className="font-mono text-4xl sm:text-5xl font-bold tracking-wider text-terracotta-600 dark:text-terracotta-400 select-all">
            {inviteCode}
          </div>
          <p className="text-xs text-foreground-muted max-w-xs mx-auto">
            Your partner can enter this 6-letter code or click the direct invitation link below to pair instantly.
          </p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2.5">
          <Button
            onClick={handleCopyLink}
            variant="primary"
            size="lg"
            className="w-full font-medium shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            <span>{copied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
          </Button>

          <Button
            onClick={handleCopyCode}
            variant="outline"
            size="md"
            className="w-full"
          >
            <span>Copy Code Only ({inviteCode})</span>
          </Button>
        </div>

        <p className="text-xs text-foreground-subtle">
          This couple space is encrypted and completely isolated to the two of you.
        </p>

      </div>
    </Modal>
  );
};
