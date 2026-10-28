/* ============================================================
   SEMA - DASHBOARD PSICÓLOGO (Actualizado: Todos los pacientes)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 1. VERIFICAR AUTENTICACIÓN Y ROL
    // ==========================================
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
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
            // Intentamos obtener todos los pacientes
            let totalPacientes = 0;
            try {
                const pacientes = await fetchAuth('/usuarios/pacientes');
                totalPacientes = pacientes.length;
            } catch (e) {
                // Fallback: Si falla /pacientes, contamos los chats
                const chats = await fetchAuth('/chats');
                totalPacientes = chats.length;
            }
            document.getElementById('stat-pacientes').textContent = totalPacientes;

            // Cargar citas
            const citas = await fetchAuth('/citas');
            const hoyStr = new Date().toISOString().split('T')[0];
            
            const citasHoy = citas.filter(c => {
                const fechaCita = new Date(c.fecha).toISOString().split('T')[0];
                return fechaCita === hoyStr && c.estado !== 'cancelada';
            });
            document.getElementById('stat-citas-hoy').textContent = citasHoy.length;

            // Citas este mes
            const mesActual = new Date().getMonth();
            const citasMes = citas.filter(c => 
                new Date(c.fecha).getMonth() === mesActual && c.estado !== 'cancelada'
            );
            document.getElementById('stat-citas-mes').textContent = citasMes.length;

            // Mensajes recibidos (Optimizado con Promise.all)
            let totalMensajes = 0;
            const chats = await fetchAuth('/chats').catch(() => []);
            
            if (chats.length > 0) {
                // Limitamos a los primeros 10 para no colapsar el servidor
                const promesasMensajes = chats.slice(0, 10).map(chat => 
                    fetchAuth(`/mensajes/${chat._id}`).catch(() => [])
                );
                const resultados = await Promise.all(promesasMensajes);
                
                resultados.forEach(mensajes => {
                    totalMensajes += mensajes.filter(m => m.emisorModel === 'Usuario').length;
                });
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
                contenedor.innerHTML = '<p class="text-suave">No tienes citas programadas.</p>';
                return;
            }

            contenedor.innerHTML = proximas.map(cita => {
                const fechaObj = new Date(cita.fecha);
                const dia = fechaObj.getUTCDate();
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
            const contenedor = document.getElementById('lista-pacientes');
            
            // 1. Intentar traer a TODOS los pacientes
            let usuarios = [];
            try {
                usuarios = await fetchAuth('/usuarios/pacientes'); 
            } catch (error) {
                // Si el backend no tiene la ruta /pacientes, usamos los chats
                console.warn('Ruta /pacientes no encontrada, usando chats...');
                const chats = await fetchAuth('/chats');
                usuarios = chats.map(c => c.usuarioId).filter(Boolean);
            }

            // 2. Traer los chats para saber si ya hay conversación
            const chats = await fetchAuth('/chats').catch(() => []);

            if (usuarios.length === 0) {
                contenedor.innerHTML = '<p class="text-suave">Aún no tienes pacientes.</p>';
                return;
            }

            // 3. Renderizar los primeros 5
            contenedor.innerHTML = usuarios.slice(0, 5).map(u => {
                const nombre = u.nombre || 'Paciente';
                const email = u.email || '';
                const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                // Buscar si este usuario ya tiene un chat
                const chatExistente = chats.find(c => c.usuarioId?._id === u._id);
                
                // Si hay chat, botón de ir al chat. Si no, botón para iniciarlo
                const botonChat = chatExistente 
                    ? `<a href="chat.html?chat=${chatExistente._id}" class="btn btn-secundario btn-sm"><i class="fi fi-bs-comment"></i> Chat</a>`
                    : `<a href="chat.html?nuevoChat=${u._id}" class="btn btn-secundario btn-sm"><i class="fi fi-bs-comment"></i> Iniciar</a>`;

                return `
                    <div class="paciente-item">
                        <div class="avatar-grande">${iniciales}</div>
                        <div class="flex-1">
                            <h4>${nombre}</h4>
                            <small class="text-suave">${email}</small>
                        </div>
                        ${botonChat}
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error cargando pacientes:', error);
            document.getElementById('lista-pacientes').innerHTML = '<p class="text-suave">Error al cargar pacientes.</p>';
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
    // 8. INICIALIZAR (Cargar todo en paralelo)
    // ==========================================
    await Promise.all([
        cargarEstadisticas(),
        cargarCitas(),
        cargarPacientes()
    ]);
});