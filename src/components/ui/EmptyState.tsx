import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-border rounded-2xl bg-surface/50 my-4 max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200/60 dark:border-terracotta-800/60 flex items-center justify-center text-terracotta-500 mb-4 shadow-sm">
        <Icon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-xl font-medium text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-foreground-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
