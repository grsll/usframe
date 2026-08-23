import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { USFramePhoto } from '../../types';
import { playShutterSound, playSuccessChime } from '../../lib/utils';
import { Camera, RefreshCw, UserPlus, Users, Sparkles, AlertCircle, Heart, CheckCircle2, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface USFrameLiveDuoProps {
  onCompleteSession: (photos: USFramePhoto[]) => void;
  onCancel: () => void;
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

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [shotStep, setShotStep] = useState<number>(0); // 0 = ready, 1 = shot 1 taken, 2 = all done
  const [localSnapshots, setLocalSnapshots] = useState<string[]>([]);
  const [remoteSnapshots, setRemoteSnapshots] = useState<string[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const previewIntervalRef = useRef<number | null>(null);

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

      // Add tracks to WebRTC peer connection if active
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Izin kamera belum diberikan atau kamera sedang digunakan aplikasi lain.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [facingMode]);

  // Capture single local frame
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

  // Realtime Broadcast Channel & WebRTC Signaling
  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase.channel(`couple_room_${couple.id}`);

    // Create RTCPeerConnection
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
      // 1. Partner joins booth
      .on('broadcast', { event: 'booth_join' }, async (payload) => {
        if (payload.payload?.senderId !== user?.id) {
          setPartnerOnline(true);
          setIsInviting(false);
          info(`${payload.payload?.name || 'Pasangan'} telah masuk ke kamera studio! 📸`);

          // As initiator, create offer
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
      // 2. WebRTC Offer
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
      // 3. WebRTC Answer
      .on('broadcast', { event: 'booth_webrtc_answer' }, async (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
        }
      })
      // 4. WebRTC ICE Candidates
      .on('broadcast', { event: 'booth_webrtc_ice' }, async (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
          } catch {}
        }
      })
      // 5. Fallback Periodic Snapshot Stream
      .on('broadcast', { event: 'booth_preview_frame' }, (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.dataUrl) {
          setRemoteFallbackImg(payload.payload.dataUrl);
          setPartnerOnline(true);
        }
      })
      // 6. Synchronized 3-2-1 Countdown
      .on('broadcast', { event: 'booth_countdown_start' }, () => {
        triggerCountdown();
      })
      // 7. Photo Shot Exchange
      .on('broadcast', { event: 'booth_shot_exchange' }, (payload) => {
        if (payload.payload?.senderId !== user?.id && payload.payload?.dataUrl) {
          setRemoteSnapshots(prev => [...prev, payload.payload.dataUrl]);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence in booth
          channel.send({
            type: 'broadcast',
            event: 'booth_join',
            payload: { senderId: user?.id, name: user?.name }
          }).catch(() => null);
        }
      });

    // Send periodic low-res preview frame for instant fallback
    previewIntervalRef.current = window.setInterval(() => {
      if (localVideoRef.current && localVideoRef.current.videoWidth) {
        const v = localVideoRef.current;
        const c = document.createElement('canvas');
        c.width = 240;
        c.height = 180;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, 240, 180);
          const mini = c.toDataURL('image/jpeg', 0.4);
          channel.send({
            type: 'broadcast',
            event: 'booth_preview_frame',
            payload: { senderId: user?.id, dataUrl: mini }
          }).catch(() => null);
        }
      }
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, user?.id, user?.name, localStream]);

  // Trigger Invite to Partner
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
      setIsInviting(false);
    }
  };

  // Synchronized Countdown Trigger
  const triggerCountdown = useCallback(() => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          executeSnap();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleStartCapture = async () => {
    if (!couple?.id) {
      triggerCountdown();
      return;
    }

    const channel = supabase.channel(`couple_room_${couple.id}`);
    await channel.send({
      type: 'broadcast',
      event: 'booth_countdown_start',
      payload: { timestamp: Date.now() }
    });
    triggerCountdown();
  };

  // Snap photo at 0
  const executeSnap = () => {
    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 300);

    const localPhoto = captureLocalFrame();
    setLocalSnapshots(prev => [...prev, localPhoto]);

    // Send my photo to partner
    if (couple?.id) {
      const channel = supabase.channel(`couple_room_${couple.id}`);
      channel.send({
        type: 'broadcast',
        event: 'booth_shot_exchange',
        payload: { senderId: user?.id, dataUrl: localPhoto }
      }).catch(() => null);
    }

    setShotStep(prev => prev + 1);
  };

  // When photos are collected, composite & finish session
  const handleFinishDuo = () => {
    const mySnap = localSnapshots[0] || captureLocalFrame();
    const partnerSnap = remoteSnapshots[0] || remoteFallbackImg || partner?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800';

    playSuccessChime();
    confetti({ particleCount: 50, spread: 70 });

    const duoPhotos: USFramePhoto[] = [
      { id: 'shot_me', dataUrl: mySnap, timestamp: Date.now() },
      { id: 'shot_partner', dataUrl: partnerSnap, timestamp: Date.now() }
    ];

    onCompleteSession(duoPhotos);
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
              Live Duo Studio
            </h2>
            <p className="text-xs text-foreground-muted flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {partnerOnline 
                ? `Pasangan terhubung (${partner?.name || 'Elena'} & ${user?.name || 'Kai'})`
                : 'Menunggu pasangan membuka kamera studio'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!partnerOnline && (
            <Button
              onClick={handleSendInvite}
              disabled={isInviting}
              variant="primary"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>{isInviting ? 'Memanggil...' : 'Ajak Pasangan Foto 📸'}</span>
            </Button>
          )}
          <Button onClick={onCancel} variant="ghost" size="sm">
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
          <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center rounded-3xl pointer-events-none">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-terracotta-500 text-white flex items-center justify-center font-serif text-5xl sm:text-7xl font-bold shadow-elevated animate-ping-once">
              {countdown}
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
              <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-terracotta-400">
                <Camera className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Kamera {partner?.name || 'Pasangan'} (Kanan)
                </h4>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  {partnerOnline 
                    ? 'Menghubungkan sinyal video berdua...' 
                    : 'Ajak pasangan untuk membuka kamera bersama secara langsung.'}
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

      {/* Central Capture Trigger & Action Bar */}
      <div className="bg-surface border border-border rounded-3xl p-5 sm:p-7 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h4 className="font-serif text-base font-semibold text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-terracotta-500" />
            <span>Studio Foto Split Kanan-Kiri</span>
          </h4>
          <p className="text-xs text-foreground-muted">
            {localSnapshots.length > 0
              ? `Sudah mengambil ${localSnapshots.length} foto berdua! Kamu bisa lanjut ke editor untuk memilih bingkai.`
              : 'Klik tombol di samping untuk memulai hitungan mundur 3-2-1 dan jepret bersama.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {localSnapshots.length === 0 ? (
            <Button
              onClick={handleStartCapture}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-medium"
            >
              <Camera className="w-5 h-5 mr-2" />
              <span>Ambil Foto Berdua 📸</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleStartCapture}
                variant="outline"
                size="md"
                className="flex-1 sm:flex-initial"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                <span>Foto Ulang</span>
              </Button>

              <Button
                onClick={handleFinishDuo}
                variant="primary"
                size="md"
                className="flex-1 sm:flex-initial shadow-soft"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Edit & Simpan Bingkai ✨</span>
              </Button>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
