import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingPage: React.FC = () => {
  const { createCoupleRoom, joinCoupleRoom, user } = useAuth();
  const { success, error } = useToast();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  
  // Create Room State
  const [partnerName, setPartnerName] = useState('');
  const [relationshipDate, setRelationshipDate] = useState(new Date().toISOString().split('T')[0]);
  const [userCity, setUserCity] = useState('Tokyo');
  const [partnerCity, setPartnerCity] = useState('Paris');
  const [nextMeetDate, setNextMeetDate] = useState('');

  // Join Room State
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName) return;

    setIsLoading(true);
    try {
      await createCoupleRoom({
        partnerName,
        relationshipStartDate: relationshipDate,
        nextMeetDate: nextMeetDate || undefined,
        userCity,
        partnerCity
      });

      confetti({ particleCount: 50, spread: 70 });
      success('Ruangan pasangan berhasil dibuat! Selamat datang di ruang kalian 🤍');
    } catch (err: any) {
      error(err.message || 'Gagal membuat ruangan pasangan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;

    setIsLoading(true);
    try {
      await joinCoupleRoom(inviteCode);
      confetti({ particleCount: 50, spread: 70 });
      success('Berhasil bergabung ke ruangan pasangan! 🤍');
    } catch (err: any) {
      error(err.message || 'Kode undangan tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 grain-overlay">
      
      <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-7 sm:p-9 shadow-elevated space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-terracotta-50 dark:bg-terracotta-950 text-terracotta-500 flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-6 h-6 fill-current animate-pulse-subtle" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground tracking-tight">
            Hubungkan Ruang Pasangan
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Halo {user?.name || 'kamu'}! Pilih cara kalian ingin menyatukan ruang.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-surface-subtle border border-border rounded-2xl">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              tab === 'create'
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Buat Ruang Baru
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              tab === 'join'
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Saya Punya Kode Undangan
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Nama Panggilan Pasangan"
              placeholder="contoh: Elena, Maya, Ken, Sarah"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />

            <Input
              label="Tanggal Mulai Hubungan / Jadian"
              type="date"
              value={relationshipDate}
              onChange={(e) => setRelationshipDate(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Kota Asal Kamu"
                value={userCity}
                onChange={(e) => setUserCity(e.target.value)}
                placeholder="contoh: Tokyo, Jakarta"
              />
              <Input
                label="Kota Asal Pasangan"
                value={partnerCity}
                onChange={(e) => setPartnerCity(e.target.value)}
                placeholder="contoh: Paris, London"
              />
            </div>

            <Input
              label="Tanggal Pertemuan Berikutnya (Opsional)"
              type="date"
              value={nextMeetDate}
              onChange={(e) => setNextMeetDate(e.target.value)}
              helperText="Kami akan membuat hitung mundur anggun di Beranda kalian."
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-medium shadow-sm mt-2"
            >
              Buat Ruangan & Buat Kode Undangan →
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              label="Kode Undangan 6 Karakter"
              placeholder="contoh: US7788"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg tracking-widest uppercase font-semibold"
              required
            />

            <p className="text-xs text-foreground-muted text-center leading-relaxed">
              Minta 6 karakter kode yang tampil di layar pasanganmu untuk terhubung.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-medium shadow-sm"
            >
              Gabung ke Ruang Pasangan →
            </Button>
          </form>
        )}

      </div>

    </div>
  );
};
