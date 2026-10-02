/* ============================================================
   SEMA - CITAS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 1. VERIFICAR AUTENTICACIÓN
    // ==========================================
    if (!Auth || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const psiSelect = document.getElementById('psi');
    const formCita = document.getElementById('form-cita');
    const listaCitas = document.getElementById('lista-citas');
    const btnEnviar = document.getElementById('btn-enviar-cita');
    const fechaInput = document.getElementById('fecha');

    // ==========================================
    // 2. CARGAR PSICÓLOGOS REALES EN EL SELECT
    // ==========================================
    async function cargarPsicologos() {
        try {
            const psicologos = await fetchAuth('/psicologos');
            
            psiSelect.innerHTML = '<option value="">Selecciona un profesional...</option>';
            
            psicologos.forEach(p => {
                const option = document.createElement('option');
                option.value = p._id;
                option.textContent = `${p.nombre} - ${p.especialidad}`;
                psiSelect.appendChild(option);
            });
            
        } catch (error) {
            psiSelect.innerHTML = '<option value="">Error al cargar psicólogos</option>';
            console.error('Error cargando psicólogos:', error);
        }
    }

    // ==========================================
    // 3. CARGAR CITAS DEL USUARIO
    // ==========================================
    async function cargarCitas() {
        try {
            const citas = await fetchAuth('/citas');
            
            if (!citas || citas.length === 0) {
                listaCitas.innerHTML = '<p style="color: var(--texto-secundario, #64748b);">No tienes citas programadas.</p>';
                return;
            }
            
            // Ordenar por fecha (más próximas primero)
            const citasOrdenadas = citas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            
            listaCitas.innerHTML = citasOrdenadas.map(cita => {
                const fechaObj = new Date(cita.fecha);
                const dia = fechaObj.getDate();
                const mes = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '');
                const nombrePsicologo = cita.psicologoId?.nombre || 'Psicólogo';
                const especialidad = cita.psicologoId?.especialidad || '';
                
                // Color del badge según estado
                let badgeClass = 'badge-azul';
                if (cita.estado === 'confirmada') badgeClass = 'badge-verde';
                if (cita.estado === 'cancelada') badgeClass = 'badge-rojo';
                
                return `
                    <div class="cita-item">
                        <div class="cita-fecha">
                            <div class="dia">${dia}</div>
                            <div class="mes">${mes}</div>
                        </div>
                        <div class="cita-info">
                            <h4>${nombrePsicologo}</h4>
                            <p>${cita.hora} · ${cita.motivo || 'Sin motivo especificado'}</p>
                            <small style="color: var(--texto-secundario, #64748b); display: block; margin-top: 4px;">${especialidad}</small>
                        </div>
                        <span class="badge ${badgeClass}">
                            ${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                        </span>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            listaCitas.innerHTML = '<p style="color: var(--error, #ef4444);">Error al cargar las citas.</p>';
            console.error('Error cargando citas:', error);
        }
    }

    // ==========================================
    // 4. ENVIAR NUEVA CITA AL BACKEND
    // ==========================================
    if (formCita) {
        formCita.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const psicologoId = psiSelect.value;
            const fecha = fechaInput.value;
            const hora = document.getElementById('hora').value;
            const motivo = document.getElementById('motivo').value.trim();
            
            // Validaciones básicas
            if (!psicologoId) {
                if (typeof mostrarToast === 'function') mostrarToast('⚠️ Selecciona un profesional');
                return;
            }
            
            if (!fecha || !hora) {
                if (typeof mostrarToast === 'function') mostrarToast('⚠️ Completa la fecha y la hora');
                return;
            }
            
            // Estado de carga en el botón
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
                
                if (typeof mostrarToast === 'function') {
                    mostrarToast('✅ Cita agendada correctamente');
                }
                
                formCita.reset();
                await cargarCitas(); // Recargar la lista de citas
                
            } catch (error) {
                if (typeof mostrarToast === 'function') {
                    mostrarToast('❌ ' + error.message);
                }
            } finally {
                // Restaurar el botón
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = 'Confirmar cita';
            }
        });
    }

    // ==========================================
    // 5. INICIALIZAR
    // ==========================================
    await cargarPsicologos();
    await cargarCitas();
    
    // Establecer fecha mínima (hoy) en el input de fecha para evitar citas en el pasado
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', hoy);
    }
});