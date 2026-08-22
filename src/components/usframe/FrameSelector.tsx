import React from 'react';
import { USFRAME_TEMPLATES } from '../../data/initialData';
import { USFrameTemplateId } from '../../types';
import { Check } from 'lucide-react';

interface FrameSelectorProps {
  selectedId: USFrameTemplateId;
  onSelect: (id: USFrameTemplateId) => void;
}

export const FrameSelector: React.FC<FrameSelectorProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        Pilih Gaya Bingkai (Frame)
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {USFRAME_TEMPLATES.map(template => {
          const isSelected = selectedId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer active:scale-95 ${
                isSelected
                  ? 'border-terracotta-500 bg-terracotta-50/50 dark:bg-terracotta-950/60 ring-2 ring-terracotta-500/20 shadow-xs'
                  : 'border-border bg-surface hover:bg-surface-subtle'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Color swatch preview */}
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-5 h-5 rounded-lg border border-stone-300 shadow-2xs shrink-0" 
                  style={{ backgroundColor: template.bg }} 
                />
                <span className="font-serif text-sm font-semibold text-foreground truncate">
                  {template.name}
                </span>
              </div>

              <p className="text-[11px] text-foreground-muted leading-tight line-clamp-2">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
