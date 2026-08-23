import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { USFramePhoto } from '../../types';
import { playShutterSound, playSuccessChime } from '../../lib/utils';
import { Camera, RefreshCw, UserPlus, Users, Sparkles, AlertCircle, Heart, CheckCircle2, Play, FlipHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface USFrameLiveDuoProps {
  onCompleteSession: (photos: USFramePhoto[]) => void;
  onCancel: () => void;
}

// Helper to draw image with object-fit: cover onto canvas
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = (img.width || 1) / (img.height || 1);
  const targetRatio = w / h;
  let sx = 0, sy = 0, sw = img.width || 1, sh = img.height || 1;

  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Helper to merge Left and Right photos into 1 split-duo image
async function createSplitDuoFrame(
  leftDataUrl: string,
  rightDataUrl: string,
  leftLabel: string,
  rightLabel: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(leftDataUrl);
      return;
    }

    const imgLeft = new Image();
    const imgRight = new Image();
    let loaded = 0;

    const onBothLoaded = () => {
      // Left 50% (Me)
      drawImageCover(ctx, imgLeft, 0, 0, 600, 800);
      // Right 50% (Partner)
      drawImageCover(ctx, imgRight, 600, 0, 600, 800);

      // Center Divider line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(600, 0);
      ctx.lineTo(600, 800);
      ctx.stroke();

      // Subtle Center Heart Emblem
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(600, 400, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#D95D39';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🤍', 600, 406);

      // Left badge (city / name)
      if (leftLabel) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(20, 735, ctx.measureText(leftLabel).width + 30, 42, 12);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 17px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(leftLabel, 35, 762);
      }

      // Right badge (city / name)
      if (rightLabel) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        const w = ctx.measureText(rightLabel).width + 30;
        ctx.beginPath();
        ctx.roundRect(1180 - w, 735, w, 42, 12);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 17px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(rightLabel, 1165, 762);
      }

      try {
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        console.warn('Canvas export warning:', err);
        resolve(leftDataUrl);
      }
    };

    imgLeft.crossOrigin = 'anonymous';
    imgRight.crossOrigin = 'anonymous';
    imgLeft.onload = () => { loaded++; if (loaded === 2) onBothLoaded(); };
    imgRight.onload = () => { loaded++; if (loaded === 2) onBothLoaded(); };
    imgLeft.onerror = () => { loaded++; if (loaded === 2) onBothLoaded(); };
    imgRight.onerror = () => { loaded++; if (loaded === 2) onBothLoaded(); };

    imgLeft.src = leftDataUrl;
    imgRight.src = rightDataUrl;
  });
}

