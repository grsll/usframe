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

const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    console.warn(`Error parsing localStorage key "${key}", reverting to fallback`, err);
    try {
      localStorage.setItem(key, JSON.stringify(fallback));
    } catch {}
    return fallback;
  }
};

export const storage = {
  getUser: (): UserProfile => {
    return safeParse(KEYS.USER, INITIAL_USER);
  },
  setUser: (user: UserProfile) => {
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch {}
  },

  getPartner: (): UserProfile => {
    return safeParse(KEYS.PARTNER, INITIAL_PARTNER);
  },
  setPartner: (partner: UserProfile) => {
    try {
      localStorage.setItem(KEYS.PARTNER, JSON.stringify(partner));
    } catch {}
  },

  getCouple: (): Couple => {
    return safeParse(KEYS.COUPLE, INITIAL_COUPLE);
  },
  setCouple: (couple: Couple) => {
    try {
      localStorage.setItem(KEYS.COUPLE, JSON.stringify(couple));
    } catch {}
  },

  getMemories: (): Memory[] => {
    return safeParse(KEYS.MEMORIES, INITIAL_MEMORIES);
  },
  setMemories: (memories: Memory[]) => {
    try {
      localStorage.setItem(KEYS.MEMORIES, JSON.stringify(memories));
    } catch {}
  },
  addMemory: (memory: Memory) => {
    const memories = storage.getMemories();
    const updated = [memory, ...memories];
    storage.setMemories(updated);
    return updated;
  },

  getMilestones: (): Milestone[] => {
    return safeParse(KEYS.MILESTONES, INITIAL_MILESTONES);
  },
  setMilestones: (milestones: Milestone[]) => {
    try {
      localStorage.setItem(KEYS.MILESTONES, JSON.stringify(milestones));
    } catch {}
  },
  addMilestone: (milestone: Milestone) => {
    const list = storage.getMilestones();
    const updated = [...list, milestone].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    storage.setMilestones(updated);
    return updated;
  },

  getCountdowns: (): Countdown[] => {
    return safeParse(KEYS.COUNTDOWNS, INITIAL_COUNTDOWNS);
  },
  setCountdowns: (countdowns: Countdown[]) => {
    try {
      localStorage.setItem(KEYS.COUNTDOWNS, JSON.stringify(countdowns));
    } catch {}
  },
  addCountdown: (countdown: Countdown) => {
    const list = storage.getCountdowns();
    const updated = [countdown, ...list];
    storage.setCountdowns(updated);
    return updated;
  },

  getLoveNotes: (): LoveNote[] => {
    return safeParse(KEYS.LOVE_NOTES, INITIAL_LOVE_NOTES);
  },
  setLoveNotes: (notes: LoveNote[]) => {
    try {
      localStorage.setItem(KEYS.LOVE_NOTES, JSON.stringify(notes));
    } catch {}
  },
  addLoveNote: (note: LoveNote) => {
    const list = storage.getLoveNotes();
    const updated = [note, ...list];
    storage.setLoveNotes(updated);
    return updated;
  },

  getDailyQuestion: (): DailyQuestion => {
    return safeParse(KEYS.DAILY_QUESTION, INITIAL_DAILY_QUESTION);
  },
  setDailyQuestion: (dq: DailyQuestion) => {
    try {
      localStorage.setItem(KEYS.DAILY_QUESTION, JSON.stringify(dq));
    } catch {}
  },

  getBucketList: (): BucketListItem[] => {
    return safeParse(KEYS.BUCKET_LIST, INITIAL_BUCKET_LIST);
  },
  setBucketList: (items: BucketListItem[]) => {
    try {
      localStorage.setItem(KEYS.BUCKET_LIST, JSON.stringify(items));
    } catch {}
  },

  resetAll: () => {
    try {
      localStorage.clear();
    } catch {}
  }
};
