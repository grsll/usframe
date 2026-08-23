import { Couple, UserProfile, Memory, Milestone, Countdown, LoveNote, DailyQuestion, BucketListItem } from '../types';
import { generateInviteCode } from './utils';
import { 
  INITIAL_USER, 
  INITIAL_PARTNER, 
  INITIAL_COUPLE, 
  INITIAL_MEMORIES, 
  INITIAL_MILESTONES, 
  INITIAL_COUNTDOWNS, 
  INITIAL_LOVE_NOTES, 
  INITIAL_DAILY_QUESTION, 
  INITIAL_BUCKET_LIST 
} from '../data/initialData';

const KEYS = {
  USERS_DB: 'us_users_database',
  COUPLES_DB: 'us_couples_database',
  CURRENT_USER_ID: 'us_active_user_id',
  USER: 'us_user_profile',
  PARTNER: 'us_partner_profile',
  COUPLE: 'us_couple_data',
  MEMORIES: 'us_memories_data',
  MILESTONES: 'us_milestones_data',
  COUNTDOWNS: 'us_countdowns_data',
  LOVE_NOTES: 'us_lovenotes_data',
  DAILY_QUESTION: 'us_daily_question',
  BUCKET_LIST: 'us_bucket_list',
  THEME: 'us_theme_preference',
  VIEW: 'us_current_view'
};

// In-memory cache fallback
const memoryStore: Record<string, string> = {};

const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {}
  return memoryStore[key] ?? null;
};

const safeSetItem = (key: string, value: string): void => {
  memoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {}
};

const safeRemoveItem = (key: string): void => {
  delete memoryStore[key];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {}
};

const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const raw = safeGetItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return (parsed !== null && parsed !== undefined) ? parsed : fallback;
  } catch (err) {
    return fallback;
  }
};

const isDemoCouple = (couple: Couple): boolean => {
  return couple.id === 'couple_main' || couple.invite_code === 'US7788';
};

