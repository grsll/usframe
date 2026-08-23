import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { roomService } from '../../lib/roomService';
import { deviceNotification } from '../../lib/deviceNotification';
import { HeartMessage } from '../../types';
import { formatDatePretty, playSuccessChime } from '../../lib/utils';
import { Modal } from '../layout/Modal';
import { Button } from '../ui/Button';
import { Heart, Send, Bell, History, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeartPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_MESSAGES = [
  { emoji: '🤍', text: 'Aku kangen kamu saat ini' },
  { emoji: '🥰', text: 'Lagi senyum sendiri kepikiran kamu' },
  { emoji: '☕', text: 'Semangat kerjanya ya cintaku' },
  { emoji: '✨', text: 'Peluk hangat dari jauh untukmu' },
  { emoji: '🌙', text: 'Malam ini tidur nyenyak ya sayang' },
  { emoji: '🥺', text: 'Butuh pelukan hangatmu sekarang' },
  { emoji: '💌', text: 'Ingat ya, aku selalu bangga sama kamu' },
  { emoji: '🥪', text: 'Jangan lupa makan & istirahat ya' }
];

export const HeartPulseModal: React.FC<HeartPulseModalProps> = ({ isOpen, onClose }) => {
  const { user, partner, couple, sendHeartPulse } = useAuth();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [customText, setCustomText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🤍');
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState<HeartMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'received' | 'sent'>('all');

  const [hasNotifPermission, setHasNotifPermission] = useState<boolean>(false);

  // Check notification permission on mount
  useEffect(() => {
    if (deviceNotification.isSupported()) {
      setHasNotifPermission(Notification.permission === 'granted');
    }
  }, [isOpen]);

  // Load message history
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await roomService.fetchHeartMessages(couple?.id);
      setMessages(data);
    } catch (err) {
      console.warn('Load heart messages error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, couple?.id]);

  // Realtime subscription to heart messages
  useEffect(() => {
    if (!isOpen || !couple?.id) return;
    const unsub = roomService.subscribeToHeartMessages(couple.id, () => {
      loadHistory();
    });
    return () => unsub();
  }, [isOpen, couple?.id]);

  // Handle requesting native device notification permission
  const handleEnableDeviceNotification = async () => {
    const granted = await deviceNotification.requestPermission();
    setHasNotifPermission(granted);
    if (granted) {
      success('Notifikasi perangkat berhasil diaktifkan! 🔔');
      deviceNotification.send('USFRAME Notifikasi Aktif ✨', {
        body: 'Kamu akan menerima notifikasi setiap kali pasangan mengirimkan pesan atau sinyal cinta.'
      });
    } else {
      info('Izin notifikasi tidak diberikan di browser.');
    }
  };

  // Handle sending message / heart pulse
  const handleSendMessage = async (messageText?: string, emoji?: string) => {
    const textToSend = (messageText || customText).trim() || 'Aku kangen kamu saat ini 🤍';
    const emojiToSend = emoji || selectedEmoji || '🤍';

    setIsSending(true);
    try {
      // 1. Broadcast to realtime channel + save to database
      await sendHeartPulse(textToSend);

      // 2. Play sound & celebratory confetti
      playSuccessChime();
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.3, x: 0.5 },
        colors: ['#D95D39', '#F472B6', '#FDA4AF']
      });

      // 3. Dispatch native notification for test/feedback
      deviceNotification.send(`Pesan Rindu Terkirim 🤍`, {
        body: textToSend
      });

      success(`Pesan cinta terkirim ke ${partner?.name || 'pasanganmu'}! 🤍`);
      setCustomText('');

      // Reload history and switch to history view
      await loadHistory();
      setActiveTab('history');
    } catch (err) {
      console.warn('Send pulse error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filterType === 'received') return m.sender_id !== user?.id;
    if (filterType === 'sent') return m.sender_id === user?.id;
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title="Sinyal & Pesan Cinta 🤍"
      subtitle={`Kirim sentuhan rindu langsung ke perangkat ${partner?.name || 'pasanganmu'}`}
    >
      <div className="space-y-4">
        
        {/* Device Notification Banner if not yet enabled */}
        {deviceNotification.isSupported() && !hasNotifPermission && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Aktifkan notifikasi agar pesan rindu muncul langsung di layar HP/laptopmu.</span>
            </div>
            <Button
              onClick={handleEnableDeviceNotification}
              size="sm"
              variant="outline"
              className="border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 shrink-0"
            >
              Aktifkan Notifikasi 🔔
            </Button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-surface-subtle p-1 border border-border">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'bg-surface text-foreground shadow-2xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Kirim Pesan Rindu</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-surface text-foreground shadow-2xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <History className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Riwayat Pesan ({messages.length})</span>
          </button>
        </div>

        {/* TAB 1: SEND MESSAGE */}
        {activeTab === 'send' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                <span>Pilih Pesan Cepat</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_MESSAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(preset.text, preset.emoji)}
                    disabled={isSending}
                    className="p-3 rounded-2xl border border-border bg-surface hover:bg-terracotta-50 dark:hover:bg-terracotta-950/60 hover:border-terracotta-300 dark:hover:border-terracotta-800 text-left transition-all text-xs font-medium flex items-center gap-2.5 cursor-pointer active:scale-98 group shadow-2xs"
                  >
                    <span className="text-lg group-hover:scale-125 transition-transform">{preset.emoji}</span>
                    <span className="text-foreground flex-1 line-clamp-1">{preset.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Box */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted flex items-center justify-between">
                <span>Atau Tulis Pesan Khusus</span>
                <span className="text-[10px] text-foreground-subtle font-normal">Maksimal 160 karakter</span>
              </label>

              <div className="relative">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={160}
                  placeholder={`Tulis apa yang sedang kamu rasakan untuk ${partner?.name || 'pasanganmu'}...`}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20 placeholder:text-foreground-subtle resize-none"
                />
              </div>

              {/* Emoji bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-xs text-foreground-muted mr-1">Emoji:</span>
                {['🤍', '🥰', '✨', '☕', '🌙', '🥺', '💌', '🌸', '🧸'].map((em) => (
                  <button
                    key={em}
                    onClick={() => setSelectedEmoji(em)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-transform cursor-pointer ${
                      selectedEmoji === em
                        ? 'bg-terracotta-100 dark:bg-terracotta-950 scale-110 ring-2 ring-terracotta-500'
                        : 'bg-surface hover:bg-surface-subtle border border-border'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Submit */}
            <div className="pt-2 flex justify-end gap-2">
              <Button onClick={onClose} variant="ghost">
                Tutup
              </Button>
              <Button
                onClick={() => handleSendMessage()}
                disabled={isSending || !customText.trim()}
                variant="primary"
                className="shadow-soft"
              >
                <Heart className="w-4 h-4 mr-1.5 fill-current" />
                <span>{isSending ? 'Mengirim...' : 'Kirim Pesan Rindu 🤍'}</span>
              </Button>
            </div>

          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-fade-in">
            
            {/* Filter & Refresh */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {(['all', 'received', 'sent'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      filterType === type
                        ? 'bg-terracotta-50 dark:bg-terracotta-950/80 border-terracotta-300 text-terracotta-700 dark:text-terracotta-300 font-semibold'
                        : 'bg-surface border-border text-foreground-muted hover:bg-surface-subtle'
                    }`}
                  >
                    {type === 'all' ? 'Semua' : type === 'received' ? `Dari ${partner?.name || 'Pasangan'}` : 'Terkirim'}
                  </button>
                ))}
              </div>

              <button
                onClick={loadHistory}
                disabled={isLoadingHistory}
                className="p-1.5 rounded-xl border border-border text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
                title="Muat ulang riwayat"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Message List */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-foreground-muted">
                  Memuat riwayat pesan rindu...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="py-8 text-center text-xs text-foreground-muted space-y-1">
                  <Heart className="w-6 h-6 text-foreground-subtle mx-auto mb-1" />
                  <p>Belum ada riwayat pesan rindu.</p>
                  <p className="text-[11px] text-foreground-subtle">Kirimkan sinyal rindu pertama ke pasanganmu!</p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs flex items-start justify-between gap-3 ${
                        isMe
                          ? 'bg-surface border-border'
                          : 'bg-terracotta-50/70 dark:bg-terracotta-950/50 border-terracotta-200 dark:border-terracotta-800/80'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-base">{msg.mood_emoji || '🤍'}</span>
                          <span className={`font-semibold ${isMe ? 'text-foreground' : 'text-terracotta-700 dark:text-terracotta-300'}`}>
                            {isMe ? 'Kamu' : msg.sender_name || partner?.name || 'Pasangan'}
                          </span>
                          <span className="text-[10px] text-foreground-subtle">
                            • {formatDatePretty(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-foreground text-xs leading-relaxed pl-6">
                          {msg.content}
                        </p>
                      </div>

                      {!isMe && (
                        <button
                          onClick={() => handleSendMessage('Aku kangen kamu juga sayang 🤍')}
                          className="px-2.5 py-1 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-[11px] font-medium shrink-0 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                        >
                          Balas 🤍
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom button */}
            <div className="pt-2 flex justify-between items-center border-t border-border">
              <Button
                onClick={() => setActiveTab('send')}
                variant="outline"
                size="sm"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Tulis Pesan Baru</span>
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                Tutup
              </Button>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
};
