import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Heart, Sparkles, KeyRound, ArrowLeft, Home, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingPage: React.FC = () => {
  const { createCoupleRoom, joinCoupleRoom, user, couple, logout, setCurrentView, loginDemo } = useAuth();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteFromUrl = params.get('invite') || params.get('code');
    if (inviteFromUrl) {
      setTab('join');
      setInviteCode(inviteFromUrl.trim().toUpperCase());
    }
  }, []);

  const handleBack = () => {
    if (couple) {
      setCurrentView('home');
    } else {
      setCurrentView('landing');
    }
  };

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
      setCurrentView('home');
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
      setCurrentView('home');
    } catch (err: any) {
      error(err.message || 'Kode undangan tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 grain-overlay relative">
      
      {/* Top Navigation Bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={handleBack}
          className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-border shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{couple ? 'Ke Beranda' : 'Ke Halaman Awal'}</span>
        </button>

        <div className="flex items-center gap-2">
          {couple && (
            <button
              onClick={() => setCurrentView('home')}
              className="text-xs text-terracotta-600 dark:text-terracotta-400 hover:underline flex items-center gap-1 px-3 py-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950 border border-terracotta-200 dark:border-terracotta-800 transition-colors cursor-pointer font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Buka Ruang Kita</span>
            </button>
          )}

          {user && (
            <button
              onClick={logout}
              title="Keluar akun"
              className="text-xs text-foreground-muted hover:text-rose-600 flex items-center gap-1 px-3 py-2 rounded-xl bg-surface border border-border hover:border-rose-200 shadow-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-9 shadow-elevated space-y-5 sm:space-y-6">
        
        {/* Active Couple Banner if user is already connected */}
        {couple && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Kamu sudah berada di ruangan: {couple.couple_name || couple.invite_code}</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Kode Ruangan: <strong>{couple.invite_code}</strong></p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs whitespace-nowrap shadow-xs cursor-pointer transition-colors"
            >
              Ke Beranda →
            </button>
          </div>
        )}

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

        {/* Quick Demo Access / Return Link */}
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-foreground-muted">
          <button
            type="button"
            onClick={() => setCurrentView('landing')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            ← Halaman Utama
          </button>

          <button
            type="button"
            onClick={() => loginDemo()}
            className="text-terracotta-600 dark:text-terracotta-400 hover:underline transition-colors cursor-pointer font-medium"
          >
            Coba Mode Demo (Kai × Elena) →
          </button>
        </div>

      </div>

    </div>
  );
};
