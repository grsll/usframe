import { supabase } from './supabaseClient.js';

export async function register(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
        email, 
        password, 
        options: { data: { name } } // Name triggers auto-insert in profile
    });
    return { data, error };
}

export async function login(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
    return await supabase.auth.signOut();
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
    return { user, profile, error };
}
