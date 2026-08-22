import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Sparkles, Shield, ArrowRight, Globe, Heart, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const { setCurrentView } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-terracotta-200">
      
      {/* Top Editorial Nav */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center font-serif text-lg sm:text-xl font-bold shadow-soft">
              US
            </div>
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              USFRAME
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setCurrentView('auth')}
              variant="ghost"
              size="sm"
            >
              Masuk
            </Button>
            <Button
              onClick={() => setCurrentView('auth')}
              variant="primary"
              size="sm"
              className="shadow-sm"
            >
              Buat Ruang Kita
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-20 pb-16 sm:pb-24 border-b border-border grain-overlay">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-soft text-xs font-medium text-foreground-muted">
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Ruang digital privat khusus untuk dua insan yang saling mencintai</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-6xl md:text-7xl font-normal tracking-tight text-foreground leading-[1.15] max-w-4xl mx-auto">
            Ruang kecil tenang khusus <span className="italic font-serif text-terracotta-600 dark:text-terracotta-400">kalian berdua</span>.
          </h1>

          <p className="text-sm sm:text-xl text-foreground-muted max-w-2xl mx-auto font-normal leading-relaxed">
            Simpan kenangan, strip photobooth, surat cinta, dan setiap momen berharga — tetap dekat di hati, meski terpisah 9.000 kilometer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5 pt-2">
            <Button
              onClick={() => setCurrentView('auth')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 text-base font-medium shadow-medium"
            >
              <span>Mulai Ruang Berdua</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              onClick={() => setCurrentView('home')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 text-base"
            >
              <span>Jelajahi Demo Langsung</span>
            </Button>
          </div>

          {/* Editorial Visual Showcase Hero Image */}
          <div className="relative pt-6 sm:pt-10 max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-elevated bg-surface p-3.5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Photo Strip Mockup */}
                <div className="md:col-span-4 flex justify-center">
                  <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-300/80 shadow-photostrip max-w-[220px] w-full space-y-2 text-stone-900">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
                      alt="Photobooth pose 1"
                      className="w-full aspect-[4/3] object-cover rounded-sm border border-stone-200"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300"
                      alt="Photobooth pose 2"
                      className="w-full aspect-[4/3] object-cover rounded-sm border border-stone-200"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300"
                      alt="Photobooth pose 3"
                      className="w-full aspect-[4/3] object-cover rounded-sm border border-stone-200"
                    />
                    <div className="pt-2 text-center border-t border-stone-300 font-serif">
                      <span className="text-[11px] font-bold tracking-widest uppercase block text-stone-800">USFRAME</span>
                      <span className="text-[9px] text-stone-600">Tokyo × Paris • 9.710 KM</span>
                    </div>
                  </div>
                </div>

                {/* Editorial Feature Preview */}
                <div className="md:col-span-8 text-left space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle text-xs font-semibold text-terracotta-600 dark:text-terracotta-400 border border-border">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Sinkronisasi Hubungan Jarak Jauh (LDR)</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-3xl font-medium text-foreground tracking-tight leading-snug">
                    "Jarak bukan alasan untuk berhenti mengabadikan momen berdua."
                  </h3>

                  <p className="text-xs sm:text-base text-foreground-muted leading-relaxed">
                    USFRAME menghadirkan pengalaman photobooth interaktif 4-shot, surat terbuka dengan kondisi khusus, tanya jawab harian berpasangan, dan linimasa perjalanan cinta kalian dalam satu tempat yang aman dan intim.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Privat 100% Khusus Berdua
                    </span>
                    <span>•</span>
                    <span>Tanpa Iklan</span>
                    <span>•</span>
                    <span>Ekspor Cetak 300DPI</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-16 sm:py-24 bg-surface-subtle/40 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Dirancang penuh ketulusan untuk kalian.
            </h2>
            <p className="text-xs sm:text-base text-foreground-muted">
              Fitur-fitur yang mendekatkan hati dan mengabadikan setiap babak perjalanan cinta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-soft space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">Photobooth 4-Shot Otentik</h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Hitungan mundur otomatis 3-2-1 dengan kilatan shutter vintage. Pilih template strip editorial minimalis hingga film analog 35mm.
              </p>
            </div>

            <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-soft space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">Sinyal Rindu & Mood Langsung</h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Kirim getaran detak jantung *"Aku Kangen"* secara instan kapanpun kamu memikirkannya, lengkap dengan update suasana hati hari ini.
              </p>
            </div>

            <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-soft space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">Lini Masa & Hitung Mundur Temu</h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Lacak hari-hari menuju tiket penerbangan berikutnya, tanggal jadian, serta impian bucket list yang ingin dicapai berdua.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-surface border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-foreground">USFRAME</span>
            <span>• Ruang kecil untuk kalian berdua.</span>
          </div>
          <p>© {new Date().getFullYear()} USFRAME. Dibuat dengan cinta untuk pasangan di seluruh dunia.</p>
        </div>
      </footer>

    </div>
  );
};
