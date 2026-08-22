# US × USFRAME — A Little Place for Two

> **An authentic browser-based 4-photo photobooth, couple memory vault, and private digital sanctuary designed for couples in love & long-distance relationships.**

![USFRAME Preview](https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80)

---

## ✨ Features

- **📷 USFRAME Photobooth**:
  - Live browser camera with front/rear camera switcher.
  - Automated 3-2-1 countdown for 4 sequential photo poses with vintage shutter flash and tactile shutter sound synthesis.
  - 6 handcrafted photo templates (Minimal Editorial, Classic Photobooth, Warm Terracotta, Analog 35mm Film, Midnight Velvet, Polaroid Duo).
  - 6 color filters (Natural, Film 400, Warm B&W, Golden Hour, Muted Vintage, Noir).
  - Custom captions, date stamps, and 300DPI high-resolution canvas export / direct vault saving.

- **💌 Together Space**:
  - **Daily Question for Two**: Thoughtful daily prompts that unlock only when both partners share their response.
  - **Love Letters & Open When Notes**: Intimate sealed letters and open-when notes.
  - **Mood Tracker & Live Presence**: Real-time heartbeat pulse alerts (*"I Miss You"*) with confetti animations.
  - **Couple Bucket List**: Shared travel destinations, food spots, and dreams with completion badges.
  - **Countdown Manager**: Milestone tracking for flight visits, reunions, and anniversaries.

- **📖 Story Timeline & Vault**:
  - Chronological story stream with milestones, location badges, and memory notes.
  - Searchable memory vault with tag filters and favorites.

- **📱 Android & Mobile Optimized**:
  - Native bottom-sheet modals with gesture handles.
  - Safe-area floating navigation bar.
  - Responsive photobooth camera tailored for smartphone screens.

- **🌓 Dual Theme Support**:
  - Warm Light Mode (`#FAF8F5`) and Midnight Dark Mode (`#121110`) with automatic system preference detection.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 with custom `@theme` tokens
- **Icons & Animation**: Lucide React, Canvas Confetti
- **Audio & Rendering**: Web Audio API (Synthesized shutter clicks), HTML5 Canvas 2D
- **Database**:
  - Local Persistent Engine: Typed `localStorage` with fail-safe error recovery
  - Cloud Realtime: Supabase (PostgreSQL with Realtime WebSockets)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/grsll/usframe.git
cd usframe
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 🔐 Connecting Supabase (Optional)

Create a `.env` file from the template:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📄 License
MIT License. Created with care for couples worldwide.
