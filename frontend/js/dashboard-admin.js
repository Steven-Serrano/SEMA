document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICAR AUTENTICACIÓN Y ROL
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "index.html";
        return;
    }

    const user = Auth.getUser();
    const esSuperAdmin = user.rol === 'super_administrador';
    
    if (user.rol !== 'administrador_sena' && !esSuperAdmin) {
        window.location.href = "login.html";
        return;
    }

    // 2. LÓGICA DE PESTAÑAS (TABS)
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.admin-tab-content');
    
    // Mostrar pestaña de administradores solo al Super Admin
    if (esSuperAdmin) {
        const tabBtnAdmins = document.getElementById('tab-btn-admins');
        if (tabBtnAdmins) tabBtnAdmins.style.display = 'flex';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('activo'));
            contents.forEach(c => c.classList.remove('activo'));
            
            tab.classList.add('activo');
            document.getElementById(tab.dataset.target).classList.add('activo');
        });
    });

    // ==========================================
    // 3. CARGAR ESTADÍSTICAS
    // ==========================================
    async function cargarEstadisticas() {
        try {
            const stats = await fetchAuth('/estadisticas');
            document.getElementById('total-usuarios').textContent = stats.usuarios || 0;
            document.getElementById('total-psicologos').textContent = stats.psicologos || 0;
            document.getElementById('total-citas').textContent = stats.citas || 0;
        } catch (error) { 
            console.warn('Error stats:', error); 
        }
    }

    // ==========================================
    // 4. GESTIÓN DE PSICÓLOGOS
    // ==========================================
    async function cargarPsicologos() {
        const contenedor = document.getElementById('lista-psicologos-admin');
        try {
            const psicologos = await fetchAuth('/psicologos');
            
            if (!psicologos || psicologos.length === 0) {
                contenedor.innerHTML = '<p class="text-suave text-center" style="padding: 1rem;">No hay psicólogos registrados.</p>';
                return;
            }

            contenedor.innerHTML = psicologos.slice(0, 5).map(p => `
                <div class="paciente-item" style="padding: 0.8rem 0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <div class="avatar-admin" style="width: 35px; height: 35px; font-size: 0.9rem;">
                            ${p.nombre ? p.nombre.charAt(0) : 'P'}
                        </div>
                        <div>
                            <h4 style="font-size: 0.95rem; margin: 0;">${p.nombre || 'Sin nombre'}</h4>
                            <small class="text-suave" style="font-size: 0.75rem;">${p.especialidad || 'Sin especialidad'}</small>
                        </div>
                    </div>
                    <button class="btn btn-peligro btn-sm" onclick="eliminarPsicologo('${p._id}')" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) { 
            console.error("Error cargando psicólogos:", error);
            contenedor.innerHTML = `<p class="text-center" style="color: var(--error);">Error al cargar la lista.</p>`; 
        }
    }

    window.eliminarPsicologo = async function(id) {
        if (!confirm('⚠️ ¿Eliminar permanentemente a este psicólogo?')) return;
        try {
            await fetchAuth(`/admin/psicologos/${id}`, { method: 'DELETE' });
            if (typeof mostrarToast === 'function') mostrarToast('🗑️ Psicólogo eliminado');
            cargarPsicologos();
        } catch (error) { 
            alert('Error al eliminar: ' + error.message); 
        }
    };

    // ==========================================
    // 5. GESTIÓN DE ESTUDIANTES
    // ==========================================
    let estudiantesData = [];
    
    async function cargarEstudiantes() {
        const contenedor = document.getElementById('lista-estudiantes-admin');
        try {
            const usuarios = await fetchAuth('/usuarios');
            // Filtramos para que solo aparezcan aprendices
            estudiantesData = usuarios.filter(u => u.rol === 'usuario' || !u.rol); 
            renderizarEstudiantes(estudiantesData);
        } catch (error) { 
            console.error("Error cargando estudiantes:", error);
            contenedor.innerHTML = `<p class="text-center" style="color: var(--error);">Error al cargar la lista.</p>`; 
        }
    }

    function renderizarEstudiantes(lista) {
        const contenedor = document.getElementById('lista-estudiantes-admin');
        if (lista.length === 0) {
            contenedor.innerHTML = '<p class="text-suave text-center" style="padding: 1rem;">No hay estudiantes registrados.</p>';
            return;
        }

        contenedor.innerHTML = lista.map(u => {
            const esActivo = u.activo !== false;
            return `
            <div class="paciente-item" style="padding: 1rem 0; align-items: flex-start; border-bottom: 1px solid var(--borde);">
                <div class="avatar-admin" style="width: 40px; height: 40px; font-size: 1rem; background: ${esActivo ? 'var(--azul)' : 'var(--gris-oscuro)'};">
                    ${u.nombre ? u.nombre.charAt(0) : 'U'}
                </div>
                <div class="flex-1" style="padding: 0 1rem;">
                    <h4 style="font-size: 1rem; margin: 0;">${u.nombre || 'Estudiante'}</h4>
                    <small class="text-suave" style="font-size: 0.8rem;">${u.email}</small>
                    <p class="text-suave" style="font-size: 0.8rem; margin: 0.2rem 0 0 0;">
                        <i class="fa-solid fa-id-badge"></i> Ficha: ${u.numeroFicha || 'N/A'} | 
                        <i class="fa-solid fa-graduation-cap"></i> ${u.programaFormacion || 'N/A'}
                    </p>
                    ${!esActivo ? '<span class="badge badge-rojo mt-1">Baneado</span>' : ''}
                </div>
                <div class="flex gap-0-5" style="flex-direction: column;">
                    <button class="btn btn-sm ${esActivo ? 'btn-peligro' : 'btn-primario'}" onclick="cambiarEstadoEstudiante('${u._id}', ${esActivo})">
                        <i class="fa-solid ${esActivo ? 'fa-user-slash' : 'fa-user-check'}"></i> ${esActivo ? 'Banear' : 'Activar'}
                    </button>
                    <button class="btn btn-sm btn-peligro" onclick="eliminarEstudiante('${u._id}')" title="Eliminar permanentemente">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `}).join('');
    }

    window.cambiarEstadoEstudiante = async function(id, estadoActual) {
        const nuevoEstado = !estadoActual;
        if (!confirm(`¿Estás seguro de ${nuevoEstado ? 'activar' : 'banear'} a este estudiante?`)) return;
        try {
            await fetchAuth(`/admin/usuarios/${id}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ activo: nuevoEstado })
            });
            if (typeof mostrarToast === 'function') mostrarToast(`✅ Estudiante ${nuevoEstado ? 'activado' : 'baneado'}`);
            cargarEstudiantes();
        } catch (error) { 
            alert('Error al cambiar estado: ' + error.message); 
        }
    };

    window.eliminarEstudiante = async function(id) {
        if (!confirm('⚠️ ¿Estás seguro de ELIMINAR a este estudiante? Se borrarán todos sus datos permanentemente.')) return;
        try {
            await fetchAuth(`/admin/usuarios/${id}`, { method: 'DELETE' });
            if (typeof mostrarToast === 'function') mostrarToast('🗑️ Estudiante eliminado');
            cargarEstudiantes();
        } catch (error) { 
            alert('Error al eliminar: ' + error.message); 
        }
    };

    const buscadorEst = document.getElementById('buscador-estudiantes');
    if (buscadorEst) {
        buscadorEst.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtrados = estudiantesData.filter(u => 
                (u.nombre || '').toLowerCase().includes(query) ||
                (u.email || '').toLowerCase().includes(query) ||
                (u.numeroFicha || '').toLowerCase().includes(query)
            );
            renderizarEstudiantes(filtrados);
        });
    }

    // ==========================================
    // 6. GESTIÓN DE ADMINISTRADORES (Solo Super Admin)
    // ==========================================
    async function cargarAdminsSena() {
        if (!esSuperAdmin) return;
        const contenedor = document.getElementById('lista-admins-sena');
        try {
            const admins = await fetchAuth('/admin/admins-sena');
            
            if (!admins || admins.length === 0) {
                contenedor.innerHTML = '<p class="text-suave text-center" style="padding: 1rem;">No hay administradores registrados.</p>';
                return;
            }

            contenedor.innerHTML = admins.map(a => `
                <div class="paciente-item" style="padding: 0.8rem 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--borde);">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <div class="avatar-admin" style="width: 35px; height: 35px; font-size: 0.9rem;">${a.nombre.charAt(0)}</div>
                        <div>
                            <h4 style="font-size: 0.95rem; margin: 0;">${a.nombre}</h4>
                            <small class="text-suave" style="font-size: 0.75rem;">${a.email}</small>
                        </div>
                    </div>
                    <button class="btn btn-peligro btn-sm" onclick="eliminarAdminSena('${a._id}')" title="Eliminar Administrador">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) { 
            console.error("Error cargando admins:", error);
            contenedor.innerHTML = `<p class="text-center" style="color: var(--error);">Error al cargar la lista.</p>`;
        }
    }

    window.eliminarAdminSena = async function(id) {
        if (!confirm('⚠️ ¿Estás seguro de eliminar a este Administrador del SENA?')) return;
        try {
            await fetchAuth(`/admin/admins-sena/${id}`, { method: 'DELETE' });
            if (typeof mostrarToast === 'function') mostrarToast('🗑️ Administrador eliminado');
            cargarAdminsSena();
        } catch (error) { 
            alert('Error al eliminar: ' + error.message); 
        }
    };

    // ==========================================
    // 7. FORMULARIOS DE CREACIÓN
    // ==========================================
    const formPsi = document.getElementById('form-crear-psicologo');
    if (formPsi) {
        formPsi.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnCrearPsi');
            const textoOriginal = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Creando...';
            
            try {
                await fetchAuth('/admin/crear-psicologo', {
                    method: 'POST',
                    body: JSON.stringify({
                        nombre: document.getElementById('psi-nombre').value,
                        email: document.getElementById('psi-email').value,
                        password: document.getElementById('psi-password').value,
                        especialidad: document.getElementById('psi-especialidad').value,
                        telefono: document.getElementById('psi-telefono').value
                    })
                });
                if (typeof mostrarToast === 'function') mostrarToast('✅ Psicólogo creado');
                formPsi.reset(); 
                cargarPsicologos();
            } catch (error) { 
                alert(error.message); 
            } finally { 
                btn.disabled = false; 
                btn.innerHTML = textoOriginal;
            }
        });
    }

    const formAdmin = document.getElementById('form-crear-admin-sena');
    if (formAdmin && esSuperAdmin) {
        formAdmin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnCrearAdmin');
            const textoOriginal = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Creando...';
            
            try {
                await fetchAuth('/admin/crear-admin-sena', {
                    method: 'POST',
                    body: JSON.stringify({
                        nombre: document.getElementById('admin-nombre').value,
                        email: document.getElementById('admin-email').value,
                        password: document.getElementById('admin-password').value,
                        ficha: document.getElementById('admin-ficha').value,
                        centro: document.getElementById('admin-centro').value
                    })
                });
                if (typeof mostrarToast === 'function') mostrarToast('✅ Administrador creado');
                formAdmin.reset(); 
                cargarAdminsSena();
            } catch (error) { 
                alert(error.message); 
            } finally { 
                btn.disabled = false; 
                btn.innerHTML = textoOriginal;
            }
        });
    }

    // ==========================================
    // 8. CERRAR SESIÓN
    // ==========================================
    document.querySelectorAll('.logout-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            Auth.clear(); 
            window.location.href = 'index.html';
        });
    });

    // ==========================================
    // 9. INICIALIZAR TODO
    // ==========================================
    await cargarEstadisticas();
    await cargarPsicologos();
    await cargarEstudiantes();
    await cargarAdminsSena();
});