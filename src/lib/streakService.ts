import { supabase } from './supabase';
import { storage } from './storage';
import { isUuid } from './utils';
import { 
  CoupleStreak, 
  CouplePet, 
  PetType, 
  CoupleActivityType 
} from '../types';
import { 
  getPetLevelInfo, 
  STREAK_MILESTONES, 
  getRandomPetDialogue,
  playPetChirpSound,
  playLevelUpSound
} from './petConstants';

export interface ActivityResult {
  streak: CoupleStreak;
  pet: CouplePet;
  xpGained: number;
  newMilestone?: { days: number; title: string; rewardXp: number };
  levelUp: boolean;
  dialogue: string;
}

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const STREAK_STORAGE_PREFIX = 'usframe_couple_streak_';
const PET_STORAGE_PREFIX = 'usframe_couple_pet_';

export const streakService = {
  /**
   * Retrieves the current synchronized streak & pet state for a couple.
   */
  getStreakAndPet: async (coupleId?: string | null): Promise<{ streak: CoupleStreak; pet: CouplePet }> => {
    const defaultStreak: CoupleStreak = {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: getTodayDateString(),
      streakStartedAt: new Date().toISOString(),
      streakBrokenAt: null,
      unlockedMilestones: []
    };

    const defaultPet: CouplePet = {
      name: 'Mochi',
      type: 'cat',
      level: 1,
      xp: 50,
      totalXp: 50,
      lastInteraction: new Date().toISOString(),
      statusText: 'Mochi siap menjaga api cinta kalian! 🤍'
    };

    if (!coupleId) {
      return { streak: defaultStreak, pet: defaultPet };
    }

    // 1. Read from local cache first
    let localStreak: CoupleStreak | null = null;
    let localPet: CouplePet | null = null;

    try {
      const s = localStorage.getItem(`${STREAK_STORAGE_PREFIX}${coupleId}`);
      if (s) localStreak = JSON.parse(s);
      const p = localStorage.getItem(`${PET_STORAGE_PREFIX}${coupleId}`);
      if (p) localPet = JSON.parse(p);
    } catch {}

    // 2. Fetch from Supabase couples table if UUID
    if (isUuid(coupleId)) {
      try {
        const { data: coupleRow } = await supabase
          .from('couples')
          .select('pet_name, pet_type, xp')
          .eq('id', coupleId)
          .maybeSingle();

        if (coupleRow) {
          const totalXp = Math.max(50, coupleRow.xp || localPet?.totalXp || 50);
          const lvlInfo = getPetLevelInfo(totalXp);
          const petName = coupleRow.pet_name || localPet?.name || 'Mochi';
          const petType = (coupleRow.pet_type as PetType) || localPet?.type || 'cat';

          const remotePet: CouplePet = {
            name: petName,
            type: petType,
            level: lvlInfo.level,
            xp: lvlInfo.currentLevelXp,
            totalXp,
            lastInteraction: localPet?.lastInteraction || new Date().toISOString(),
            statusText: lvlInfo.statusBadge
          };

          const activeStreak: CoupleStreak = localStreak || defaultStreak;

          // Check for streak break on load
          const today = getTodayDateString();
          const yesterday = getYesterdayDateString();
          if (activeStreak.lastActivityDate && activeStreak.lastActivityDate !== today && activeStreak.lastActivityDate !== yesterday) {
            // Missed a day
            activeStreak.streakBrokenAt = new Date().toISOString();
          }

          streakService.saveLocal(coupleId, activeStreak, remotePet);
          return { streak: activeStreak, pet: remotePet };
        }
      } catch (err) {
        console.warn('Error fetching streak & pet from Supabase:', err);
      }
    }

    const finalStreak = localStreak || defaultStreak;
    const finalPet = localPet || defaultPet;
    return { streak: finalStreak, pet: finalPet };
  },

  /**
   * Records a couple activity with strict idempotency and anti-farming rules.
   */
  recordActivity: async (
    coupleId: string, 
    activityType: CoupleActivityType,
    senderId?: string
  ): Promise<ActivityResult> => {
    const { streak, pet } = await streakService.getStreakAndPet(coupleId);
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    let streakIncremented = false;
    let newCurrentStreak = streak.currentStreak;
    let newLongestStreak = streak.longestStreak;
    let newBrokenAt = streak.streakBrokenAt;

    // 1. Streak Idempotency Calculation
    if (streak.lastActivityDate === today) {
      // Activity already recorded today: maintain current streak without double increment
      newCurrentStreak = Math.max(1, streak.currentStreak);
    } else if (streak.lastActivityDate === yesterday) {
      // Consecutive day! Increment streak!
      newCurrentStreak = (streak.currentStreak || 0) + 1;
      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
      streakIncremented = true;
    } else if (!streak.lastActivityDate) {
      // First ever interaction
      newCurrentStreak = 1;
      newLongestStreak = Math.max(newLongestStreak, 1);
      streakIncremented = true;
    } else {
      // Streak was broken (missed days) -> reset to 1
      newBrokenAt = new Date().toISOString();
      newCurrentStreak = 1;
      streakIncremented = true;
    }

    // 2. XP Rewards by Activity
    let baseActivityXp = 0;
    switch (activityType) {
      case 'kangen':
        baseActivityXp = 15;
        break;
      case 'memory_added':
        baseActivityXp = 35;
        break;
      case 'letter_sent':
        baseActivityXp = 30;
        break;
      case 'daily_question':
        baseActivityXp = 25;
        break;
      case 'bucket_item':
        baseActivityXp = 20;
        break;
      case 'pet_interaction':
        baseActivityXp = 5;
        break;
      default:
        baseActivityXp = 10;
    }

    const streakXp = streakIncremented ? 50 : 0;
    let totalAddedXp = baseActivityXp + streakXp;

    // 3. Milestone Check
    const unlocked = new Set(streak.unlockedMilestones || []);
    let newMilestone: { days: number; title: string; rewardXp: number } | undefined = undefined;

    const milestoneDef = STREAK_MILESTONES.find(m => m.days === newCurrentStreak);
    if (milestoneDef && !unlocked.has(milestoneDef.days)) {
      unlocked.add(milestoneDef.days);
      newMilestone = milestoneDef;
      totalAddedXp += milestoneDef.rewardXp;
    }

    const prevLevel = pet.level;
    const newTotalXp = pet.totalXp + totalAddedXp;
    const lvlInfo = getPetLevelInfo(newTotalXp);
    const isLevelUp = lvlInfo.level > prevLevel;

    if (isLevelUp) {
      playLevelUpSound();
    }

    // 4. Construct updated models
    const updatedStreak: CoupleStreak = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      streakStartedAt: streak.streakStartedAt || new Date().toISOString(),
      streakBrokenAt: newBrokenAt,
      unlockedMilestones: Array.from(unlocked)
    };

    const eventName = activityType === 'kangen' ? 'kangen' : activityType === 'memory_added' ? 'memory' : undefined;
    const dialogue = isLevelUp 
      ? `🎉 Level Up! ${pet.name} sekarang Level ${lvlInfo.level} (${lvlInfo.levelName})!`
      : getRandomPetDialogue(pet.name, newCurrentStreak, eventName);

    const updatedPet: CouplePet = {
      ...pet,
      level: lvlInfo.level,
      xp: lvlInfo.currentLevelXp,
      totalXp: newTotalXp,
      lastInteraction: new Date().toISOString(),
      statusText: lvlInfo.statusBadge
    };

    // 5. Persist to cache & Supabase
    streakService.saveLocal(coupleId, updatedStreak, updatedPet);

    if (isUuid(coupleId)) {
      try {
        await supabase
          .from('couples')
          .update({
            xp: newTotalXp,
            pet_name: updatedPet.name,
            pet_type: updatedPet.type
          })
          .eq('id', coupleId);

        // Realtime broadcast to partner's client
        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'streak_pet_updated',
          payload: {
            senderId,
            activityType,
            streak: updatedStreak,
            pet: updatedPet,
            xpGained: totalAddedXp,
            newMilestone,
            isLevelUp
          }
        }).catch(() => null);
      } catch (err) {
        console.warn('Sync streak & pet error:', err);
      }
    }

    return {
      streak: updatedStreak,
      pet: updatedPet,
      xpGained: totalAddedXp,
      newMilestone,
      levelUp: isLevelUp,
      dialogue
    };
  },

  /**
   * Interactive petting action (Elus Pet).
   */
  petMochi: async (coupleId: string): Promise<{ pet: CouplePet; dialogue: string; xpAwarded: number }> => {
    playPetChirpSound();
    const result = await streakService.recordActivity(coupleId, 'pet_interaction');
    const dialogue = getRandomPetDialogue(result.pet.name, result.streak.currentStreak, 'petting');
    return {
      pet: result.pet,
      dialogue,
      xpAwarded: 5
    };
  },

  /**
   * Updates Pet Name and Type in Room settings.
   */
  updatePetProfile: async (
    coupleId: string, 
    params: { name?: string; type?: PetType }
  ): Promise<CouplePet> => {
    const { streak, pet } = await streakService.getStreakAndPet(coupleId);
    const updatedPet: CouplePet = {
      ...pet,
      name: params.name?.trim() || pet.name,
      type: params.type || pet.type
    };

    streakService.saveLocal(coupleId, streak, updatedPet);

    if (isUuid(coupleId)) {
      try {
        await supabase
          .from('couples')
          .update({
            pet_name: updatedPet.name,
            pet_type: updatedPet.type
          })
          .eq('id', coupleId);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'streak_pet_updated',
          payload: { pet: updatedPet }
        }).catch(() => null);
      } catch (err) {
        console.warn('Error updating pet settings:', err);
      }
    }

    return updatedPet;
  },

  /**
   * Realtime subscription for Streak and Pet updates across devices.
   */
  subscribeToStreakAndPet: (
    coupleId: string | null | undefined, 
    onUpdate: (payload: { streak: CoupleStreak; pet: CouplePet }) => void
  ) => {
    if (!coupleId || !isUuid(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_pet_${coupleId}`)
      .on('broadcast', { event: 'streak_pet_updated' }, (res) => {
        if (res.payload?.streak && res.payload?.pet) {
          streakService.saveLocal(coupleId, res.payload.streak, res.payload.pet);
          onUpdate({ streak: res.payload.streak, pet: res.payload.pet });
        } else if (res.payload?.pet) {
          streakService.getStreakAndPet(coupleId).then(({ streak }) => {
            streakService.saveLocal(coupleId, streak, res.payload.pet);
            onUpdate({ streak, pet: res.payload.pet });
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveLocal: (coupleId: string, streak: CoupleStreak, pet: CouplePet) => {
    try {
      localStorage.setItem(`${STREAK_STORAGE_PREFIX}${coupleId}`, JSON.stringify(streak));
      localStorage.setItem(`${PET_STORAGE_PREFIX}${coupleId}`, JSON.stringify(pet));
    } catch {}
  }
};
