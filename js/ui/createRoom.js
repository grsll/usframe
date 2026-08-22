import { getCurrentUser, logout } from '../auth.js';
import { createCoupleRoom } from '../coupleService.js';

const btn = document.getElementById('createBtn');
const errorMsg = document.getElementById('errorMsg');

// Check auth state
getCurrentUser().then(data => {
    if(!data) window.location.href = 'login.html';
    if(data && data.profile && data.profile.couple_id) window.location.href = '../index.html';
});

btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Membuat...';
    
    try {
        const data = await getCurrentUser();
        if(!data) throw new Error("Silakan login kembali.");
        
        await createCoupleRoom(data.user.id);
        window.location.href = 'waiting.html';
    } catch (err) {
        errorMsg.textContent = err.message || "Gagal membuat ruangan.";
        btn.disabled = false;
        btn.textContent = 'Buat Ruangan Baru';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
    window.location.href = 'login.html';
});
