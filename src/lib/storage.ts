import { Couple, UserProfile, Memory, Milestone, Countdown, LoveNote, DailyQuestion, BucketListItem } from '../types';
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
  VIEW: 'us_current_view',
  AUTH_SESSION: 'us_auth_session'
};

// In-memory cache fallback in case localStorage is blocked by browser policy
const memoryStore: Record<string, string> = {};

const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    // localStorage unavailable or restricted
  }
  return memoryStore[key] ?? null;
};

const safeSetItem = (key: string, value: string): void => {
  memoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {
    // localStorage quota exceeded or restricted
  }
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

export const storage = {
  getUser: (): UserProfile | null => {
    return safeParse<UserProfile | null>(KEYS.USER, null);
  },
  setUser: (user: UserProfile | null) => {
    if (!user) {
      safeRemoveItem(KEYS.USER);
    } else {
      safeSetItem(KEYS.USER, JSON.stringify(user));
    }
  },

  getPartner: (): UserProfile | null => {
    return safeParse<UserProfile | null>(KEYS.PARTNER, null);
  },
  setPartner: (partner: UserProfile | null) => {
    if (!partner) {
      safeRemoveItem(KEYS.PARTNER);
    } else {
      safeSetItem(KEYS.PARTNER, JSON.stringify(partner));
    }
  },

  getCouple: (): Couple | null => {
    return safeParse<Couple | null>(KEYS.COUPLE, null);
  },
  setCouple: (couple: Couple | null) => {
    if (!couple) {
      safeRemoveItem(KEYS.COUPLE);
    } else {
      safeSetItem(KEYS.COUPLE, JSON.stringify(couple));
    }
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

  resetAll: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {}
    Object.keys(memoryStore).forEach(k => delete memoryStore[k]);
  }
};
