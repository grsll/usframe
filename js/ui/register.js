import { register } from '../auth.js';

const form = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const { error } = await register(email, password, name);
        if (error) throw error;
        alert("Pendaftaran berhasil! Silakan login.");
        window.location.href = 'login.html';
    } catch (err) {
        errorMsg.textContent = err.message || "Gagal mendaftar.";
        btn.disabled = false;
    }
});
