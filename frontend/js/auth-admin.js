document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminLoginForm');
    const btnLogin = document.getElementById('btnLogin');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner"></span> Verificando...';

        try {
            const response = await fetch(`${API_URL}/auth-admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Credenciales incorrectas');

            const temaGuardado = localStorage.getItem('theme');
            localStorage.clear();
            if (temaGuardado) localStorage.setItem('theme', temaGuardado);

            Auth.setToken(data.token);
            Auth.setUser({ 
                nombre: data.nombre, 
                email: data.email, 
                rol: data.rol 
            });

            window.location.href = 'dashboard-admin.html';

        } catch (error) {
            alert(error.message);
            btnLogin.disabled = false;
            btnLogin.innerHTML = 'Ingresar al Panel';
        }
    });
});