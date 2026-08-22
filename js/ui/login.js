import { login } from '../auth.js';

const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const { error } = await login(email, password);
        if (error) throw error;
        window.location.href = '../index.html'; // Redirect to router
    } catch (err) {
        errorMsg.textContent = err.message || "Gagal login. Cek kredensial Anda.";
        btn.disabled = false;
    }
});
