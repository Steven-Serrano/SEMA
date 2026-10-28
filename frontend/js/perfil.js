/* ============================================================
   SEMA - PERFIL (Solo visualización + estadísticas)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
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
            
            document.getElementById('perfilNombre').textContent = perfil.nombre || user.nombre;
            document.getElementById('perfilCorreo').textContent = perfil.email || user.email;
            
            if (perfil.fotoPerfil) {
                document.getElementById('previewFoto').src = perfil.fotoPerfil;
            }

            document.getElementById('doc').textContent = perfil.documento || 'No especificado';
            document.getElementById('tel').textContent = perfil.telefono || 'No especificado';
            document.getElementById('ciudad').textContent = perfil.ciudad || 'No especificado';
            document.getElementById('fecha').textContent = perfil.fechaNacimiento ? new Date(perfil.fechaNacimiento).toLocaleDateString() : 'No especificado';
            document.getElementById('genero').textContent = perfil.genero || 'No especificado';
            document.getElementById('bio').textContent = perfil.biografia || 'Sin biografía';

            // Calcular días usando SEMA (asumiendo que el backend envía createdAt)
            if (perfil.createdAt) {
                const fechaRegistro = new Date(perfil.createdAt);
                const hoy = new Date();
                const diferenciaTiempo = hoy.getTime() - fechaRegistro.getTime();
                const dias = Math.floor(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
                document.getElementById('diasSEMA').textContent = dias;
            }

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
            
            const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
            
            document.getElementById('totalRegistros').textContent = estados.length || 0;
            document.getElementById('totalCitas').textContent = citasCompletadas || 0;
            // Nota: Para mensajes, necesitarías un endpoint en el backend que te diga el total
            document.getElementById('totalMensajes').textContent = "0"; 

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    await cargarPerfil();
    await cargarEstadisticas();
});