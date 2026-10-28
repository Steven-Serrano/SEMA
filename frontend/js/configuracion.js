document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    // 🔑 RUTA DINÁMICA SEGÚN EL ROL
    const rutaApi = user.rol === 'psicologo' ? '/psicologos/perfil' : '/usuarios/perfil';

    const previewFoto = document.getElementById('previewFoto');
    const inputFoto = document.getElementById('fotoPerfilInput');

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
            
            if (perfil.fotoPerfil) previewFoto.src = perfil.fotoPerfil;
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

    // 3. FOTO
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

    document.getElementById('guardarFoto').addEventListener('click', async function() {
        const file = inputFoto.files[0];
        if (!file) return mostrarToast('⚠️ Selecciona una imagen');
        if (file.size > 5 * 1024 * 1024) return mostrarToast('⚠️ Máximo 5MB');

        const formData = new FormData();
        formData.append('foto', file);

        this.disabled = true;
        this.innerHTML = '<span class="spinner"></span>';

        try {
            const rutaFoto = user.rol === 'psicologo' ? '/psicologos/subir-foto' : '/usuarios/subir-foto';
            const response = await fetch(`${API_URL}${rutaFoto}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            mostrarToast('✅ Foto actualizada');
            if (data.fotoPerfil) {
                const userActual = Auth.getUser();
                userActual.fotoPerfil = data.fotoPerfil;
                Auth.setUser(userActual);
            }
        } catch (error) {
            mostrarToast('❌ ' + error.message);
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fi fi-bs-upload"></i> Subir';
        }
    });

    // 4. CONTRASEÑA
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
            const rutaPass = user.rol === 'psicologo' ? '/psicologos/cambiar-password' : '/usuarios/cambiar-password';
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