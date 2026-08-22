import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  className
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={cn(
          "relative w-full bg-surface border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-elevated overflow-hidden animate-slide-up flex flex-col max-h-[90vh] sm:max-h-[85vh]",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-border-strong rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border bg-surface-subtle/40 shrink-0">
            <div className="pr-4">
              {title && <h3 className="font-serif text-lg sm:text-2xl font-semibold text-foreground tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 -mt-1 text-foreground-muted hover:text-foreground hover:bg-surface-subtle rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
