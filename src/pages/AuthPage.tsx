import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, loginDemo, setCurrentView } = useAuth();
  const { error, success } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'register' && !name) return;

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await register(name, email, password);
        success('Akun berhasil dibuat! Selamat datang di US 🤍');
      } else {
        await login(email, password);
        success('Selamat datang kembali di ruang kalian 🤍');
      }
    } catch (err: any) {
      error(err.message || 'Gagal masuk. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    loginDemo();
    success('Berhasil masuk dengan akun demo Kai & Elena! ✨');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 grain-overlay">
      
      {/* Back to landing */}
      <button
        onClick={() => setCurrentView('landing')}
        className="absolute top-6 left-6 text-xs text-foreground-muted hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border shadow-xs transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali</span>
      </button>

      <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-7 sm:p-9 shadow-elevated space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-soft mx-auto">
            US
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
            <Input
              label="Nama Panggilan Kamu"
              placeholder="contoh: Kai, Elena, Rian, Maya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
            {mode === 'register' ? 'Lanjut ke Pengaturan Pasangan →' : 'Masuk ke Ruang Berdua →'}
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
