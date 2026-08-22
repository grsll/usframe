import { 
  UserProfile, 
  Couple, 
  Memory, 
  Milestone, 
  Countdown, 
  LoveNote, 
  DailyQuestion, 
  BucketListItem, 
  USFrameTemplate 
} from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'user_kai',
  name: 'Kai',
  email: 'kai@uscouple.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  couple_id: 'couple_main',
  current_mood: '🥰',
  mood_label: 'Sedang rindu & tersenyum',
  status_activity: 'Online di ruang kita',
  location_name: 'Tokyo, Jepang',
  last_active: 'Baru saja',
  created_at: '2025-06-10T08:00:00.000Z'
};

export const INITIAL_PARTNER: UserProfile = {
  id: 'user_elena',
  name: 'Elena',
  email: 'elena@uscouple.app',
  avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  couple_id: 'couple_main',
  current_mood: '✨',
  mood_label: 'Tenang & menghitung hari',
  status_activity: 'Di Paris, membaca suratmu',
  location_name: 'Paris, Prancis',
  last_active: '5 menit yang lalu',
  created_at: '2025-06-10T08:00:00.000Z'
};

export const INITIAL_COUPLE: Couple = {
  id: 'couple_main',
  invite_code: 'US7788',
  status: 'active',
  member_ids: ['user_kai', 'user_elena'],
  couple_name: 'Kai × Elena',
  relationship_start_date: '2025-06-10',
  next_meet_date: '2026-09-15',
  user_city: 'Tokyo',
  partner_city: 'Paris',
  distance_km: 9710,
  created_at: '2025-06-10T08:00:00.000Z'
};

export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem_1',
    couple_id: 'couple_main',
    created_by: 'user_kai',
    creator_name: 'Kai',
    title: 'Malam Hujan & Ramen Hangat di Shibuya',
    caption: 'Di luar hujan deras, kita berbagi payung kecil yang basah dan semangkuk ramen hangat sambil tertawa lepas.',
    media_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2025-07-22',
    location: 'Shibuya, Tokyo',
    category: 'Kencan',
    is_favorite: true,
    created_at: '2025-07-22T20:30:00.000Z'
  },
  {
    id: 'mem_2',
    couple_id: 'couple_main',
    created_by: 'user_elena',
    creator_name: 'Elena',
    title: 'Strip Photobooth Tokyo Pertama Kita',
    caption: 'Foto strip pertama di USFRAME. Pose ke-3 kita berdua tertawa karena panik dengan hitungan mundurnya!',
    media_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&auto=format&fit=crop&q=80',
    media_type: 'usframe_strip',
    date: '2025-08-14',
    location: 'Omotesando, Tokyo',
    category: 'Photobooth',
    is_favorite: true,
    created_at: '2025-08-14T15:10:00.000Z'
  },
  {
    id: 'mem_3',
    couple_id: 'couple_main',
    created_by: 'user_kai',
    creator_name: 'Kai',
    title: 'Senja Tenang di Tepi Sungai Seine',
    caption: 'Duduk berdua di tepi sungai, menikmati croissant dan membicarakan impian masa depan kita.',
    media_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2025-10-05',
    location: 'Paris, Prancis',
    category: 'Perjalanan',
    is_favorite: false,
    created_at: '2025-10-05T18:45:00.000Z'
  },
  {
    id: 'mem_4',
    couple_id: 'couple_main',
    created_by: 'user_elena',
    creator_name: 'Elena',
    title: 'Panggilan Video Larut Malam Jam 2 Pagi',
    caption: 'Perbedaan 7 jam tidak terasa saat kita tertidur sambil saling menemani di layar ponsel.',
    media_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1000&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2025-11-20',
    location: 'Tokyo ⇄ Paris',
    category: 'Sehari-hari',
    is_favorite: true,
    created_at: '2025-11-20T17:00:00.000Z'
  },
  {
    id: 'mem_5',
    couple_id: 'couple_main',
    created_by: 'user_kai',
    creator_name: 'Kai',
    title: 'Bunga Sakura Pertama Kita Berdua',
    caption: 'Kelopak sakura jatuh di jaketmu. Hari itu kamu terlihat begitu bahagia dan mempesona.',
    media_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1000&auto=format&fit=crop&q=80',
    media_type: 'image',
    date: '2026-03-28',
    location: 'Taman Shinjuku Gyoen, Tokyo',
    category: 'Momen Spesial',
    is_favorite: false,
    created_at: '2026-03-28T11:20:00.000Z'
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'mile_1',
    couple_id: 'couple_main',
    title: 'Pertama Kali Bertemu di Tokyo',
    description: 'Secangkir matcha latte tumpah sedikit di kafe Daikanyama. Di situlah percakapan 4 jam pertama kita bermula.',
    date: '2025-06-10',
    location: 'Daikanyama, Tokyo',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    category: 'first_met',
    created_at: '2025-06-10T12:00:00.000Z'
  },
  {
    id: 'mile_2',
    couple_id: 'couple_main',
    title: 'Kita Resmi Menjadi Pasangan',
    description: 'Di atas jembatan Odaiba dengan latar gemerlap Rainbow Bridge di malam musim panas.',
    date: '2025-07-07',
    location: 'Odaiba, Tokyo',
    image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    category: 'dating',
    created_at: '2025-07-07T21:00:00.000Z'
  },
  {
    id: 'mile_3',
    couple_id: 'couple_main',
    title: 'Awal Perjalanan Hubungan Jarak Jauh (LDR)',
    description: 'Pelukan perpisahan terpanjang di Bandara Narita sebelum Elena terbang kembali ke Paris untuk studinya.',
    date: '2025-08-30',
    location: 'Bandara Internasional Narita',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80',
    category: 'flight_visit',
    created_at: '2025-08-30T14:30:00.000Z'
  },
  {
    id: 'mile_4',
    couple_id: 'couple_main',
    title: 'Reuni Hangat di Bandara Paris',
    description: 'Kai mendarat di CDG Paris setelah 14 jam penerbangan. Berlari dan saling berpelukan erat di pintu kedatangan.',
    date: '2025-10-01',
    location: 'Bandara Charles de Gaulle, Paris',
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    category: 'flight_visit',
    created_at: '2025-10-01T16:00:00.000Z'
  },
  {
    id: 'mile_5',
    couple_id: 'couple_main',
    title: '1 Tahun Bersama',
    description: '365 hari penuh cinta, saling percaya, dan ribuan kilometer yang mendekatkan hati kita.',
    date: '2026-06-10',
    location: 'Tokyo ⇄ Paris',
    image_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=80',
    category: 'anniversary',
    created_at: '2026-06-10T00:00:00.000Z'
  }
];

