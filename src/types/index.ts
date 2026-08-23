export type UserProfile = {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  couple_id?: string | null;
  current_mood?: string;
  mood_label?: string;
  status_activity?: string;
  location_name?: string;
  last_active?: string;
  created_at?: string;
};

export type PetType = 'cat' | 'chick' | 'bunny' | 'bear' | 'penguin';

export type CouplePet = {
  name: string;
  type: PetType;
  level: number;
  xp: number;
  totalXp: number;
  lastInteraction?: string;
  statusText?: string;
};

export type CoupleStreak = {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakStartedAt?: string;
  streakBrokenAt?: string | null;
  unlockedMilestones: number[];
};

export type CoupleActivityType = 'kangen' | 'memory_added' | 'letter_sent' | 'daily_question' | 'bucket_item' | 'pet_interaction';

export type Couple = {
  id: string;
  invite_code: string;
  status: 'pending' | 'active';
  member_ids: string[];
  couple_name?: string;
  relationship_start_date: string;
  next_meet_date?: string | null;
  city?: string;
  user_city?: string;
  partner_city?: string;
  distance_km?: number;
  current_streak?: number;
  longest_streak?: number;
  last_activity_date?: string;
  streak_started_at?: string;
  streak_broken_at?: string | null;
  pet_name?: string;
  pet_type?: PetType | string;
  pet_level?: number;
  pet_xp?: number;
  total_xp?: number;
  xp?: number;
  unlocked_milestones?: number[];
  pet?: CouplePet;
  streak?: CoupleStreak;
  created_at?: string;
};

export type MemoryCategory = 'Semua' | 'Photobooth' | 'Kencan' | 'Perjalanan' | 'Sehari-hari' | 'Momen Spesial' | string;

export type Memory = {
  id: string;
  couple_id: string;
  created_by: string;
  creator_name?: string;
  title: string;
  caption: string;
  media_url: string;
  storage_path?: string;
  media_type: 'image' | 'usframe_strip';
  date: string;
  location?: string;
  category: string;
  is_favorite: boolean;
  created_at: string;
};

export type MilestoneCategory = 'first_met' | 'dating' | 'first_trip' | 'flight_visit' | 'anniversary' | 'future_plan' | string;

export type Milestone = {
  id: string;
  couple_id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  image_url?: string;
  category: string;
  created_at: string;
};

export type Countdown = {
  id: string;
  couple_id: string;
  title: string;
  target_date: string;
  icon?: string;
  category?: 'meet' | 'anniversary' | 'birthday' | 'trip' | 'special' | string;
  is_pinned?: boolean;
  created_by: string;
  created_at: string;
};

export type NoteType = 'general' | 'open_when_sad' | 'open_when_miss' | 'anniversary' | 'letter' | string;

export type LoveNote = {
  id: string;
  couple_id: string;
  sender_id: string;
  sender_name: string;
  title: string;
  content: string;
  note_type: NoteType;
  unlock_date?: string | null;
  is_opened: boolean;
  created_at: string;
};

export type DailyQuestion = {
  id: string;
  couple_id: string;
  date: string;
  question: string;
  answers: {
    [userId: string]: {
      userName: string;
      answer: string;
      answeredAt: string;
    };
  };
};

export type MoodOption = {
  emoji: string;
  label: string;
  color: string;
};

export type BucketListItem = {
  id: string;
  couple_id: string;
  title: string;
  category: 'trip' | 'food' | 'activity' | 'future' | string;
  completed: boolean;
  target_location?: string;
  completed_at?: string | null;
  created_by: string;
};

export type USFrameTemplateId = 'minimal' | 'classic' | 'terracotta' | 'film35' | 'midnight' | 'polaroid' | 'duo_live';

export type USFrameTemplate = {
  id: USFrameTemplateId;
  name: string;
  description: string;
  bg: string;
  textColor: string;
  borderStyle: string;
  layout: 'strip-4' | 'grid-2x2' | 'duo-vertical' | 'side-by-side';
  previewBg: string;
};

export type USFramePhoto = {
  id: string;
  dataUrl: string;
  filter?: string;
  timestamp: number;
};

export type USFrameCustomization = {
  templateId: USFrameTemplateId;
  customText: string;
  showDate: boolean;
  customDate: string;
  frameColor: string;
  filter: string;
  stamp: string;
  fontStyle: 'serif' | 'sans' | 'script' | 'mono';
  layout: 'strip-4' | 'grid-2x2' | 'duo-vertical' | 'side-by-side';
};

export type HeartMessage = {
  id: string;
  couple_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  mood_emoji?: string;
  created_at: string;
};

export type AppNotification = {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name?: string;
  receiver_id: string;
  type: 'miss_you' | 'love_letter' | 'photo_shared' | 'booth_invite' | string;
  title: string;
  body: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
};
