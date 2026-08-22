import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Image as ImageIcon, 
  Camera, 
  GitCommit, 
  HeartHandshake, 
  Settings 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navigation: React.FC = () => {
  const { currentView, setCurrentView } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'memories', label: 'Memories', icon: ImageIcon },
    { id: 'usframe', label: 'USFRAME', icon: Camera, isSignature: true },
    { id: 'timeline', label: 'Timeline', icon: GitCommit },
    { id: 'together', label: 'Together', icon: HeartHandshake },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Editorial Nav Bar */}
      <nav aria-label="Desktop Main Navigation" className="hidden md:flex items-center justify-center py-3 border-b border-border/80 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border rounded-2xl shadow-soft">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                  item.isSignature && !isActive && "text-terracotta-600 dark:text-terracotta-400 bg-terracotta-50/50 dark:bg-terracotta-950/40",
                  isActive && item.isSignature
                    ? "bg-terracotta-500 text-white shadow-sm font-semibold"
                    : isActive
                    ? "bg-surface text-foreground shadow-sm font-semibold border border-border/60"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface/50"
                )}
              >
                <Icon className={cn("w-4 h-4", item.isSignature && !isActive && "text-terracotta-500")} />
                <span>{item.label}</span>
                {item.isSignature && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-terracotta-100 dark:bg-terracotta-900 text-terracotta-800 dark:text-terracotta-200 rounded-md">
                    Booth
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Android / iOS Floating Bottom Dock */}
      <nav 
        aria-label="Mobile Navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg select-none"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            if (item.isSignature) {
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className="flex flex-col items-center justify-center -mt-6 group focus:outline-none cursor-pointer relative"
                  aria-label="Open USFRAME photobooth"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 group-active:scale-90 border-2 border-surface",
                    isActive ? "bg-terracotta-600 text-white ring-4 ring-terracotta-500/30 scale-105" : "bg-terracotta-500 text-white"
                  )}>
                    <Camera className="w-5 h-5 text-white animate-pulse-subtle" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold mt-1 tracking-tight",
                    isActive ? "text-terracotta-600 dark:text-terracotta-400" : "text-foreground-muted"
                  )}>
                    USFRAME
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 active:scale-90 min-w-[52px] cursor-pointer",
                  isActive ? "text-terracotta-600 dark:text-terracotta-400 font-semibold" : "text-foreground-muted hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-1 rounded-xl transition-colors",
                  isActive && "bg-terracotta-50 dark:bg-terracotta-950/60"
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.3]" : "stroke-[1.8]")} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
