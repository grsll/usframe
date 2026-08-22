import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Heart, Sparkles, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingPage: React.FC = () => {
  const { createCoupleRoom, joinCoupleRoom, user } = useAuth();
  const { success, error } = useToast();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  
  // Create Room State
  const [coupleName, setCoupleName] = useState(user?.name ? `Ruang ${user.name}` : 'Ruang Kita');
  const [relationshipDate, setRelationshipDate] = useState(new Date().toISOString().split('T')[0]);
  const [userCity, setUserCity] = useState('Jakarta');
  const [nextMeetDate, setNextMeetDate] = useState('');

  // Join Room State
  const [inviteCode, setInviteCode] = useState('');
  const [joinCity, setJoinCity] = useState('Bandung');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const room = await createCoupleRoom({
        coupleName: coupleName.trim() || `Ruang ${user?.name || 'Kita'}`,
        relationshipStartDate: relationshipDate,
        nextMeetDate: nextMeetDate || undefined,
        userCity
      });

      confetti({ particleCount: 50, spread: 70 });
      success(`Ruangan berhasil dibuat! Kode undanganmu: ${room.invite_code} 🤍`);
    } catch (err: any) {
      error(err.message || 'Gagal membuat ruangan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    try {
      await joinCoupleRoom(inviteCode.trim().toUpperCase(), joinCity);
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
      
      <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-9 shadow-elevated space-y-5 sm:space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-terracotta-50 dark:bg-terracotta-950 text-terracotta-500 flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-6 h-6 fill-current animate-pulse-subtle" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground tracking-tight">
            Hubungkan Ruang Pasangan
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Halo {user?.name || 'kamu'}! Buat ruangan baru atau gabung ke ruangan pasanganmu.
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
              label="Nama Ruang / Judul Pasangan"
              placeholder="contoh: Ruang Kita, Kisah Cinta Kita"
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
              helperText="Bisa diubah kapan saja di pengaturan."
              required
            />

            <Input
              label="Tanggal Mulai Hubungan / Jadian"
              type="date"
              value={relationshipDate}
              onChange={(e) => setRelationshipDate(e.target.value)}
              required
            />

            <Input
              label="Kota Asal Kamu"
              value={userCity}
              onChange={(e) => setUserCity(e.target.value)}
              placeholder="contoh: Jakarta, Surabaya, Tokyo"
            />

            <Input
              label="Tanggal Pertemuan Berikutnya (Opsional)"
              type="date"
              value={nextMeetDate}
              onChange={(e) => setNextMeetDate(e.target.value)}
              helperText="Kami akan membuat hitung mundur anggun di Beranda kalian."
            />

            <div className="p-3.5 rounded-2xl bg-terracotta-50/60 dark:bg-terracotta-950/40 border border-terracotta-200/80 dark:border-terracotta-800/80 text-xs text-terracotta-800 dark:text-terracotta-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-terracotta-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Setelah ruangan dibuat, kamu akan mendapatkan <strong>Kode Undangan 6 Karakter</strong> yang bisa kamu bagikan ke pasangan/akun lain untuk bergabung ke ruangan ini.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-medium shadow-sm mt-2"
            >
              Buat Ruang & Dapatkan Kode Undangan →
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1">
              <Input
                label="Kode Undangan 6 Karakter"
                placeholder="contoh: US7788"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono text-center text-lg tracking-widest uppercase font-semibold"
                required
              />
              <p className="text-[11px] text-foreground-muted text-center leading-relaxed">
                Masukkan 6 karakter kode yang dibuat oleh pasanganmu untuk terhubung ke ruangannya.
              </p>
            </div>

            <Input
              label="Kota Asal Kamu"
              value={joinCity}
              onChange={(e) => setJoinCity(e.target.value)}
              placeholder="contoh: Bandung, Paris, London"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-medium shadow-sm"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              <span>Gabung ke Ruang Pasangan →</span>
            </Button>
          </form>
        )}

      </div>

    </div>
  );
};

