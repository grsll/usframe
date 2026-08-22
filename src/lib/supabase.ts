import { createClient } from '@supabase/supabase-js';

// Default Supabase project configuration (matches the existing schema setup)
const supabaseUrl = 'https://pbgdkfvxgcnpiwdtzzhm.supabase.co';
const supabaseKey = 'sb_publishable_UTJOJVjCJ1z-CJrTBp7oOQ_eveEmA5T';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
