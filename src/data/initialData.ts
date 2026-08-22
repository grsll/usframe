import { Couple, UserProfile, Memory, Milestone, Countdown, LoveNote, DailyQuestion, BucketListItem, USFrameTemplate } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'user_kai',
  name: 'Kai',
  email: 'kai@uscouple.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  couple_id: 'couple_kai_elena',
  current_mood: '🥰',
  mood_label: 'Missing you & smiling',
  status_activity: 'Working from Shibuya café ☕',
  location_name: 'Tokyo, Japan (GMT+9)',
  last_active: 'Just now',
  created_at: '2025-06-10T00:00:00.000Z'
};

export const INITIAL_PARTNER: UserProfile = {
  id: 'user_elena',
  name: 'Elena',
  email: 'elena@uscouple.app',
  avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  couple_id: 'couple_kai_elena',
  current_mood: '✨',
  mood_label: 'Peaceful & counting days',
  status_activity: 'Heading to design studio 🎨',
  location_name: 'Paris, France (GMT+2)',
  last_active: '12m ago',
  created_at: '2025-06-10T00:00:00.000Z'
};

export const INITIAL_COUPLE: Couple = {
  id: 'couple_kai_elena',
  invite_code: 'US7788',
  status: 'active',
  member_ids: ['user_kai', 'user_elena'],
  couple_name: 'Kai × Elena',
  relationship_start_date: '2025-06-10',
  next_meet_date: '2026-09-15',
  user_city: 'Tokyo',
  partner_city: 'Paris',
  distance_km: 9710,
  created_at: '2025-06-10T00:00:00.000Z'
};

export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem_1',
    couple_id: 'couple_kai_elena',
    created_by: 'user_kai',
    creator_name: 'Kai',
    title: 'Golden Hour at Montmartre',
    caption: 'We walked through the narrow stone streets until the sun turned the whole city amber. You couldn’t stop laughing at my French pronunciation.',
    media_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2025-08-14',
    location: 'Montmartre, Paris',
    category: 'Travel',
    is_favorite: true,
    created_at: '2025-08-14T18:30:00.000Z'
  },
  {
    id: 'mem_2',
    couple_id: 'couple_kai_elena',
    created_by: 'user_elena',
    creator_name: 'Elena',
    title: 'Late Night Matcha & Ramen',
    caption: '2 AM in Shibuya. Rain tapping on the awning, steamy broth, and sharing headphones listening to our favorite album.',
    media_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2025-10-22',
    location: 'Shibuya, Tokyo',
    category: 'Date',
    is_favorite: true,
    created_at: '2025-10-22T23:45:00.000Z'
  },
  {
    id: 'mem_3',
    couple_id: 'couple_kai_elena',
    created_by: 'user_kai',
    creator_name: 'Kai',
    title: 'Our First USFRAME Strip',
    caption: 'Four takes of silly faces in the vintage photobooth station. This strip is pinned right on my desk.',
    media_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    media_type: 'usframe_strip',
    date: '2025-12-05',
    location: 'Harajuku Studio',
    category: 'Photobooth',
    is_favorite: true,
    created_at: '2025-12-05T14:10:00.000Z'
  },
  {
    id: 'mem_4',
    couple_id: 'couple_kai_elena',
    created_by: 'user_elena',
    creator_name: 'Elena',
    title: 'Morning Coffee Across Screens',
    caption: 'My 8:00 AM breakfast was your 3:00 PM afternoon tea. Distance feels smaller when our cups are raised together.',
    media_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2026-02-18',
    location: 'Tokyo ⇄ Paris',
    category: 'Everyday',
    is_favorite: false,
    created_at: '2026-02-18T07:15:00.000Z'
  },
  {
    id: 'mem_5',
    couple_id: 'couple_kai_elena',
    created_by: 'user_kai',
    creator_name: 'Kai',
    title: 'The Rain Jacket Picnic',
    caption: 'Sudden summer rain caught us in Yoyogi park. We huddled under one coat and ended up eating melon bread while getting drenched.',
    media_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2026-05-03',
    location: 'Yoyogi Park, Tokyo',
    category: 'Date',
    is_favorite: true,
    created_at: '2026-05-03T16:00:00.000Z'
  },
  {
    id: 'mem_6',
    couple_id: 'couple_kai_elena',
    created_by: 'user_elena',
    creator_name: 'Elena',
    title: '1 Year Together Celebration',
    caption: '365 days of proof that hearts beat in harmony no matter how many flight hours lie between them.',
    media_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2026-06-10',
    location: 'Private Sanctuary',
    category: 'Milestone',
    is_favorite: true,
    created_at: '2026-06-10T20:00:00.000Z'
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'mile_1',
    couple_id: 'couple_kai_elena',
    title: 'We Met in Tokyo',
    description: 'A chance meeting at an international architecture workshop. We talked about cities, music, and how to build spaces that feel like home.',
    date: '2025-05-12',
    location: 'Roppongi Hills, Tokyo',
    image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    category: 'first_met',
    created_at: '2025-05-12T00:00:00.000Z'
  },
  {
    id: 'mile_2',
    couple_id: 'couple_kai_elena',
    title: 'We Started Dating',
    description: 'On a quiet balcony overlooking the evening city lights, we decided our story was worth every mile.',
    date: '2025-06-10',
    location: 'Tokyo, Japan',
    image_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
    category: 'dating',
    created_at: '2025-06-10T00:00:00.000Z'
  },
  {
    id: 'mile_3',
    couple_id: 'couple_kai_elena',
    title: 'Elena’s Flight to CDG & First Reconnect',
    description: 'Running through terminal 2E arrivals. The world disappeared the moment we finally held each other again.',
    date: '2025-08-10',
    location: 'Charles de Gaulle, Paris',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
    category: 'flight_visit',
    created_at: '2025-08-10T00:00:00.000Z'
  },
  {
    id: 'mile_4',
    couple_id: 'couple_kai_elena',
    title: 'First Road Trip to Kyoto',
    description: 'Renting an old car, getting lost in Arashiyama bamboo forest, and finding a hidden teahouse during quiet twilight.',
    date: '2025-11-18',
    location: 'Kyoto, Japan',
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80',
    category: 'first_trip',
    created_at: '2025-11-18T00:00:00.000Z'
  },
  {
    id: 'mile_5',
    couple_id: 'couple_kai_elena',
    title: 'One Year Anniversary',
    description: 'Celebrating 365 days of love, laughter, shared screens, photobooth strips, and unbroken promises.',
    date: '2026-06-10',
    location: 'Our Shared Digital World',
    image_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    category: 'anniversary',
    created_at: '2026-06-10T00:00:00.000Z'
  }
];

