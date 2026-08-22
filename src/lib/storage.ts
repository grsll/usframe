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

const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const raw = safeGetItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') {
      safeSetItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    safeSetItem(key, JSON.stringify(fallback));
    return fallback;
  }
};

export const storage = {
  getUser: (): UserProfile => {
    return safeParse(KEYS.USER, INITIAL_USER);
  },
  setUser: (user: UserProfile) => {
    safeSetItem(KEYS.USER, JSON.stringify(user));
  },

  getPartner: (): UserProfile => {
    return safeParse(KEYS.PARTNER, INITIAL_PARTNER);
  },
  setPartner: (partner: UserProfile) => {
    safeSetItem(KEYS.PARTNER, JSON.stringify(partner));
  },

  getCouple: (): Couple => {
    return safeParse(KEYS.COUPLE, INITIAL_COUPLE);
  },
  setCouple: (couple: Couple) => {
    safeSetItem(KEYS.COUPLE, JSON.stringify(couple));
  },

  getMemories: (): Memory[] => {
    const list = safeParse<Memory[]>(KEYS.MEMORIES, INITIAL_MEMORIES);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_MEMORIES;
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
    const list = safeParse<Milestone[]>(KEYS.MILESTONES, INITIAL_MILESTONES);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_MILESTONES;
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
    const list = safeParse<Countdown[]>(KEYS.COUNTDOWNS, INITIAL_COUNTDOWNS);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_COUNTDOWNS;
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
    const list = safeParse<LoveNote[]>(KEYS.LOVE_NOTES, INITIAL_LOVE_NOTES);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_LOVE_NOTES;
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
    const dq = safeParse<DailyQuestion>(KEYS.DAILY_QUESTION, INITIAL_DAILY_QUESTION);
    return dq && dq.question && dq.answers ? dq : INITIAL_DAILY_QUESTION;
  },
  setDailyQuestion: (dq: DailyQuestion) => {
    safeSetItem(KEYS.DAILY_QUESTION, JSON.stringify(dq));
  },

  getBucketList: (): BucketListItem[] => {
    const list = safeParse<BucketListItem[]>(KEYS.BUCKET_LIST, INITIAL_BUCKET_LIST);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_BUCKET_LIST;
  },
  setBucketList: (items: BucketListItem[]) => {
    safeSetItem(KEYS.BUCKET_LIST, JSON.stringify(items));
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
