document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("recoveryForm");
    const correo = document.getElementById("correo");
    const boton = document.getElementById("btnRecuperar");

    /* Animación del input */
    correo.addEventListener("focus", () => correo.parentElement.classList.add("activo"));
    correo.addEventListener("blur", () => correo.parentElement.classList.remove("activo"));

    /* Enviar formulario */
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = correo.value.trim();

        if (email === "") {
            mostrarToast("Ingresa tu correo electrónico.");
            correo.focus();
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarToast("Correo electrónico no válido.");
            correo.focus();
            return;
        }

        boton.disabled = true;
        boton.innerHTML = `<span class="spinner"></span> Enviando...`;

        try {
            // 🔌 CONEXIÓN AL BACKEND (Descomentar cuando esté lista la ruta)
            /*
            await fetchAuth('/auth/recuperar', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            */

            // ⏳ Simulación de red (Borrar cuando se conecte al backend)
            await new Promise(resolve => setTimeout(resolve, 1500));

            mostrarToast("Se enviaron las instrucciones a tu correo. 📧");
            
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            mostrarToast("❌ " + error.message);
        } finally {
            boton.disabled = false;
            boton.innerHTML = `Enviar código`;
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