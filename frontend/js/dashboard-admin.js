/* ============================================================
   SEMA - DASHBOARD ADMINISTRADOR
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 1. VERIFICAR AUTENTICACIÓN Y ROL
    // ==========================================
    if (!Auth || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    
    // Si no es administrador, redirigir
    if (user.rol !== 'administrador') {
        if (user.rol === 'psicologo') {
            window.location.href = "dashboard-psicologo.html";
        } else {
            window.location.href = "dashboard.html";
        }
        return;
    }

    // ==========================================
    // 2. ACTUALIZAR DATOS DEL USUARIO
    // ==========================================
    const saludo = document.getElementById('saludoAdmin');
    if (saludo) saludo.textContent = `Hola, ${user.nombre}`;

    // ==========================================
    // 3. CARGAR ESTADÍSTICAS
    // ==========================================
    async function cargarEstadisticas() {
        try {
            const stats = await fetchAuth('/admin/estadisticas');
            
            document.getElementById('stat-usuarios').textContent = stats.usuarios;
            document.getElementById('stat-psicologos').textContent = stats.psicologos;
            document.getElementById('stat-citas').textContent = stats.citas;
            document.getElementById('stat-chats').textContent = stats.chats;
            
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    // ==========================================
    // 4. CARGAR PSICÓLOGOS PENDIENTES
    // ==========================================
    async function cargarPsicologosPendientes() {
        try {
            const psicologos = await fetchAuth('/admin/psicologos-pendientes');
            const contenedor = document.getElementById('lista-psicologos-pendientes');
            
            if (psicologos.length === 0) {
                contenedor.innerHTML = '<p style="color: var(--texto-secundario);">No hay psicólogos pendientes de aprobación.</p>';
                return;
            }

            contenedor.innerHTML = psicologos.map(p => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--borde); border-radius: 8px; margin-bottom: 0.5rem;">
                    <div>
                        <h4 style="margin: 0;">${p.nombre}</h4>
                        <small style="color: var(--texto-secundario);">${p.email} · ${p.especialidad || 'Sin especialidad'}</small>
                    </div>
                    <button class="btn btn-primario btn-aprobar" data-id="${p._id}" style="padding: 0.5rem 1rem;">
                        ✓ Aprobar
                    </button>
                </div>
            `).join('');

            // Event listeners para aprobar
            document.querySelectorAll('.btn-aprobar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    await aprobarPsicologo(id);
                });
            });

        } catch (error) {
            console.error('Error cargando psicólogos pendientes:', error);
        }
    }

    async function aprobarPsicologo(id) {
        try {
            await fetchAuth(`/admin/psicologos/${id}/aprobar`, {
                method: 'PUT'
            });
            
            mostrarToast('✅ Psicólogo aprobado correctamente');
            await cargarPsicologosPendientes(); // Recargar
            
        } catch (error) {
            mostrarToast(' Error: ' + error.message);
        }
    }

    // ==========================================
    // 5. CARGAR LISTA DE USUARIOS
    // ==========================================
    async function cargarUsuarios() {
        try {
            const usuarios = await fetchAuth('/admin/usuarios');
            const contenedor = document.getElementById('lista-usuarios');
            
            if (usuarios.length === 0) {
                contenedor.innerHTML = '<p style="color: var(--texto-secundario);">No hay usuarios registrados.</p>';
                return;
            }

            contenedor.innerHTML = usuarios.map(u => {
                const fecha = new Date(u.createdAt).toLocaleDateString();
                const badgeColor = u.rol === 'administrador' ? 'badge-azul' : 
                                  u.rol === 'psicologo' ? 'badge-verde' : 'badge-gris';
                
                return `
                    <div class="usuario-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--borde); border-radius: 8px; margin-bottom: 0.5rem;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0;">${u.nombre}</h4>
                            <small style="color: var(--texto-secundario);">${u.email}</small>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span class="badge ${badgeColor}">${u.rol}</span>
                            <small style="color: var(--texto-secundario);">${fecha}</small>
                            <button class="btn btn-secundario btn-eliminar" data-id="${u._id}" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                                🗑 Eliminar
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Event listeners para eliminar
            document.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    await eliminarUsuario(id);
                });
            });

        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    }

    async function eliminarUsuario(id) {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await fetchAuth(`/admin/usuarios/${id}`, {
                method: 'DELETE'
            });
            
            mostrarToast('✅ Usuario eliminado correctamente');
            await cargarUsuarios(); // Recargar
            await cargarEstadisticas(); // Actualizar stats
            
        } catch (error) {
            mostrarToast('❌ Error: ' + error.message);
        }
    }

    // ==========================================
    // 6. BUSCADOR DE USUARIOS
    // ==========================================
    const buscador = document.getElementById('buscador-usuarios');
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.usuario-item');
            
            items.forEach(item => {
                const texto = item.textContent.toLowerCase();
                item.style.display = texto.includes(query) ? 'flex' : 'none';
            });
        });
    }

    // ==========================================
    // 7. MENÚ DESPLEGABLE
    // ==========================================
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.classList.toggle('activo');
            userMenuBtn.classList.toggle('activo');
        });

        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('activo');
                userMenuBtn.classList.remove('activo');
            }
        });
    }

    // ==========================================
    // 8. CERRAR SESIÓN
    // ==========================================
    document.querySelectorAll('a[href="index.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.clear();
            window.location.href = 'index.html';
        });
    });

    // ==========================================
    // 9. INICIALIZAR
    // ==========================================
    await cargarEstadisticas();
    await cargarPsicologosPendientes();
    await cargarUsuarios();
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