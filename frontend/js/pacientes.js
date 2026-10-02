/* ============================================================
   SEMA - PACIENTES (PSICÓLOGO)
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

    const listaPacientes = document.getElementById('lista-pacientes');
    const buscador = document.getElementById('buscador-pacientes');
    let pacientesData = [];

    // ==========================================
    // 3. CARGAR PACIENTES
    // ==========================================
    async function cargarPacientes() {
        try {
            const chats = await fetchAuth('/chats');
            
            // Extraer información única de cada paciente
            pacientesData = chats.map(chat => ({
                id: chat.usuarioId?._id,
                nombre: chat.usuarioId?.nombre || 'Paciente',
                email: chat.usuarioId?.email || '',
                chatId: chat._id,
                ultimaActividad: chat.updatedAt
            }));

            renderizarPacientes(pacientesData);

        } catch (error) {
            listaPacientes.innerHTML = `
                <p style="color: var(--error); text-align: center; padding: 2rem;">
                    Error al cargar los pacientes: ${error.message}
                </p>
            `;
            console.error('Error cargando pacientes:', error);
        }
    }

    // ==========================================
    // 4. RENDERIZAR PACIENTES
    // ==========================================
    function renderizarPacientes(pacientes) {
        if (pacientes.length === 0) {
            listaPacientes.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--texto-secundario);">
                    <p style="font-size: 3rem; margin-bottom: 1rem;">👥</p>
                    <p>No hay pacientes que coincidan con la búsqueda.</p>
                </div>
            `;
            return;
        }

        listaPacientes.innerHTML = pacientes.map(paciente => {
            const iniciales = paciente.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const fecha = new Date(paciente.ultimaActividad).toLocaleDateString('es', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="paciente-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--borde); transition: background 0.2s;">
                    <div class="avatar-grande" style="width: 50px; height: 50px; font-size: 1rem;">
                        ${iniciales}
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.25rem 0;">${paciente.nombre}</h4>
                        <p style="margin: 0; color: var(--texto-secundario); font-size: 0.9rem;">${paciente.email}</p>
                        <small style="color: var(--texto-secundario);">Última actividad: ${fecha}</small>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="chat.html?chat=${paciente.chatId}" class="btn btn-primario" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                            💬 Chat
                        </a>
                        <a href="citas-psicologo.html" class="btn btn-secundario" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                             Citas
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==========================================
    // 5. BUSCADOR
    // ==========================================
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            const pacientesFiltrados = pacientesData.filter(p => 
                p.nombre.toLowerCase().includes(query) || 
                p.email.toLowerCase().includes(query)
            );
            
            renderizarPacientes(pacientesFiltrados);
        });
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
    await cargarPacientes();
});