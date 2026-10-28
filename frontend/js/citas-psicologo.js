document.addEventListener('DOMContentLoaded', async () => {
    
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    if (user.rol !== 'psicologo') {
        window.location.href = "dashboard.html";
        return;
    }

    document.querySelector('.nombre-usuario').textContent = user.nombre;
    document.querySelector('.correo-usuario').textContent = user.email;

    const listaCitas = document.getElementById('lista-citas-psicologo');
    let filtroActual = 'todas';

    async function cargarCitas() {
        try {
            const citas = await fetchAuth('/citas');
            
            const citasFiltradas = filtroActual === 'todas' 
                ? citas 
                : citas.filter(c => c.estado === filtroActual);

            const citasOrdenadas = citasFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            if (citasOrdenadas.length === 0) {
                listaCitas.innerHTML = `
                    <div class="text-center text-suave mt-1" style="padding: 2rem;">
                        <i class="fi fi-bs-calendar block mb-1" style="font-size: 3rem; opacity:0.5;"></i>
                        <p>No hay citas ${filtroActual === 'todas' ? '' : 'con estado "' + filtroActual + '".'}</p>
                    </div>
                `;
                return;
            }

            listaCitas.innerHTML = citasOrdenadas.map(cita => {
                const fechaObj = new Date(cita.fecha);
                const dia = fechaObj.getUTCDate();
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
                        <button class="btn btn-primario btn-sm btn-accion" data-cita-id="${cita._id}" data-accion="confirmar">
                            <i class="fi fi-bs-check"></i> Confirmar
                        </button>
                        <button class="btn btn-secundario btn-sm btn-accion" data-cita-id="${cita._id}" data-accion="cancelar">
                            <i class="fi fi-bs-cross"></i> Cancelar
                        </button>
                    `;
                } else if (cita.estado === 'confirmada') {
                    acciones = `
                        <button class="btn btn-primario btn-sm btn-accion" data-cita-id="${cita._id}" data-accion="completar">
                            <i class="fi fi-bs-check"></i> Completar
                        </button>
                    `;
                }
                
                return `
                    <div class="cita-item">
                        <div class="cita-fecha">
                            <div class="dia">${dia}</div>
                            <div class="mes">${mes}</div>
                        </div>
                        <div class="cita-info">
                            <h4>${nombrePaciente}</h4>
                            <p>${cita.hora} · ${cita.motivo || 'Consulta'}</p>
                            <small class="text-suave text-sm">${emailPaciente}</small>
                        </div>
                        <span class="badge ${badgeClass}">
                            ${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                        </span>
                        <div class="cita-acciones">
                            ${acciones}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            listaCitas.innerHTML = `
                <p class="text-center mt-1" style="color: var(--error);">
                    Error al cargar las citas: ${error.message}
                </p>
            `;
        }
    }

    async function cambiarEstadoCita(citaId, accion) {
        const estados = { 'confirmar': 'confirmada', 'cancelar': 'cancelada', 'completar': 'completada' };
        const nuevoEstado = estados[accion];
        if (!nuevoEstado) return;

        if (!confirm(`¿Estás seguro de ${accion} esta cita?`)) return;

        try {
            await fetchAuth(`/citas/${citaId}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (typeof mostrarToast === 'function') mostrarToast(`✅ Cita ${nuevoEstado}`);
            await cargarCitas();

        } catch (error) {
            if (typeof mostrarToast === 'function') mostrarToast('❌ Error: ' + error.message);
        }
    }

    listaCitas.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-accion');
        if (btn) {
            await cambiarEstadoCita(btn.dataset.citaId, btn.dataset.accion);
        }
    });

    // Filtros mejorados (sin mezclar clases incorrectamente)
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Resetear todos
            document.querySelectorAll('.filtro-btn').forEach(b => {
                b.classList.remove('activo', 'btn-primario');
                b.classList.add('btn-secundario');
            });
            // Activar el clickeado
            btn.classList.remove('btn-secundario');
            btn.classList.add('activo', 'btn-primario');
            
            filtroActual = btn.dataset.filtro;
            cargarCitas();
        });
    });

    // MENÚ Y LOGOUT
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
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
    document.querySelectorAll('a[href="index.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); Auth.clear(); window.location.href = 'index.html';
        });
    });

    await cargarCitas();
});