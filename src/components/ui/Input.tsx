import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  helperText,
  error,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wider text-foreground-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-150 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500/20 disabled:opacity-50",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-foreground-subtle">{helperText}</p>
      ) : null}
    </div>
  );
});
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className,
  label,
  helperText,
  error,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wider text-foreground-muted">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-150 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500/20 disabled:opacity-50 resize-y min-h-[90px]",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-foreground-subtle">{helperText}</p>
      ) : null}
    </div>
  );
});
Textarea.displayName = 'Textarea';
