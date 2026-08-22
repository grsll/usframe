-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Couples (Inti Rumah Virtual)
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
  member_ids UUID[] NOT NULL,
  relationship_start_date DATE DEFAULT CURRENT_DATE,
  next_meet_date DATE,
  xp INTEGER DEFAULT 0,
  garden_level INTEGER DEFAULT 1,
  pet_name TEXT DEFAULT 'Mochi',
  pet_type TEXT DEFAULT 'cat',
  pet_hunger INTEGER DEFAULT 80,
  pet_happiness INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Profiles (User)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
  current_mood TEXT DEFAULT '😊',
  status_activity TEXT DEFAULT 'Santai di rumah',
  location_name TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Heart Room: Mood, Unek-Unek & I Need to Talk
CREATE TABLE IF NOT EXISTS public.heart_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('mood', 'unek_unek', 'i_need_talk', 'appreciation', 'private_journal')),
  mood_emoji TEXT,
  content TEXT NOT NULL,
  need_tag TEXT, -- 'Cuma mau didengar', 'Butuh solusi', 'Kangen', dll.
  is_shared BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Peace Room: Cool Down & Conflict Resolution
CREATE TABLE IF NOT EXISTS public.peace_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  initiator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cooldown_until TIMESTAMPTZ,
  user_a_perspective TEXT,
  user_b_perspective TEXT,
  user_a_needs TEXT,
  user_b_needs TEXT,
  ai_summary TEXT,
  agreement TEXT,
  status TEXT CHECK (status IN ('cooldown', 'discussing', 'resolved')) DEFAULT 'discussing',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Love Letters & Open When
CREATE TABLE IF NOT EXISTS public.love_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  letter_type TEXT DEFAULT 'general', -- 'open_when_sad', 'open_when_miss', 'anniversary', dll.
  content TEXT NOT NULL,
  unlock_date TIMESTAMPTZ,
  is_opened BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Memories & Photobooth
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image', -- 'image', 'voicenote', 'video'
  category TEXT DEFAULT 'Random',
  caption TEXT,
  memory_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Setup
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peace_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Clean Up Old Policies if exists
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can create couple" ON public.couples;
DROP POLICY IF EXISTS "Users can view couples" ON public.couples;
DROP POLICY IF EXISTS "Users can update couples" ON public.couples;
DROP POLICY IF EXISTS "Couples heart notes policy" ON public.heart_notes;
DROP POLICY IF EXISTS "Couples peace policy" ON public.peace_conflicts;
DROP POLICY IF EXISTS "Couples letters policy" ON public.love_letters;
DROP POLICY IF EXISTS "Couples memories policy" ON public.memories;

-- Safe Non-Recursive Policies
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view couples" ON public.couples
  FOR SELECT USING (auth.uid() = ANY(member_ids) OR status = 'pending');

CREATE POLICY "Authenticated can create couple" ON public.couples
  FOR INSERT WITH CHECK (auth.uid() = member_ids[1]);

CREATE POLICY "Users can update couples" ON public.couples
  FOR UPDATE USING (auth.uid() = ANY(member_ids) OR (status = 'pending' AND array_length(member_ids, 1) = 1));

-- Policies for Rooms
CREATE POLICY "Couples heart notes policy" ON public.heart_notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Couples peace policy" ON public.peace_conflicts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Couples letters policy" ON public.love_letters
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Couples memories policy" ON public.memories
  FOR ALL USING (auth.role() = 'authenticated');

-- User Registration Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.heart_notes;
