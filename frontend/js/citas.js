document.addEventListener('DOMContentLoaded', async () => {
    
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const psiSelect = document.getElementById('psi');
    const horaSelect = document.getElementById('hora');
    const formCita = document.getElementById('form-cita');
    const listaCitas = document.getElementById('lista-citas');
    const btnEnviar = document.getElementById('btn-enviar-cita');
    const fechaInput = document.getElementById('fecha');

    const urlParams = new URLSearchParams(window.location.search);
    const psicologoIdPreSeleccionado = urlParams.get('psicologoId');

    let psicologosData = [];

    // 1. CARGAR PSICÓLOGOS
    async function cargarPsicologos() {
        try {
            const psicologos = await fetchAuth('/psicologos');
            psicologosData = psicologos;
            
            psiSelect.innerHTML = '<option value="">Selecciona un profesional...</option>';
            
            psicologos.forEach(p => {
                const option = document.createElement('option');
                option.value = p._id;
                option.textContent = `${p.nombre} - ${p.especialidad}`;
                
                if (p._id === psicologoIdPreSeleccionado) option.selected = true;
                psiSelect.appendChild(option);
            });

            if (psicologoIdPreSeleccionado) actualizarHorasDisponibles();
            
        } catch (error) {
            psiSelect.innerHTML = '<option value="">Error al cargar psicólogos</option>';
        }
    }

    // 2. ACTUALIZAR HORAS DISPONIBLES
    function actualizarHorasDisponibles() {
        const psiId = psiSelect.value;
        const fechaSeleccionada = fechaInput.value;
        
        horaSelect.innerHTML = '<option value="">Selecciona una hora</option>';
        
        if (!psiId || !fechaSeleccionada) {
            horaSelect.disabled = true;
            horaSelect.innerHTML = '<option value="">Elige psicólogo y fecha primero</option>';
            return;
        }

        const psicologo = psicologosData.find(p => p._id === psiId);
        if (!psicologo) return;

        const turnosDelDia = psicologo.disponibilidad?.filter(d => d.fecha === fechaSeleccionada) || [];

        if (turnosDelDia.length === 0) {
            horaSelect.disabled = true;
            horaSelect.innerHTML = '<option value="">No hay disponibilidad este día</option>';
            return;
        }

        horaSelect.disabled = false;
        
        turnosDelDia.forEach(turno => {
            const hInicio = parseInt(turno.inicio.split(':')[0]);
            const hFin = parseInt(turno.fin.split(':')[0]);

            for (let h = hInicio; h < hFin; h++) {
                const horaFormat = h.toString().padStart(2, '0') + ':00';
                const option = document.createElement('option');
                option.value = horaFormat;
                option.textContent = horaFormat;
                horaSelect.appendChild(option);
            }
        });
    }

    psiSelect.addEventListener('change', actualizarHorasDisponibles);
    fechaInput.addEventListener('change', actualizarHorasDisponibles);

    // 3. CARGAR CITAS DEL USUARIO
    async function cargarCitas() {
        try {
            const citas = await fetchAuth('/citas');
            
            if (!citas || citas.length === 0) {
                listaCitas.innerHTML = '<p class="text-suave text-center mt-1">No tienes citas programadas aún.</p>';
                return;
            }
            
            const citasOrdenadas = citas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); 
            
            listaCitas.innerHTML = citasOrdenadas.map(cita => {
                const fechaObj = new Date(cita.fecha);
                const dia = fechaObj.getUTCDate(); 
                const mes = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '');
                const nombrePsicologo = cita.psicologoId?.nombre || 'Psicólogo';
                const especialidad = cita.psicologoId?.especialidad || '';
                
                let badgeClass = 'badge-azul';
                if (cita.estado === 'confirmada') badgeClass = 'badge-verde';
                if (cita.estado === 'cancelada') badgeClass = 'badge-rojo';
                if (cita.estado === 'completada') badgeClass = 'badge-gris';

                // 🔑 LÓGICA DE BOTONES
                let botonAccion = '';
                if (cita.estado === 'pendiente' || cita.estado === 'confirmada') {
                    botonAccion = `
                        <button class="btn btn-secundario btn-sm" onclick="cancelarCita('${cita._id}')" style="color: var(--rojo); border-color: rgba(239,68,68,0.3); font-size: 0.75rem; padding: 0.3rem 0.6rem;">
                            Cancelar
                        </button>
                    `;
                } else {
                    // Botón de ocultar (Soft Delete)
                    botonAccion = `
                        <button class="btn-fantasma" onclick="ocultarCita('${cita._id}')" title="Ocultar de mi vista" style="color: var(--texto-suave); opacity: 0.6; padding: 0.3rem; transition: 0.2s;">
                            <i class="fi fi-bs-trash" style="font-size: 1rem;"></i>
                        </button>
                    `;
                }
                
                return `
                    <div class="cita-item" style="align-items: flex-start;">
                        <div class="cita-fecha">
                            <div class="dia">${dia}</div>
                            <div class="mes">${mes}</div>
                        </div>
                        <div class="cita-info">
                            <h4>${nombrePsicologo}</h4>
                            <p>${cita.hora} · ${cita.motivo || 'Sin motivo especificado'}</p>
                            <small class="text-suave text-sm block mt-0-5">${especialidad}</small>
                        </div>
                        <div class="flex flex-col align-end gap-0-5">
                            <span class="badge ${badgeClass}">
                                ${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                            </span>
                            ${botonAccion}
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            listaCitas.innerHTML = '<p style="color: var(--error); text-align:center; margin-top:1rem;">Error al cargar las citas.</p>';
        }
    }

    // 4. CANCELAR CITA (Cambia estado)
    window.cancelarCita = async function(id) {
        if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;

        try {
            await fetchAuth(`/citas/${id}/cancelar`, { method: 'PUT' });
            mostrarToast('✅ Cita cancelada');
            cargarCitas(); 
        } catch (error) {
            mostrarToast('❌ ' + error.message);
        }
    };

    // 5. OCULTAR CITA (Soft Delete)
    window.ocultarCita = async function(id) {
        if (!confirm('¿Quitar esta cita de tu vista? (El psicólogo conservará el registro)')) return;

        try {
            await fetchAuth(`/citas/${id}/ocultar`, { method: 'PUT' });
            mostrarToast('🗑️ Cita ocultada');
            cargarCitas(); 
        } catch (error) {
            mostrarToast('❌ ' + error.message);
        }
    };

    // 6. ENVIAR NUEVA CITA
    if (formCita) {
        formCita.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const psicologoId = psiSelect.value;
            const fecha = fechaInput.value;
            const hora = horaSelect.value;
            const motivo = document.getElementById('motivo').value.trim();
            
            if (!psicologoId) return mostrarToast('⚠️ Selecciona un profesional');
            if (!fecha || !hora) return mostrarToast('⚠️ Completa la fecha y la hora');
            
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<span class="spinner"></span> Agendando...';
            
            try {
                await fetchAuth('/citas', {
                    method: 'POST',
                    body: JSON.stringify({
                        psicologoId,
                        fecha,
                        hora,
                        motivo: motivo || 'Consulta general'
                    })
                });
                
                mostrarToast('✅ Cita agendada correctamente');
                formCita.reset(); 
                horaSelect.innerHTML = '<option value="">Elige psicólogo y fecha primero</option>';
                horaSelect.disabled = true;
                await cargarCitas(); 
                
            } catch (error) {
                mostrarToast('❌ ' + error.message);
            } finally {
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = 'Confirmar cita';
            }
        });
    }

    // Inicializar
    await cargarPsicologos();
    await cargarCitas();
    
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
    }
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