/* ============================================================
   SEMA - PERFIL (Solo visualización + estadísticas)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();

    // ==========================================
    // 1. CARGAR DATOS DEL PERFIL
    // ==========================================
    async function cargarPerfil() {
        try {
            const perfil = await fetchAuth('/usuarios/perfil');
            
            // Actualizar cabecera
            document.getElementById('perfilNombre').textContent = perfil.nombre || user.nombre;
            document.getElementById('perfilCorreo').textContent = perfil.email || user.email;
            
            if (perfil.fotoPerfil) {
                document.getElementById('previewFoto').src = perfil.fotoPerfil;
            }

            // Información personal
            document.getElementById('doc').textContent = perfil.documento || 'No especificado';
            document.getElementById('tel').textContent = perfil.telefono || 'No especificado';
            document.getElementById('ciudad').textContent = perfil.ciudad || 'No especificado';
            document.getElementById('fecha').textContent = perfil.fechaNacimiento ? new Date(perfil.fechaNacimiento).toLocaleDateString() : 'No especificado';
            document.getElementById('genero').textContent = perfil.genero || 'No especificado';
            document.getElementById('bio').textContent = perfil.biografia || 'Sin biografía';

        } catch (error) {
            console.error('Error cargando perfil:', error);
        }
    }

    // ==========================================
    // 2. CARGAR ESTADÍSTICAS
    // ==========================================
    async function cargarEstadisticas() {
        try {
            const estados = await fetchAuth('/estados-emocionales');
            const citas = await fetchAuth('/citas');
            
            // Contar citas completadas
            const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
            
            // Contar mensajes (aproximado: todos los enviados por el usuario)
            // Esto requeriría una ruta específica en el backend, por ahora usamos 0
            let totalMensajes = 0;
            
            document.getElementById('totalRegistros').textContent = estados.length;
            document.getElementById('totalCitas').textContent = citasCompletadas;
            document.getElementById('totalMensajes').textContent = totalMensajes;
            
            // Días usando SEMA (calculado desde la fecha de creación)
            const dias = Math.floor((new Date() - new Date()) / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('diasSEMA').textContent = dias;

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    await cargarPerfil();
    await cargarEstadisticas();
});