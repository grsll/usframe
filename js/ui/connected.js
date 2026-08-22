import { getCurrentUser, logout } from '../auth.js';
import { leaveCouple } from '../coupleService.js';
import { supabase } from '../supabaseClient.js';

let currentUser = null;
let coupleData = null;
let partnerProfile = null;

async function init() {
    const data = await getCurrentUser();
    if (!data || !data.profile || !data.profile.couple_id) {
        window.location.href = '../index.html';
        return;
    }
    currentUser = data.user;
    const profile = data.profile;

    // Fetch Couple Details
    const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .select('*')
        .eq('id', profile.couple_id)
        .single();

    if (coupleErr || !couple || couple.status !== 'active') {
        window.location.href = '../index.html';
        return;
    }
    coupleData = couple;

    // Fetch Partner Details
    const partnerId = couple.member_ids.find(id => id !== currentUser.id);
    if (partnerId) {
        const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .single();
        partnerProfile = pData;
    }

    renderUI(profile, partnerProfile, couple);
    setupRealtime();
}

function renderUI(profile, partner, couple) {
    document.getElementById('myName').textContent = profile.name || 'Aku';
    document.getElementById('myMood').textContent = `Mood: ${profile.current_mood || '😊'}`;
    
    if (partner) {
        document.getElementById('partnerName').textContent = partner.name || 'Pasangan';
        document.getElementById('partnerMood').textContent = `Mood: ${partner.current_mood || '🥰'}`;
    }

    document.getElementById('currentInviteCode').textContent = couple.invite_code;
    
    // Calculate Days Together
    if (couple.relationship_start_date) {
        const start = new Date(couple.relationship_start_date);
        const today = new Date();
        const diffDays = Math.max(1, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
        document.getElementById('daysTogetherText').textContent = `Day ${diffDays} Together 🌸`;
    }

    if (couple.next_meet_date) {
        const meet = new Date(couple.next_meet_date);
        const diffMeet = Math.ceil((meet - new Date()) / (1000 * 60 * 60 * 24));
        document.getElementById('nextMeetText').textContent = diffMeet > 0 ? `${diffMeet} hari lagi ✈️` : 'Hari ini! 🎉';
    }

    document.getElementById('gardenLevelText').textContent = `Lv. ${couple.garden_level || 1} 🌱`;
    document.getElementById('petNameText').textContent = `${couple.pet_name || 'Mochi'} (${couple.pet_happiness || 80}% Happy 🐾)`;
}

function setupRealtime() {
    // Listen for partner changes (e.g., mood, emergency need you, disconnect)
    supabase
        .channel(`home_${coupleData.id}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'couples',
            filter: `id=eq.${coupleData.id}`
        }, payload => {
            if (payload.new.status === 'pending') {
                alert("Pasanganmu telah meninggalkan ruangan.");
                window.location.href = '../index.html';
            }
        })
        .on('broadcast', { event: 'need_you' }, payload => {
            if (payload.payload.from !== currentUser.id) {
                alert(`🫂 Pasanganmu (${partnerProfile?.name || 'Dia'}) sedang membutuhkanmu sekarang juga! ❤️`);
            }
        })
        .subscribe();
}

// Emergency "I Need You" Button
document.getElementById('btnNeedYou').addEventListener('click', async () => {
    const channel = supabase.channel(`home_${coupleData.id}`);
    await channel.send({
        type: 'broadcast',
        event: 'need_you',
        payload: { from: currentUser.id }
    });
    alert("Sinyal 'I Need You' sudah terkirim ke pasanganmu! 🫂❤️");
});

// Interactive Modals for Virtual Rooms
window.openRoom = function(roomType) {
    const modal = document.getElementById('roomModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    modal.classList.add('active');

    if (roomType === 'heart') {
        title.textContent = '💌 Heart Room - Tempat Perasaan';
        body.innerHTML = `
            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:1rem;">
                Tuliskan apa yang sedang kamu rasakan tanpa takut dihakimi.
            </p>
            <div class="form-group">
                <label>Pilih Mood Hari Ini:</label>
                <select id="moodSelect">
                    <option value="😊">😊 Bahagia / Senang</option>
                    <option value="🥺">🥺 Lagi Kangen Banget</option>
                    <option value="😔">😔 Sedih / Down</option>
                    <option value="😴">😴 Capek / Butuh Istirahat</option>
                    <option value="😡">😡 Kesal / Unek-unek</option>
                </select>
            </div>
            <div class="form-group">
                <label>Yang ingin aku sampaikan ("I Need to Talk"):</label>
                <select id="needTagSelect">
                    <option value="Cuma mau didengar">Cuma mau didengar tanpa disalahkan</option>
                    <option value="Butuh reassurance">Butuh ditenangkan & reassurance</option>
                    <option value="Mau ngobrol">Mau ngobrol santai</option>
                    <option value="Lagi kangen">Cuma lagi kangen</option>
                </select>
            </div>
            <div class="form-group">
                <label>Catatan / Unek-unek:</label>
                <textarea id="heartNoteText" rows="3" placeholder="Ceritakan apa yang ada di pikiranmu..."></textarea>
            </div>
            <button onclick="saveHeartNote()">Bagikan ke Pasangan</button>
        `;
    } else if (roomType === 'peace') {
        title.textContent = '🤝 Peace Room - Menyelesaikan Masalah';
        body.innerHTML = `
            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:1rem;">
                Bukan tentang siapa yang benar atau salah, tapi tentang apa yang kita butuhkan.
            </p>
            <div style="background:#fef2f2; padding:1rem; border-radius:12px; margin-bottom:1rem; border:1px solid #fecaca;">
                <h4 style="color:#b91c1c; font-size:0.9rem;">🕊️ Butuh Waktu Menenangkan Diri?</h4>
                <p style="font-size:0.8rem; color:#7f1d1d; margin:4px 0 8px;">Kirim pesan bahwa kamu butuh waktu 30 menit agar tidak emosi.</p>
                <button class="outline" style="padding:0.4rem;" onclick="triggerCoolDown()">Minta Waktu Cool Down (30 Menit)</button>
            </div>
            <button style="background:#6366f1;" onclick="alert('Fitur Conflict Resolver & AI mediator sedang aktif di tahap berikutnya!')">Masuk Conflict Discussion Room</button>
        `;
    } else if (roomType === 'memory') {
        title.textContent = '📸 Memory Room & Photobooth';
        body.innerHTML = `
            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:1rem;">
                Koleksi foto polaroid, surat terkunci, dan kenangan kalian berdua.
            </p>
            <div style="text-align:center; padding:1.5rem; background:#fff1f2; border-radius:16px; border:2px dashed #fda4af;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">📷</div>
                <strong>Photobooth Digital</strong>
                <p style="font-size:0.8rem; color:#9f1239; margin-top:4px;">Ambil strip foto lucu bersama pasangan dan simpan ke galeri.</p>
            </div>
        `;
    } else if (roomType === 'game') {
        title.textContent = '🎮 Game Room - Seru-seruan Bareng';
        body.innerHTML = `
            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:1rem;">
                Main mini game untuk mengisi waktu luang LDR dan kumpulkan XP hubungan!
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                <button class="outline" style="padding:0.75rem; font-size:0.85rem;" onclick="alert('Membuka Tic Tac Toe...')">⭕❌ Tic Tac Toe</button>
                <button class="outline" style="padding:0.75rem; font-size:0.85rem;" onclick="alert('Membuka Couple Quiz...')">❤️ Couple Quiz</button>
                <button class="outline" style="padding:0.75rem; font-size:0.85rem;" onclick="alert('Membuka Truth or Dare...')">🎲 Truth or Dare</button>
                <button class="outline" style="padding:0.75rem; font-size:0.85rem;" onclick="alert('Membuka Connect 4...')">🔴🟡 Connect 4</button>
            </div>
        `;
    } else if (roomType === 'garden') {
        title.textContent = '🌱 Garden & Pet';
        body.innerHTML = `
            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:1rem;">
                Setiap interaksi & komunikasi kalian akan menumbuhkan taman dan merawat pet bersama.
            </p>
            <div style="text-align:center; padding:1rem; background:#f0fdf4; border-radius:16px; border:1px solid #bbf7d0;">
                <div style="font-size:3rem;">🐱</div>
                <h4 style="color:#166534;">Mochi si Kucing</h4>
                <p style="font-size:0.8rem; color:#15803d; margin:4px 0 10px;">Status: Sangat Senang & Kenyang</p>
                <button style="background:#22c55e; padding:0.5rem;" onclick="alert('Mochi sudah diberi makan! +10 XP Hubungan 🌱')">🐟 Beri Makan Pet</button>
            </div>
        `;
    } else if (roomType === 'living') {
        title.textContent = '🛋️ Living Room - Ruang Santai';
        body.innerHTML = `
            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:1rem;">
                Tempat menghabiskan malam bersama di sofa virtual.
            </p>
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                <button style="background:#8b5cf6;" onclick="alert('Voice Call akan aktif di V4!')">🎙️ Join Late Night Call</button>
                <button class="outline" onclick="alert('Fitur Watch Together akan aktif di V4!')">🍿 Nonton Bareng</button>
            </div>
        `;
    }
};

window.closeModal = function() {
    document.getElementById('roomModal').classList.remove('active');
};

window.saveHeartNote = async function() {
    const mood = document.getElementById('moodSelect').value;
    const tag = document.getElementById('needTagSelect').value;
    const text = document.getElementById('heartNoteText').value;

    if (!text.trim()) {
        alert("Silakan tulis pesanmu terlebih dahulu.");
        return;
    }

    // Update Profile Mood
    await supabase.from('profiles').update({ current_mood: mood }).eq('id', currentUser.id);

    // Insert Note
    await supabase.from('heart_notes').insert([{
        couple_id: coupleData.id,
        sender_id: currentUser.id,
        category: 'heart_note',
        mood_emoji: mood,
        need_tag: tag,
        content: text
    }]);

    alert("Catatan perasaanmu berhasil dikirim ke pasangan! 💌");
    closeModal();
    window.location.reload();
};

window.triggerCoolDown = function() {
    alert("Notifikasi Cool Down 30 menit telah dikirim ke pasangan. Luangkan waktu untuk bernapas sejenak ya. 🕊️");
    closeModal();
};

// Leave & Logout
document.getElementById('leaveRoomBtn').addEventListener('click', async () => {
    if (confirm("Yakin ingin memutuskan hubungan dari ruangan ini?")) {
        await leaveCouple(currentUser.id, coupleData.id);
        window.location.href = '../index.html';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
    window.location.href = '../index.html';
});

init();
