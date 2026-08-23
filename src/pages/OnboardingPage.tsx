import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Heart, Sparkles, KeyRound, ArrowLeft, Home, LogOut, Trash2, Copy, Check, PlusCircle, Users, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingPage: React.FC = () => {
  const { 
    createCoupleRoom, 
    joinCoupleRoom, 
    user, 
    couple, 
    userRooms, 
    fetchUserRooms, 
    switchCoupleRoom, 
    deleteCoupleRoom, 
    logout, 
    setCurrentView, 
    loginDemo 
  } = useAuth();

  const { success, error } = useToast();

  const [tab, setTab] = useState<'rooms' | 'create' | 'join'>('rooms');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  // Create Room State
  const [coupleName, setCoupleName] = useState(user?.name ? `Ruang ${user.name}` : 'Ruang Kita');
  const [relationshipDate, setRelationshipDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomCity, setRoomCity] = useState('');
  const [nextMeetDate, setNextMeetDate] = useState('');

  // Join Room State
  const [inviteCode, setInviteCode] = useState('');
  const [joinCity, setJoinCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load user rooms on mount
  useEffect(() => {
    fetchUserRooms().then((rooms) => {
      if (rooms.length === 0) {
        setTab('create');
      }
    });
  }, [fetchUserRooms]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteFromUrl = params.get('invite') || params.get('code');
    if (inviteFromUrl) {
      setTab('join');
      setInviteCode(inviteFromUrl.trim().toUpperCase());
    }
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Kode ${code} disalin ke clipboard! 📋`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
        city: roomCity.trim() || undefined,
        userCity: roomCity.trim() || undefined
      });

      confetti({ particleCount: 50, spread: 70 });
      success(`Ruangan berhasil dibuat! Kode undanganmu: ${room.invite_code} 🤍`);
      await fetchUserRooms();
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
      await fetchUserRooms();
      setCurrentView('home');
    } catch (err: any) {
      error(err.message || 'Kode undangan tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchRoom = async (roomId: string) => {
    try {
      await switchCoupleRoom(roomId);
      success('Berhasil beralih ke ruangan! 🤍');
    } catch (err: any) {
      error(err.message || 'Gagal beralih ruangan.');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    setIsDeleting(roomId);
    try {
      await deleteCoupleRoom(roomId);
      success('Ruangan berhasil dihapus.');
      setRoomToDelete(null);
    } catch (err: any) {
      error(err.message || 'Gagal menghapus ruangan.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 grain-overlay relative">
      
      {/* Top Navigation Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={handleBack}
          className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-border shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{couple ? 'Ke Beranda' : 'Ke Halaman Awal'}</span>
        </button>

        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-foreground-muted">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-terracotta-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="font-medium text-foreground max-w-[120px] truncate">{user.name}</span>
            </div>
          )}

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

      <div className="w-full max-w-xl bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-elevated space-y-5 sm:space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-terracotta-50 dark:bg-terracotta-950 text-terracotta-500 flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-6 h-6 fill-current animate-pulse-subtle" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground tracking-tight">
            Hub Ruang Pasangan
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Halo <strong className="text-foreground">{user?.name || 'kamu'}</strong>! Pilih ruangan yang sudah ada, buat baru, atau gabung ke pasanganmu.
          </p>
        </div>

        {/* 3-Way Tab Switcher */}
        <div className="flex p-1 bg-surface-subtle border border-border rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setTab('rooms')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'rooms'
                ? 'bg-surface text-foreground shadow-xs font-semibold'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ruangan Saya ({userRooms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-surface text-foreground shadow-xs font-semibold'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Buat Ruang Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-surface text-foreground shadow-xs font-semibold'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Gabung Kode</span>
          </button>
        </div>

        {/* TAB 1: DAFTAR RUANGAN SAYA */}
        {tab === 'rooms' && (
          <div className="space-y-4">
            {userRooms.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-surface-subtle border border-border border-dashed space-y-3">
                <p className="text-xs text-foreground-muted">Kamu belum memiliki ruangan pasangan.</p>
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="primary" onClick={() => setTab('create')}>
                    + Buat Ruang Baru
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setTab('join')}>
                    Gabung Kode Undangan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
                  <span>Daftar Ruangan Terdaftar ({userRooms.length})</span>
                  <span>Klik untuk masuk langsung</span>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {userRooms.map((room) => {
                    const isActive = couple?.id === room.id;
                    const isFull = (room.member_ids?.length || 0) >= 2;

                    return (
                      <div
                        key={room.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-terracotta-50/40 dark:bg-terracotta-950/40 border-terracotta-300 dark:border-terracotta-800 shadow-soft'
                            : 'bg-surface hover:bg-surface-subtle border-border hover:border-border-strong'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-semibold text-sm sm:text-base text-foreground">
                                {room.couple_name || 'Ruang Pasangan'}
                              </h4>
                              {isActive && (
                                <span className="text-[10px] bg-terracotta-500 text-white px-2 py-0.5 rounded-full font-medium">
                                  Aktif
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-foreground-muted">
                              <span className="font-mono font-semibold text-foreground bg-surface-subtle border border-border px-2 py-0.5 rounded-lg flex items-center gap-1">
                                {room.invite_code}
                                <button
                                  type="button"
                                  onClick={() => handleCopy(room.invite_code)}
                                  className="text-foreground-muted hover:text-terracotta-600 transition-colors"
                                  title="Salin kode undangan"
                                >
                                  {copiedCode === room.invite_code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </span>

                              <span className="text-[11px]">
                                {isFull ? '🤍 Terhubung 2 Anggota' : '⏳ Menunggu Pasangan'}
                              </span>

                              {(room.city || room.user_city) && (
                                <span className="text-[11px] text-foreground-muted">
                                  • {room.city || room.user_city}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSwitchRoom(room.id)}
                              className="px-3 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium text-xs shadow-xs cursor-pointer transition-colors"
                            >
                              {isActive ? 'Buka →' : 'Pilih & Masuk →'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setRoomToDelete(room.id)}
                              title="Hapus / Tinggalkan ruangan ini"
                              className="p-1.5 rounded-xl text-foreground-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Confirmation Dialog inline for this room */}
                        {roomToDelete === room.id && (
                          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              Yakin ingin menghapus ruangan ini?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setRoomToDelete(null)}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-border text-foreground-muted hover:text-foreground cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoom(room.id)}
                                disabled={isDeleting === room.id}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer"
                              >
                                {isDeleting === room.id ? 'Menghapus...' : 'Ya, Hapus'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border">
                  <button
                    type="button"
                    onClick={() => setTab('create')}
                    className="text-xs text-terracotta-600 dark:text-terracotta-400 hover:underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    + Buat Ruangan Baru Lainnya
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('join')}
                    className="text-xs text-foreground-muted hover:text-foreground font-medium cursor-pointer"
                  >
                    Punya Kode Lain? Gabung →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUAT RUANG BARU */}
        {tab === 'create' && (
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
              label="Kota / Lokasi Bersama (Opsional)"
              value={roomCity}
              onChange={(e) => setRoomCity(e.target.value)}
              placeholder="contoh: Depok, Malang, Yogyakarta"
              helperText="Lokasi ini akan ditampilkan bersama di ruang berdua."
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
        )}

        {/* TAB 3: GABUNG KODE UNDANGAN */}
        {tab === 'join' && (
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
              label="Kota / Lokasi Kamu (Opsional)"
              value={joinCity}
              onChange={(e) => setJoinCity(e.target.value)}
              placeholder="contoh: Depok, Malang, Yogyakarta"
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
