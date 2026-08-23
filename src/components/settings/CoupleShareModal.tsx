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

  const inviteCode = couple?.invite_code || '';
  const inviteUrl = inviteCode ? `${window.location.origin}/?invite=${inviteCode}` : window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    confetti({ particleCount: 25, spread: 40 });
    success('Tautan undangan berhasil disalin ke papan klip! 🤍');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    success(`Kode "${inviteCode}" berhasil disalin!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Undang Pasanganmu"
      subtitle="Bagikan ruang digital privat ini kepada belahan jiwamu."
      maxWidth="md"
    >
      <div className="space-y-4 sm:space-y-6 text-center">
        
        {/* Code Visual Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-terracotta-50/60 dark:bg-terracotta-950/40 border border-terracotta-200 dark:border-terracotta-800 space-y-1.5 sm:space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-terracotta-800 dark:text-terracotta-200 block">
            Kode Ruangan Privat Kalian
          </span>
          <div className="font-mono text-3xl sm:text-5xl font-bold tracking-wider text-terracotta-600 dark:text-terracotta-400 select-all">
            {inviteCode || 'Belum ada kode'}
          </div>
          <p className="text-xs text-foreground-muted max-w-xs mx-auto">
            Pasanganmu dapat memasukkan 6 karakter kode ini atau membuka tautan langsung untuk terhubung secara instan.
          </p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleCopyLink}
            variant="primary"
            size="lg"
            className="w-full font-medium shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            <span>{copied ? 'Tautan Tersalin!' : 'Salin Tautan Undangan'}</span>
          </Button>

          <Button
            onClick={handleCopyCode}
            variant="outline"
            size="md"
            className="w-full"
          >
            <span>{inviteCode ? `Salin Kode Saja (${inviteCode})` : 'Belum Ada Kode Undangan'}</span>
          </Button>
        </div>

        <p className="text-[11px] text-foreground-subtle">
          Ruang pasangan ini terenkripsi dan terisolasi khusus untuk kalian berdua.
        </p>

      </div>
    </Modal>
  );
};
