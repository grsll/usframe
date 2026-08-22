import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Couple } from '../types';
import { storage } from '../lib/storage';
import { generateInviteCode, generateInitialsAvatar } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { INITIAL_USER, INITIAL_PARTNER, INITIAL_COUPLE } from '../data/initialData';

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
    try {
      if (cleanEmail.includes('@')) {
        await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass }).catch(() => null);
      }
    } catch {}

    const existingUser = storage.findUserByEmail(cleanEmail);
    if (!existingUser) {
      throw new Error('Akun dengan email ini belum terdaftar. Silakan daftar akun baru terlebih dahulu.');
    }

    if (existingUser.password && existingUser.password !== pass) {
      throw new Error('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
    }

    const { user: loggedUser, partner: resolvedPartner, couple: resolvedCouple } = storage.syncUserSession(existingUser.id);
    
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

    try {
      if (cleanEmail.includes('@')) {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: { data: { name: cleanName } }
        }).catch(() => null);
      }
    } catch {}

    const finalAvatar = avatar && avatar.trim() ? avatar : generateInitialsAvatar(cleanName);

    const newUser: UserProfile = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
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

    const inviteCode = generateInviteCode();
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

    const targetCouple = storage.findCoupleByInviteCode(code);
    if (!targetCouple) {
      throw new Error(`Ruangan dengan kode "${code}" tidak ditemukan. Pastikan kodenya benar.`);
    }

    if (targetCouple.member_ids.includes(user.id)) {
      throw new Error('Kamu sudah bergabung di dalam ruangan ini.');
    }

    if (targetCouple.member_ids.length >= 2) {
      throw new Error('Ruangan ini sudah terhubung penuh dengan 2 anggota.');
    }

    const newMemberIds = [...targetCouple.member_ids, user.id];
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

  const leaveCoupleRoom = () => {
    if (!user) return;
    storage.removeUserFromCouple(user.id);
    const updatedUser = { ...user, couple_id: null };
    setUserState(updatedUser);
    setCoupleState(null);
    setPartnerState(null);
    setCurrentView('onboarding');
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUserState(updated);
    storage.saveUserToDB(updated);
  };

  const updatePartnerMood = (emoji: string, label: string) => {
    if (!partner) return;
    const updated = { ...partner, current_mood: emoji, mood_label: label };
    setPartnerState(updated);
    storage.saveUserToDB(updated);
  };

  const updateCoupleSettings = (updates: Partial<Couple>) => {
    if (!couple) return;
    const updated = { ...couple, ...updates };
    setCoupleState(updated);
    storage.saveCoupleToDB(updated);
  };

  const sendHeartPulse = (message = 'Aku kangen kamu saat ini 🤍') => {
    setPulseTriggered({
      from: user?.name || 'Pasanganmu',
      message,
      timestamp: Date.now()
    });
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

