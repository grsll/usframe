import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Modal } from '../layout/Modal';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in installed standalone mode
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(Boolean(standaloneMode));
    if (standaloneMode) return;

    // Check if user is on iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check dismissed cache in session
    const dismissed = sessionStorage.getItem('usframe_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Capture standard PWA install event (Android, Chrome, Edge, PC)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers that support install but didn't fire event yet
      setShowIOSModal(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('usframe_pwa_dismissed', 'true');
  };

  // If already installed or dismissed, don't show floating banner
  if (isStandalone || isDismissed) {
    return (
      <IOSInstructionsModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    );
  }

  return (
    <>
      <aside aria-label="Instalasi Aplikasi" className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-fade-in-up">
        <div className="bg-surface/95 backdrop-blur-md border-2 border-terracotta-500/30 rounded-3xl p-4 sm:p-4.5 shadow-elevated flex items-center justify-between gap-3 relative overflow-hidden group">
          
          {/* Subtle Glow Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-terracotta-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-md shrink-0 border border-terracotta-200 dark:border-terracotta-800">
              <img src="/icon.svg" alt="USFRAME App" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-foreground flex items-center gap-1.5 leading-tight">
                <span>Pasang USFRAME di HP</span>
                <span className="px-1.5 py-0.5 rounded-full bg-terracotta-100 dark:bg-terracotta-950 text-terracotta-700 dark:text-terracotta-300 text-[10px] font-sans font-bold">
                  App 🤍
                </span>
              </h4>
              <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">
                Buka langsung dari layar utama tanpa browser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleInstallClick}
              size="sm"
              variant="primary"
              className="text-xs font-semibold px-3 py-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Pasang</span>
            </Button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      <IOSInstructionsModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </>
  );
};

export const IOSInstructionsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Pasang di Layar Utama HP 📲"
      subtitle="Jadikan USFRAME seperti aplikasi asli di perangkatmu"
    >
      <div className="space-y-4 text-xs">
        
        {/* Step 1 */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-subtle border border-border">
          <div className="w-7 h-7 rounded-xl bg-terracotta-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <div className="space-y-0.5">
            <h5 className="font-semibold text-foreground text-sm">Buka Menu Bagikan (Share)</h5>
            <p className="text-foreground-muted">
              Di browser Safari (iPhone) atau Chrome (Android), ketuk ikon <strong>Bagikan / Opsi Menu</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-terracotta-500" />).
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-subtle border border-border">
          <div className="w-7 h-7 rounded-xl bg-terracotta-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <div className="space-y-0.5">
            <h5 className="font-semibold text-foreground text-sm">Pilih "Tambahkan ke Layar Utama"</h5>
            <p className="text-foreground-muted">
              Gulir menu ke bawah lalu pilih opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-800/80">
          <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h5 className="font-semibold text-terracotta-900 dark:text-terracotta-100 text-sm">Selesai! Buka Kapan Saja</h5>
            <p className="text-terracotta-800/80 dark:text-terracotta-300">
              Ikon USFRAME akan muncul di beranda HP kalian berdua dengan tampilan layar penuh & notifikasi aktif.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={onClose} variant="primary" className="w-full sm:w-auto">
            Mengerti ✨
          </Button>
        </div>

      </div>
    </Modal>
  );
};