export const USFrameLiveDuo: React.FC<USFrameLiveDuoProps> = ({
  onCompleteSession,
  onCancel
}) => {
  const { user, partner, couple } = useAuth();
  const { success, error, info } = useToast();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteFallbackImg, setRemoteFallbackImg] = useState<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [partnerOnline, setPartnerOnline] = useState<boolean>(false);
  const [isInviting, setIsInviting] = useState<boolean>(false);

  // 4-Shot Photobooth Session State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [currentPose, setCurrentPose] = useState<number>(0);
  const [capturedDuoPhotos, setCapturedDuoPhotos] = useState<USFramePhoto[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const previewIntervalRef = useRef<number | null>(null);
  const latestRemotePhotoRef = useRef<string | null>(null);

  // Stop camera tracks and clean up video elements
  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setLocalStream(null);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, [localStream]);

  // Initialize Local Webcam
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Akses kamera tidak didukung di browser ini.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Izin kamera belum diberikan atau kamera sedang digunakan aplikasi lain.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Capture single local frame from video element
  const captureLocalFrame = (): string => {
    if (localVideoRef.current && localVideoRef.current.videoWidth) {
      const video = localVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.95);
      }
    }
    return user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800';
  };

  // Realtime Broadcast Channel & Continuous Video Sync
  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase.channel(`couple_room_${couple.id}`);

    // Create RTCPeerConnection for WebRTC video
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'booth_webrtc_ice',
          payload: { candidate: event.candidate, senderId: user?.id }
        }).catch(() => null);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setPartnerOnline(true);
      }
    };

    channel
      .on('broadcast', { event: 'booth_join' }, async (payload) => {
        if (payload.payload?.senderId !== user?.id) {
          setPartnerOnline(true);
          setIsInviting(false);
          info(`${payload.payload?.name || 'Pasangan'} telah masuk ke kamera studio! 📸`);

          if (localStream) {
            localStream.getTracks().forEach(track => {
              try { pc.addTrack(track, localStream); } catch {}
            });
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({
              type: 'broadcast',
              event: 'booth_webrtc_offer',
              payload: { offer, senderId: user?.id }
            }).catch(() => null);
          }
        }
      })
      .on('broadcast', { event: 'booth_webrtc_offer' }, async (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.offer) {
          setPartnerOnline(true);
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.offer));
          if (localStream) {
            localStream.getTracks().forEach(track => {
              try { pc.addTrack(track, localStream); } catch {}
            });
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: 'broadcast',
            event: 'booth_webrtc_answer',
            payload: { answer, senderId: user?.id }
          }).catch(() => null);
        }
      })
      .on('broadcast', { event: 'booth_webrtc_answer' }, async (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
        }
      })
      .on('broadcast', { event: 'booth_webrtc_ice' }, async (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
          } catch {}
        }
      })
      .on('broadcast', { event: 'booth_preview_frame' }, (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.dataUrl) {
          setRemoteFallbackImg(payload.payload.dataUrl);
          latestRemotePhotoRef.current = payload.payload.dataUrl;
          setPartnerOnline(true);
        }
      })
      .on('broadcast', { event: 'booth_shot_exchange' }, (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.dataUrl) {
          latestRemotePhotoRef.current = payload.payload.dataUrl;
        }
      })
      .on('broadcast', { event: 'booth_countdown_start' }, (payload) => {
        const poseIndex = payload.payload?.pose || 1;
        runShotCountdown(poseIndex);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'booth_join',
            payload: { senderId: user?.id, name: user?.name }
          }).catch(() => null);
        }
      });

    // Fast continuous video snapshot broadcasting (400ms)
    previewIntervalRef.current = window.setInterval(() => {
      if (localVideoRef.current && localVideoRef.current.videoWidth) {
        const v = localVideoRef.current;
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 240;
        const ctx = c.getContext('2d');
        if (ctx) {
          if (facingMode === 'user') {
            ctx.translate(320, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(v, 0, 0, 320, 240);
          const mini = c.toDataURL('image/jpeg', 0.5);
          channel.send({
            type: 'broadcast',
            event: 'booth_preview_frame',
            payload: { senderId: user?.id, dataUrl: mini }
          }).catch(() => null);
        }
      }
    }, 400);

    return () => {
      supabase.removeChannel(channel);
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, [couple?.id, user?.id, user?.name, localStream, facingMode]);

  // Send Push / Broadcast Invite to Partner
  const handleSendInvite = async () => {
    if (!couple?.id) return;
    setIsInviting(true);

    try {
      const channel = supabase.channel(`couple_room_${couple.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'booth_invite',
        payload: {
          fromId: user?.id,
          fromName: user?.name || 'Pasanganmu',
          timestamp: Date.now()
        }
      });
      success(`Undangan photobooth telah dikirimkan ke ${partner?.name || 'pasanganmu'}! 📸`);
    } catch {
      error('Gagal mengirim undangan. Coba lagi.');
    } finally {
      setIsInviting(false);
    }
  };

  // Automated 4-Pose Photobooth Sequence
  const startDuoPhotobooth = async () => {
    setCapturedDuoPhotos([]);
    setCurrentPose(1);
    setIsSessionActive(true);

    if (couple?.id) {
      const channel = supabase.channel(`couple_room_${couple.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'booth_countdown_start',
        payload: { pose: 1, timestamp: Date.now() }
      }).catch(() => null);
    }

    runShotCountdown(1, []);
  };

  const runShotCountdown = (poseNum: number, accumulatedList: USFramePhoto[] = capturedDuoPhotos) => {
    setCurrentPose(poseNum);
    setCountdown(3);

    let count = 3;
    const timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        // Flash & Shutter
        setIsFlashing(true);
        playShutterSound();
        setTimeout(() => setIsFlashing(false), 300);

        // 1. Capture local photo
        const myPhoto = captureLocalFrame();

        // 2. Broadcast local shot to partner
        if (couple?.id) {
          const channel = supabase.channel(`couple_room_${couple.id}`);
          channel.send({
            type: 'broadcast',
            event: 'booth_shot_exchange',
            payload: { senderId: user?.id, dataUrl: myPhoto, pose: poseNum }
          }).catch(() => null);
        }

        // 3. Resolve partner photo (either latest remote live frame, or fallback avatar)
        const partnerPhoto = latestRemotePhotoRef.current || remoteFallbackImg || partner?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800';

        // 4. Merge Left (Me) + Right (Partner) into 1 Split-Duo Photo
        const leftLabel = `${user?.name || 'Kamu'} • ${couple?.user_city || 'Jakarta'}`;
        const rightLabel = `${partner?.name || 'Pasangan'} • ${couple?.partner_city || 'Bandung'}`;
        const mergedSplitPhoto = await createSplitDuoFrame(myPhoto, partnerPhoto, leftLabel, rightLabel);

        const newPhotoItem: USFramePhoto = {
          id: `duo_pose_${poseNum}_${Date.now()}`,
          dataUrl: mergedSplitPhoto,
          timestamp: Date.now()
        };

        const nextList = [...accumulatedList, newPhotoItem];
        setCapturedDuoPhotos(nextList);

        // If there are more poses left (total 4)
        if (poseNum < 4) {
          setTimeout(() => {
            if (couple?.id) {
              const channel = supabase.channel(`couple_room_${couple.id}`);
              channel.send({
                type: 'broadcast',
                event: 'booth_countdown_start',
                payload: { pose: poseNum + 1, timestamp: Date.now() }
              }).catch(() => null);
            }
            runShotCountdown(poseNum + 1, nextList);
          }, 1800);
        } else {
          // All 4 poses captured! Stop camera and transition to editor!
          setIsSessionActive(false);
          playSuccessChime();
          confetti({ particleCount: 60, spread: 80 });
          stopCamera();
          setTimeout(() => {
            onCompleteSession(nextList);
          }, 800);
        }
      }
    }, 1000);
  };

  const handleCancelClick = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-3xl p-4 sm:p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-foreground">
              Live Duo Studio (Split Kiri-Kanan 4 Pose)
            </h2>
            <p className="text-xs text-foreground-muted flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {partnerOnline 
                ? `Pasangan terhubung (${user?.name || 'Kamu'} & ${partner?.name || 'Pasangan'})`
                : 'Menunggu pasangan membuka kamera studio'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!partnerOnline && (
            <Button
              onClick={handleSendInvite}
              disabled={isInviting || isSessionActive}
              variant="primary"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>{isInviting ? 'Memanggil...' : 'Ajak Pasangan Foto 📸'}</span>
            </Button>
          )}
          <Button onClick={handleCancelClick} variant="ghost" size="sm" disabled={isSessionActive}>
            Kembali
          </Button>
        </div>
      </div>

      {/* Split Dual Camera Stage (KIRI: Kamu / KANAN: Pasangan) */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 z-50 bg-white animate-pulse pointer-events-none rounded-3xl" />
        )}

        {/* Countdown Indicator Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl pointer-events-none">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-terracotta-500 text-white flex items-center justify-center font-serif text-5xl sm:text-7xl font-bold shadow-elevated animate-ping-once">
              {countdown}
            </div>
            <div className="mt-4 px-4 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold uppercase tracking-wider">
              Pose {currentPose} dari 4! Bersiap senyum 📸
            </div>
          </div>
        )}

        {/* LEFT CAMERA: ME */}
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-stone-900 border-2 border-border shadow-soft flex flex-col justify-between p-3.5 sm:p-4">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
          />

          {/* Camera Label Header */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {user?.name || 'Kamu'} (Kiri)
            </span>

            <button
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              disabled={isSessionActive}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors cursor-pointer"
              title="Putar Kamera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <span className="text-[11px] font-medium text-white/80 px-2.5 py-0.5 rounded-lg bg-black/40 backdrop-blur-xs">
              📍 {couple?.user_city || 'Jakarta'}
            </span>
          </div>
        </div>

        {/* RIGHT CAMERA: PARTNER */}
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-stone-900 border-2 border-border shadow-soft flex flex-col justify-between p-3.5 sm:p-4">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : remoteFallbackImg ? (
            <img
              src={remoteFallbackImg}
              alt="Partner live stream"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-stone-400 bg-stone-900/90 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-terracotta-400 overflow-hidden">
                {partner?.avatar ? (
                  <img src={partner.avatar} alt={partner.name} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Kamera {partner?.name || 'Pasangan'} (Kanan)
                </h4>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  {partnerOnline 
                    ? 'Menghubungkan sinyal video berdua...' 
                    : 'Ajak pasangan untuk membuka kamera studio secara langsung.'}
                </p>
              </div>
              {!partnerOnline && (
                <Button onClick={handleSendInvite} size="sm" variant="outline" className="text-white border-stone-700">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Panggil Pasangan
                </Button>
              )}
            </div>
          )}

          {/* Partner Label */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              {partner?.name || 'Pasangan'} (Kanan)
            </span>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <span className="text-[11px] font-medium text-white/80 px-2.5 py-0.5 rounded-lg bg-black/40 backdrop-blur-xs">
              📍 {couple?.partner_city || 'Bandung'}
            </span>
          </div>
        </div>

      </div>

      {/* Progress Dots for 4 Poses */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((i) => {
          const isDone = capturedDuoPhotos.length >= i;
          const isCurrent = currentPose === i && isSessionActive;
          return (
            <div
              key={i}
              className={`h-3 rounded-full transition-all duration-300 ${
                isDone
                  ? 'w-10 bg-terracotta-500 shadow-xs'
                  : isCurrent
                  ? 'w-12 bg-amber-500 animate-pulse'
                  : 'w-4 bg-border'
              }`}
            />
          );
        })}
      </div>

      {/* Central Action Bar */}
      <div className="bg-surface border border-border rounded-3xl p-5 sm:p-7 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h4 className="font-serif text-base font-semibold text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-terracotta-500" />
            <span>Studio Foto Split Kanan-Kiri (4 Pose Berurutan)</span>
          </h4>
          <p className="text-xs text-foreground-muted">
            {isSessionActive
              ? `Sedang mengambil Pose ${currentPose} dari 4... Tetap di posisi!`
              : capturedDuoPhotos.length > 0
              ? `Selesai mengambil 4 pose berdua! Klik tombol di samping untuk lanjut memilih bingkai.`
              : 'Klik tombol di samping untuk memulai 4 jepretan otomatis dengan hitungan mundur 3-2-1 di setiap pose.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={startDuoPhotobooth}
            disabled={isSessionActive}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto shadow-medium"
          >
            <Camera className="w-5 h-5 mr-2" />
            <span>
              {isSessionActive
                ? `Mengambil Pose (${capturedDuoPhotos.length}/4)...`
                : capturedDuoPhotos.length > 0
                ? 'Foto Ulang 4 Pose 📸'
                : 'Mulai 4 Pose Berdua 📸'}
            </span>
          </Button>
        </div>
      </div>

    </div>
  );
};
