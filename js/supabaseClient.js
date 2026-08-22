import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// TODO: ISI DENGAN URL & ANON KEY PROJECT SUPABASE ANDA
const supabaseUrl = 'https://pbgdkfvxgcnpiwdtzzhm.supabase.co';
const supabaseKey = 'sb_publishable_UTJOJVjCJ1z-CJrTBp7oOQ_eveEmA5T';

export const supabase = createClient(supabaseUrl, supabaseKey);
