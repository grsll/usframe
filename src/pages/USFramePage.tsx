import React, { useState, useEffect } from 'react';
import { USFramePhoto, Memory } from '../types';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { roomService } from '../lib/roomService';
import { USFrameCamera } from '../components/usframe/USFrameCamera';
import { USFrameLiveDuo } from '../components/usframe/USFrameLiveDuo';
import { USFrameEditor } from '../components/usframe/USFrameEditor';
import { Camera, Sparkles, Users, Video } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const USFramePage: React.FC = () => {
  const { user, couple, partner } = useAuth();
  
  const [sessionStep, setSessionStep] = useState<'intro' | 'camera' | 'live_duo' | 'editor'>('intro');
  const [capturedPhotos, setCapturedPhotos] = useState<USFramePhoto[]>([]);

  const handleStartSoloBooth = () => {
    setSessionStep('camera');
  };

  const handleStartLiveDuo = () => {
    setSessionStep('live_duo');
  };

  const handleCompleteCamera = (photos: USFramePhoto[]) => {
    setCapturedPhotos(photos);
    setSessionStep('editor');
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setSessionStep('live_duo');
  };

  const handleSaveToMemories = async (renderedDataUrl: string, caption: string) => {
    await roomService.createMemory({
      coupleId: couple?.id || 'couple_main',
      uploaderId: user?.id || 'user_me',
      creatorName: user?.name || 'Kai',
      title: `Strip USFRAME • ${new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}`,
      caption: caption || 'Strip photobooth tenang yang diabadikan khusus berdua.',
      mediaUrl: renderedDataUrl,
      mediaType: 'usframe_strip',
      date: new Date().toISOString().split('T')[0],
      location: `${couple?.user_city || 'Jakarta'} ⇄ ${couple?.partner_city || 'Bandung'}`,
      category: 'Photobooth',
      isFavorite: true
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {sessionStep === 'intro' && (
        <div className="text-center max-w-3xl mx-auto py-6 sm:py-16 space-y-6 sm:space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-soft text-xs font-medium text-foreground-muted">
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Photobooth Interaktif & Live Duo Kamera</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-6xl font-normal tracking-tight text-foreground leading-[1.15]">
            Bikin kenangan manis berdua secara langsung.
          </h1>

          <p className="text-sm sm:text-lg text-foreground-muted max-w-lg mx-auto leading-relaxed">
            Buka kamera bersama pasanganmu dari dua tempat berbeda secara real-time, jepret berbarengan dalam split kanan-kiri, dan simpan strip kenangan ke brankas cinta.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Button
              onClick={handleStartLiveDuo}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-7 py-3.5 sm:py-4 text-base font-medium shadow-medium"
            >
              <Users className="w-5 h-5 mr-2" />
              <span>Studio Live Berdua (Kanan-Kiri) 📸</span>
            </Button>

            <Button
              onClick={handleStartSoloBooth}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 text-base font-medium"
            >
              <Camera className="w-5 h-5 mr-2" />
              <span>Strip 4 Pose Solo</span>
            </Button>
          </div>

          {/* Frame Style Preview Cards */}
          <div className="pt-6 sm:pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-soft">
              <span className="text-xs font-bold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider block">01</span>
              <h4 className="font-serif text-base font-semibold text-foreground">Split Duo Live</h4>
              <p className="text-xs text-foreground-muted">Foto kanan & kiri bersebelahan dengan cap tanggal & nama kota kalian.</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-soft">
              <span className="text-xs font-bold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider block">02</span>
              <h4 className="font-serif text-base font-semibold text-foreground">Terracotta Hangat</h4>
              <p className="text-xs text-foreground-muted">Warna tanah liat lembut dengan aksen tulisan tangan romantis.</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-soft">
              <span className="text-xs font-bold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider block">03</span>
              <h4 className="font-serif text-base font-semibold text-foreground">Film Analog 35mm</h4>
              <p className="text-xs text-foreground-muted">Perforasi rol film vintage & tekstur ISO 400 otentik.</p>
            </div>
          </div>

        </div>
      )}

      {sessionStep === 'live_duo' && (
        <USFrameLiveDuo
          onCompleteSession={handleCompleteCamera}
          onCancel={() => setSessionStep('intro')}
        />
      )}

      {sessionStep === 'camera' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3 sm:pb-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Kamera Studio USFRAME</h2>
              <p className="text-xs sm:text-sm text-foreground-muted">Bersiap untuk 4 pose terbaik kalian!</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSessionStep('intro')}>
              Batal
            </Button>
          </div>

          <USFrameCamera
            onCompleteSession={handleCompleteCamera}
            targetCount={4}
          />
        </div>
      )}

      {sessionStep === 'editor' && (
        <div className="space-y-4 sm:space-y-6">
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
