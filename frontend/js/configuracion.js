/* ============================================================
   SEMA - CONFIGURACIÓN (Completa)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    const previewFoto = document.getElementById('previewFoto');
    const inputFoto = document.getElementById('fotoPerfil');

    // ==========================================
    // 1. CARGAR DATOS ACTUALES
    // ==========================================
    async function cargarDatos() {
        try {
            const perfil = await fetchAuth('/usuarios/perfil');
            
            // Llenar todos los campos
            document.getElementById('nombre').value = perfil.nombre || '';
            document.getElementById('documento').value = perfil.documento || '';
            document.getElementById('correo').value = perfil.email || '';
            document.getElementById('telefono').value = perfil.telefono || '';
            document.getElementById('ciudad').value = perfil.ciudad || '';
            document.getElementById('fechaNacimiento').value = perfil.fechaNacimiento ? new Date(perfil.fechaNacimiento).toISOString().split('T')[0] : '';
            document.getElementById('genero').value = perfil.genero || '';
            document.getElementById('biografia').value = perfil.biografia || '';
            document.getElementById('fotoPerfil').value = perfil.fotoPerfil || '';
            
            if (perfil.fotoPerfil) {
                previewFoto.src = perfil.fotoPerfil;
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
            mostrarToast(' Error al cargar los datos');
        }
    }

    // Preview de foto
    if (inputFoto) {
        inputFoto.addEventListener('input', (e) => {
            previewFoto.src = e.target.value || 'assets/avatar-default.png';
        });
    }

    // ==========================================
    // 2. GUARDAR INFORMACIÓN PERSONAL
    // ==========================================
    const btnGuardarPerfil = document.getElementById('guardarPerfil');
    if (btnGuardarPerfil) {
        btnGuardarPerfil.addEventListener('click', async () => {
            const datos = {
                nombre: document.getElementById('nombre').value.trim(),
                documento: document.getElementById('documento').value.trim(),
                email: document.getElementById('correo').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                ciudad: document.getElementById('ciudad').value.trim(),
                fechaNacimiento: document.getElementById('fechaNacimiento').value,
                genero: document.getElementById('genero').value,
                biografia: document.getElementById('biografia').value.trim()
            };

            if (!datos.nombre || !datos.email) {
                mostrarToast('⚠️ Nombre y correo son obligatorios');
                return;
            }

            btnGuardarPerfil.disabled = true;
            btnGuardarPerfil.innerHTML = '<span class="spinner"></span> Guardando...';

            try {
                await fetchAuth('/usuarios/perfil', {
                    method: 'PUT',
                    body: JSON.stringify(datos)
                });

                // Actualizar localStorage
                const userActual = Auth.getUser();
                userActual.nombre = datos.nombre;
                userActual.email = datos.email;
                Auth.setUser(userActual);

                mostrarToast('✅ Información actualizada correctamente');

            } catch (error) {
                mostrarToast('❌ Error: ' + error.message);
            } finally {
                btnGuardarPerfil.disabled = false;
                btnGuardarPerfil.innerHTML = 'Guardar información';
            }
        });
    }

    // ==========================================
    // 3. GUARDAR FOTO DE PERFIL
    // ==========================================
    const btnGuardarFoto = document.getElementById('guardarFoto');
    if (btnGuardarFoto) {
        btnGuardarFoto.addEventListener('click', async () => {
            const fotoURL = inputFoto.value.trim();

            btnGuardarFoto.disabled = true;
            btnGuardarFoto.innerHTML = '<span class="spinner"></span> Actualizando...';

            try {
                await fetchAuth('/usuarios/perfil', {
                    method: 'PUT',
                    body: JSON.stringify({ fotoPerfil: fotoURL })
                });

                // Actualizar localStorage
                const userActual = Auth.getUser();
                userActual.fotoPerfil = fotoURL;
                Auth.setUser(userActual);

                mostrarToast('✅ Foto actualizada correctamente');
                setTimeout(() => window.location.reload(), 1000);

            } catch (error) {
                mostrarToast('❌ Error: ' + error.message);
            } finally {
                btnGuardarFoto.disabled = false;
                btnGuardarFoto.innerHTML = 'Actualizar foto';
            }
        });
    }

    // ==========================================
    // 4. CAMBIAR CONTRASEÑA
    // ==========================================
    const btnGuardarPassword = document.getElementById('guardarPassword');
    if (btnGuardarPassword) {
        btnGuardarPassword.addEventListener('click', async () => {
            const actual = document.getElementById('passwordActual').value;
            const nueva = document.getElementById('passwordNueva').value;
            const confirmar = document.getElementById('passwordConfirmar').value;

            if (!actual || !nueva || !confirmar) {
                mostrarToast('⚠️ Completa todos los campos');
                return;
            }
            if (nueva.length < 6) {
                mostrarToast('⚠️ Mínimo 6 caracteres');
                return;
            }
            if (nueva !== confirmar) {
                mostrarToast('⚠️ Las contraseñas no coinciden');
                return;
            }

            btnGuardarPassword.disabled = true;
            btnGuardarPassword.innerHTML = '<span class="spinner"></span> Actualizando...';

            try {
                await fetchAuth('/usuarios/cambiar-password', {
                    method: 'PUT',
                    body: JSON.stringify({
                        passwordActual: actual,
                        passwordNueva: nueva
                    })
                });

                mostrarToast('✅ Contraseña actualizada correctamente');
                
                // Limpiar campos
                document.getElementById('passwordActual').value = '';
                document.getElementById('passwordNueva').value = '';
                document.getElementById('passwordConfirmar').value = '';

            } catch (error) {
                mostrarToast(' Error: ' + error.message);
            } finally {
                btnGuardarPassword.disabled = false;
                btnGuardarPassword.innerHTML = 'Actualizar contraseña';
            }
        });
    }

    await cargarDatos();
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

// Subir foto
const fotoInput = document.getElementById('fotoPerfilInput');
const btnGuardarFoto = document.getElementById('guardarFoto');

if (fotoInput) {
  fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewFoto.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

if (btnGuardarFoto) {
  btnGuardarFoto.addEventListener('click', async () => {
    const file = fotoInput.files[0];
    if (!file) {
      mostrarToast('⚠️ Selecciona una imagen primero');
      return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    btnGuardarFoto.disabled = true;
    btnGuardarFoto.innerHTML = '<span class="spinner"></span> Subiendo...';

    try {
      const response = await fetch('http://localhost:3000/api/usuarios/subir-foto', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        mostrarToast('✅ Foto subida correctamente');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        mostrarToast('❌ ' + data.error);
      }
    } catch (error) {
      mostrarToast(' Error al subir la foto');
    } finally {
      btnGuardarFoto.disabled = false;
      btnGuardarFoto.innerHTML = 'Subir foto de perfil';
    }
  });
}   