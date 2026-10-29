document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    const esPsicologo = user.rol === 'psicologo';
    
    // Rutas dinámicas
    const rutaApi = esPsicologo ? '/psicologos/perfil' : '/usuarios/perfil';
    const rutaFoto = esPsicologo ? '/psicologos/subir-foto' : '/usuarios/subir-foto';

    const previewFoto = document.getElementById('previewFoto');
    const inputFoto = document.getElementById('fotoPerfilInput');

    // 🔑 FUNCIÓN CLAVE: Armar la URL completa de la foto
    function obtenerUrlFoto(ruta) {
        if (!ruta) return 'assets/avatar-default.png';
        if (ruta.startsWith('http') || ruta.startsWith('data:')) return ruta;
        
        // Si viene "/uploads/foto.jpg", le pegamos la URL base del servidor
        // API_URL es "http://localhost:3000/api", quitamos el "/api"
        const baseUrl = API_URL.replace('/api', ''); 
        return `${baseUrl}${ruta}`;
    }

    // 1. CARGAR DATOS
    async function cargarDatos() {
        try {
            const perfil = await fetchAuth(rutaApi);
            
            document.getElementById('nombre').value = perfil.nombre || '';
            document.getElementById('documento').value = perfil.documento || '';
            document.getElementById('correo').value = perfil.email || perfil.correo || '';
            document.getElementById('telefono').value = perfil.telefono || '';
            document.getElementById('ciudad').value = perfil.ciudad || '';
            document.getElementById('fechaNacimiento').value = perfil.fechaNacimiento ? new Date(perfil.fechaNacimiento).toISOString().split('T')[0] : '';
            document.getElementById('genero').value = perfil.genero || '';
            document.getElementById('biografia').value = perfil.biografia || '';
            
            if (perfil.fotoPerfil) {
                previewFoto.src = obtenerUrlFoto(perfil.fotoPerfil);
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
            mostrarToast('❌ Error al cargar los datos');
        }
    }

    // 2. GUARDAR INFO
    document.getElementById('guardarPerfil').addEventListener('click', async function() {
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

        if (!datos.nombre || !datos.email) return mostrarToast('⚠️ Nombre y correo obligatorios');

        this.disabled = true;
        this.innerHTML = '<span class="spinner"></span> Guardando...';

        try {
            await fetchAuth(rutaApi, { method: 'PUT', body: JSON.stringify(datos) });
            const userActual = Auth.getUser();
            userActual.nombre = datos.nombre;
            userActual.email = datos.email;
            Auth.setUser(userActual);
            mostrarToast('✅ Información actualizada');
        } catch (error) {
            mostrarToast('❌ ' + error.message);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fi fi-bs-check"></i> Guardar información';
        }
    });

    // 3. PREVISUALIZAR FOTO AL SELECCIONARLA
    if (inputFoto) {
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => previewFoto.src = ev.target.result;
                reader.readAsDataURL(file);
            }
        });
    }

    // 4. SUBIR LA FOTO AL BACKEND
    document.getElementById('guardarFoto').addEventListener('click', async function() {
        const file = inputFoto.files[0];
        if (!file) return mostrarToast('⚠️ Selecciona una imagen primero');
        if (file.size > 5 * 1024 * 1024) return mostrarToast('⚠️ La imagen no debe superar los 5MB');

        const formData = new FormData();
        formData.append('foto', file); // El nombre 'foto' debe coincidir con upload.single('foto')

        this.disabled = true;
        this.innerHTML = '<span class="spinner"></span> Subiendo...';

        try {
            // 🔑 USAMOS FETCH NATIVO (No fetchAuth)
            const response = await fetch(`${API_URL}${rutaFoto}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${Auth.getToken()}` 
                    // ⚠️ NO PONEMOS Content-Type, el navegador lo maneja solo
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al subir la imagen');

            mostrarToast('✅ Foto actualizada correctamente');
            
            if (data.fotoPerfil) {
                const userActual = Auth.getUser();
                userActual.fotoPerfil = data.fotoPerfil;
                Auth.setUser(userActual);
                // Actualizar la imagen en pantalla
                previewFoto.src = obtenerUrlFoto(data.fotoPerfil);
            }
        } catch (error) {
            mostrarToast('❌ ' + error.message);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fi fi-bs-upload"></i> Subir';
        }
    });

    // 5. CAMBIAR CONTRASEÑA
    document.getElementById('guardarPassword').addEventListener('click', async function() {
        const actual = document.getElementById('passwordActual').value;
        const nueva = document.getElementById('passwordNueva').value;
        const confirmar = document.getElementById('passwordConfirmar').value;

        if (!actual || !nueva || !confirmar) return mostrarToast('⚠️ Completa todos los campos');
        if (nueva.length < 6) return mostrarToast('⚠️ Mínimo 6 caracteres');
        if (nueva !== confirmar) return mostrarToast('⚠️ Las contraseñas no coinciden');

        this.disabled = true;
        this.innerHTML = '<span class="spinner"></span> Actualizando...';

        try {
            const rutaPass = esPsicologo ? '/psicologos/cambiar-password' : '/usuarios/cambiar-password';
            await fetchAuth(rutaPass, {
                method: 'PUT',
                body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva })
            });
            mostrarToast('✅ Contraseña actualizada');
            document.getElementById('passwordActual').value = '';
            document.getElementById('passwordNueva').value = '';
            document.getElementById('passwordConfirmar').value = '';
        } catch (error) {
            mostrarToast('❌ ' + error.message);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fi fi-bs-key"></i> Actualizar contraseña';
        }
    });

    // Iniciar
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