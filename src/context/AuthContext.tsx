import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Couple } from '../types';
import { storage } from '../lib/storage';
import { generateInitialsAvatar, isUuid } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { roomService } from '../lib/roomService';
import { INITIAL_USER, INITIAL_PARTNER, INITIAL_COUPLE } from '../data/initialData';

const getRemoteUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getUser();
    return isUuid(data.user?.id) ? data.user!.id : null;
  } catch {
    return null;
  }
};

export type AppView = 
  | 'landing' 
  | 'auth' 
  | 'onboarding' 
  | 'home' 
  | 'memories' 
  | 'usframe' 
  | 'timeline' 
  | 'together' 
  | 'settings';

interface AuthContextType {
  user: UserProfile | null;
  partner: UserProfile | null;
  couple: Couple | null;
  isAuthenticated: boolean;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string, avatar?: string) => Promise<boolean>;
  loginDemo: () => void;
  logout: () => void;
  createCoupleRoom: (params: {
    coupleName?: string;
    relationshipStartDate: string;
    nextMeetDate?: string;
    userCity?: string;
  }) => Promise<Couple>;
  joinCoupleRoom: (inviteCode: string, userCity?: string) => Promise<Couple>;
  leaveCoupleRoom: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  updatePartnerMood: (emoji: string, label: string) => void;
  updateCoupleSettings: (updates: Partial<Couple>) => void;
  sendHeartPulse: (message?: string) => void;
  pulseTriggered: { from: string; message: string; timestamp: number } | null;
  clearPulse: () => void;
  boothInviteReceived: { fromId: string; fromName: string; timestamp: number } | null;
  acceptBoothInvite: () => void;
  declineBoothInvite: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(() => storage.getUser());
  const [partner, setPartnerState] = useState<UserProfile | null>(() => storage.getPartner());
  const [couple, setCoupleState] = useState<Couple | null>(() => storage.getCouple());

  const [currentView, setCurrentViewState] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('invite') || params.get('code')) {
        return 'onboarding';
      }
    }
    const savedUser = storage.getUser();
    const savedView = storage.getCurrentView() as AppView | null;
    
    if (!savedUser) {
      return (savedView === 'auth' || savedView === 'onboarding') ? savedView : 'landing';
    }
    
    const savedCouple = storage.getCouple();
    if (!savedCouple) {
      return 'onboarding';
    }
    
    const validViews: AppView[] = ['home', 'memories', 'usframe', 'timeline', 'together', 'settings'];
    if (savedView && validViews.includes(savedView)) {
      return savedView;
    }
    return 'home';
  });

  const [pulseTriggered, setPulseTriggered] = useState<{ from: string; message: string; timestamp: number } | null>(null);
  const [boothInviteReceived, setBoothInviteReceived] = useState<{ fromId: string; fromName: string; timestamp: number } | null>(null);

  // Synchronize view changes with storage
  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    storage.setCurrentView(view);
  };

  // Sync complete user, couple, and partner session from Supabase
  const syncRemoteSession = useCallback(async (userId: string): Promise<{ user: UserProfile | null; partner: UserProfile | null; couple: Couple | null }> => {
    if (!isUuid(userId)) {
      return storage.syncUserSession(userId);
    }

    try {
      // 1. Fetch user's profile from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        return { user: null, partner: null, couple: null };
      }

      const currentUser: UserProfile = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.photo_url || generateInitialsAvatar(profile.name),
        couple_id: profile.couple_id || null,
        current_mood: profile.current_mood || '🥰',
        mood_label: profile.mood_label || 'Siap melanjutkan kisah kita',
        status_activity: profile.status_activity || 'Santai di rumah',
        location_name: profile.location_name,
        created_at: profile.created_at
      };

      storage.saveUserToDB(currentUser);
      storage.setUser(currentUser);
      setUserState(currentUser);

      // 2. If user has no couple room yet
      if (!profile.couple_id) {
        storage.setCouple(null);
        storage.setPartner(null);
        setCoupleState(null);
        setPartnerState(null);
        return { user: currentUser, partner: null, couple: null };
      }

      // 3. Fetch couple room data from Supabase
      const { data: coupleRow } = await supabase
        .from('couples')
        .select('*')
        .eq('id', profile.couple_id)
        .maybeSingle();

      if (!coupleRow) {
        storage.setCouple(null);
        storage.setPartner(null);
        setCoupleState(null);
        setPartnerState(null);
        return { user: currentUser, partner: null, couple: null };
      }

      const currentCouple: Couple = {
        id: coupleRow.id,
        invite_code: coupleRow.invite_code,
        status: coupleRow.status,
        member_ids: coupleRow.member_ids || [],
        couple_name: coupleRow.couple_name,
        relationship_start_date: coupleRow.relationship_start_date,
        next_meet_date: coupleRow.next_meet_date,
        user_city: coupleRow.user_city,
        partner_city: coupleRow.partner_city,
        created_at: coupleRow.created_at
      };

      storage.saveCoupleToDB(currentCouple);
      storage.setCouple(currentCouple);
      setCoupleState(currentCouple);

      // 4. Resolve partner profile from Supabase profiles table
      const partnerId = (coupleRow.member_ids || []).find((id: string) => id !== userId);
      let currentPartner: UserProfile | null = null;

      if (partnerId && isUuid(partnerId)) {
        const { data: partnerRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .maybeSingle();

        if (partnerRow) {
          currentPartner = {
            id: partnerRow.id,
            name: partnerRow.name,
            email: partnerRow.email,
            avatar: partnerRow.photo_url || generateInitialsAvatar(partnerRow.name),
            couple_id: partnerRow.couple_id || coupleRow.id,
            current_mood: partnerRow.current_mood || '🥰',
            mood_label: partnerRow.mood_label || 'Aktif di ruang berdua',
            status_activity: partnerRow.status_activity || 'Online',
            location_name: partnerRow.location_name,
            created_at: partnerRow.created_at
          };

          storage.saveUserToDB(currentPartner);
          storage.setPartner(currentPartner);
          setPartnerState(currentPartner);
        }
      }

      if (!currentPartner) {
        storage.setPartner(null);
        setPartnerState(null);
      }

      return { user: currentUser, partner: currentPartner, couple: currentCouple };
    } catch (err) {
      console.warn('Error syncing remote session:', err);
      return storage.syncUserSession(userId);
    }
  }, []);

  // Check URL params for invite code or initial view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite') || params.get('code');
    if (invite) {
      setCurrentView('onboarding');
    }
  }, []);

  // Session Persistence on Boot and Auth State Listener
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user?.id) {
          const synced = await syncRemoteSession(session.user.id);
          if (isMounted) {
            if (synced.couple) {
              // Maintain active page or set home
              const currentSavedView = storage.getCurrentView() as AppView | null;
              const validViews: AppView[] = ['home', 'memories', 'usframe', 'timeline', 'together', 'settings'];
              if (currentSavedView && validViews.includes(currentSavedView)) {
                setCurrentViewState(currentSavedView);
              } else {
                setCurrentView('home');
              }
            } else {
              setCurrentView('onboarding');
            }
          }
        } else {
          // If no remote Supabase session, check local storage (for demo login)
          const localUser = storage.getUser();
          if (localUser && (localUser.id === INITIAL_USER.id || localUser.id === INITIAL_PARTNER.id)) {
            const localSession = storage.syncUserSession(localUser.id);
            setUserState(localSession.user);
            setPartnerState(localSession.partner);
            setCoupleState(localSession.couple);
          } else {
            setUserState(null);
            setPartnerState(null);
            setCoupleState(null);
          }
        }
      } catch (err) {
        console.warn('Session restoration error:', err);
      }
    };

    restoreSession();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          await syncRemoteSession(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserState(null);
        setPartnerState(null);
        setCoupleState(null);
        storage.setUser(null);
        storage.setCouple(null);
        storage.setPartner(null);
        setCurrentView('landing');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncRemoteSession]);

  // Realtime Broadcast Channel & Database changes for Couple Room
  useEffect(() => {
    if (!couple?.id) return;

    // 1. Broadcast channel for pulse & live mood
    const roomChannel = supabase.channel(`couple_room_${couple.id}`, {
      config: { broadcast: { self: false } }
    });

    roomChannel
      .on('broadcast', { event: 'heart_pulse' }, (payload) => {
        const data = payload.payload;
        if (data && data.senderId !== user?.id) {
          setPulseTriggered({
            from: data.from || 'Pasanganmu',
            message: data.message || 'Aku kangen kamu saat ini 🤍',
            timestamp: data.timestamp || Date.now()
          });
        }
      })
      .on('broadcast', { event: 'booth_invite' }, (payload) => {
        const data = payload.payload;
        if (data && data.fromId !== user?.id) {
          setBoothInviteReceived({
            fromId: data.fromId,
            fromName: data.fromName || partner?.name || 'Pasanganmu',
            timestamp: data.timestamp || Date.now()
          });
        }
      })
      .on('broadcast', { event: 'mood_update' }, (payload) => {
        const data = payload.payload;
        if (data && data.senderId !== user?.id) {
          setPartnerState(prev => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              current_mood: data.mood || prev.current_mood,
              mood_label: data.label || prev.mood_label
            };
            storage.saveUserToDB(updated);
            return updated;
          });
        }
      })
      .subscribe();

    // 2. Realtime listener on couples table (e.g. when partner joins room)
    const coupleDbChannel = supabase
      .channel(`db_couple_${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${couple.id}`
        },
        () => {
          if (user?.id) {
            syncRemoteSession(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(coupleDbChannel);
    };
  }, [couple?.id, user?.id, syncRemoteSession]);

  const loginDemo = () => {
    storage.loadDemoData();
    setUserState(INITIAL_USER);
    setPartnerState(INITIAL_PARTNER);
    setCoupleState(INITIAL_COUPLE);
    setCurrentView('home');
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      throw new Error('Harap isi alamat email dan kata sandi.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        throw new Error('Email belum dikonfirmasi. Silakan periksa inbox/spam email Anda untuk tautan verifikasi atau nonaktifkan email confirmation di dashboard Supabase.');
      }
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        throw new Error('Email atau kata sandi yang Anda masukkan salah. Silakan coba lagi.');
      }
      throw new Error(error.message || 'Gagal masuk ke akun.');
    }

    if (!data.user?.id) {
      throw new Error('Gagal memuat sesi pengguna dari server.');
    }

    const session = await syncRemoteSession(data.user.id);
    if (session.couple) {
      setCurrentView('home');
    } else {
      setCurrentView('onboarding');
    }

    return true;
  };

  const register = async (name: string, email: string, pass: string, avatar?: string): Promise<boolean> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !pass) {
      throw new Error('Mohon lengkapi semua kolom pendaftaran.');
    }

    const finalAvatar = avatar && avatar.trim() ? avatar : generateInitialsAvatar(cleanName);

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          name: cleanName,
          photo_url: finalAvatar
        }
      }
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error('Alamat email sudah terdaftar. Silakan langsung masuk ke akun Anda.');
      }
      if (msg.includes('password')) {
        throw new Error('Kata sandi terlalu pendek. Gunakan minimal 6 karakter.');
      }
      throw new Error(error.message || 'Pendaftaran ke server Supabase gagal.');
    }

    if (!data.user?.id) {
      throw new Error('Pendaftaran gagal dibuat di server.');
    }

    const remoteUserId = data.user.id;

    // Create or update profile in Supabase profiles table
    try {
      await supabase.from('profiles').upsert({
        id: remoteUserId,
        name: cleanName,
        email: cleanEmail,
        photo_url: finalAvatar,
        current_mood: '🥰',
        mood_label: 'Siap memulai kisah kita',
        status_activity: 'Santai di rumah'
      }, { onConflict: 'id' });
    } catch (profileErr) {
      console.warn('Profile upsert warning:', profileErr);
    }

    if (data.session) {
      await syncRemoteSession(remoteUserId);
    } else {
      const newUser: UserProfile = {
        id: remoteUserId,
        name: cleanName,
        email: cleanEmail,
        avatar: finalAvatar,
        couple_id: null,
        current_mood: '🥰',
        mood_label: 'Siap memulai kisah kita',
        status_activity: 'Menyiapkan ruang pasangan',
        created_at: new Date().toISOString()
      };
      storage.saveUserToDB(newUser);
      storage.setUser(newUser);
      setUserState(newUser);
    }

    storage.setCouple(null);
    storage.setPartner(null);
    setCoupleState(null);
    setPartnerState(null);
    setCurrentView('onboarding');
    return true;
  };

  const logout = () => {
    try {
      supabase.auth.signOut().catch(() => null);
    } catch {}
    storage.setUser(null);
    storage.setCouple(null);
    storage.setPartner(null);
    setUserState(null);
    setCoupleState(null);
    setPartnerState(null);
    setCurrentView('landing');
  };

  const createCoupleRoom = async (params: {
    coupleName?: string;
    relationshipStartDate: string;
    nextMeetDate?: string;
    userCity?: string;
  }): Promise<Couple> => {
    if (!user) throw new Error('Harap masuk terlebih dahulu.');

    const inviteCode = await roomService.generateUniqueInviteCodeAsync();
    const remoteUserId = await getRemoteUserId();

    if (remoteUserId && remoteUserId === user.id) {
      const { data, error } = await supabase
        .from('couples')
        .insert([{
          invite_code: inviteCode,
          status: 'pending',
          member_ids: [remoteUserId],
          couple_name: params.coupleName || `Ruang ${user.name}`,
          relationship_start_date: params.relationshipStartDate || new Date().toISOString().split('T')[0],
          next_meet_date: params.nextMeetDate || null,
          user_city: params.userCity || 'Jakarta'
        }])
        .select()
        .single();

      if (error || !data) {
        console.error('Supabase create room error:', error);
        throw new Error(error?.message || 'Room gagal disimpan ke server. Pastikan tabel couples Supabase sudah aktif.');
      }

      await supabase.from('profiles').update({ 
        couple_id: data.id,
        location_name: params.userCity || 'Jakarta'
      }).eq('id', remoteUserId);

      await syncRemoteSession(remoteUserId);
      setCurrentView('home');
      return storage.getCouple()!;
    }

    const newCouple: Couple = {
      id: 'couple_' + Math.random().toString(36).substring(2, 9),
      invite_code: inviteCode,
      status: 'pending',
      member_ids: [user.id],
      couple_name: params.coupleName || `Ruang ${user.name}`,
      relationship_start_date: params.relationshipStartDate || new Date().toISOString().split('T')[0],
      next_meet_date: params.nextMeetDate || null,
      user_city: params.userCity || 'Jakarta',
      created_at: new Date().toISOString()
    };

    storage.saveCoupleToDB(newCouple);
    const updatedUser: UserProfile = { ...user, couple_id: newCouple.id };
    storage.saveUserToDB(updatedUser);
    storage.setUser(updatedUser);

    setUserState(updatedUser);
    setCoupleState(newCouple);
    setPartnerState(null);

    setCurrentView('home');
    return newCouple;
  };

  const joinCoupleRoom = async (inviteCode: string, userCity?: string): Promise<Couple> => {
    if (!user) throw new Error('Harap masuk terlebih dahulu.');
    const code = inviteCode.trim().toUpperCase();

    if (!code || code.length < 4) {
      throw new Error('Silakan masukkan kode undangan yang valid (contoh: US1234).');
    }

    const remoteUserId = await getRemoteUserId();

    if (remoteUserId && remoteUserId === user.id) {
      let joinSuccess = false;

      // 1. Try atomic PostgreSQL RPC if created
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('join_couple_room', {
          p_invite_code: code,
          p_city: userCity || user.location_name || 'Bandung'
        });

        if (!rpcError && rpcData) {
          joinSuccess = true;
        }
      } catch (e) {}

      // 2. Direct query fallback
      if (!joinSuccess) {
        const { data: targetCouple, error: findError } = await supabase
          .from('couples')
          .select('*')
          .eq('invite_code', code)
          .maybeSingle();

        if (findError) {
          console.error('Find couple error:', findError);
          throw new Error('Gagal memeriksa kode undangan ke server: ' + findError.message);
        }

        if (!targetCouple) {
          throw new Error(`Ruangan dengan kode "${code}" tidak ditemukan. Pastikan kodenya benar.`);
        }

        if (targetCouple.member_ids?.includes(remoteUserId)) {
          throw new Error('Kamu sudah bergabung di dalam ruangan ini.');
        }

        if (targetCouple.member_ids && targetCouple.member_ids.length >= 2) {
          throw new Error('Ruangan ini sudah penuh (terhubung dengan 2 anggota).');
        }

        const newMemberIds = [...(targetCouple.member_ids || []), remoteUserId];
        const partnerCity = userCity || user.location_name || 'Bandung';

        const { data: updatedData, error: updateError } = await supabase
          .from('couples')
          .update({ 
            member_ids: newMemberIds, 
            status: 'active',
            partner_city: partnerCity
          })
          .eq('id', targetCouple.id)
          .select()
          .maybeSingle();

        if (updateError || !updatedData) {
          console.error('Update couple error:', updateError);
          throw new Error(updateError?.message || 'Gagal terhubung ke ruangan. Pastikan izin RLS tabel couples sudah diperbarui.');
        }

        await supabase.from('profiles').update({ 
          couple_id: targetCouple.id,
          location_name: partnerCity 
        }).eq('id', remoteUserId);
      }

      // Sync complete state (including partner profile!)
      await syncRemoteSession(remoteUserId);
      setCurrentView('home');
      return storage.getCouple()!;
    }

    // Local demo fallback
    const targetCouple = storage.findCoupleByInviteCode(code);
    if (!targetCouple) {
      throw new Error(`Ruangan dengan kode "${code}" tidak ditemukan.`);
    }

    if (targetCouple.member_ids.includes(user.id)) {
      throw new Error('Kamu sudah bergabung di dalam ruangan ini.');
    }

    const updatedCouple: Couple = {
      ...targetCouple,
      member_ids: [...targetCouple.member_ids, user.id],
      status: 'active',
      partner_city: userCity || 'Bandung'
    };

    storage.saveCoupleToDB(updatedCouple);
    const updatedUser: UserProfile = { ...user, couple_id: updatedCouple.id };
    storage.saveUserToDB(updatedUser);
    storage.setUser(updatedUser);

    setUserState(updatedUser);
    setCoupleState(updatedCouple);
    setPartnerState(storage.findUserById(targetCouple.member_ids[0]));

    setCurrentView('home');
    return updatedCouple;
  };

  const leaveCoupleRoom = async () => {
    if (!user) return;
    const currentCoupleId = user.couple_id;
    const currentUserId = user.id;

    if (currentCoupleId && isUuid(currentCoupleId) && isUuid(currentUserId)) {
      try {
        const { data: remoteCouple } = await supabase
          .from('couples')
          .select('member_ids')
          .eq('id', currentCoupleId)
          .maybeSingle();

        const remainingMembers = (remoteCouple?.member_ids || []).filter((id: string) => id !== currentUserId);

        if (remainingMembers.length === 0) {
          await supabase.from('couples').delete().eq('id', currentCoupleId);
        } else {
          await supabase
            .from('couples')
            .update({ member_ids: remainingMembers, status: 'pending' })
            .eq('id', currentCoupleId);
        }

        await supabase
          .from('profiles')
          .update({ couple_id: null })
          .eq('id', currentUserId);
      } catch (err) {
        console.error('Error syncing room exit with Supabase:', err);
      }
    }

    storage.removeUserFromCouple(currentUserId);
    const updatedUser = { ...user, couple_id: null };
    setUserState(updatedUser);
    setCoupleState(null);
    setPartnerState(null);
    setCurrentView('onboarding');
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUserState(updated);
    storage.saveUserToDB(updated);

    if (isUuid(user.id)) {
      try {
        await supabase.from('profiles').update({
          name: updated.name,
          photo_url: updated.avatar,
          current_mood: updated.current_mood,
          mood_label: updated.mood_label,
          status_activity: updated.status_activity,
          location_name: updated.location_name
        }).eq('id', user.id);

        if (couple?.id && (updates.current_mood || updates.mood_label)) {
          const channel = supabase.channel(`couple_room_${couple.id}`);
          channel.send({
            type: 'broadcast',
            event: 'mood_update',
            payload: {
              senderId: user.id,
              mood: updated.current_mood,
              label: updated.mood_label
            }
          }).catch(() => null);
        }
      } catch (err) {
        console.warn('Error syncing profile update to Supabase:', err);
      }
    }
  };

  const updatePartnerMood = (emoji: string, label: string) => {
    if (!partner) return;
    const updated = { ...partner, current_mood: emoji, mood_label: label };
    setPartnerState(updated);
    storage.saveUserToDB(updated);
  };

  const updateCoupleSettings = async (updates: Partial<Couple>) => {
    if (!couple) return;
    const updated = { ...couple, ...updates };
    setCoupleState(updated);
    storage.saveCoupleToDB(updated);

    if (isUuid(couple.id)) {
      try {
        await supabase.from('couples').update({
          couple_name: updated.couple_name,
          relationship_start_date: updated.relationship_start_date,
          next_meet_date: updated.next_meet_date,
          user_city: updated.user_city,
          partner_city: updated.partner_city
        }).eq('id', couple.id);
      } catch (err) {
        console.warn('Error syncing couple settings to Supabase:', err);
      }
    }
  };

  const sendHeartPulse = async (message = 'Aku kangen kamu saat ini 🤍') => {
    const pulsePayload = {
      from: user?.name || 'Pasanganmu',
      senderId: user?.id,
      message,
      timestamp: Date.now()
    };

    if (couple?.id) {
      try {
        const channel = supabase.channel(`couple_room_${couple.id}`);
        await channel.send({
          type: 'broadcast',
          event: 'heart_pulse',
          payload: pulsePayload
        });
      } catch (err) {
        console.warn('Realtime pulse send warning:', err);
      }

      if (isUuid(couple.id) && user && isUuid(user.id)) {
        roomService.recordHeartPulse(couple.id, user.id, message).catch(() => null);
      }
    } else {
      setPulseTriggered(pulsePayload);
    }
  };

  const clearPulse = () => {
    setPulseTriggered(null);
  };

  const acceptBoothInvite = () => {
    setBoothInviteReceived(null);
    setCurrentView('usframe');
    if (couple?.id) {
      const channel = supabase.channel(`couple_room_${couple.id}`);
      channel.send({
        type: 'broadcast',
        event: 'booth_join',
        payload: { senderId: user?.id, name: user?.name }
      }).catch(() => null);
    }
  };

  const declineBoothInvite = () => {
    setBoothInviteReceived(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        couple,
        isAuthenticated: !!user,
        currentView,
        setCurrentView,
        login,
        register,
        loginDemo,
        logout,
        createCoupleRoom,
        joinCoupleRoom,
        leaveCoupleRoom,
        updateUser,
        updatePartnerMood,
        updateCoupleSettings,
        sendHeartPulse,
        pulseTriggered,
        clearPulse,
        boothInviteReceived,
        acceptBoothInvite,
        declineBoothInvite
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
