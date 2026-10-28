document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginButton = document.querySelector(".login__btn");

    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            const icon = togglePassword.querySelector("i");
            if (icon) icon.className = type === "password" ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
        });
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const correo = emailInput.value.trim();
        const clave = passwordInput.value.trim();

        if (!correo || !clave) return mostrarToast("Ingresa tu correo y contraseña.");

        loginButton.disabled = true;
        loginButton.innerHTML = `<span class="spinner"></span> Ingresando...`;

        try {
            let data;
            let esPsicologo = false;

            try {
                data = await fetchAuth('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: correo, password: clave })
                });
            } catch (userError) {
                data = await fetchAuth('/auth-psicologo/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: correo, password: clave })
                });
                esPsicologo = true;
            }

            // 🔑 GUARDAR EL TEMA ANTES DE LIMPIAR
            const temaGuardado = localStorage.getItem('theme');
            localStorage.clear(); 
            if (temaGuardado) localStorage.setItem('theme', temaGuardado);

            const rolUsuario = data.rol || data.tipo || data.user?.rol || data.user?.tipo || (esPsicologo ? 'psicologo' : 'usuario');
            const nombreUsuario = data.nombre || data.user?.nombre || 'Usuario';
            const emailUsuario = data.email || data.user?.email || correo;

            Auth.setToken(data.token || data.accessToken);
            Auth.setUser({ 
                id: data.id || data._id || data.user?.id || data.user?._id, 
                nombre: nombreUsuario, 
                email: emailUsuario, 
                rol: rolUsuario
            });

            mostrarToast(`¡Bienvenido a SEMA, ${nombreUsuario}! 💙`);
            
            setTimeout(() => {
                if (rolUsuario === 'psicologo') window.location.href = "dashboard-psicologo.html";
                else if (rolUsuario === 'administrador') window.location.href = "dashboard-admin.html";
                else window.location.href = "dashboard.html";
            }, 900);

        } catch (error) {
            mostrarToast(error.message || "Error al iniciar sesión.");
            loginButton.disabled = false;
            loginButton.innerHTML = `Iniciar sesión`;
        }
    });
});

function mostrarToast(texto) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = texto;
    toast.classList.add("activo");
    setTimeout(() => toast.classList.remove("activo"), 3000);
}