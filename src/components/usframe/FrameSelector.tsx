import React from 'react';
import { USFrameTemplate, USFrameTemplateId } from '../../types';
import { USFRAME_TEMPLATES } from '../../data/initialData';
import { Check } from 'lucide-react';

interface FrameSelectorProps {
  selectedId: USFrameTemplateId;
  onSelect: (id: USFrameTemplateId) => void;
}

export const FrameSelector: React.FC<FrameSelectorProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        Choose Frame Design
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {USFRAME_TEMPLATES.map(template => {
          const isSelected = selectedId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                isSelected
                  ? 'border-terracotta-500 ring-2 ring-terracotta-500/20 bg-surface shadow-medium'
                  : 'border-border bg-surface hover:bg-surface-subtle hover:border-border-strong'
              }`}
            >
              <div className="space-y-2">
                {/* Mini Frame Preview Swatch */}
                <div className={`h-14 rounded-xl border border-border/80 flex items-center justify-center p-2 shadow-xs ${template.previewBg}`}>
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 opacity-70">
                    <div className="w-3/4 h-1.5 bg-current rounded-xs opacity-50" />
                    <div className="w-1/2 h-1 bg-current rounded-xs opacity-30" />
                  </div>
                </div>

                <div>
                  <h4 className="font-serif text-sm font-semibold text-foreground tracking-tight">
                    {template.name}
                  </h4>
                  <p className="text-[11px] text-foreground-muted line-clamp-2 mt-0.5 leading-snug">
                    {template.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
