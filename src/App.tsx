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
import { Heart, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentView, isAuthenticated, pulseTriggered, clearPulse, sendHeartPulse, partner } = useAuth();

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
