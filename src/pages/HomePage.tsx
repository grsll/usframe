import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { storage } from '../lib/storage';
import { roomService } from '../lib/roomService';
import { deviceNotification } from '../lib/deviceNotification';
import { Memory, Countdown } from '../types';
import { CoupleHeader } from '../components/home/CoupleHeader';
import { CouplePetCard } from '../components/home/CouplePetCard';
import { FeaturedMemory } from '../components/home/FeaturedMemory';
import { QuickActions } from '../components/home/QuickActions';
import { NextMeetCountdown } from '../components/home/NextMeetCountdown';
import { RecentMemories } from '../components/home/RecentMemories';
import { AddMemoryModal } from '../components/memories/AddMemoryModal';
import { MemoryModal } from '../components/memories/MemoryModal';
import { BellRing, Heart, Sparkles, X } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const { couple, partner } = useAuth();
  const { success, info } = useToast();
  
  const [memories, setMemories] = useState<Memory[]>(() => storage.getMemories(couple?.id));
  const [countdowns, setCountdowns] = useState<Countdown[]>(() => storage.getCountdowns(couple?.id));
  
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  useEffect(() => {
    if (deviceNotification.isSupported() && Notification.permission === 'default') {
      const dismissed = sessionStorage.getItem('usframe_notif_prompt_dismissed');
      if (!dismissed) {
        setShowNotifBanner(true);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await deviceNotification.requestPermission();
    if (granted) {
      setShowNotifBanner(false);
      success('Notifikasi rindu berhasil diaktifkan di perangkatmu! 🔔🤍');
      deviceNotification.send('USFRAME Notifikasi Aktif 🤍', {
        body: `Sinyal rindu & surat cinta dari ${partner?.name || 'pasanganmu'} akan langsung muncul di HP/layarmu.`
      });
    } else {
      setShowNotifBanner(false);
      info('Izin notifikasi tidak diberikan di browser.');
    }
  };

  const handleDismissNotifBanner = () => {
    setShowNotifBanner(false);
    sessionStorage.setItem('usframe_notif_prompt_dismissed', 'true');
  };

  const loadData = useCallback(async () => {
    const [freshMemories, freshCountdowns] = await Promise.all([
      roomService.fetchMemories(couple?.id),
      roomService.fetchCountdowns(couple?.id)
    ]);
    setMemories(freshMemories);
    setCountdowns(freshCountdowns);
  }, [couple?.id]);

  useEffect(() => {
    loadData();
    const unsubMemories = roomService.subscribeToMemories(couple?.id, loadData);
    const unsubCountdowns = roomService.subscribeToCountdowns(couple?.id, loadData);

    return () => {
      unsubMemories();
      unsubCountdowns();
    };
  }, [loadData, couple?.id]);

  // Pick today's featured memory or favorite
  const featuredMemory = memories.find(m => m.is_favorite) || memories[0];

  const handleAddMemory = async (newMem: Memory) => {
    const created = await roomService.createMemory({
      coupleId: couple?.id || 'couple_main',
      uploaderId: newMem.created_by,
      creatorName: newMem.creator_name,
      title: newMem.title,
      caption: newMem.caption,
      location: newMem.location,
      mediaUrl: newMem.media_url,
      mediaType: newMem.media_type,
      category: newMem.category,
      isFavorite: newMem.is_favorite,
      date: newMem.date
    });
    setMemories(prev => [created, ...prev.filter(m => m.id !== created.id)]);
  };

  const handleToggleFavorite = async (id: string) => {
    const target = memories.find(m => m.id === id);
    if (!target) return;
    const nextFavorite = !target.is_favorite;

    setMemories(prev => prev.map(m => m.id === id ? { ...m, is_favorite: nextFavorite } : m));
    if (selectedMemory && selectedMemory.id === id) {
      setSelectedMemory(prev => prev ? { ...prev, is_favorite: nextFavorite } : null);
    }
    await roomService.toggleMemoryFavorite(id, nextFavorite, couple?.id);
  };

  const handleDeleteMemory = async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    if (selectedMemory && selectedMemory.id === id) {
      setSelectedMemory(null);
    }
    await roomService.deleteMemory(id, couple?.id);
  };

  const refreshCountdowns = async () => {
    const fresh = await roomService.fetchCountdowns(couple?.id);
    setCountdowns(fresh);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {/* Cute Push Notification Permission Prompt Banner */}
      {showNotifBanner && (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-terracotta-500/10 via-rose-500/10 to-amber-500/10 border-2 border-terracotta-300/80 dark:border-terracotta-700/80 p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center shadow-xs shrink-0 animate-bounce-subtle">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-sm sm:text-base font-semibold text-foreground">
                  Aktifkan Notifikasi Rindu 🔔
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                  Biar Selalu Nyambung
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Supaya saat {partner?.name || 'pasanganmu'} kirim pesan rindu, surat, atau foto, notifikasinya langsung muncul di HP kamu meskipun web sedang ditutup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={handleDismissNotifBanner}
              className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Nanti saja"
            >
              <X className="w-4 h-4" />
            </button>
            <Button
              onClick={handleEnableNotifications}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto shadow-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>Aktifkan Sekarang ✨</span>
            </Button>
          </div>
        </div>
      )}

      {/* Couple Header Hero */}
      <CoupleHeader />

      {/* Virtual Couple Pet & Streak System */}
      <CouplePetCard />

      {/* Quick Action Buttons */}
      <QuickActions onOpenAddMemory={() => setIsAddMemoryOpen(true)} />

      {/* Grid: Featured Memory (Remember This Day?) + Next Meet Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8">
          <FeaturedMemory memory={featuredMemory} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <NextMeetCountdown
            countdowns={countdowns}
            onUpdate={refreshCountdowns}
          />
        </div>
      </div>

      {/* Recent Memories Filmstrip */}
      <RecentMemories
        memories={memories}
        onSelectMemory={(m) => setSelectedMemory(m)}
      />

      {/* Modals */}
      <AddMemoryModal
        isOpen={isAddMemoryOpen}
        onClose={() => setIsAddMemoryOpen(false)}
        onAddMemory={handleAddMemory}
      />

      <MemoryModal
        memory={selectedMemory}
        isOpen={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteMemory}
      />

    </div>
  );
};
