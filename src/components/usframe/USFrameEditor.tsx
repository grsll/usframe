import React, { useState, useEffect } from 'react';
import { USFrameCustomization, USFramePhoto } from '../../types';
import { USFRAME_TEMPLATES, PHOTO_FILTERS, PHOTO_STAMPS } from '../../data/initialData';
import { FrameSelector } from './FrameSelector';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { renderUSFrameCanvas } from '../../lib/photobooth';
import { Sparkles, Download, Save, RefreshCw, Type, Filter, Stamp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../../lib/utils';

interface USFrameEditorProps {
  photos: USFramePhoto[];
  onRetake: () => void;
  onSaveToMemories: (renderedDataUrl: string, caption: string) => void;
}

export const USFrameEditor: React.FC<USFrameEditorProps> = ({
  photos,
  onRetake,
  onSaveToMemories
}) => {
  const [customization, setCustomization] = useState<USFrameCustomization>({
    templateId: 'minimal',
    customText: 'US — A Little Place for Two',
    showDate: true,
    customDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    frameColor: '#FAF8F5',
    filter: 'natural',
    stamp: 'us_logo',
    fontStyle: 'serif',
    layout: 'strip-4'
  });

  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Re-render composite canvas preview whenever customization changes
  useEffect(() => {
    let isCurrent = true;
    const generate = async () => {
      setIsRendering(true);
      try {
        const url = await renderUSFrameCanvas({ photos, customization });
        if (isCurrent) {
          setPreviewDataUrl(url);
        }
      } catch (err) {
        console.error('Render preview error:', err);
      } finally {
        if (isCurrent) setIsRendering(false);
      }
    };

    generate();
    return () => {
      isCurrent = false;
    };
  }, [photos, customization]);

  const handleDownload = () => {
    if (!previewDataUrl) return;
    const link = document.createElement('a');
    link.download = `USFRAME_${new Date().toISOString().split('T')[0]}.png`;
    link.href = previewDataUrl;
    link.click();

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.85 }
    });
  };

  const handleSave = () => {
    if (!previewDataUrl) return;
    setIsSaved(true);
    playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 }
    });
    onSaveToMemories(previewDataUrl, customization.customText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start max-w-6xl mx-auto">
      
      {/* Left: Real Photo Strip Canvas Preview */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center order-1 lg:order-1 w-full">
        <div className="w-full max-w-[280px] sm:max-w-[340px] flex flex-col items-center mx-auto">
          
          <div className="relative p-2.5 sm:p-3 bg-stone-200/50 dark:bg-stone-800/50 rounded-3xl backdrop-blur-md shadow-elevated border border-border w-full">
            {isRendering && (
              <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-xs flex items-center justify-center rounded-3xl">
                <span className="text-xs font-medium text-foreground flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface shadow-md border border-border">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta-500 animate-spin" />
                  Generating Strip...
                </span>
              </div>
            )}
            
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="USFRAME Photobooth Strip"
                className="w-full h-auto rounded-2xl shadow-photostrip transition-all duration-300 select-none border border-stone-200 dark:border-stone-800"
              />
            ) : (
              <div className="h-[360px] sm:h-[480px] flex items-center justify-center text-foreground-muted text-xs">
                Rendering photostrip...
              </div>
            )}
          </div>

          <p className="text-[11px] text-foreground-subtle text-center mt-2.5">
            High-resolution 300DPI export ready
          </p>

        </div>
      </div>

      {/* Right: Customization Controls */}
      <div className="lg:col-span-7 bg-surface border border-border rounded-3xl p-5 sm:p-8 shadow-soft space-y-5 sm:space-y-6 order-2 lg:order-2">
        
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Customize Your USFRAME
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Personalize typography, frame theme, and intimate stamps.
            </p>
          </div>

          <button
            onClick={onRetake}
            className="text-xs font-medium text-foreground-muted hover:text-foreground flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border hover:bg-surface-subtle transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake</span>
          </button>
        </div>

        {/* 1. Frame Style Selector */}
        <FrameSelector
          selectedId={customization.templateId}
          onSelect={(id) => {
            const t = USFRAME_TEMPLATES.find(x => x.id === id);
            setCustomization(prev => ({
              ...prev,
              templateId: id,
              layout: t?.layout || 'strip-4'
            }));
          }}
        />

        {/* 2. Photo Filters */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Color Filter</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
            {PHOTO_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setCustomization(prev => ({ ...prev, filter: f.id }))}
                className={`py-2 px-1.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer truncate ${
                  customization.filter === f.id
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/80 text-terracotta-700 dark:text-terracotta-300 font-semibold'
                    : 'border-border bg-surface text-foreground-muted hover:bg-surface-subtle'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Text & Caption */}
        <div className="space-y-3.5 sm:space-y-4">
          <Input
            label="Strip Caption / Title"
            placeholder="e.g. Rainy Afternoon in Paris, Us in Shibuya"
            value={customization.customText}
            onChange={(e) => setCustomization(prev => ({ ...prev, customText: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Date Display"
              value={customization.customDate}
              onChange={(e) => setCustomization(prev => ({ ...prev, customDate: e.target.value }))}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-terracotta-500" />
                <span>Font Style</span>
              </label>
              <select
                value={customization.fontStyle}
                onChange={(e) => setCustomization(prev => ({ ...prev, fontStyle: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-terracotta-500"
              >
                <option value="serif">Editorial Serif (Playfair)</option>
                <option value="script">Handwritten Script (Caveat)</option>
                <option value="sans">Modern Sans (Plus Jakarta)</option>
                <option value="mono">Analog Monospace (Film)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Stamps & Emblems */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Stamp className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Couple Stamp</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
            {PHOTO_STAMPS.map(st => (
              <button
                key={st.id}
                onClick={() => setCustomization(prev => ({ ...prev, stamp: st.id === 'none' ? '' : st.label }))}
                className={`py-2 px-2 rounded-xl text-xs font-medium border text-left transition-all truncate cursor-pointer ${
                  (customization.stamp === st.label || (st.id === 'none' && !customization.stamp))
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950/80 text-terracotta-700 dark:text-terracotta-300 font-semibold'
                    : 'border-border bg-surface text-foreground-muted hover:bg-surface-subtle'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save & Download Action Bar */}
        <div className="pt-4 sm:pt-6 border-t border-border flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaved}
            variant="primary"
            size="lg"
            className="w-full sm:flex-1 py-3 sm:py-3.5 font-medium shadow-sm active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            <span>{isSaved ? 'Saved to Memories! 🤍' : 'Add to Shared Memories'}</span>
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto py-3 sm:py-3.5 active:scale-95"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>Download PNG</span>
          </Button>
        </div>

      </div>

    </div>
  );
};
