document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    const esPsicologo = user.rol === 'psicologo';
    
    // 🔑 LA CLAVE: Elegir la ruta correcta según el rol
    const rutaApi = esPsicologo ? '/psicologos/perfil' : '/usuarios/perfil';

    async function cargarPerfil() {
        try {
            const perfil = await fetchAuth(rutaApi);
            
            document.getElementById('perfilNombre').textContent = perfil.nombre || user.nombre;
            document.getElementById('perfilCorreo').textContent = perfil.email || user.email;
            
            // Usamos getImgUrl para la foto
            if (perfil.fotoPerfil) {
                document.getElementById('previewFoto').src = getImgUrl(perfil.fotoPerfil);
            }

            document.getElementById('doc').textContent = perfil.documento || 'No especificado';
            document.getElementById('tel').textContent = perfil.telefono || 'No especificado';
            document.getElementById('ciudad').textContent = perfil.ciudad || 'No especificado';
            document.getElementById('fecha').textContent = perfil.fechaNacimiento ? new Date(perfil.fechaNacimiento).toLocaleDateString() : 'No especificado';
            document.getElementById('genero').textContent = perfil.genero || 'No especificado';
            document.getElementById('bio').textContent = perfil.biografia || 'Sin biografía';

            if (perfil.createdAt) {
                const fechaRegistro = new Date(perfil.createdAt);
                const hoy = new Date();
                const diferenciaTiempo = hoy.getTime() - fechaRegistro.getTime();
                const dias = Math.floor(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
                document.getElementById('diasSEMA').textContent = dias;
            }

        } catch (error) {
            console.error('Error cargando perfil:', error);
            // Si falla, al menos mostramos lo que tenemos en la sesión
            document.getElementById('perfilNombre').textContent = user.nombre || 'Usuario';
            document.getElementById('perfilCorreo').textContent = user.email || '...';
        }
    }

    async function cargarEstadisticas() {
        try {
            // Para psicólogos, estas estadísticas podrían no existir, así que protegemos el código
            const estados = await fetchAuth('/estados-emocionales').catch(() => []);
            const citas = await fetchAuth('/citas').catch(() => []);
            
            const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
            
            document.getElementById('totalRegistros').textContent = estados.length || 0;
            document.getElementById('totalCitas').textContent = citasCompletadas || 0;
            document.getElementById('totalMensajes').textContent = "0"; 
        } catch (error) {
            console.warn('No se pudieron cargar las estadísticas', error);
        }
    }

    await cargarPerfil();
    await cargarEstadisticas();
});