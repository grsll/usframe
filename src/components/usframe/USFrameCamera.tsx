import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, FlipHorizontal, Sparkles, AlertCircle, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { USFramePhoto } from '../../types';
import { playShutterSound } from '../../lib/utils';

interface USFrameCameraProps {
  onCompleteSession: (photos: USFramePhoto[]) => void;
  targetCount?: number;
}

export const USFrameCamera: React.FC<USFrameCameraProps> = ({
  onCompleteSession,
  targetCount = 4
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<USFramePhoto[]>([]);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);

  // Initialize camera stream
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. You can enable permissions or use sample snapshots.'
          : 'Camera is busy or unavailable. You can take automated snapshots or upload files.'
      );
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Flip camera between front and back
  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture a single frame from video element
  const takeSingleSnapshot = (): string => {
    if (videoRef.current && videoRef.current.videoWidth) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          // Mirror front camera
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    }

    // Fallback sample snapshot if camera is unavailable or denied
    const sampleStock = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80'
    ];
    return sampleStock[currentShotIndex % sampleStock.length];
  };

  // Start automated 4-shot photobooth sequence
  const startPhotoboothSequence = () => {
    setCapturedPhotos([]);
    setCurrentShotIndex(0);
    setIsSessionActive(true);
    runShotCountdown(1, []);
  };

  const runShotCountdown = (shotNum: number, currentList: USFramePhoto[]) => {
    setCurrentShotIndex(shotNum);
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        
        // Trigger Shutter Flash & Sound
        setIsFlashing(true);
        playShutterSound();
        setTimeout(() => setIsFlashing(false), 300);

        // Snap Photo
        const photoData = takeSingleSnapshot();
        const newPhoto: USFramePhoto = {
          id: `photo_${shotNum}_${Date.now()}`,
          dataUrl: photoData,
          timestamp: Date.now()
        };

        const updatedList = [...currentList, newPhoto];
        setCapturedPhotos(updatedList);

        if (shotNum < targetCount) {
          setTimeout(() => {
            runShotCountdown(shotNum + 1, updatedList);
          }, 1400);
        } else {
          setIsSessionActive(false);
          if (stream) {
            stream.getTracks().forEach(track => {
              track.stop();
              track.enabled = false;
            });
            setStream(null);
          }
          setTimeout(() => {
            onCompleteSession(updatedList);
          }, 600);
        }
      }
    }, 1000);
  };

  // Handle manual upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(0, targetCount);
      const photoPromises = files.map((file, idx) => {
        return new Promise<USFramePhoto>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `upload_${idx}_${Date.now()}`,
              dataUrl: reader.result as string,
              timestamp: Date.now()
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(photoPromises).then(photos => {
        setCapturedPhotos(photos);
        onCompleteSession(photos);
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Photobooth Stage Box */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-stone-950 rounded-3xl overflow-hidden shadow-photostrip border-2 sm:border-4 border-stone-800">
        
        {/* Real Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
        />

        {/* Shutter Flash Animation Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-40 animate-camera-flash" />
        )}

        {/* Countdown Big Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs">
            <span className="font-serif text-7xl sm:text-9xl font-bold text-white drop-shadow-2xl animate-pulse">
              {countdown}
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white/90 mt-2 sm:mt-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/50">
              Pose! Shot {currentShotIndex} of {targetCount}
            </span>
          </div>
        )}

        {/* Top Floating Controls */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>USFRAME BOOTH</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleFacingMode}
              disabled={isSessionActive}
              className="p-2 sm:p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors active:scale-95 cursor-pointer"
              title="Flip camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => startCamera(facingMode)}
              disabled={isSessionActive}
              className="p-2 sm:p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors active:scale-95 cursor-pointer"
              title="Restart camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shot Counter Indicators */}
        <div className="absolute bottom-3 sm:bottom-4 left-4 right-4 z-20 flex items-center justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: targetCount }).map((_, i) => {
            const isFilled = capturedPhotos.length > i;
            const isCurrent = currentShotIndex === i + 1 && isSessionActive;
            return (
              <div
                key={i}
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                  isFilled
                    ? 'w-6 sm:w-8 bg-terracotta-500'
                    : isCurrent
                    ? 'w-8 sm:w-10 bg-white animate-pulse'
                    : 'w-3 sm:w-4 bg-white/40'
                }`}
              />
            );
          })}
        </div>

      </div>

      {/* Camera Warning / Permission Fallback Info */}
      {cameraError && (
        <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 sm:gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">{cameraError}</p>
            <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px]">
              Click "Start 4-Shot Booth" to take automated snapshots, or upload photos from gallery.
            </p>
          </div>
        </div>
      )}

      {/* Action Triggers */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-md">
        <Button
          onClick={startPhotoboothSequence}
          disabled={isSessionActive}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto flex-1 font-semibold text-sm sm:text-base py-3 sm:py-3.5 shadow-md active:scale-95"
        >
          <Camera className="w-5 h-5 mr-2" />
          <span>{isSessionActive ? `Snapping (${capturedPhotos.length}/${targetCount})...` : 'Start 4-Shot Booth'}</span>
        </Button>

        <label className="w-full sm:w-auto inline-flex items-center justify-center font-medium transition-all duration-150 border border-border bg-surface hover:bg-surface-subtle text-foreground text-sm sm:text-base px-5 py-2.5 sm:py-3 rounded-xl gap-2 font-semibold cursor-pointer shadow-xs active:scale-95">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <span>Upload Photos</span>
        </label>
      </div>

      <p className="text-[11px] sm:text-xs text-foreground-muted text-center max-w-sm px-2">
        Click Start to take 4 sequential photos with a 3-second countdown between each shot, just like a real photobooth.
      </p>

    </div>
  );
};
