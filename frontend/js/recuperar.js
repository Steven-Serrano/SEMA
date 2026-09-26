/* ============================================================
   SEMA - RECUPERAR CONTRASEÑA
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("recoveryForm");
    const correo = document.getElementById("correo");
    const boton = document.querySelector(".login__btn");

    /* ==========================================
       Animación del input
    ========================================== */

    correo.addEventListener("focus", () => {

        correo.parentElement.classList.add("activo");

    });

    correo.addEventListener("blur", () => {

        correo.parentElement.classList.remove("activo");

    });

    /* ==========================================
       Enviar formulario
    ========================================== */

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = correo.value.trim();

        if (email === "") {

            mostrarToast("Ingresa tu correo electrónico.");

            correo.focus();

            return;

        }

        if (!validarCorreo(email)) {

            mostrarToast("Correo electrónico no válido.");

            correo.focus();

            return;

        }

        boton.disabled = true;

        boton.innerHTML = `
            <span class="spinner"></span>
            Enviando código...
        `;

        /* ===========================
           Aquí luego irá el backend
        ============================ */

        setTimeout(() => {

            mostrarToast("Se enviaron las instrucciones a tu correo. 📧");

            setTimeout(() => {

                window.location.href = "login.html";

            }, 1500);

        }, 2000);

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