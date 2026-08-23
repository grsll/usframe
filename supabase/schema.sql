-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Couples (Inti Rumah Virtual & Shared Room Source of Truth)
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
  member_ids UUID[] NOT NULL,
  couple_name TEXT,
  relationship_start_date DATE DEFAULT CURRENT_DATE,
  next_meet_date DATE,
  city TEXT,
  user_city TEXT,
  partner_city TEXT,
  xp INTEGER DEFAULT 0,
  garden_level INTEGER DEFAULT 1,
  pet_name TEXT DEFAULT 'Mochi',
  pet_type TEXT DEFAULT 'cat',
  pet_hunger INTEGER DEFAULT 80,
  pet_happiness INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS next_meet_date DATE;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS user_city TEXT;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS partner_city TEXT;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS garden_level INTEGER DEFAULT 1;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS pet_name TEXT DEFAULT 'Mochi';
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS pet_type TEXT DEFAULT 'cat';
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS pet_hunger INTEGER DEFAULT 80;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS pet_happiness INTEGER DEFAULT 80;

-- 2. Tabel Profiles (User)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
  current_mood TEXT DEFAULT '🥰',
  mood_label TEXT DEFAULT 'Siap melanjutkan kisah kita',
  status_activity TEXT DEFAULT 'Santai di rumah',
  location_name TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_mood TEXT DEFAULT '🥰';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mood_label TEXT DEFAULT 'Siap melanjutkan kisah kita';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_activity TEXT DEFAULT 'Santai di rumah';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();

-- 3. Heart Room: Mood, Unek-Unek & I Need to Talk & Heart Pulse History
CREATE TABLE IF NOT EXISTS public.heart_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('mood', 'unek_unek', 'i_need_talk', 'appreciation', 'private_journal', 'heart_pulse')) DEFAULT 'heart_pulse',
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
  letter_type TEXT DEFAULT 'general', -- 'general', 'open_when_sad', 'open_when_miss', 'anniversary'
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
  title TEXT,
  caption TEXT,
  location TEXT,
  media_url TEXT NOT NULL,
  storage_path TEXT,
  media_type TEXT DEFAULT 'image', -- 'image', 'usframe_strip', 'voicenote', 'video'
  category TEXT DEFAULT 'Random',
  is_favorite BOOLEAN DEFAULT false,
  memory_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 7. Timeline / Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'dating',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Countdowns
CREATE TABLE IF NOT EXISTS public.countdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  icon TEXT DEFAULT '✈️',
  category TEXT DEFAULT 'meet',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Bucket List Items
CREATE TABLE IF NOT EXISTS public.bucket_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'trip',
  completed BOOLEAN DEFAULT false,
  target_location TEXT,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Daily Questions & Answers
CREATE TABLE IF NOT EXISTS public.daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  question_date DATE NOT NULL DEFAULT CURRENT_DATE,
  question TEXT NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(couple_id, question_date)
);

-- 11. Personal User Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'miss_you', 'love_letter', 'photo_shared', 'booth_invite'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reference_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Setup
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peace_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Clean Up Old Policies
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles insert" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles update" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated can create couple" ON public.couples;
DROP POLICY IF EXISTS "Users can view couples" ON public.couples;
DROP POLICY IF EXISTS "Users can update couples" ON public.couples;
DROP POLICY IF EXISTS "Users can delete couples" ON public.couples;
DROP POLICY IF EXISTS "Public couples select" ON public.couples;
DROP POLICY IF EXISTS "Public couples insert" ON public.couples;
DROP POLICY IF EXISTS "Public couples update" ON public.couples;
DROP POLICY IF EXISTS "Public couples delete" ON public.couples;

DROP POLICY IF EXISTS "Couples heart notes policy" ON public.heart_notes;
DROP POLICY IF EXISTS "Couples peace policy" ON public.peace_conflicts;
DROP POLICY IF EXISTS "Couples letters policy" ON public.love_letters;
DROP POLICY IF EXISTS "Couples memories policy" ON public.memories;
DROP POLICY IF EXISTS "Couples milestones policy" ON public.milestones;
DROP POLICY IF EXISTS "Couples countdowns policy" ON public.countdowns;
DROP POLICY IF EXISTS "Couples bucket list policy" ON public.bucket_list_items;
DROP POLICY IF EXISTS "Couples daily questions policy" ON public.daily_questions;

