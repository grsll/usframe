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
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface border border-border rounded-3xl space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-foreground-muted flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-xs sm:text-sm text-foreground-muted max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button onClick={onAction} variant="outline" size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
