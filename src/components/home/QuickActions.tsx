import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Camera, PlusCircle, GitCommit, MessageCircleHeart } from 'lucide-react';

interface QuickActionsProps {
  onOpenAddMemory: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onOpenAddMemory }) => {
  const { setCurrentView } = useAuth();

  const actions = [
    {
      label: 'USFRAME',
      sublabel: '4-photo strip booth',
      icon: Camera,
      onClick: () => setCurrentView('usframe'),
      primary: true
    },
    {
      label: 'Add Memory',
      sublabel: 'Save photo & note',
      icon: PlusCircle,
      onClick: onOpenAddMemory,
      primary: false
    },
    {
      label: 'Together',
      sublabel: 'Daily prompts & notes',
      icon: MessageCircleHeart,
      onClick: () => setCurrentView('together'),
      primary: false
    },
    {
      label: 'Timeline',
      sublabel: 'Relationship story',
      icon: GitCommit,
      onClick: () => setCurrentView('timeline'),
      primary: false
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <button
            key={idx}
            onClick={action.onClick}
            className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between group active:scale-[0.96] cursor-pointer ${
              action.primary
                ? 'bg-terracotta-500 hover:bg-terracotta-600 border-terracotta-600 text-white shadow-soft'
                : 'bg-surface hover:bg-surface-subtle border-border text-foreground shadow-soft hover:border-border-strong'
            }`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 transition-transform group-hover:scale-110 shrink-0 ${
              action.primary ? 'bg-white/20 text-white' : 'bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500 border border-terracotta-100 dark:border-terracotta-900'
            }`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm sm:text-base font-semibold tracking-tight leading-tight">{action.label}</h4>
              <p className={`text-[11px] sm:text-xs mt-0.5 leading-tight truncate ${action.primary ? 'text-white/80' : 'text-foreground-muted'}`}>
                {action.sublabel}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
