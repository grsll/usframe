import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pbgdkfvxgcnpiwdtzzhm.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UTJOJVjCJ1z-CJrTBp7oOQ_eveEmA5T';

let client: SupabaseClient;

try {
  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
} catch (err) {
  console.warn('Supabase client initialization fallback:', err);
  // Dummy safe proxy in case creation ever fails in sandbox environments
  client = {
    auth: {
      signInWithPassword: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      send: () => {},
    })
  } as any;
}

export const supabase = client;