export const INITIAL_COUNTDOWNS: Countdown[] = [
  {
    id: 'count_1',
    couple_id: 'couple_kai_elena',
    title: 'Flight to Paris ✈️ Meeting Elena',
    target_date: '2026-09-15T14:30:00',
    icon: '✈️',
    category: 'meet',
    is_pinned: true,
    created_by: 'user_kai',
    created_at: '2026-07-01T00:00:00.000Z'
  },
  {
    id: 'count_2',
    couple_id: 'couple_kai_elena',
    title: 'Elena’s Birthday 🎂',
    target_date: '2026-11-28T00:00:00',
    icon: '🎂',
    category: 'birthday',
    is_pinned: false,
    created_by: 'user_kai',
    created_at: '2026-07-01T00:00:00.000Z'
  },
  {
    id: 'count_3',
    couple_id: 'couple_kai_elena',
    title: '500 Days of Us ✨',
    target_date: '2026-10-23T00:00:00',
    icon: '🌸',
    category: 'anniversary',
    is_pinned: false,
    created_by: 'user_elena',
    created_at: '2026-07-01T00:00:00.000Z'
  }
];

export const INITIAL_LOVE_NOTES: LoveNote[] = [
  {
    id: 'note_1',
    couple_id: 'couple_kai_elena',
    sender_id: 'user_elena',
    sender_name: 'Elena',
    title: 'Open when you have a hard day',
    content: 'Take a deep breath and close your eyes for thirty seconds. Remember our afternoon by the canal when we watched the swans? You are capable of so much, and you don’t have to carry the whole world at once. I am always in your corner.',
    note_type: 'open_when_sad',
    unlock_date: null,
    is_opened: true,
    created_at: '2026-07-15T12:00:00.000Z'
  },
  {
    id: 'note_2',
    couple_id: 'couple_kai_elena',
    sender_id: 'user_kai',
    sender_name: 'Kai',
    title: 'Open when you miss me the most',
    content: 'Look outside your window tonight. Even across 9,000 kilometers, we are under the same night sky. I am counting down every single minute until I can hold your hand at the airport again.',
    note_type: 'open_when_miss',
    unlock_date: null,
    is_opened: false,
    created_at: '2026-08-01T08:30:00.000Z'
  },
  {
    id: 'note_3',
    couple_id: 'couple_kai_elena',
    sender_id: 'user_elena',
    sender_name: 'Elena',
    title: 'Midnight note from Paris',
    content: 'Just finished sketching the concept for our future living room. I made sure to leave space for a big bookshelf and a gallery wall for all our USFRAME strips.',
    note_type: 'letter',
    unlock_date: null,
    is_opened: true,
    created_at: '2026-08-18T22:15:00.000Z'
  }
];

export const INITIAL_DAILY_QUESTION: DailyQuestion = {
  id: 'dq_today',
  couple_id: 'couple_kai_elena',
  date: '2026-08-22',
  question: 'What is one small song or sound that instantly reminds you of us?',
  answers: {
    user_kai: {
      userName: 'Kai',
      answer: 'That acoustic jazz record playing in the bakery near your flat when it was drizzling outside.',
      answeredAt: '2026-08-22T09:12:00.000Z'
    },
    user_elena: {
      userName: 'Elena',
      answer: 'The sound of the Shinkansen chime right before we arrived in Kyoto. It gave me butterflies!',
      answeredAt: '2026-08-22T10:45:00.000Z'
    }
  }
};

