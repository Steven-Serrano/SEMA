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

    const listaPacientes = document.getElementById('lista-pacientes');
    const buscador = document.getElementById('buscador-pacientes');
    let pacientesData = [];

    async function cargarPacientes() {
        try {
            // 🔌 AQUÍ CAMBIAMOS LA RUTA: En vez de /chats, pedimos todos los pacientes
            // (Asegúrate de que esta ruta exista en tu backend)
            const usuarios = await fetchAuth('/usuarios/pacientes'); 
            
            // Obtenemos los chats para saber si el paciente ya tiene conversación
            const chats = await fetchAuth('/chats').catch(() => []); 
            
            pacientesData = usuarios.map(u => {
                // Buscar si este usuario ya tiene un chat con el psicólogo
                const chatExistente = chats.find(c => c.usuarioId?._id === u._id);

                return {
                    id: u._id,
                    nombre: u.nombre || 'Paciente',
                    email: u.email || 'Sin correo',
                    chatId: chatExistente ? chatExistente._id : null, // Si no hay chat, es null
                    ultimaActividad: chatExistente ? chatExistente.updatedAt : u.createdAt
                };
            });

            renderizarPacientes(pacientesData);

        } catch (error) {
            listaPacientes.innerHTML = `
                <p class="text-center mt-1" style="color: var(--error);">
                    Error al cargar los pacientes: ${error.message}. <br>
                    <small>Asegúrate de que la ruta /pacientes exista en tu backend.</small>
                </p>
            `;
        }
    }

    function renderizarPacientes(pacientes) {
        if (pacientes.length === 0) {
            listaPacientes.innerHTML = `
                <div class="text-center text-suave mt-1" style="padding: 2rem;">
                    <i class="fi fi-bs-users block mb-1" style="font-size: 3rem; opacity:0.5;"></i>
                    <p>No hay pacientes registrados.</p>
                </div>
            `;
            return;
        }

        listaPacientes.innerHTML = pacientes.map(paciente => {
            const iniciales = paciente.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const fecha = paciente.ultimaActividad 
                ? new Date(paciente.ultimaActividad).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Recién registrado';
            
            // Si tiene chat, muestra el botón de chat. Si no, permite iniciar uno.
            const botonChat = paciente.chatId 
                ? `<a href="chat.html?chat=${paciente.chatId}" class="btn btn-primario btn-sm"><i class="fi fi-bs-comment"></i> Chat</a>`
                : `<a href="chat.html?nuevoChat=${paciente.id}" class="btn btn-primario btn-sm"><i class="fi fi-bs-comment"></i> Iniciar Chat</a>`;

            return `
                <div class="paciente-item">
                    <div class="avatar-grande">${iniciales}</div>
                    <div class="flex-1">
                        <h4>${paciente.nombre}</h4>
                        <p class="text-suave text-sm">${paciente.email}</p>
                        <small class="text-suave">Última actividad: ${fecha}</small>
                    </div>
                    <div class="flex gap-0-5">
                        ${botonChat}
                        <a href="citas-psicologo.html" class="btn btn-secundario btn-sm">
                            <i class="fi fi-bs-calendar"></i> Citas
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

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

    await cargarPacientes();
});