export const INITIAL_COUNTDOWNS: Countdown[] = [
  {
    id: 'count_1',
    couple_id: 'couple_main',
    title: 'Penerbangan ke Paris ✈️',
    target_date: '2026-09-15',
    icon: '✈️',
    category: 'meet',
    is_pinned: true,
    created_by: 'user_kai',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'count_2',
    couple_id: 'couple_main',
    title: 'Ulang Tahun Elena 🎂',
    target_date: '2026-11-04',
    icon: '🎂',
    category: 'birthday',
    is_pinned: false,
    created_by: 'user_kai',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'count_3',
    couple_id: 'couple_main',
    title: 'Liburan Musim Dingin ke Kyoto 🌸',
    target_date: '2026-12-24',
    icon: '🌸',
    category: 'trip',
    is_pinned: false,
    created_by: 'user_elena',
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_LOVE_NOTES: LoveNote[] = [
  {
    id: 'note_1',
    couple_id: 'couple_main',
    sender_id: 'user_elena',
    sender_name: 'Elena',
    title: 'Buka saat kamu sedang merasa rindu berat',
    content: 'Hei sayang, jika kamu membaca ini sekarang, ketahuilah bahwa jarak 9.710 km ini hanyalah angka di peta. Setiap malam sebelum tidur, kamu adalah pikiran terakhirku. Jangan lupa minum air hangat dan istirahat ya. Aku sangat mencintaimu! 🤍',
    note_type: 'open_when_miss',
    unlock_date: null,
    is_opened: true,
    created_at: '2025-09-10T14:20:00.000Z'
  },
  {
    id: 'note_2',
    couple_id: 'couple_main',
    sender_id: 'user_kai',
    sender_name: 'Kai',
    title: 'Buka saat harimu terasa berat atau lelah',
    content: 'Elena, kamu orang terhebat dan paling tangguh yang kukenal. Apapun yang terjadi hari ini, tarik nafas dalam-dalam. Aku selalu ada di sini mendukungmu, kapanpun kamu butuh didengar. Kamu tidak pernah sendirian 🤍',
    note_type: 'open_when_sad',
    unlock_date: null,
    is_opened: false,
    created_at: '2025-11-05T09:15:00.000Z'
  },
  {
    id: 'note_3',
    couple_id: 'couple_main',
    sender_id: 'user_kai',
    sender_name: 'Kai',
    title: 'Pikiran tengah malam dari Tokyo',
    content: 'Melihat foto kita di Daikanyama hari ini membuatku tersenyum sendiri di kereta. Aku sangat bersyukur semesta mempertemukan kita berdua.',
    note_type: 'general',
    unlock_date: null,
    is_opened: true,
    created_at: '2026-01-18T16:40:00.000Z'
  }
];

export const INITIAL_DAILY_QUESTION: DailyQuestion = {
  id: 'dq_today',
  couple_id: 'couple_main',
  date: new Date().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' }),
  question: 'Hal kecil apa dari pasangamu yang diam-diam paling sering membuatmu tersenyum hari ini?',
  answers: {
    user_kai: {
      userName: 'Kai',
      answer: 'Saat kamu mengirimkan foto kopi pagimu dengan emoji mengantuk, itu selalu membuat hariku lebih ceria.',
      answeredAt: new Date().toISOString()
    },
    user_elena: {
      userName: 'Elena',
      answer: 'Caramu selalu memastikan aku sudah makan meskipun di tokomu sedang sangat sibuk.',
      answeredAt: new Date().toISOString()
    }
  }
};

export const INITIAL_BUCKET_LIST: BucketListItem[] = [
  {
    id: 'b_1',
    couple_id: 'couple_main',
    title: 'Menyewa kabin tepi pantai di Bretagne & melihat bintang',
    category: 'trip',
    completed: false,
    target_location: 'Bretagne, Prancis',
    completed_at: null,
    created_by: 'user_elena'
  },
  {
    id: 'b_2',
    couple_id: 'couple_main',
    title: 'Makan parfait matcha & berburu barang antik di Kyoto',
    category: 'food',
    completed: true,
    target_location: 'Gion, Kyoto',
    completed_at: '2025-07-28',
    created_by: 'user_kai'
  },
  {
    id: 'b_3',
    couple_id: 'couple_main',
    title: 'Mencoba photobooth analog 35mm di setiap kota yang kita kunjungi',
    category: 'activity',
    completed: false,
    target_location: 'Tokyo & Paris',
    completed_at: null,
    created_by: 'user_kai'
  },
  {
    id: 'b_4',
    couple_id: 'couple_main',
    title: 'Membangun rumah impian dengan jendela besar & sudut baca',
    category: 'future',
    completed: false,
    target_location: 'Masa Depan Kita',
    completed_at: null,
    created_by: 'user_elena'
  }
];

export const USFRAME_TEMPLATES: USFrameTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal Editorial',
    description: 'Off-white hangat, spasi tenang, tipografi serif anggun.',
    bg: '#FAF8F5',
    textColor: '#1C1917',
    borderStyle: 'solid',
    layout: 'strip-4',
    previewBg: 'bg-[#FAF8F5]'
  },
  {
    id: 'classic',
    name: 'Klasik Photobooth',
    description: 'Putih studio murni, frame hitam tegas, nuansa arcade retro.',
    bg: '#FFFFFF',
    textColor: '#000000',
    borderStyle: 'solid',
    layout: 'strip-4',
    previewBg: 'bg-[#FFFFFF]'
  },
  {
    id: 'terracotta',
    name: 'Terracotta Hangat',
    description: 'Warna tanah liat lembut dengan aksen tulisan tangan romantis.',
    bg: '#F4ECE6',
    textColor: '#9E3418',
    borderStyle: 'solid',
    layout: 'strip-4',
    previewBg: 'bg-[#F4ECE6]'
  },
  {
    id: 'film35',
    name: 'Film Analog 35mm',
    description: 'Perforasi rol film vintage & tekstur ISO 400 otentik.',
    bg: '#141414',
    textColor: '#E5E5E5',
    borderStyle: 'film',
    layout: 'strip-4',
    previewBg: 'bg-[#141414]'
  },
  {
    id: 'midnight',
    name: 'Midnight Velvet',
    description: 'Charcoal gelap elegan dengan sentuhan tipografi emas.',
    bg: '#121110',
    textColor: '#E5D5BA',
    borderStyle: 'solid',
    layout: 'strip-4',
    previewBg: 'bg-[#121110]'
  },
  {
    id: 'polaroid',
    name: 'Duo Polaroid',
    description: 'Dua foto berukuran besar dengan margin bawah lebar untuk catatan.',
    bg: '#FAF8F5',
    textColor: '#292524',
    borderStyle: 'solid',
    layout: 'duo-vertical',
    previewBg: 'bg-[#FAF8F5]'
  }
];

export const PHOTO_FILTERS = [
  { id: 'natural', name: 'Alami' },
  { id: 'film400', name: 'Film 400' },
  { id: 'bw_warm', name: 'B&W Hangat' },
  { id: 'golden', name: 'Golden Hour' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'noir', name: 'Noir' }
];

export const PHOTO_STAMPS = [
  { id: 'us_logo', label: 'US • Kita' },
  { id: 'date_stamp', label: 'Cap Tanggal' },
  { id: 'coordinates', label: '9,710 KM' },
  { id: 'love_heart', label: '🤍 Abadi' },
  { id: 'film_roll', label: 'ISO 400' },
  { id: 'none', label: 'Tanpa Cap' }
];
