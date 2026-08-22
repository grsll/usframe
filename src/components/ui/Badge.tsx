import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'terracotta' | 'sage' | 'amber' | 'rose' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className
}) => {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 rounded-md",
    md: "text-xs px-2.5 py-1 rounded-lg"
  };

  const variantStyles = {
    default: "bg-surface-subtle text-foreground-muted border border-border",
    terracotta: "bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/80 dark:border-terracotta-800/80",
    sage: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80",
    amber: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80",
    rose: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80",
    outline: "border border-border text-foreground-muted"
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium transition-colors select-none", sizeStyles[size], variantStyles[variant], className)}>
      {children}
    </span>
  );
};
