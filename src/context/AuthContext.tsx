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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    return storage.getUser();
  });
  const [partner, setPartnerState] = useState<UserProfile | null>(() => {
    return storage.getPartner();
  });
  const [couple, setCoupleState] = useState<Couple | null>(() => {
    return storage.getCouple();
  });

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

  // Synchronize view changes with storage
  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    storage.setCurrentView(view);
  };

  // Check URL params for invite code or initial view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite') || params.get('code');
    if (invite) {
      setCurrentView('onboarding');
    }
  }, []);

  // Sync state whenever active user changes or mounts
  useEffect(() => {
    if (user?.id) {
      const session = storage.syncUserSession(user.id);
      setUserState(session.user);
      setPartnerState(session.partner);
      setCoupleState(session.couple);
    }
  }, []);

  // Realtime Broadcast Channel for Room Events (Heart Pulse & Mood updates)
  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase.channel(`couple_room_${couple.id}`, {
      config: { broadcast: { self: false } }
    });

    channel
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, user?.id]);

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

    // Try Supabase auth if connected
    let remoteUserId: string | null = null;
    try {
      if (cleanEmail.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
        if (!error && isUuid(data.user?.id)) {
          remoteUserId = data.user!.id;
        }
      }
    } catch {}

    let existingUser = storage.findUserByEmail(cleanEmail);
    if (!existingUser && remoteUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', remoteUserId)
        .maybeSingle();

      if (profile) {
        existingUser = {
          id: remoteUserId,
          name: profile.name || cleanEmail.split('@')[0],
          email: profile.email || cleanEmail,
          password: pass,
          avatar: profile.photo_url || generateInitialsAvatar(profile.name || cleanEmail),
          couple_id: profile.couple_id || null,
          current_mood: profile.current_mood || '🥰',
          mood_label: profile.mood_label || 'Siap melanjutkan kisah kita',
          status_activity: profile.status_activity || 'Online',
          location_name: profile.location_name,
          created_at: profile.created_at
        };
        storage.saveUserToDB(existingUser);
      }
    }

    if (!existingUser && !remoteUserId) {
      throw new Error('Akun dengan email ini belum terdaftar. Silakan daftar akun baru terlebih dahulu.');
    }

    if (existingUser && existingUser.password && existingUser.password !== pass && !remoteUserId) {
      throw new Error('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
    }

    const loginUser = remoteUserId && existingUser && existingUser.id !== remoteUserId
      ? { ...existingUser, id: remoteUserId }
      : existingUser || {
          id: remoteUserId!,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          password: pass,
          avatar: generateInitialsAvatar(cleanEmail),
          couple_id: null,
          created_at: new Date().toISOString()
        };

    storage.saveUserToDB(loginUser);

    if (remoteUserId && loginUser.couple_id) {
      const { data: remoteCouple } = await supabase
        .from('couples')
        .select('*')
        .eq('id', loginUser.couple_id)
        .maybeSingle();
      if (remoteCouple) {
        storage.saveCoupleToDB({
          id: remoteCouple.id,
          invite_code: remoteCouple.invite_code,
          status: remoteCouple.status,
          member_ids: remoteCouple.member_ids,
          relationship_start_date: remoteCouple.relationship_start_date,
          next_meet_date: remoteCouple.next_meet_date,
          created_at: remoteCouple.created_at
        });
      }
    }

    const { user: loggedUser, partner: resolvedPartner, couple: resolvedCouple } = storage.syncUserSession(loginUser.id);
    
    setUserState(loggedUser);
    setPartnerState(resolvedPartner);
    setCoupleState(resolvedCouple);

    if (resolvedCouple) {
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

    const existingUser = storage.findUserByEmail(cleanEmail);
    if (existingUser) {
      throw new Error('Alamat email sudah terdaftar. Silakan masuk menggunakan akun Anda.');
    }

    // Step 7: Strict Supabase registration - Never silently fallback to local fake user
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: { data: { name: cleanName } }
    });

    if (error || !data.user?.id) {
      throw new Error(error?.message || 'Pendaftaran ke server Supabase gagal. Silakan periksa koneksi internet dan coba lagi.');
    }

    const remoteUserId = data.user.id;
    const finalAvatar = avatar && avatar.trim() ? avatar : generateInitialsAvatar(cleanName);

    const newUser: UserProfile = {
      id: remoteUserId,
      name: cleanName,
      email: cleanEmail,
      password: pass,
      avatar: finalAvatar,
      couple_id: null,
      current_mood: '🥰',
      mood_label: 'Siap memulai kisah kita',
      status_activity: 'Menyiapkan ruang pasangan',
      created_at: new Date().toISOString()
    };

    // Upsert profile in Supabase profiles table
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
      console.warn('Profile record save warning:', profileErr);
    }

    storage.saveUserToDB(newUser);
    storage.setUser(newUser);
    storage.setCouple(null);
    storage.setPartner(null);

    setUserState(newUser);
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

    // Step 5: Validate unique invite code against server
    const inviteCode = await roomService.generateUniqueInviteCodeAsync();
    const remoteUserId = await getRemoteUserId();
    
    if (!remoteUserId && user.id !== INITIAL_USER.id && user.id !== INITIAL_PARTNER.id) {
      throw new Error('Akun ini belum tersambung ke server. Masuk kembali setelah verifikasi email agar kode undangan bisa dipakai di perangkat lain.');
    }
    
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
        throw new Error('Room gagal disimpan ke server. Pastikan tabel couples Supabase sudah aktif.');
      }

      const remoteCouple: Couple = {
        id: data.id,
        invite_code: data.invite_code,
        status: data.status,
        member_ids: data.member_ids,
        couple_name: params.coupleName || `Ruang ${user.name}`,
        relationship_start_date: data.relationship_start_date,
        next_meet_date: data.next_meet_date,
        user_city: params.userCity || 'Jakarta',
        created_at: data.created_at
      };
      await supabase.from('profiles').update({ couple_id: data.id }).eq('id', remoteUserId);
      const updatedUser: UserProfile = { ...user, couple_id: data.id };
      storage.saveCoupleToDB(remoteCouple);
      storage.saveUserToDB(updatedUser);
      storage.setUser(updatedUser);
      setUserState(updatedUser);
      storage.setCouple(remoteCouple);
      setCoupleState(remoteCouple);
      setPartnerState(null);
      setCurrentView('home');
      return remoteCouple;
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

    // Save couple & link user
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

    if (!code) throw new Error('Silakan masukkan 6 karakter kode undangan.');

    const remoteUserId = await getRemoteUserId();
    let targetCouple = storage.findCoupleByInviteCode(code);

    if (remoteUserId && remoteUserId === user.id) {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', code)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        throw new Error('Room belum bisa dibaca dari server. Pastikan tabel couples Supabase sudah aktif.');
      }
      targetCouple = data ? {
        id: data.id,
        invite_code: data.invite_code,
        status: data.status,
        member_ids: data.member_ids,
        couple_name: data.couple_name,
        relationship_start_date: data.relationship_start_date,
        next_meet_date: data.next_meet_date,
        user_city: data.user_city,
        partner_city: data.partner_city,
        created_at: data.created_at
      } : null;
    }

    if (!targetCouple) {
      throw new Error(`Ruangan dengan kode "${code}" tidak ditemukan. Pastikan kodenya benar.`);
    }

    if (targetCouple.member_ids.includes(user.id)) {
      throw new Error('Kamu sudah bergabung di dalam ruangan ini.');
    }

    if (targetCouple.member_ids.length >= 2) {
      throw new Error('Ruangan ini sudah terhubung penuh dengan 2 anggota.');
    }

    const memberId = remoteUserId || user.id;
    const newMemberIds = [...targetCouple.member_ids, memberId];
    const owner = storage.findUserById(targetCouple.member_ids[0]);

    const updatedCouple: Couple = {
      ...targetCouple,
      member_ids: newMemberIds,
      status: 'active',
      couple_name: targetCouple.couple_name && !targetCouple.couple_name.startsWith('Ruang ')
        ? targetCouple.couple_name
        : `${owner?.name || 'Pasangan'} × ${user.name}`,
      partner_city: userCity || user.location_name || targetCouple.partner_city || 'Bandung'
    };

    if (remoteUserId && remoteUserId === user.id) {
      const { data, error } = await supabase
        .from('couples')
        .update({ 
          member_ids: newMemberIds, 
          status: 'active',
          partner_city: updatedCouple.partner_city
        })
        .eq('id', targetCouple.id)
        .eq('status', 'pending')
        .select()
        .maybeSingle();
      if (error || !data) {
        throw new Error('Room gagal dihubungkan. Kode mungkin sudah dipakai oleh akun lain.');
      }
      await supabase.from('profiles').update({ couple_id: targetCouple.id }).eq('id', remoteUserId);
    }

    storage.saveCoupleToDB(updatedCouple);
    const updatedUser: UserProfile = { ...user, couple_id: updatedCouple.id };
    storage.saveUserToDB(updatedUser);
    storage.setUser(updatedUser);

    setUserState(updatedUser);
    setCoupleState(updatedCouple);
    setPartnerState(owner || null);

    setCurrentView('home');
    return updatedCouple;
  };

  // Step 6: Fully Synchronized Leave Room
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
          // Delete couple room if empty
          await supabase.from('couples').delete().eq('id', currentCoupleId);
        } else {
          // Reset status to pending for the partner
          await supabase
            .from('couples')
            .update({ member_ids: remainingMembers, status: 'pending' })
            .eq('id', currentCoupleId);
        }

        // Clear couple_id in profiles table
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

  // Step 3: Realtime Heart Pulse via Supabase Realtime Broadcast & History Storage
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
      // Local fallback for demo
      setPulseTriggered(pulsePayload);
    }
  };

  const clearPulse = () => {
    setPulseTriggered(null);
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
        clearPulse
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
