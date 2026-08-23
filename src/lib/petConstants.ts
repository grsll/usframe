import { PetType, CouplePet, CoupleStreak } from '../types';

export interface PetDefinition {
  type: PetType;
  defaultName: string;
  avatarEmoji: string;
  description: string;
  favoriteFood: string;
  themeColor: string;
}

export const PET_DEFINITIONS: Record<PetType, PetDefinition> = {
  cat: {
    type: 'cat',
    defaultName: 'Mochi',
    avatarEmoji: '🐱',
    description: 'Kucing manis yang manja dan setia menemani hari-hari kalian.',
    favoriteFood: 'Ikan Tuna 🐟',
    themeColor: '#D95D39'
  },
  chick: {
    type: 'chick',
    defaultName: 'Piyo',
    avatarEmoji: '🐣',
    description: 'Anak ayam ceria yang selalu bersemangat saat kalian bersama.',
    favoriteFood: 'Biji Jagung Manis 🌽',
    themeColor: '#F59E0B'
  },
  bunny: {
    type: 'bunny',
    defaultName: 'Lulu',
    avatarEmoji: '🐰',
    description: 'Kelinci lembut pemalu yang selalu melompat gembira saat ada pesan baru.',
    favoriteFood: 'Wortel Segar 🥕',
    themeColor: '#EC4899'
  },
  bear: {
    type: 'bear',
    defaultName: 'Kuma',
    avatarEmoji: '🐻',
    description: 'Beruang hangat yang siap memberi pelukan pelindung cinta kalian.',
    favoriteFood: 'Madu Bunga 🍯',
    themeColor: '#8B5CF6'
  },
  penguin: {
    type: 'penguin',
    defaultName: 'Pepi',
    avatarEmoji: '🐧',
    description: 'Pinguin lucu yang melambangkan kesetiaan seumur hidup berdua.',
    favoriteFood: 'Es Krim Vanila 🍦',
    themeColor: '#06B6D4'
  }
};

export interface LevelTier {
  level: number;
  name: string;
  stage: string;
  minXp: number;
  maxXp: number;
  statusBadge: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, name: 'Baby', stage: 'Menetas', minXp: 0, maxXp: 100, statusBadge: '🐣 Bayi Imut' },
  { level: 2, name: 'Toddler', stage: 'Ceria', minXp: 100, maxXp: 250, statusBadge: '🐥 Balita Aktif' },
  { level: 3, name: 'Happy', stage: 'Menggemaskan', minXp: 250, maxXp: 500, statusBadge: '✨ Remaja Ceria' },
  { level: 4, name: 'Sweet', stage: 'Setia', minXp: 500, maxXp: 900, statusBadge: '💖 Sahabat Cinta' },
  { level: 5, name: 'Guardian', stage: 'Pelindung Abadi', minXp: 900, maxXp: 1500, statusBadge: '🌟 Penjaga Cinta Abadi' }
];

export const STREAK_MILESTONES = [
  { days: 3, title: 'Api Cinta Pertama 🔥', rewardXp: 50, description: '3 hari berturut-turut menjaga kehangatan!' },
  { days: 7, title: 'Satu Minggu Bersama 💖', rewardXp: 100, description: '7 hari konsisten mengisi ruang berdua!' },
  { days: 14, title: 'Dua Pekan Emas ✨', rewardXp: 150, description: '14 hari tanpa putus saling menyapa!' },
  { days: 30, title: 'Sebulan Penuh Kasih 🏆', rewardXp: 250, description: '30 hari komitmen dan perhatian tulus!' },
  { days: 50, title: 'Setengah Abad Cinta 🌟', rewardXp: 350, description: '50 hari mengukir kisah manis bersama!' },
  { days: 100, title: '100 Hari Bersemi 👑', rewardXp: 500, description: '100 hari bukti cinta yang kokoh!' },
  { days: 365, title: 'Satu Tahun Keabadian 💍', rewardXp: 1000, description: '365 hari penuh cinta melintasi waktu!' }
];

export function getPetLevelInfo(totalXp: number): {
  level: number;
  levelName: string;
  currentLevelXp: number;
  requiredLevelXp: number;
  progressPercent: number;
  statusBadge: string;
} {
  let currentTier = LEVEL_TIERS[0];

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
      break;
    }
  }

  const isMaxLevel = currentTier.level === LEVEL_TIERS[LEVEL_TIERS.length - 1].level;
  const currentLevelXp = totalXp - currentTier.minXp;
  const requiredLevelXp = isMaxLevel ? 500 : (currentTier.maxXp - currentTier.minXp);
  const progressPercent = isMaxLevel 
    ? Math.min(100, Math.round((currentLevelXp % 500) / 5)) 
    : Math.min(100, Math.round((currentLevelXp / requiredLevelXp) * 100));

  return {
    level: currentTier.level,
    levelName: currentTier.name,
    currentLevelXp: Math.max(0, currentLevelXp),
    requiredLevelXp,
    progressPercent,
    statusBadge: currentTier.statusBadge
  };
}

export function getRandomPetDialogue(petName: string, streakDays: number, event?: string): string {
  if (event === 'petting') {
    const petQuotes = [
      `Purrr~ ${petName} suka banget dielus kalian! 🥰`,
      `Hihi, geli! Sayang kalian berdua banyak-banyak! 🤍`,
      `${petName} merasa hangat dan disayangi! ✨`,
      `Elusan cinta dari pasangan terbaik di dunia! 🐾`
    ];
    return petQuotes[Math.floor(Math.random() * petQuotes.length)];
  }

  if (event === 'kangen') {
    return `${petName} juga ikut berdebar merasakan rindu kalian yang tulus! 🥺🤍`;
  }

  if (event === 'memory') {
    return `Foto baru masuk brankas! ${petName} senang banget lihat kalian berdua! 📸✨`;
  }

  if (event === 'letter') {
    return `Ada surat cinta baru! Hati ${petName} jadi hangat membaca kisah kalian! 💌`;
  }

  if (streakDays >= 30) {
    return `Hebat! ${streakDays} hari bersama! ${petName} bangga banget punya orang tua seperti kalian! 🏆👑`;
  }

  if (streakDays >= 7) {
    return `Streak ${streakDays} hari terjaga! Cinta kalian makin kuat setiap harinya! 🔥💖`;
  }

  if (streakDays >= 1) {
    return `Halo! ${petName} siap menemani dan menjaga api cinta kalian hari ini! 🤍✨`;
  }

  return `${petName} menunggu sapaan dan momen manis dari kalian hari ini! 🥺🐾`;
}

// Audio Synthesizers for Pet Interaction, Level Up, and Streak Celebration
export function playPetChirpSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

export function playLevelUpSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  } catch {}
}
