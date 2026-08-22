import { getCurrentUser } from '../auth.js';
import { subscribeToCouple, leaveCouple } from '../coupleService.js';
import { supabase } from '../supabaseClient.js';

let coupleId = null;
let userId = null;
let subscription = null;

async function init() {
    const data = await getCurrentUser();
    if(!data || !data.profile || !data.profile.couple_id) {
        window.location.href = '../index.html';
        return;
    }
    userId = data.user.id;
    coupleId = data.profile.couple_id;

    // Fetch couple to get code
    const { data: couple, error } = await supabase
        .from('couples')
        .select('*')
        .eq('id', coupleId)
        .single();
        
    if(error || !couple) {
        window.location.href = '../index.html';
        return;
    }
    
    if(couple.status === 'active') {
        window.location.href = 'connected.html';
        return;
    }

    document.getElementById('codeDisplay').textContent = couple.invite_code;

    // Listen for partner joining real-time
    subscription = subscribeToCouple(coupleId, (payload) => {
        if(payload.status === 'active') {
            window.location.href = 'connected.html';
        }
    });
}

document.getElementById('copyBtn').addEventListener('click', () => {
    const code = document.getElementById('codeDisplay').textContent;
    navigator.clipboard.writeText(code);
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Tersalin!';
    setTimeout(() => btn.textContent = 'Salin Kode', 2000);
});

document.getElementById('cancelBtn').addEventListener('click', async () => {
    if(confirm("Batalkan pembuatan ruangan ini?")) {
        const btn = document.getElementById('cancelBtn');
        btn.disabled = true;
        await leaveCouple(userId, coupleId);
        window.location.href = 'create-room.html';
    }
});

init();