export const storage = {
  // --- USERS DATABASE (MULTI-ACCOUNT) ---
  getUsersDB: (): Record<string, UserProfile> => {
    return safeParse<Record<string, UserProfile>>(KEYS.USERS_DB, {});
  },

  saveUserToDB: (user: UserProfile): void => {
    const db = storage.getUsersDB();
    db[user.id] = { ...db[user.id], ...user };
    safeSetItem(KEYS.USERS_DB, JSON.stringify(db));
    
    // If this is the active user, update active user cache as well
    const active = storage.getUser();
    if (active && active.id === user.id) {
      storage.setUser(db[user.id]);
    }
  },

  findUserByEmail: (email: string): UserProfile | null => {
    if (!email) return null;
    const db = storage.getUsersDB();
    const cleanEmail = email.trim().toLowerCase();
    const found = Object.values(db).find(u => u.email?.toLowerCase() === cleanEmail);
    return found || null;
  },

  findUserById: (id: string): UserProfile | null => {
    if (!id) return null;
    const db = storage.getUsersDB();
    return db[id] || null;
  },

  // --- ACTIVE USER SESSION ---
  getUser: (): UserProfile | null => {
    const activeUser = safeParse<UserProfile | null>(KEYS.USER, null);
    if (activeUser?.id) {
      // Always fetch latest data from Users DB
      const freshUser = storage.findUserById(activeUser.id);
      if (freshUser) return freshUser;
    }
    return activeUser;
  },

  setUser: (user: UserProfile | null) => {
    if (!user) {
      safeRemoveItem(KEYS.USER);
      safeRemoveItem(KEYS.CURRENT_USER_ID);
    } else {
      safeSetItem(KEYS.USER, JSON.stringify(user));
      safeSetItem(KEYS.CURRENT_USER_ID, user.id);
      // Ensure user is also saved in DB
      const db = storage.getUsersDB();
      db[user.id] = { ...db[user.id], ...user };
      safeSetItem(KEYS.USERS_DB, JSON.stringify(db));
    }
  },

  // --- COUPLES ROOMS DATABASE ---
  getCouplesDB: (): Record<string, Couple> => {
    return safeParse<Record<string, Couple>>(KEYS.COUPLES_DB, {});
  },

  saveCoupleToDB: (couple: Couple): void => {
    const db = storage.getCouplesDB();
    db[couple.id] = { ...db[couple.id], ...couple };
    safeSetItem(KEYS.COUPLES_DB, JSON.stringify(db));

    // If active couple, update active couple cache
    const activeCouple = storage.getCouple();
    if (activeCouple && activeCouple.id === couple.id) {
      storage.setCouple(db[couple.id]);
    }
  },

  findCoupleById: (coupleId: string): Couple | null => {
    if (!coupleId) return null;
    const db = storage.getCouplesDB();
    return db[coupleId] || null;
  },

  findCoupleByInviteCode: (code: string): Couple | null => {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const db = storage.getCouplesDB();
    const matches = Object.values(db).filter(c => c.invite_code?.toUpperCase() === clean);
    if (!matches.length) return null;

    const nonDemoMatches = matches.filter(c => !isDemoCouple(c));
    const preferred = nonDemoMatches.length ? nonDemoMatches : matches;

    return preferred.sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    })[0] || null;
  },

  getCouple: (): Couple | null => {
    const active = safeParse<Couple | null>(KEYS.COUPLE, null);
    if (active?.id) {
      const fresh = storage.findCoupleById(active.id);
      if (fresh) return fresh;
    }
    return active;
  },

  setCouple: (couple: Couple | null) => {
    if (!couple) {
      safeRemoveItem(KEYS.COUPLE);
    } else {
      safeSetItem(KEYS.COUPLE, JSON.stringify(couple));
      const db = storage.getCouplesDB();
      db[couple.id] = { ...db[couple.id], ...couple };
      safeSetItem(KEYS.COUPLES_DB, JSON.stringify(db));
    }
  },

  // --- PARTNER RESOLUTION ---
  getPartner: (): UserProfile | null => {
    const currentUser = storage.getUser();
    if (!currentUser || !currentUser.couple_id) {
      return null;
    }
    const couple = storage.findCoupleById(currentUser.couple_id);
    if (!couple || !couple.member_ids || couple.member_ids.length < 2) {
      return null;
    }
    const partnerId = couple.member_ids.find(id => id !== currentUser.id);
    if (!partnerId) return null;

    return storage.findUserById(partnerId);
  },

  setPartner: (partner: UserProfile | null) => {
    if (!partner) {
      safeRemoveItem(KEYS.PARTNER);
    } else {
      safeSetItem(KEYS.PARTNER, JSON.stringify(partner));
      storage.saveUserToDB(partner);
    }
  },

  /**
   * Sync and resolve active user, active couple, and active partner from database
   */
  syncUserSession: (userId?: string): { user: UserProfile | null; partner: UserProfile | null; couple: Couple | null } => {
    const uid = userId || safeGetItem(KEYS.CURRENT_USER_ID) || storage.getUser()?.id;
    if (!uid) {
      return { user: null, partner: null, couple: null };
    }

    const user = storage.findUserById(uid);
    if (!user) {
      return { user: null, partner: null, couple: null };
    }

    storage.setUser(user);

    if (!user.couple_id) {
      storage.setCouple(null);
      storage.setPartner(null);
      return { user, partner: null, couple: null };
    }

    const couple = storage.findCoupleById(user.couple_id);
    storage.setCouple(couple || null);

    if (!couple || !couple.member_ids || couple.member_ids.length < 2) {
      storage.setPartner(null);
      return { user, partner: null, couple: couple || null };
    }

    const partnerId = couple.member_ids.find(id => id !== user.id);
    const partner = partnerId ? storage.findUserById(partnerId) : null;
    storage.setPartner(partner);

    return { user, partner, couple };
  },

  removeUserFromCouple: (userId: string) => {
    const user = storage.findUserById(userId);
    if (!user || !user.couple_id) return;

    const coupleId = user.couple_id;
    const couple = storage.findCoupleById(coupleId);
    
    // Remove couple_id from user
    storage.saveUserToDB({ ...user, couple_id: null });
    
    if (couple) {
      const updatedMembers = couple.member_ids.filter(id => id !== userId);
      if (updatedMembers.length === 0) {
        // Delete couple from DB
        const db = storage.getCouplesDB();
        delete db[coupleId];
        safeSetItem(KEYS.COUPLES_DB, JSON.stringify(db));
      } else {
        // Revert room to pending for remaining member
        storage.saveCoupleToDB({
          ...couple,
          member_ids: updatedMembers,
          status: 'pending'
        });
      }
    }

    storage.setCouple(null);
    storage.setPartner(null);
  },

  getCurrentView: (): string | null => {
    return safeGetItem(KEYS.VIEW);
  },
  setCurrentView: (view: string) => {
    safeSetItem(KEYS.VIEW, view);
  },

  getMemories: (): Memory[] => {
    return safeParse<Memory[]>(KEYS.MEMORIES, []);
  },
  setMemories: (memories: Memory[]) => {
    safeSetItem(KEYS.MEMORIES, JSON.stringify(memories));
  },
  addMemory: (memory: Memory) => {
    const memories = storage.getMemories();
    const updated = [memory, ...memories];
    storage.setMemories(updated);
    return updated;
  },

  getMilestones: (): Milestone[] => {
    return safeParse<Milestone[]>(KEYS.MILESTONES, []);
  },
  setMilestones: (milestones: Milestone[]) => {
    safeSetItem(KEYS.MILESTONES, JSON.stringify(milestones));
  },
  addMilestone: (milestone: Milestone) => {
    const list = storage.getMilestones();
    const updated = [...list, milestone].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    storage.setMilestones(updated);
    return updated;
  },

  getCountdowns: (): Countdown[] => {
    return safeParse<Countdown[]>(KEYS.COUNTDOWNS, []);
  },
  setCountdowns: (countdowns: Countdown[]) => {
    safeSetItem(KEYS.COUNTDOWNS, JSON.stringify(countdowns));
  },
  addCountdown: (countdown: Countdown) => {
    const list = storage.getCountdowns();
    const updated = [countdown, ...list];
    storage.setCountdowns(updated);
    return updated;
  },

  getLoveNotes: (): LoveNote[] => {
    return safeParse<LoveNote[]>(KEYS.LOVE_NOTES, []);
  },
  setLoveNotes: (notes: LoveNote[]) => {
    safeSetItem(KEYS.LOVE_NOTES, JSON.stringify(notes));
  },
  addLoveNote: (note: LoveNote) => {
    const list = storage.getLoveNotes();
    const updated = [note, ...list];
    storage.setLoveNotes(updated);
    return updated;
  },

  getDailyQuestion: (): DailyQuestion => {
    const dq = safeParse<DailyQuestion | null>(KEYS.DAILY_QUESTION, null);
    return dq ?? INITIAL_DAILY_QUESTION;
  },
  setDailyQuestion: (dq: DailyQuestion) => {
    safeSetItem(KEYS.DAILY_QUESTION, JSON.stringify(dq));
  },

  getBucketList: (): BucketListItem[] => {
    return safeParse<BucketListItem[]>(KEYS.BUCKET_LIST, []);
  },
  setBucketList: (items: BucketListItem[]) => {
    safeSetItem(KEYS.BUCKET_LIST, JSON.stringify(items));
  },

  loadDemoData: () => {
    // Populate demo accounts into DB
    storage.saveUserToDB(INITIAL_USER);
    storage.saveUserToDB(INITIAL_PARTNER);
    storage.saveCoupleToDB(INITIAL_COUPLE);

    storage.setUser(INITIAL_USER);
    storage.setPartner(INITIAL_PARTNER);
    storage.setCouple(INITIAL_COUPLE);
    storage.setMemories(INITIAL_MEMORIES);
    storage.setMilestones(INITIAL_MILESTONES);
    storage.setCountdowns(INITIAL_COUNTDOWNS);
    storage.setLoveNotes(INITIAL_LOVE_NOTES);
    storage.setDailyQuestion(INITIAL_DAILY_QUESTION);
    storage.setBucketList(INITIAL_BUCKET_LIST);
    storage.setCurrentView('home');
  },

  generateUniqueInviteCode: (): string => {
    let code = generateInviteCode();
    const db = storage.getCouplesDB();
    const existingCodes = new Set(Object.values(db).map(c => c.invite_code?.toUpperCase()).filter(Boolean));

    while (existingCodes.has(code.toUpperCase())) {
      code = generateInviteCode();
    }

    return code;
  },

  // Step 8: Safe cache resets without wiping user auth tokens or database records
  clearVolatileCache: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(KEYS.VIEW);
      }
    } catch {}
    delete memoryStore[KEYS.VIEW];
  },

  resetOfflineCaches: () => {
    const cacheKeys = [
      KEYS.MEMORIES,
      KEYS.MILESTONES,
      KEYS.COUNTDOWNS,
      KEYS.LOVE_NOTES,
      KEYS.DAILY_QUESTION,
      KEYS.BUCKET_LIST,
      KEYS.VIEW
    ];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        cacheKeys.forEach(k => window.localStorage.removeItem(k));
      }
    } catch {}
    cacheKeys.forEach(k => delete memoryStore[k]);
  },

  getHeartMessages: (): import('../types').HeartMessage[] => {
    return safeParse<import('../types').HeartMessage[]>('usframe_heart_messages', [
      {
        id: 'msg_init_1',
        couple_id: 'couple_main',
        sender_id: 'user_kai',
        sender_name: 'Kai',
        content: 'Aku kangen kamu saat ini 🤍',
        mood_emoji: '🤍',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'msg_init_2',
        couple_id: 'couple_main',
        sender_id: 'user_elena',
        sender_name: 'Elena',
        content: 'Kangen kamu juga, semangat kerjanya ya sayang ✨',
        mood_emoji: '✨',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ]);
  },

  addHeartMessage: (msg: import('../types').HeartMessage) => {
    const list = storage.getHeartMessages();
    storage.setHeartMessages([msg, ...list.filter(m => m.id !== msg.id)]);
  },

  setHeartMessages: (msgs: import('../types').HeartMessage[]) => {
    safeSetItem('usframe_heart_messages', JSON.stringify(msgs));
  },

  resetAll: () => {
    // Only resets UsFrame app caches, does not wipe Supabase auth tokens
    storage.resetOfflineCaches();
    storage.setUser(null);
    storage.setCouple(null);
    storage.setPartner(null);
  }
};
