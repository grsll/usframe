import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Sparkles, Shield, ArrowRight, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const { setCurrentView } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-terracotta-200">
      
      {/* Top Editorial Nav */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center font-serif text-xl font-bold shadow-soft">
              US
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              USFRAME
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setCurrentView('auth')}
              variant="ghost"
              size="sm"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setCurrentView('auth')}
              variant="primary"
              size="sm"
              className="shadow-sm"
            >
              Create Your Space
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-border grain-overlay">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-soft text-xs font-medium text-foreground-muted">
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>A private digital room built for couples in love & distance</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-foreground leading-[1.1] max-w-4xl mx-auto">
            A little place for the <span className="italic font-serif text-terracotta-600 dark:text-terracotta-400">two of you</span>.
          </h1>

          <p className="text-base sm:text-xl text-foreground-muted max-w-2xl mx-auto font-normal leading-relaxed">
            Keep your memories, moments, photobooth strips, and everything in between — together, even when you're 9,000 kilometers apart.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button
              onClick={() => setCurrentView('auth')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 py-4 text-base font-medium shadow-medium"
            >
              <span>Create Your Space</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              onClick={() => setCurrentView('home')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 py-4 text-base"
            >
              <span>Explore Live Demo</span>
            </Button>
          </div>

          {/* Editorial Visual Showcase Hero Image */}
          <div className="relative pt-10 max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-elevated bg-surface p-3 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Photo Strip Mockup */}
                <div className="md:col-span-4 flex justify-center">
                  <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-300/80 shadow-photostrip max-w-[220px] w-full space-y-2 text-stone-900">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
                      alt="Photobooth shot"
                      className="w-full aspect-[4/3] object-cover rounded-sm border border-stone-200"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300"
                      alt="Photobooth shot"
                      className="w-full aspect-[4/3] object-cover rounded-sm border border-stone-200"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=300"
                      alt="Photobooth shot"
                      className="w-full aspect-[4/3] object-cover rounded-sm border border-stone-200"
                    />
                    <div className="pt-2 text-center">
                      <span className="font-serif text-xs font-semibold block text-stone-900">US • PARIS & TOKYO</span>
                      <span className="text-[10px] text-stone-600 font-medium">9,710 KM TOGETHER</span>
                    </div>
                  </div>
                </div>

                {/* Couple Journey Preview */}
                <div className="md:col-span-8 p-4 sm:p-6 text-left space-y-4">
                  <div className="flex items-center gap-2 text-xs text-terracotta-600 dark:text-terracotta-400 font-medium">
                    <Globe className="w-4 h-4" />
                    <span>Tokyo ⇄ Paris • 438 Days Together</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium text-foreground">
                    "Your own little internet for two."
                  </h3>
                  <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
                    Not a noisy social media feed. An intimate sanctuary where daily prompts, locked love letters, milestone timelines, and real-time photobooth sessions belong only to you.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-surface-subtle text-xs text-foreground-muted border border-border">
                      📷 USFRAME Photobooth
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-subtle text-xs text-foreground-muted border border-border">
                      💌 Sealed Love Notes
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-subtle text-xs text-foreground-muted border border-border">
                      ⏳ Flight Countdowns
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Pillar 1: USFRAME Photobooth */}
      <section className="py-20 border-b border-border bg-surface/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400">
              Signature Experience
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
              An authentic photobooth, right inside your browser.
            </h2>
            <p className="text-base text-foreground-muted leading-relaxed">
              Step into the booth. Count down 3, 2, 1, and take 4 sequential shots with vintage shutter flashes. Choose from editorial, terracotta, and analog 35mm film frames, stamp your custom notes, and export high-res strips directly to your couple memory vault.
            </p>
            <ul className="space-y-2 text-sm text-foreground-muted pt-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500"></span>
                <span>Automatic 4-shot sequence with tactile countdowns</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500"></span>
                <span>6 original handcrafted frames & Japanese-inspired typography</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500"></span>
                <span>One-click save to shared couple memories or download high-res PNG</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button onClick={() => setCurrentView('usframe')} variant="warm">
                <Camera className="w-4 h-4 mr-2" />
                <span>Try USFRAME Booth</span>
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="p-5 bg-surface border border-border rounded-3xl shadow-medium max-w-sm w-full space-y-3">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600"
                  alt="Couple capture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-foreground-subtle">
                  <span>Minimalist Strip</span>
                  <span>ISO 400</span>
                </div>
                <h4 className="font-serif text-lg font-medium text-foreground">Tokyo Nights & Rainy Walks</h4>
                <p className="text-xs text-foreground-muted">"You smiled right as the flash went off."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar 2: Relationship Vault & Timeline */}
      <section className="py-20 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="space-y-4 max-w-sm w-full">
              <div className="p-5 rounded-3xl bg-surface border border-border shadow-soft space-y-1.5">
                <div className="flex items-center justify-between text-xs text-foreground-subtle">
                  <span>August 14, 2025</span>
                  <span>Paris</span>
                </div>
                <h4 className="font-serif text-lg font-medium text-foreground">Sunset by the Seine</h4>
                <p className="text-xs text-foreground-muted">"We talked about our dream home until the stars came out."</p>
              </div>

              <div className="p-5 rounded-3xl bg-terracotta-50/50 dark:bg-terracotta-950/40 border border-terracotta-200 dark:border-terracotta-800 shadow-soft space-y-1.5">
                <div className="flex items-center justify-between text-xs text-terracotta-700 dark:text-terracotta-300">
                  <span>Next Meetup</span>
                  <span>24 Days Remaining</span>
                </div>
                <h4 className="font-serif text-lg font-medium text-foreground">Flight to Paris ✈️</h4>
                <p className="text-xs text-foreground-muted">Counting down every second together.</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400">
              Living Story
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
              A private digital timeline of every chapter.
            </h2>
            <p className="text-base text-foreground-muted leading-relaxed">
              From your first awkward message to airport reunions, first trips, and anniversaries. Keep every date, photo, and emotional milestone organized in a quiet, chronological journey.
            </p>
            <div className="pt-2">
              <Button onClick={() => setCurrentView('timeline')} variant="outline">
                <span>Explore Timeline</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="py-16 bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950 text-terracotta-500 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-medium text-foreground">
            Private by default. Strictly for two.
          </h3>
          <p className="text-sm sm:text-base text-foreground-muted max-w-xl mx-auto leading-relaxed">
            There are no public followers, algorithm feeds, or strangers. Only you and your partner hold the key to your couple room.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center space-y-6">
        <h2 className="font-serif text-3xl sm:text-5xl font-medium text-foreground tracking-tight">
          Ready to build your little place?
        </h2>
        <p className="text-base text-foreground-muted max-w-md mx-auto">
          Start your couple space in less than two minutes.
        </p>
        <Button
          onClick={() => setCurrentView('auth')}
          variant="primary"
          size="lg"
          className="px-8 py-4 font-medium shadow-medium"
        >
          Create Your Space Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border text-xs text-foreground-muted text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-foreground">US</span>
            <span>— Your Own Little Internet for Two</span>
          </div>
          <p>© {new Date().getFullYear()} USFRAME × LDR Couple Space. Built with care for couples across the world.</p>
        </div>
      </footer>

    </div>
  );
};
