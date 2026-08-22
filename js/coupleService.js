import { supabase } from './supabaseClient.js';

function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0,O,1,I
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function createCoupleRoom(userId) {
    const inviteCode = generateInviteCode();
    
    // 1. Create room in 'couples'
    const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .insert([{
            invite_code: inviteCode,
            status: 'pending',
            member_ids: [userId]
        }])
        .select()
        .single();

    if (coupleError) throw coupleError;

    // 2. Update 'profiles' with new couple_id
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', userId);

    if (profileError) throw profileError;

    return couple;
}

export async function joinCoupleRoom(userId, code) {
    // 1. Verify code and room availability
    const { data: couple, error: fetchError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', code.toUpperCase())
        .eq('status', 'pending')
        .single();

    if (fetchError || !couple) {
        throw new Error('Kode tidak valid, sudah expired, atau ruangan penuh.');
    }

    if (couple.member_ids.includes(userId)) {
        throw new Error('Anda sudah berada di ruangan ini.');
    }

    const newMemberIds = [...couple.member_ids, userId];

    // 2. Update couple to 'active'
    const { data: updatedCouple, error: updateError } = await supabase
        .from('couples')
        .update({
            member_ids: newMemberIds,
            status: 'active',
            relationship_start_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', couple.id)
        .select()
        .single();

    if (updateError) throw updateError;

    // 3. Update profile's couple_id
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', userId);

    if (profileError) throw profileError;

    return updatedCouple;
}

export async function leaveCouple(userId, coupleId) {
    const { data: couple, error: fetchError } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .single();

    if (fetchError) throw fetchError;

    const newMemberIds = couple.member_ids.filter(id => id !== userId);

    // If no members left, delete the room
    if (newMemberIds.length === 0) {
        await supabase.from('couples').delete().eq('id', coupleId);
    } else {
        // Revert to pending
        await supabase
            .from('couples')
            .update({ member_ids: newMemberIds, status: 'pending' })
            .eq('id', coupleId);
    }

    // Unlink the profile
    await supabase
        .from('profiles')
        .update({ couple_id: null })
        .eq('id', userId);
}

export function subscribeToCouple(coupleId, onUpdate) {
    return supabase
        .channel(`couple_room_${coupleId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'couples',
            filter: `id=eq.${coupleId}`
        }, payload => {
            onUpdate(payload.new);
        })
        .subscribe();
}
