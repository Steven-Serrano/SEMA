/* ============================================================
   SEMA - CITAS PSICÓLOGO (CORREGIDO)
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
    
    if (user.rol !== 'psicologo') {
        window.location.href = "dashboard.html";
        return;
    }

    // ==========================================
    // 2. ACTUALIZAR DATOS DEL USUARIO
    // ==========================================
    const nombreUsuario = document.querySelector('.nombre-usuario');
    const correoUsuario = document.querySelector('.correo-usuario');
    
    if (nombreUsuario) nombreUsuario.textContent = user.nombre;
    if (correoUsuario) correoUsuario.textContent = user.email;

    const listaCitas = document.getElementById('lista-citas-psicologo');
    let filtroActual = 'todas';

    // ==========================================
    // 3. CARGAR CITAS
    // ==========================================
    async function cargarCitas() {
        try {
            const citas = await fetchAuth('/citas');
            
            const citasFiltradas = filtroActual === 'todas' 
                ? citas 
                : citas.filter(c => c.estado === filtroActual);

            const citasOrdenadas = citasFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            if (citasOrdenadas.length === 0) {
                listaCitas.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--texto-secundario);">
                        <p style="font-size: 3rem; margin-bottom: 1rem;">📅</p>
                        <p>No hay citas ${filtroActual === 'todas' ? '' : 'con estado "' + filtroActual + '"'}.</p>
                    </div>
                `;
                return;
            }

            listaCitas.innerHTML = citasOrdenadas.map(cita => {
                const fechaObj = new Date(cita.fecha);
                const dia = fechaObj.getDate();
                const mes = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '').toUpperCase();
                const nombrePaciente = cita.usuarioId?.nombre || 'Paciente';
                const emailPaciente = cita.usuarioId?.email || '';
                
                let badgeClass = 'badge-azul';
                if (cita.estado === 'confirmada') badgeClass = 'badge-verde';
                if (cita.estado === 'cancelada') badgeClass = 'badge-rojo';
                if (cita.estado === 'completada') badgeClass = 'badge-gris';
                
                let acciones = '';
                if (cita.estado === 'pendiente') {
                    acciones = `
                        <button class="btn btn-primario btn-accion" data-cita-id="${cita._id}" data-accion="confirmar" style="margin-right: 0.5rem; padding: 0.5rem 1rem; font-size: 0.85rem;">
                            ✓ Confirmar
                        </button>
                        <button class="btn btn-secundario btn-accion" data-cita-id="${cita._id}" data-accion="cancelar" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                            ✗ Cancelar
                        </button>
                    `;
                } else if (cita.estado === 'confirmada') {
                    acciones = `
                        <button class="btn btn-primario btn-accion" data-cita-id="${cita._id}" data-accion="completar" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                            ✓ Completar
                        </button>
                    `;
                }
                
                return `
                    <div class="cita-item" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--borde); border-radius: 8px;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="cita-fecha">
                                <div class="dia">${dia}</div>
                                <div class="mes">${mes}</div>
                            </div>
                            <div class="cita-info" style="flex: 1;">
                                <h4>${nombrePaciente}</h4>
                                <p style="margin: 0.25rem 0;">${cita.hora} · ${cita.motivo || 'Consulta'}</p>
                                <small style="color: var(--texto-secundario);">${emailPaciente}</small>
                            </div>
                            <span class="badge ${badgeClass}" style="margin-right: 1rem;">
                                ${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                            </span>
                            <div class="cita-acciones">
                                ${acciones}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            listaCitas.innerHTML = `
                <p style="color: var(--error); text-align: center; padding: 2rem;">
                    Error al cargar las citas: ${error.message}
                </p>
            `;
            console.error('Error cargando citas:', error);
        }
    }

    // ==========================================
    // 4. CAMBIAR ESTADO DE CITA (CON DELEGACIÓN DE EVENTOS)
    // ==========================================
    async function cambiarEstadoCita(citaId, accion) {
        const estados = {
            'confirmar': 'confirmada',
            'cancelar': 'cancelada',
            'completar': 'completada'
        };

        const nuevoEstado = estados[accion];
        if (!nuevoEstado) return;

        // Confirmación antes de cambiar
        if (!confirm(`¿Estás seguro de ${accion} esta cita?`)) {
            return;
        }

        try {
            await fetchAuth(`/citas/${citaId}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (typeof mostrarToast === 'function') {
                mostrarToast(`✅ Cita ${nuevoEstado} correctamente`);
            } else {
                alert(`Cita ${nuevoEstado} correctamente`);
            }

            await cargarCitas(); // Recargar lista

        } catch (error) {
            console.error('Error cambiando estado:', error);
            if (typeof mostrarToast === 'function') {
                mostrarToast('❌ Error: ' + error.message);
            } else {
                alert('Error: ' + error.message);
            }
        }
    }

    // ==========================================
    // 5. DELEGACIÓN DE EVENTOS PARA BOTONES (CORREGIDO)
    // ==========================================
    listaCitas.addEventListener('click', async (e) => {
        // Buscar el botón más cercano (por si se hace clic en un ícono dentro del botón)
        const btn = e.target.closest('.btn-accion');
        
        if (btn) {
            const citaId = btn.dataset.citaId;
            const accion = btn.dataset.accion;
            
            console.log('Botón clickeado:', { citaId, accion }); // Debug
            
            await cambiarEstadoCita(citaId, accion);
        }
    });

    // ==========================================
    // 6. FILTROS
    // ==========================================
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-btn').forEach(b => {
                b.classList.remove('activo');
                b.className = 'btn btn-secundario filtro-btn';
            });
            
            btn.classList.remove('btn-secundario');
            btn.classList.add('activo');
            btn.className = 'btn btn-primario filtro-btn activo';
            
            filtroActual = btn.dataset.filtro;
            cargarCitas();
        });
    });

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
    await cargarCitas();
});