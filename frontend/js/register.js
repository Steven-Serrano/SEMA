document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const submitButton = document.getElementById("btnRegister");

  // Animación de inputs
  document.querySelectorAll("input, select").forEach(campo => {
    campo.addEventListener("focus", () => campo.parentElement.classList.add("activo"));
    campo.addEventListener("blur", () => campo.parentElement.classList.remove("activo"));
  });

  // Envío del formulario
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const documento = document.getElementById("documento").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const telefono = document.getElementById("telefono").value.trim();
    const fecha = document.getElementById("fecha").value;
    const genero = document.getElementById("genero").value;
    const ciudad = document.getElementById("ciudad").value.trim();
    const numeroFicha = document.getElementById("numeroFicha").value.trim();
    const programaFormacion = document.getElementById("programaFormacion").value.trim();

    // Validaciones con Focus
    if (!nombre) { document.getElementById("nombre").focus(); return mostrarToast("Ingresa tu nombre"); }
    if (!documento) { document.getElementById("documento").focus(); return mostrarToast("Ingresa tu documento"); }
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { document.getElementById("correo").focus(); return mostrarToast("Correo no válido"); }
    if (!numeroFicha) { document.getElementById("numeroFicha").focus(); return mostrarToast("Ingresa tu número de ficha"); }
    if (!programaFormacion) { document.getElementById("programaFormacion").focus(); return mostrarToast("Ingresa tu programa de formación"); }
    if (password.length < 6) { document.getElementById("password").focus(); return mostrarToast("La contraseña debe tener mínimo 6 caracteres"); }
    if (password !== confirmPassword) { document.getElementById("confirmPassword").focus(); return mostrarToast("Las contraseñas no coinciden"); }

    // Calcular edad
    const edad = fecha ? new Date().getFullYear() - new Date(fecha).getFullYear() : null;

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Creando cuenta...';

    try {
      await fetchAuth('/auth/registro', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          documento,
          email: correo,
          password,
          telefono,
          ciudad,
          fechaNacimiento: fecha,
          genero,
          numeroFicha,
          programaFormacion,
          edad,
          rol: 'usuario'
        })
      });

      mostrarToast("✅ Cuenta creada correctamente. ¡Ahora inicia sesión!");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {
      mostrarToast("❌ " + error.message);
    } finally {
      // Esto asegura que el botón se restaure incluso si hay un error
      submitButton.disabled = false;
      submitButton.innerHTML = 'Crear cuenta';
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