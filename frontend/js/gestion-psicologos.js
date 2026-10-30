document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Autenticación
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "index.html";
        return;
    }

    const user = Auth.getUser();
    if (user.rol !== 'administrador_sena' && user.rol !== 'super_administrador') {
        window.location.href = "login.html";
        return;
    }

    const contenedor = document.getElementById('lista-gestion-psicologos');
    const buscador = document.getElementById('buscador-psi');
    let psicologosData = [];

    // Función auxiliar para mostrar alertas
    function toast(msg) {
        if (typeof mostrarToast === 'function') return mostrarToast(msg);
        if (window.SEMA && window.SEMA.toast) return window.SEMA.toast(msg);
        alert(msg);
    }

    // 2. Cargar Psicólogos desde el backend
    async function cargarPsicologos() {
        try {
            const psicologos = await fetchAuth('/psicologos');
            psicologosData = psicologos;
            renderizar(psicologosData);
        } catch (error) {
            console.error('Error cargando psicólogos:', error);
            contenedor.innerHTML = '<p class="text-center" style="color: var(--error); grid-column: 1/-1;">Error al cargar la lista de profesionales.</p>';
        }
    }

    // 3. Renderizar las tarjetas HTML
    function renderizar(lista) {
        if (lista.length === 0) {
            contenedor.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: 3rem;">
                    <i class="fa-solid fa-user-slash" style="font-size: 3rem; color: var(--borde); margin-bottom: 1rem;"></i>
                    <p class="text-suave">No se encontraron psicólogos.</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = lista.map(psi => {
            const inicial = psi.nombre ? psi.nombre.charAt(0).toUpperCase() : 'P';
            const esActivo = psi.estado === 'activo';
            
            return `
                <div class="admin-card-psi">
                    <div class="admin-card-psi__header">
                        <div class="avatar-admin">${inicial}</div>
                        <div class="admin-card-psi__info">
                            <h4>${psi.nombre || 'Psicólogo sin nombre'}</h4>
                            <span class="especialidad-tag">${psi.especialidad || 'General'}</span>
                        </div>
                        <div class="estado-indicador ${esActivo ? 'activo' : 'inactivo'}" title="${esActivo ? 'Activo' : 'Inactivo'}"></div>
                    </div>
                    
                    <div class="admin-card-psi__body">
                        <p><i class="fa-solid fa-envelope"></i> ${psi.email}</p>
                        <p><i class="fa-solid fa-phone"></i> ${psi.telefono || 'Sin teléfono'}</p>
                    </div>

                    <div class="admin-card-psi__footer">
                        <button class="btn ${esActivo ? 'btn-peligro' : 'btn-primario'} btn-sm" onclick="cambiarEstadoPsi('${psi._id}', '${psi.estado}')" style="width: 100%;">
                            <i class="fa-solid ${esActivo ? 'fa-user-slash' : 'fa-user-check'}"></i> 
                            ${esActivo ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. Cambiar el estado del psicólogo (Activar / Desactivar)
    window.cambiarEstadoPsi = async function(id, estadoActual) {
        const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
        const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
        
        if (!confirm(`¿Estás seguro de que deseas ${accion} la cuenta de este psicólogo?`)) return;

        try {
            await fetchAuth(`/admin/psicologos/${id}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ estado: nuevoEstado })
            });
            toast(`✅ Psicólogo ${nuevoEstado}`);
            cargarPsicologos(); // Recargar la lista para ver el cambio
        } catch (error) {
            console.error(error);
            toast('❌ Error al cambiar el estado del psicólogo');
        }
    };

    // 5. Filtro del Buscador
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            const filtrados = psicologosData.filter(p => 
                (p.nombre || '').toLowerCase().includes(query) || 
                (p.especialidad || '').toLowerCase().includes(query) ||
                (p.email || '').toLowerCase().includes(query)
            );
            renderizar(filtrados);
        });
    }

    // 6. Cerrar Sesión
    document.querySelectorAll('.logout-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            Auth.clear(); 
            window.location.href = 'index.html';
        });
    });

    // Iniciar
    await cargarPsicologos();
});