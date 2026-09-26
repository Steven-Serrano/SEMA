/* ============================================================
   SEMA - REGISTER
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    const nombre = document.getElementById("nombre");
    const documento = document.getElementById("documento");
    const correo = document.getElementById("correo");
    const telefono = document.getElementById("telefono");
    const fecha = document.getElementById("fecha");
    const genero = document.getElementById("genero");
    const ciudad = document.getElementById("ciudad");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const submitButton = document.querySelector(".login__btn");

    /* ==========================================
       Animación de inputs
    ========================================== */

    document.querySelectorAll("input, select").forEach(campo => {

        campo.addEventListener("focus", () => {

            campo.parentElement.classList.add("activo");

        });

        campo.addEventListener("blur", () => {

            campo.parentElement.classList.remove("activo");

        });

    });

    /* ==========================================
       Envío del formulario
    ========================================== */

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        if (nombre.value.trim() === "") {

            mostrarToast("Ingresa tu nombre.");

            nombre.focus();

            return;

        }

        if (documento.value.trim() === "") {

            mostrarToast("Ingresa tu documento.");

            documento.focus();

            return;

        }

        if (!validarCorreo(correo.value.trim())) {

            mostrarToast("Correo electrónico no válido.");

            correo.focus();

            return;

        }

        if (telefono.value.trim().length < 7) {

            mostrarToast("Número de teléfono incorrecto.");

            telefono.focus();

            return;

        }

        if (fecha.value === "") {

            mostrarToast("Selecciona tu fecha de nacimiento.");

            fecha.focus();

            return;

        }

        if (genero.selectedIndex === 0) {

            mostrarToast("Selecciona un género.");

            genero.focus();

            return;

        }

        if (ciudad.value.trim() === "") {

            mostrarToast("Ingresa tu ciudad.");

            ciudad.focus();

            return;

        }

        if (password.value.length < 6) {

            mostrarToast("La contraseña debe tener mínimo 6 caracteres.");

            password.focus();

            return;

        }

        if (password.value !== confirmPassword.value) {

            mostrarToast("Las contraseñas no coinciden.");

            confirmPassword.focus();

            return;

        }

        submitButton.disabled = true;

        submitButton.innerHTML = `

            <span class="spinner"></span>

            Creando cuenta...

        `;

        setTimeout(() => {

            mostrarToast("Cuenta creada correctamente 💙");

            setTimeout(() => {

                window.location.href = "login.html";

            }, 1000);

        }, 1800);

    });

});

/* ==========================================
   Validar correo
========================================== */

function validarCorreo(correo) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

}

/* ==========================================
   Toast
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