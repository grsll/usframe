import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { MemoriesPage } from './pages/MemoriesPage';
import { USFramePage } from './pages/USFramePage';
import { TimelinePage } from './pages/TimelinePage';
import { TogetherPage } from './pages/TogetherPage';
import { SettingsPage } from './pages/SettingsPage';
import { PWAInstallBanner } from './components/ui/PWAInstallBanner';
import { Heart, X, Camera, Sparkles } from 'lucide-react';
import { Button } from './components/ui/Button';

const AppContent: React.FC = () => {
  const { 
    currentView, 
    isAuthenticated, 
    pulseTriggered, 
    clearPulse, 
    boothInviteReceived, 
    acceptBoothInvite, 
    declineBoothInvite 
  } = useAuth();

  // Public / Auth Views
  if (currentView === 'landing') {
    return <LandingPage />;
  }

  if (currentView === 'auth') {
    return <AuthPage />;
  }

  if (currentView === 'onboarding') {
    return <OnboardingPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-terracotta-200">
      
      {/* Top Header */}
      <Header />

      {/* Main Navigation (Desktop Top Bar / Mobile Bottom Floating Dock) */}
      <Navigation />

      {/* Live Photobooth Invite Alert Modal */}
      {boothInviteReceived && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-md w-[92vw] px-2">
          <div className="bg-surface/95 border-2 border-terracotta-400 shadow-elevated rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center shadow-md shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {boothInviteReceived.fromName} Mengajak Foto Bareng! 📸
                </h4>
                <p className="text-[11px] text-foreground-muted truncate">
                  Buka kamera studio berdua split kanan-kiri sekarang.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={declineBoothInvite}
                className="px-3 py-1.5 rounded-xl border border-border text-xs text-foreground-muted hover:text-foreground cursor-pointer"
              >
                Nanti Saja
              </button>
              <Button
                onClick={acceptBoothInvite}
                variant="primary"
                size="sm"
                className="shadow-soft whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Buka Kamera ✨</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Heart Pulse Alert Notification */}
      {pulseTriggered && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-sm w-[92vw] px-2">
          <div className="bg-rose-50/95 dark:bg-rose-950/90 border-2 border-rose-300 dark:border-rose-700 shadow-elevated rounded-2xl p-3.5 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center animate-pulse shrink-0">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-100 truncate">
                  {pulseTriggered.from} Mengirimkan Sinyal Rindu!
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 truncate">
                  {pulseTriggered.message}
                </p>
              </div>
            </div>
            <button
              onClick={clearPulse}
              className="text-rose-500 hover:text-rose-800 p-1 shrink-0 cursor-pointer"
              aria-label="Tutup notifikasi rindu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area with mobile safe padding for bottom bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-12">
        {currentView === 'home' && <HomePage />}
        {currentView === 'memories' && <MemoriesPage />}
        {currentView === 'usframe' && <USFramePage />}
        {currentView === 'timeline' && <TimelinePage />}
        {currentView === 'together' && <TogetherPage />}
        {currentView === 'settings' && <SettingsPage />}
      </main>

      {/* Progressive Web App (PWA) Install to Home Screen Prompt */}
      <PWAInstallBanner />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
