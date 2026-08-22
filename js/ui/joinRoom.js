import { getCurrentUser } from '../auth.js';
import { joinCoupleRoom } from '../coupleService.js';

const form = document.getElementById('joinForm');
const errorMsg = document.getElementById('errorMsg');

getCurrentUser().then(data => {
    if(!data) window.location.href = 'login.html';
    if(data && data.profile && data.profile.couple_id) window.location.href = '../index.html';
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    
    const code = document.getElementById('code').value;
    
    try {
        const data = await getCurrentUser();
        if(!data) throw new Error("Silakan login kembali.");
        
        await joinCoupleRoom(data.user.id, code);
        window.location.href = 'connected.html';
    } catch (err) {
        errorMsg.textContent = err.message || "Gagal bergabung. Pastikan kode benar.";
        btn.disabled = false;
    }
});