export const INITIAL_BUCKET_LIST: BucketListItem[] = [
  {
    id: 'b_1',
    couple_id: 'couple_kai_elena',
    title: 'Watch the sunrise from Montmartre steps',
    category: 'trip',
    completed: true,
    target_location: 'Paris, France',
    completed_at: '2025-08-15',
    created_by: 'user_elena'
  },
  {
    id: 'b_2',
    couple_id: 'couple_kai_elena',
    title: 'Cook traditional Coq au Vin & Japanese Omurice together',
    category: 'food',
    completed: true,
    target_location: 'Kitchen studio',
    completed_at: '2025-11-20',
    created_by: 'user_kai'
  },
  {
    id: 'b_3',
    couple_id: 'couple_kai_elena',
    title: 'Take a USFRAME photobooth strip in every city we visit',
    category: 'activity',
    completed: false,
    target_location: 'Everywhere',
    completed_at: null,
    created_by: 'user_kai'
  },
  {
    id: 'b_4',
    couple_id: 'couple_kai_elena',
    title: 'Rent a seaside cabin in Brittany for one quiet week',
    category: 'future',
    completed: false,
    target_location: 'Brittany Coast',
    completed_at: null,
    created_by: 'user_elena'
  }
];

export const USFRAME_TEMPLATES: USFrameTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal Editorial',
    description: 'Warm cream background, clean typography & quiet spacing.',
    bg: '#FAF8F5',
    textColor: '#1C1917',
    borderStyle: 'border border-stone-200',
    layout: 'strip-4',
    previewBg: 'bg-[#FAF8F5]'
  },
  {
    id: 'classic',
    name: 'Classic Photobooth',
    description: 'Authentic 4-shot vertical strip with crisp white border.',
    bg: '#FFFFFF',
    textColor: '#111827',
    borderStyle: 'border border-gray-300 shadow-sm',
    layout: 'strip-4',
    previewBg: 'bg-white'
  },
  {
    id: 'terracotta',
    name: 'Warm Terracotta',
    description: 'Earthy soft rose-clay tones for an intimate, romantic touch.',
    bg: '#F5EBE6',
    textColor: '#5C2D22',
    borderStyle: 'border border-[#EBD2C7]',
    layout: 'strip-4',
    previewBg: 'bg-[#F5EBE6]'
  },
  {
    id: 'film35',
    name: 'Analog 35mm Film',
    description: 'Cinematic borders with sprocket holes and exposure markers.',
    bg: '#141414',
    textColor: '#E5E5E5',
    borderStyle: 'border border-neutral-800',
    layout: 'strip-4',
    previewBg: 'bg-[#141414]'
  },
  {
    id: 'midnight',
    name: 'Midnight Velvet',
    description: 'Deep onyx frame with metallic champagne accents.',
    bg: '#18181B',
    textColor: '#F4E8D1',
    borderStyle: 'border border-neutral-700',
    layout: 'grid-2x2',
    previewBg: 'bg-[#18181B]'
  },
  {
    id: 'polaroid',
    name: 'Polaroid Duo',
    description: 'Wide bottom margin for handwritten notes and dates.',
    bg: '#FDFAF5',
    textColor: '#292524',
    borderStyle: 'border border-stone-200',
    layout: 'duo-vertical',
    previewBg: 'bg-[#FDFAF5]'
  }
];

export const PHOTO_FILTERS = [
  { id: 'natural', name: 'Natural', filterCss: 'none' },
  { id: 'bw', name: 'B&W Contrast', filterCss: 'grayscale(100%) contrast(115%)' },
  { id: 'warm_film', name: 'Warm Film', filterCss: 'sepia(25%) saturate(120%) contrast(105%)' },
  { id: 'tokyo_fade', name: 'Tokyo Fade', filterCss: 'contrast(92%) brightness(108%) saturate(85%)' },
  { id: 'golden_hour', name: 'Golden Hour', filterCss: 'sepia(35%) hue-rotate(-15deg) saturate(130%)' },
  { id: 'vintage_noir', name: 'Vintage Noir', filterCss: 'grayscale(100%) contrast(140%) brightness(90%)' }
];

export const PHOTO_STAMPS = [
  { id: 'none', label: 'No Stamp' },
  { id: 'us_logo', label: 'US. 🤍' },
  { id: 'stolen_moment', label: 'STOLEN MOMENT' },
  { id: 'ldr_connected', label: '9,710 KM CONNECTED' },
  { id: 'forever', label: 'FOR TWO ONLY' },
  { id: 'tokyo_paris', label: 'TYO ⇄ PAR' }
];
