import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Couple } from '../types';
import { storage } from '../lib/storage';
import { generateInviteCode } from '../lib/utils';
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
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  loginDemo: () => void;
  logout: () => void;
  createCoupleRoom: (params: {
    partnerName: string;
    relationshipStartDate: string;
    nextMeetDate?: string;
    userCity?: string;
    partnerCity?: string;
  }) => Promise<Couple>;
  joinCoupleRoom: (inviteCode: string) => Promise<Couple>;
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

  const loginDemo = () => {
    storage.loadDemoData();
    setUserState(INITIAL_USER);
    setPartnerState(INITIAL_PARTNER);
    setCoupleState(INITIAL_COUPLE);
    setCurrentView('home');
  };

  const login = async (email: string, _pass: string): Promise<boolean> => {
    // Attempt Supabase auth if connected
    try {
      if (email && email.includes('@')) {
        await supabase.auth.signInWithPassword({ email, password: _pass }).catch(() => null);
      }
    } catch {
      // Fallback to local session
    }

    const existingUser = storage.getUser();
    let loggedUser: UserProfile;

    if (existingUser && existingUser.email?.toLowerCase() === email.toLowerCase()) {
      loggedUser = existingUser;
    } else {
      loggedUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 8),
        name: email.split('@')[0],
        email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        current_mood: '😊',
        mood_label: 'Bahagia & Terhubung',
        status_activity: 'Online di ruang kita',
        created_at: new Date().toISOString()
      };
      storage.setUser(loggedUser);
    }

    setUserState(loggedUser);

    const existingCouple = storage.getCouple();
    const existingPartner = storage.getPartner();

    if (existingCouple) {
      setCoupleState(existingCouple);
    }
    if (existingPartner) {
      setPartnerState(existingPartner);
    }

    if (existingCouple) {
      setCurrentView('home');
    } else {
      setCurrentView('onboarding');
    }

    return true;
  };

  const register = async (name: string, email: string, _pass: string): Promise<boolean> => {
    try {
      if (email && email.includes('@')) {
        await supabase.auth.signUp({
          email,
          password: _pass,
          options: { data: { name } }
        }).catch(() => null);
      }
    } catch {
      // Fallback
    }

    const newUser: UserProfile = {
      id: 'user_' + Math.random().toString(36).substring(2, 8),
      name: name || email.split('@')[0],
      email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      current_mood: '🥰',
      mood_label: 'Siap memulai kisah kita',
      status_activity: 'Menyiapkan ruang pasangan',
      created_at: new Date().toISOString()
    };

    setUserState(newUser);
    storage.setUser(newUser);
    setCurrentView('onboarding');
    return true;
  };

  const logout = () => {
    try {
      supabase.auth.signOut().catch(() => null);
    } catch {}
    // Do NOT wipe couple data or memories so reconnecting is instant and safe
    setUserState(null);
    setCurrentView('landing');
  };

  const createCoupleRoom = async (params: {
    partnerName: string;
    relationshipStartDate: string;
    nextMeetDate?: string;
    userCity?: string;
    partnerCity?: string;
  }): Promise<Couple> => {
    const inviteCode = generateInviteCode();
    const newCouple: Couple = {
      id: 'couple_' + Math.random().toString(36).substring(2, 8),
      invite_code: inviteCode,
      status: 'active',
      member_ids: [user?.id || 'user_1', 'partner_pending'],
      couple_name: `${user?.name || 'Kamu'} × ${params.partnerName || 'Pasangan'}`,
      relationship_start_date: params.relationshipStartDate || new Date().toISOString().split('T')[0],
      next_meet_date: params.nextMeetDate || null,
      user_city: params.userCity || 'Jakarta',
      partner_city: params.partnerCity || 'Bandung',
      distance_km: 150,
      created_at: new Date().toISOString()
    };

    const newPartner: UserProfile = {
      id: 'partner_' + Math.random().toString(36).substring(2, 8),
      name: params.partnerName || 'Pasangan',
      email: `${params.partnerName?.toLowerCase().replace(/\s+/g, '') || 'pasangan'}@uscouple.app`,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      couple_id: newCouple.id,
      current_mood: '✨',
      mood_label: 'Menunggu bersama',
      status_activity: `Di ${params.partnerCity || 'Kota Pasangan'}`,
      location_name: params.partnerCity || 'Indonesia',
      last_active: 'Baru saja',
      created_at: new Date().toISOString()
    };

    if (user) {
      const updatedUser = { ...user, couple_id: newCouple.id };
      setUserState(updatedUser);
      storage.setUser(updatedUser);
    }

    setPartnerState(newPartner);
    storage.setPartner(newPartner);

    setCoupleState(newCouple);
    storage.setCouple(newCouple);

    setCurrentView('home');
    return newCouple;
  };

  const joinCoupleRoom = async (inviteCode: string): Promise<Couple> => {
    const code = inviteCode.trim().toUpperCase();
    const currentCouple = storage.getCouple() || {
      id: 'couple_' + Math.random().toString(36).substring(2, 8),
      invite_code: code,
      status: 'active' as const,
      member_ids: [user?.id || 'user_joined', 'partner_owner'],
      couple_name: `${user?.name || 'Kamu'} × Pasangan`,
      relationship_start_date: new Date().toISOString().split('T')[0],
      user_city: 'Jakarta',
      partner_city: 'Surabaya',
      created_at: new Date().toISOString()
    };
    
    const joinedCouple: Couple = {
      ...currentCouple,
      invite_code: code,
      status: 'active',
      member_ids: [user?.id || 'user_joined', currentCouple.member_ids[0]]
    };

    setCoupleState(joinedCouple);
    storage.setCouple(joinedCouple);

    if (user) {
      const updatedUser = { ...user, couple_id: joinedCouple.id };
      setUserState(updatedUser);
      storage.setUser(updatedUser);
    }

    setCurrentView('home');
    return joinedCouple;
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUserState(updated);
    storage.setUser(updated);
  };

  const updatePartnerMood = (emoji: string, label: string) => {
    if (!partner) return;
    const updated = { ...partner, current_mood: emoji, mood_label: label };
    setPartnerState(updated);
    storage.setPartner(updated);
  };

  const updateCoupleSettings = (updates: Partial<Couple>) => {
    if (!couple) return;
    const updated = { ...couple, ...updates };
    setCoupleState(updated);
    storage.setCouple(updated);
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
