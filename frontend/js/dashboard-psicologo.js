/* ============================================================
   SEMA - DASHBOARD PSICÓLOGO
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
    
    // Si no es psicólogo, redirigir al dashboard normal
    if (user.rol !== 'psicologo') {
        window.location.href = "dashboard.html";
        return;
    }

    // ==========================================
    // 2. ACTUALIZAR DATOS DEL USUARIO
    // ==========================================
    const saludo = document.getElementById('saludoPsicologo');
    if (saludo) saludo.textContent = `Hola, ${user.nombre}`;

    const nombreUsuario = document.querySelector('.nombre-usuario');
    const correoUsuario = document.querySelector('.correo-usuario');
    
    if (nombreUsuario) nombreUsuario.textContent = user.nombre;
    if (correoUsuario) correoUsuario.textContent = user.email;

    // ==========================================
    // 3. CARGAR ESTADÍSTICAS
    // ==========================================
    async function cargarEstadisticas() {
        try {
            // Cargar chats (pacientes)
            const chats = await fetchAuth('/chats');
            document.getElementById('stat-pacientes').textContent = chats.length;

            // Cargar citas
            const citas = await fetchAuth('/citas');
            const hoy = new Date().toISOString().split('T')[0];
            const citasHoy = citas.filter(c => c.fecha.startsWith(hoy));
            document.getElementById('stat-citas-hoy').textContent = citasHoy.length;

            // Citas este mes
            const mesActual = new Date().getMonth();
            const citasMes = citas.filter(c => new Date(c.fecha).getMonth() === mesActual);
            document.getElementById('stat-citas-mes').textContent = citasMes.length;

            // Mensajes (aproximado: contar mensajes en todos los chats)
            let totalMensajes = 0;
            for (const chat of chats) {
                try {
                    const mensajes = await fetchAuth(`/mensajes/${chat._id}`);
                    // Contar solo mensajes del usuario (estudiante)
                    const mensajesRecibidos = mensajes.filter(m => m.emisorModel === 'Usuario');
                    totalMensajes += mensajesRecibidos.length;
                } catch (err) {
                    console.warn('Error cargando mensajes:', err);
                }
            }
            document.getElementById('stat-mensajes').textContent = totalMensajes;

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    // ==========================================
    // 4. CARGAR PRÓXIMAS CITAS
    // ==========================================
    async function cargarCitas() {
        try {
            const citas = await fetchAuth('/citas');
            const proximas = citas
                .filter(c => c.estado !== 'cancelada' && c.estado !== 'completada')
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                .slice(0, 5); // Mostrar solo las 5 más próximas

            const contenedor = document.getElementById('lista-citas-psicologo');
            
            if (proximas.length === 0) {
                contenedor.innerHTML = '<p style="color: var(--texto-secundario);">No tienes citas programadas.</p>';
                return;
            }

            contenedor.innerHTML = proximas.map(cita => {
                const fechaObj = new Date(cita.fecha);
                const dia = fechaObj.getDate();
                const mes = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '');
                const nombrePaciente = cita.usuarioId?.nombre || 'Paciente';
                
                return `
                    <div class="cita-item">
                        <div class="cita-fecha">
                            <div class="dia">${dia}</div>
                            <div class="mes">${mes}</div>
                        </div>
                        <div class="cita-info">
                            <h4>${nombrePaciente}</h4>
                            <p>${cita.hora} · ${cita.motivo || 'Consulta'}</p>
                        </div>
                        <span class="badge badge-${cita.estado === 'confirmada' ? 'verde' : 'azul'}">
                            ${cita.estado}
                        </span>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error cargando citas:', error);
        }
    }

    // ==========================================
    // 5. CARGAR PACIENTES RECIENTES
    // ==========================================
    async function cargarPacientes() {
        try {
            const chats = await fetchAuth('/chats');
            const contenedor = document.getElementById('lista-pacientes');

            if (chats.length === 0) {
                contenedor.innerHTML = '<p style="color: var(--texto-secundario);">Aún no tienes pacientes.</p>';
                return;
            }

            contenedor.innerHTML = chats.slice(0, 5).map(chat => {
                const nombre = chat.usuarioId?.nombre || 'Paciente';
                const email = chat.usuarioId?.email || '';
                const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                return `
                    <div class="paciente-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--borde);">
                        <div class="avatar-grande" style="width: 45px; height: 45px; font-size: 0.9rem;">
                            ${iniciales}
                        </div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.25rem 0;">${nombre}</h4>
                            <small style="color: var(--texto-secundario);">${email}</small>
                        </div>
                        <a href="chat.html?chat=${chat._id}" class="btn btn-secundario" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                            💬 Chat
                        </a>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error cargando pacientes:', error);
        }
    }

    // ==========================================
    // 6. MENÚ DESPLEGABLE
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
    // 7. CERRAR SESIÓN
    // ==========================================
    document.querySelectorAll('a[href="index.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.clear();
            window.location.href = 'index.html';
        });
    });

    // ==========================================
    // 8. INICIALIZAR
    // ==========================================
    await cargarEstadisticas();
    await cargarCitas();
    await cargarPacientes();
});