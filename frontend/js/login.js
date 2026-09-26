/* ============================================================
   SEMA - LOGIN
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginButton = document.querySelector(".login__btn");

    /* Mostrar / Ocultar contraseña */

    if (togglePassword) {

        togglePassword.addEventListener("click", () => {

            const type = password.getAttribute("type") === "password"
                ? "text"
                : "password";

            password.setAttribute("type", type);

            togglePassword.textContent =
                type === "password" ? "👁" : "🙈";

        });

    }

    /* Animación de los inputs*/

    document.querySelectorAll("input").forEach(input => {

        input.addEventListener("focus", () => {

            input.parentElement.classList.add("activo");

        });

        input.addEventListener("blur", () => {

            input.parentElement.classList.remove("activo");

        });

    });

    /* Envío del formulario */

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        const correo = email.value.trim();
        const clave = password.value.trim();

        if (correo === "") {

            mostrarToast("Ingresa tu correo electrónico.");

            email.focus();

            return;

        }

        if (!validarCorreo(correo)) {

            mostrarToast("El correo electrónico no es válido.");

            email.focus();

            return;

        }

        if (clave === "") {

            mostrarToast("Ingresa tu contraseña.");

            password.focus();

            return;

        }

        if (clave.length < 6) {

            mostrarToast("La contraseña debe tener al menos 6 caracteres.");

            password.focus();

            return;

        }

        loginButton.disabled = true;

        loginButton.innerHTML = `
            <span class="spinner"></span>
            Ingresando...
        `;

        setTimeout(() => {

            mostrarToast("¡Bienvenido a SEMA! 💙");

            setTimeout(() => {

                window.location.href = "dashboard.html";

            }, 900);

        }, 1800);

    });

});

/* Validar correo */

function validarCorreo(correo) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

}

/* Toast */

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