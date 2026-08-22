import React, { useState } from 'react';
import { USFramePhoto, Memory } from '../types';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { USFrameCamera } from '../components/usframe/USFrameCamera';
import { USFrameEditor } from '../components/usframe/USFrameEditor';
import { Camera, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const USFramePage: React.FC = () => {
  const { user, couple } = useAuth();
  
  const [sessionStep, setSessionStep] = useState<'intro' | 'camera' | 'editor'>('intro');
  const [capturedPhotos, setCapturedPhotos] = useState<USFramePhoto[]>([]);

  const handleStartBooth = () => {
    setSessionStep('camera');
  };

  const handleCompleteCamera = (photos: USFramePhoto[]) => {
    setCapturedPhotos(photos);
    setSessionStep('editor');
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setSessionStep('camera');
  };

  const handleSaveToMemories = (renderedDataUrl: string, caption: string) => {
    const newMemory: Memory = {
      id: 'mem_usframe_' + Math.random().toString(36).substring(2, 9),
      couple_id: couple?.id || 'couple_main',
      created_by: user?.id || 'user_me',
      creator_name: user?.name || 'Kai',
      title: `USFRAME Strip • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      caption: caption || 'A quiet photobooth strip captured for two.',
      media_url: renderedDataUrl,
      media_type: 'usframe_strip',
      date: new Date().toISOString().split('T')[0],
      location: `${couple?.user_city || 'Tokyo'} ⇄ ${couple?.partner_city || 'Paris'}`,
      category: 'Photobooth',
      is_favorite: true,
      created_at: new Date().toISOString()
    };

    storage.addMemory(newMemory);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {sessionStep === 'intro' && (
        <div className="text-center max-w-3xl mx-auto py-8 sm:py-16 space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-soft text-xs font-medium text-foreground-muted">
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Interactive Online Photobooth</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-foreground leading-[1.15]">
            Make a memory together.
          </h1>

          <p className="text-base sm:text-lg text-foreground-muted max-w-lg mx-auto leading-relaxed">
            Take 4 sequential photos with vintage shutter flashes, choose from handcrafted frames, add your notes, and save an authentic strip to your shared vault.
          </p>

          <div className="pt-2">
            <Button
              onClick={handleStartBooth}
              variant="primary"
              size="lg"
              className="px-8 py-4 text-base font-medium shadow-medium"
            >
              <Camera className="w-5 h-5 mr-2" />
              <span>Start USFRAME Booth</span>
            </Button>
          </div>

          {/* Frame Style Preview Carousel */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-soft">
              <span className="text-xs font-bold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider block">01</span>
              <h4 className="font-serif text-base font-semibold text-foreground">Minimal Editorial</h4>
              <p className="text-xs text-foreground-muted">Warm off-white, quiet spacing, serif headline.</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-soft">
              <span className="text-xs font-bold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider block">02</span>
              <h4 className="font-serif text-base font-semibold text-foreground">Warm Terracotta</h4>
              <p className="text-xs text-foreground-muted">Soft clay tones and handwritten script notes.</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-soft">
              <span className="text-xs font-bold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider block">03</span>
              <h4 className="font-serif text-base font-semibold text-foreground">Analog 35mm Film</h4>
              <p className="text-xs text-foreground-muted">Sprocket perforations & ISO 400 film grain.</p>
            </div>
          </div>

        </div>
      )}

      {sessionStep === 'camera' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">USFRAME Studio Camera</h2>
              <p className="text-xs sm:text-sm text-foreground-muted">Get ready for 4 poses!</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSessionStep('intro')}>
              Cancel
            </Button>
          </div>

          <USFrameCamera
            onCompleteSession={handleCompleteCamera}
            targetCount={4}
          />
        </div>
      )}

      {sessionStep === 'editor' && (
        <div className="space-y-6">
          <USFrameEditor
            photos={capturedPhotos}
            onRetake={handleRetake}
            onSaveToMemories={handleSaveToMemories}
          />
        </div>
      )}

    </div>
  );
};