-- Profiles Policies (Accessible to authenticated & anon for pairing)
CREATE POLICY "Public profiles select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public profiles update" ON public.profiles FOR UPDATE USING (true);

-- Couples Policies (Accessible so invite codes can be found and joined across devices)
CREATE POLICY "Public couples select" ON public.couples FOR SELECT USING (true);
CREATE POLICY "Public couples insert" ON public.couples FOR INSERT WITH CHECK (true);
CREATE POLICY "Public couples update" ON public.couples FOR UPDATE USING (true);
CREATE POLICY "Public couples delete" ON public.couples FOR DELETE USING (true);

-- Room Collaborative Data Policies
CREATE POLICY "Public heart notes policy" ON public.heart_notes FOR ALL USING (true);
CREATE POLICY "Public peace policy" ON public.peace_conflicts FOR ALL USING (true);
CREATE POLICY "Public letters policy" ON public.love_letters FOR ALL USING (true);
CREATE POLICY "Public memories policy" ON public.memories FOR ALL USING (true);
CREATE POLICY "Public milestones policy" ON public.milestones FOR ALL USING (true);
CREATE POLICY "Public countdowns policy" ON public.countdowns FOR ALL USING (true);
CREATE POLICY "Public bucket list policy" ON public.bucket_list_items FOR ALL USING (true);
CREATE POLICY "Public daily questions policy" ON public.daily_questions FOR ALL USING (true);
CREATE POLICY "Public notifications policy" ON public.notifications FOR ALL USING (true);

-- RPC Helper for Atomic Room Join (Works with both authenticated session and explicit user UUID)
DROP FUNCTION IF EXISTS public.join_couple_room(TEXT);
DROP FUNCTION IF EXISTS public.join_couple_room(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.join_couple_room(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.join_couple_room(
  p_invite_code TEXT, 
  p_city TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_couple RECORD;
  v_updated_couple RECORD;
BEGIN
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ID Pengguna tidak ditemukan untuk bergabung ke ruangan.';
  END IF;

  SELECT * INTO v_couple 
  FROM public.couples 
  WHERE UPPER(TRIM(invite_code)) = UPPER(TRIM(p_invite_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ruangan dengan kode "%" tidak ditemukan. Pastikan kodenya benar.', p_invite_code;
  END IF;

  IF v_user_id = ANY(v_couple.member_ids) THEN
    -- Already a member, return existing couple
    RETURN to_jsonb(v_couple);
  END IF;

  IF array_length(v_couple.member_ids, 1) >= 2 THEN
    RAISE EXCEPTION 'Ruangan ini sudah penuh (terhubung dengan 2 anggota).';
  END IF;

  UPDATE public.couples
  SET 
    member_ids = array_append(v_couple.member_ids, v_user_id),
    status = 'active',
    city = COALESCE(city, p_city, v_couple.user_city, v_couple.partner_city),
    partner_city = COALESCE(p_city, partner_city)
  WHERE id = v_couple.id
  RETURNING * INTO v_updated_couple;

  UPDATE public.profiles
  SET 
    couple_id = v_couple.id,
    location_name = COALESCE(p_city, location_name)
  WHERE id = v_user_id;

  RETURN to_jsonb(v_updated_couple);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.join_couple_room(TEXT, TEXT, UUID) TO anon, authenticated, service_role;

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

-- Enable Realtime safely for all collaborative tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'couples'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'heart_notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.heart_notes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'love_letters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.love_letters;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'memories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'milestones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'countdowns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.countdowns;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bucket_list_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bucket_list_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'daily_questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_questions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 12. Supabase Storage Buckets & Policies (Persistent Cloud Storage for Memories & Avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('memories', 'memories', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Memories
DROP POLICY IF EXISTS "Public Memories Storage Select" ON storage.objects;
DROP POLICY IF EXISTS "Public Memories Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Memories Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Memories Storage Delete" ON storage.objects;

CREATE POLICY "Public Memories Storage Select" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('memories', 'avatars'));

CREATE POLICY "Public Memories Storage Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('memories', 'avatars'));

CREATE POLICY "Public Memories Storage Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id IN ('memories', 'avatars'));

CREATE POLICY "Public Memories Storage Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id IN ('memories', 'avatars'));
