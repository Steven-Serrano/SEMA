/* ============================================================
   SEMA - LOGIN
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginButton = document.querySelector(".login__btn");

    /* Mostrar / Ocultar contraseña */
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            togglePassword.textContent = type === "password" ? "👁" : "🙈";
        });
    }

    /* Animación de los inputs */
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("focus", () => {
            input.parentElement.classList.add("activo");
        });
        input.addEventListener("blur", () => {
            input.parentElement.classList.remove("activo");
        });
    });

    /* Envío del formulario al backend */
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const correo = emailInput.value.trim();
        const clave = passwordInput.value.trim();

        // Validaciones básicas
        if (correo === "") {
            mostrarToast("Ingresa tu correo electrónico.");
            emailInput.focus();
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            mostrarToast("El correo electrónico no es válido.");
            emailInput.focus();
            return;
        }

        if (clave === "") {
            mostrarToast("Ingresa tu contraseña.");
            passwordInput.focus();
            return;
        }

        if (clave.length < 6) {
            mostrarToast("La contraseña debe tener al menos 6 caracteres.");
            passwordInput.focus();
            return;
        }

        // Estado de carga
        loginButton.disabled = true;
        loginButton.innerHTML = `<span class="spinner"></span> Ingresando...`;

        try {
            let data;
            // 1. Intentamos login como usuario normal
            try {
                data = await fetchAuth('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: correo, password: clave })
                });
            } catch (userError) {
                // 2. Si falla, intentamos como psicólogo
                data = await fetchAuth('/auth-psicologo/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: correo, password: clave })
                });
            }

// 3. Limpiamos datos anteriores y guardamos los nuevos
localStorage.clear(); 

// 4. Guardamos el token y los datos del usuario NUEVO
Auth.setToken(data.token);
Auth.setUser({ 
    nombre: data.nombre, 
    email: data.email, 
    rol: data.rol || data.tipo || 'usuario'  // ✅ Usar 'tipo' si viene del login de psicólogo
});

            mostrarToast(`¡Bienvenido a SEMA, ${data.nombre}! 💙`);
            
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 900);

        } catch (error) {
            mostrarToast(error.message || "Error al iniciar sesión. Verifica tus credenciales.");
            
            // Restaurar el botón si hay error
            loginButton.disabled = false;
            loginButton.innerHTML = `Iniciar sesión`;
        }
    });
});

/* ==========================================
   Toast (Función original intacta)
   ========================================== */
function mostrarToast(texto) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = texto;
    toast.classList.add("activo");
    setTimeout(() => {
        toast.classList.remove("activo");
    }, 3000);
}