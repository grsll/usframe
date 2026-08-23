import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft, Upload, X } from 'lucide-react';
import { compressImage } from '../lib/utils';

export const AuthPage: React.FC = () => {
  const { login, register, loginDemo, setCurrentView, user, couple } = useAuth();
  const { error, success } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400, 0.85);
      setAvatar(compressed);
    } catch (err) {
      error('Gagal memproses foto. Silakan coba gambar lain.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'register' && !name) return;

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await register(name, email, password, avatar);
        success('Akun berhasil dibuat! Selamat datang di US 🤍');
      } else {
        await login(email, password);
        success('Selamat datang kembali di ruang kalian 🤍');
      }
    } catch (err: any) {
      error(err.message || 'Gagal masuk. Silakan periksa email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    loginDemo();
    success('Berhasil masuk dengan akun demo Kai & Elena! ✨');
  };

  const handleBack = () => {
    if (couple) {
      setCurrentView('home');
    } else {
      setCurrentView('landing');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 grain-overlay relative">
      
      {/* Back to landing / home */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 text-xs text-foreground-muted hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border shadow-xs transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{couple ? 'Ke Beranda' : 'Ke Halaman Awal'}</span>
      </button>

      <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-9 shadow-elevated space-y-5 sm:space-y-6">
        
        {/* If user is already authenticated */}
        {user && (
          <div className="p-3 rounded-2xl bg-surface-subtle border border-border text-xs flex items-center justify-between gap-2 text-foreground-muted">
            <span>Masuk sebagai: <strong className="text-foreground">{user.name}</strong></span>
            <button
              type="button"
              onClick={() => couple ? setCurrentView('home') : setCurrentView('onboarding')}
              className="text-terracotta-600 dark:text-terracotta-400 font-semibold hover:underline cursor-pointer"
            >
              {couple ? 'Buka Ruang →' : 'Hubungkan Ruang →'}
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-soft mx-auto ring-2 ring-terracotta-200 dark:ring-terracotta-800">
            <img src="/icon.svg" alt="USFRAME" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground tracking-tight">
            {mode === 'register' ? 'Buat Akun Ruang Berdua' : 'Selamat Datang Kembali'}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted">
            {mode === 'register' ? 'Mulai ruang digital privat khusus kalian berdua.' : 'Masukkan data akun untuk masuk ke ruang kalian.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-surface-subtle border border-border rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Daftar Akun
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Masuk
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Profile Photo Upload Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Foto Profil (Unggah Sendiri)
                </label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-subtle border border-border">
                  {avatar ? (
                    <div className="relative">
                      <img
                        src={avatar}
                        alt="Preview Foto"
                        className="w-14 h-14 rounded-full object-cover border-2 border-terracotta-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                        title="Hapus foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-terracotta-100 dark:bg-terracotta-950/80 border-2 border-dashed border-terracotta-300 dark:border-terracotta-700 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 font-semibold text-lg shrink-0">
                      {name ? name.charAt(0).toUpperCase() : '👤'}
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="register-avatar-input"
                    />
                    <label
                      htmlFor="register-avatar-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border text-xs font-medium text-foreground transition-colors cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-terracotta-500" />
                      <span>{avatar ? 'Ganti Foto' : 'Pilih Foto dari Galeri'}</span>
                    </label>
                    <p className="text-[10px] text-foreground-muted mt-1">
                      Foto hanya diambil dari yang kamu unggah sendiri.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="Nama Panggilan Kamu"
                placeholder="contoh: Kai, Elena, Rian, Maya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <Input
            label="Alamat Email"
            type="email"
            placeholder="kamu@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Kata Sandi"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-medium shadow-sm mt-2"
          >
            {mode === 'register' ? 'Daftar & Lanjut ke Ruang →' : 'Masuk ke Ruang Berdua →'}
          </Button>
        </form>

        {/* Instant Demo Shortcut */}
        <div className="pt-4 border-t border-border text-center space-y-3">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/80 border border-terracotta-200 dark:border-terracotta-800 text-terracotta-700 dark:text-terracotta-300 text-xs font-medium hover:bg-terracotta-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Akses Demo Langsung (Kai × Elena)</span>
          </button>

          <p className="text-xs text-foreground-subtle">
            Semua data pasangan terlindungi dan privat khusus berdua.
          </p>
        </div>

      </div>

    </div>
  );
};

