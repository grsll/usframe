import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Couple } from '../types';
import { storage } from '../lib/storage';
import { generateInitialsAvatar, isUuid, generateUuid } from '../lib/utils';
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

const VALID_VIEWS: AppView[] = [
  'landing', 
  'auth', 
  'onboarding', 
  'home', 
  'memories', 
  'usframe', 
  'timeline', 
  'together', 
  'settings'
];

const getViewFromUrl = (): AppView | null => {
  if (typeof window === 'undefined') return null;
  
  // Check URL parameters for invite code first
  const params = new URLSearchParams(window.location.search);
  if (params.get('invite') || params.get('code')) {
    return 'onboarding';
  }

  // Check URL hash
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase() as AppView;
  if (VALID_VIEWS.includes(hash)) {
    return hash;
  }

  return null;
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
  userRooms: Couple[];
  isAuthenticated: boolean;
  currentView: AppView;
  setCurrentView: (view: AppView, replace?: boolean) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string, avatar?: string) => Promise<boolean>;
  loginDemo: () => void;
  logout: () => void;
  fetchUserRooms: () => Promise<Couple[]>;
  switchCoupleRoom: (coupleId: string) => Promise<void>;
  deleteCoupleRoom: (coupleId: string) => Promise<void>;
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
  const [userRooms, setUserRooms] = useState<Couple[]>([]);

  const [currentView, setCurrentViewState] = useState<AppView>(() => {
    const fromUrl = getViewFromUrl();
    const savedUser = storage.getUser();
    const savedCouple = storage.getCouple();

    // If not logged in, NEVER show protected or onboarding pages
    if (!savedUser) {
      if (fromUrl === 'auth') return 'auth';
      return 'landing';
    }

    // If logged in and has couple room, land on dashboard or bookmarked view
    if (savedCouple) {
      const validViews: AppView[] = ['home', 'memories', 'usframe', 'timeline', 'together', 'settings'];
      if (fromUrl && validViews.includes(fromUrl)) {
        return fromUrl;
      }
      return 'home';
    }

    // If logged in but no couple room yet, go to onboarding
    return 'onboarding';
  });

  const [pulseTriggered, setPulseTriggered] = useState<{ from: string; message: string; timestamp: number } | null>(null);
  const [boothInviteReceived, setBoothInviteReceived] = useState<{ fromId: string; fromName: string; timestamp: number } | null>(null);

  // Synchronize view changes with browser URL hash and history
  const setCurrentView = useCallback((view: AppView, replace = false) => {
    setCurrentViewState(view);
    storage.setCurrentView(view);
    if (typeof window !== 'undefined') {
      const targetHash = '#' + view;
      if (window.location.hash !== targetHash) {
        if (replace) {
          window.history.replaceState(null, '', targetHash);
        } else {
          window.history.pushState(null, '', targetHash);
        }
      }
    }
  }, []);

  // Listen to browser Back/Forward navigation (hashchange & popstate)
  useEffect(() => {
    const handleUrlChange = () => {
      const view = getViewFromUrl();
      if (view) {
        setCurrentViewState(view);
        storage.setCurrentView(view);
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    // Ensure initial URL has matching hash if not present
    if (typeof window !== 'undefined') {
      const existing = getViewFromUrl();
      if (!existing) {
        window.history.replaceState(null, '', '#' + currentView);
      }
    }

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [currentView]);

  // Sync complete user, couple, and partner session from Supabase & recover room history
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

      const localUser = storage.findUserById(userId) || storage.getUser();

      const currentUser: UserProfile = profile ? {
        id: profile.id,
        name: profile.name || localUser?.name || 'Kamu',
        email: profile.email || localUser?.email || '',
        avatar: profile.photo_url || localUser?.avatar || generateInitialsAvatar(profile.name || 'Kamu'),
        couple_id: profile.couple_id || localUser?.couple_id || null,
        current_mood: profile.current_mood || '🥰',
        mood_label: profile.mood_label || 'Siap melanjutkan kisah kita',
        status_activity: profile.status_activity || 'Santai di rumah',
        location_name: profile.location_name || localUser?.location_name,
        created_at: profile.created_at || new Date().toISOString()
      } : (localUser || {
        id: userId,
        name: 'Kamu',
        email: '',
        avatar: generateInitialsAvatar('Kamu'),
        couple_id: null,
        created_at: new Date().toISOString()
      });

      storage.saveUserToDB(currentUser);
      storage.setUser(currentUser);
      setUserState(currentUser);

      // 2. Fetch couple room: check profile.couple_id first, then query couples where member_ids contains userId, then local cache
      let coupleRow: any = null;

      if (currentUser.couple_id && isUuid(currentUser.couple_id)) {
        const { data } = await supabase
          .from('couples')
          .select('*')
          .eq('id', currentUser.couple_id)
          .maybeSingle();
        coupleRow = data;
      }

      // If not linked yet or unlinked, search if there is any couple room in Supabase with this user as member!
      if (!coupleRow) {
        const { data: foundCouples } = await supabase
          .from('couples')
          .select('*')
          .contains('member_ids', [userId])
          .order('created_at', { ascending: false })
          .limit(1);

        if (foundCouples && foundCouples.length > 0) {
          coupleRow = foundCouples[0];
          // Auto-link back to profile so it's permanent across all devices!
          currentUser.couple_id = coupleRow.id;
          storage.saveUserToDB(currentUser);
          storage.setUser(currentUser);
          setUserState(currentUser);
          try {
            await supabase.from('profiles').update({ couple_id: coupleRow.id }).eq('id', userId);
          } catch {}
        }
      }

      // If still not found in Supabase, check local couple storage
      if (!coupleRow) {
        const localCouple = storage.getCouple() || (currentUser.couple_id ? storage.findCoupleById(currentUser.couple_id) : null);
        if (localCouple) {
          coupleRow = localCouple;
        }
      }

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

      // 3. Resolve partner profile from Supabase profiles table
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
        const localPartner = storage.getPartner();
        if (localPartner && localPartner.id === partnerId) {
          currentPartner = localPartner;
        } else {
          storage.setPartner(null);
          setPartnerState(null);
        }
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
  }, [setCurrentView]);

  // Session Persistence on Boot and Auth State Listener
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        // Check either Supabase authenticated user or stored persistent user
        const effectiveUserId = session?.user?.id || storage.getUser()?.id;

        if (effectiveUserId && isUuid(effectiveUserId)) {
          const synced = await syncRemoteSession(effectiveUserId);
          if (isMounted) {
            if (synced.couple) {
              const currentSavedView = storage.getCurrentView() as AppView | null;
              const validViews: AppView[] = ['home', 'memories', 'usframe', 'timeline', 'together', 'settings'];
              if (currentSavedView && validViews.includes(currentSavedView)) {
                setCurrentView(currentSavedView);
              } else {
                setCurrentView('home');
              }
            } else if (synced.user) {
              setCurrentView('onboarding');
            } else {
              setCurrentView('landing');
            }
          }
        } else {
          // Check local demo user session (Kai & Elena)
          const localUser = storage.getUser();
          if (localUser && (localUser.id === INITIAL_USER.id || localUser.id === INITIAL_PARTNER.id)) {
            const localSession = storage.syncUserSession(localUser.id);
            setUserState(localSession.user);
            setPartnerState(localSession.partner);
            setCoupleState(localSession.couple);
            const currentSavedView = storage.getCurrentView() as AppView | null;
            if (currentSavedView && ['home', 'memories', 'usframe', 'timeline', 'together', 'settings'].includes(currentSavedView)) {
              setCurrentView(currentSavedView);
            } else {
              setCurrentView('home');
            }
          } else {
            // Unauthenticated guest -> ALWAYS land on landing page
            setUserState(null);
            setPartnerState(null);
            setCoupleState(null);
            storage.setUser(null);
            storage.setCouple(null);
            storage.setPartner(null);
            setCurrentView('landing');
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
          const synced = await syncRemoteSession(session.user.id);
          if (synced.couple) {
            setCurrentView('home');
          } else {
            setCurrentView('onboarding');
          }
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
  }, [syncRemoteSession, setCurrentView]);

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
    await fetchUserRooms();
    setCurrentView('onboarding');

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

    let remoteUserId = data?.user?.id;

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error('Alamat email sudah terdaftar. Silakan langsung masuk ke akun Anda.');
      }
      if (msg.includes('password')) {
        throw new Error('Kata sandi terlalu pendek. Gunakan minimal 6 karakter.');
      }
      if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        console.warn('Supabase email rate limit reached, generating local session');
        remoteUserId = generateUuid();
      } else {
        throw new Error(error.message || 'Pendaftaran ke server Supabase gagal.');
      }
    }

    if (!remoteUserId) {
      remoteUserId = generateUuid();
    }

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
    const effectiveUserId = isUuid(user.id) ? user.id : (await getRemoteUserId());

    if (effectiveUserId) {
      // 1. Ensure profile exists in profiles table
      try {
        await supabase.from('profiles').upsert({
          id: effectiveUserId,
          name: user.name,
          email: user.email,
          photo_url: user.avatar,
          location_name: params.userCity || 'Jakarta'
        }, { onConflict: 'id' });
      } catch (profileErr) {
        console.warn('Profile upsert before room creation:', profileErr);
      }

      // 2. Insert into Supabase couples table
      const { data, error } = await supabase
        .from('couples')
        .insert([{
          invite_code: inviteCode,
          status: 'pending',
          member_ids: [effectiveUserId],
          couple_name: params.coupleName || `Ruang ${user.name}`,
          relationship_start_date: params.relationshipStartDate || new Date().toISOString().split('T')[0],
          next_meet_date: params.nextMeetDate || null,
          user_city: params.userCity || 'Jakarta'
        }])
        .select()
        .single();

      if (error || !data) {
        console.error('Supabase create room error:', error);
        throw new Error('Gagal menyimpan ruangan ke server: ' + (error?.message || 'Pastikan izin RLS tabel couples sudah diperbarui.'));
      }

      await supabase.from('profiles').update({ 
        couple_id: data.id,
        location_name: params.userCity || 'Jakarta'
      }).eq('id', effectiveUserId);

      await syncRemoteSession(effectiveUserId);
      setCurrentView('home');
      return storage.getCouple()!;
    }

    // Demo account only (e.g. initial demo user)
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

    const effectiveUserId = isUuid(user.id) ? user.id : (await getRemoteUserId());

    if (effectiveUserId) {
      let joinSuccess = false;

      // 1. Ensure profile exists in profiles table
      try {
        await supabase.from('profiles').upsert({
          id: effectiveUserId,
          name: user.name,
          email: user.email,
          photo_url: user.avatar,
          location_name: userCity || user.location_name || 'Bandung'
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Profile upsert before join:', e);
      }

      // 2. Try PostgreSQL RPC first
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('join_couple_room', {
          p_invite_code: code,
          p_city: userCity || user.location_name || 'Bandung',
          p_user_id: effectiveUserId
        });

        if (!rpcError && rpcData) {
          joinSuccess = true;
          console.log('[joinRoom] RPC success:', rpcData);
        } else if (rpcError) {
          console.warn('[joinRoom] RPC error:', rpcError.message);
          if (rpcError.message && (
            rpcError.message.includes('sudah penuh') || 
            rpcError.message.includes('sudah bergabung')
          )) {
            throw new Error(rpcError.message);
          }
        }
      } catch (e: any) {
        if (e.message && (e.message.includes('sudah penuh') || e.message.includes('sudah bergabung'))) {
          throw e;
        }
        console.warn('[joinRoom] RPC exception:', e);
      }

      // 3. Direct query fallback
      if (!joinSuccess) {
        console.log('[joinRoom] Trying direct query for code:', code);
        const { data: targetCouple, error: findError } = await supabase
          .from('couples')
          .select('*')
          .ilike('invite_code', code)
          .maybeSingle();

        console.log('[joinRoom] Direct query result:', { targetCouple, findError });

        if (findError) {
          console.error('Find couple error:', findError);
          throw new Error('Gagal memeriksa kode undangan ke server: ' + findError.message);
        }

        if (!targetCouple) {
          // Check local demo couples before failing
          const localMatch = storage.findCoupleByInviteCode(code);
          if (localMatch) {
            const updatedCouple: Couple = {
              ...localMatch,
              member_ids: Array.from(new Set([...localMatch.member_ids, effectiveUserId])),
              status: 'active',
              partner_city: userCity || 'Bandung'
            };
            storage.saveCoupleToDB(updatedCouple);
            storage.setCouple(updatedCouple);
            setCoupleState(updatedCouple);
            const updatedUser: UserProfile = { ...user, couple_id: updatedCouple.id };
            storage.saveUserToDB(updatedUser);
            storage.setUser(updatedUser);
            setUserState(updatedUser);
            setCurrentView('home');
            return updatedCouple;
          }

          throw new Error(`Ruangan dengan kode "${code}" tidak ditemukan. Pastikan kodenya benar.`);
        }

        if (targetCouple.member_ids?.includes(effectiveUserId)) {
          // Already in this room — just sync session
          await syncRemoteSession(effectiveUserId);
          setCurrentView('home');
          return storage.getCouple()!;
        }

        if (targetCouple.member_ids && targetCouple.member_ids.length >= 2) {
          throw new Error('Ruangan ini sudah penuh (terhubung dengan 2 anggota).');
        }

        const newMemberIds = Array.from(new Set([...(targetCouple.member_ids || []), effectiveUserId]));
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
        }).eq('id', effectiveUserId);
      }

      // Sync complete state (including partner profile!)
      await syncRemoteSession(effectiveUserId);
      setCurrentView('home');
      return storage.getCouple()!;
    }

    // Local demo fallback (non-UUID users)
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

  const fetchUserRooms = useCallback(async (): Promise<Couple[]> => {
    const activeUser = user || storage.getUser();
    if (!activeUser) return [];

    const roomsMap: Record<string, Couple> = {};

    // 1. Query Supabase for rooms where member_ids contains activeUser.id
    if (isUuid(activeUser.id)) {
      try {
        const { data, error } = await supabase
          .from('couples')
          .select('*')
          .contains('member_ids', [activeUser.id])
          .order('created_at', { ascending: false });

        if (!error && data) {
          data.forEach((row: any) => {
            roomsMap[row.id] = {
              id: row.id,
              invite_code: row.invite_code,
              status: row.status,
              member_ids: row.member_ids || [],
              couple_name: row.couple_name,
              relationship_start_date: row.relationship_start_date,
              next_meet_date: row.next_meet_date,
              user_city: row.user_city,
              partner_city: row.partner_city,
              created_at: row.created_at
            };
          });
        }
      } catch (err) {
        console.warn('Error fetching user rooms from Supabase:', err);
      }
    }

    // 2. Query local couples database
    const localCouples = storage.getCouplesDB();
    Object.values(localCouples).forEach((c) => {
      if (c && c.member_ids && c.member_ids.includes(activeUser.id)) {
        if (!roomsMap[c.id]) {
          roomsMap[c.id] = c;
        }
      }
    });

    const result = Object.values(roomsMap).sort((a, b) => {
      const aT = new Date(a.created_at || 0).getTime();
      const bT = new Date(b.created_at || 0).getTime();
      return bT - aT;
    });

    setUserRooms(result);
    return result;
  }, [user]);

  const switchCoupleRoom = async (coupleId: string): Promise<void> => {
    const activeUser = user || storage.getUser();
    if (!activeUser) return;

    const updatedUser: UserProfile = { ...activeUser, couple_id: coupleId };
    storage.saveUserToDB(updatedUser);
    storage.setUser(updatedUser);
    setUserState(updatedUser);

    if (isUuid(activeUser.id)) {
      try {
        await supabase
          .from('profiles')
          .update({ couple_id: coupleId })
          .eq('id', activeUser.id);
      } catch (e) {
        console.warn('Error updating couple_id:', e);
      }
      await syncRemoteSession(activeUser.id);
    } else {
      const targetCouple = storage.findCoupleById(coupleId);
      if (targetCouple) {
        storage.setCouple(targetCouple);
        setCoupleState(targetCouple);
      }
    }

    setCurrentView('home');
  };

  const deleteCoupleRoom = async (coupleId: string): Promise<void> => {
    const activeUser = user || storage.getUser();
    if (!activeUser) return;

    // 1. Delete from Supabase
    if (isUuid(coupleId)) {
      try {
        await supabase
          .from('couples')
          .delete()
          .eq('id', coupleId);
      } catch (e) {
        console.warn('Error deleting couple from Supabase:', e);
      }
    }

    // 2. Delete from local database
    const localCouples = storage.getCouplesDB();
    delete localCouples[coupleId];
    try {
      localStorage.setItem('us_couples_database', JSON.stringify(localCouples));
    } catch {}

    // 3. If currently active couple, clear active room
    if (couple?.id === coupleId) {
      storage.setCouple(null);
      storage.setPartner(null);
      setCoupleState(null);
      setPartnerState(null);
      const updatedUser: UserProfile = { ...activeUser, couple_id: null };
      storage.saveUserToDB(updatedUser);
      storage.setUser(updatedUser);
      setUserState(updatedUser);

      if (isUuid(activeUser.id)) {
        try {
          await supabase.from('profiles').update({ couple_id: null }).eq('id', activeUser.id);
        } catch {}
      }
    }

    await fetchUserRooms();
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
        userRooms,
        isAuthenticated: !!user,
        currentView,
        setCurrentView,
        login,
        register,
        loginDemo,
        logout,
        fetchUserRooms,
        switchCoupleRoom,
        deleteCoupleRoom,
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
