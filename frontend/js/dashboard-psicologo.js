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

    const saludo = document.getElementById('saludoPsicologo');
    if (saludo) saludo.textContent = `Hola, ${user.nombre}`;

    document.querySelector('.nombre-usuario').textContent = user.nombre;
    document.querySelector('.correo-usuario').textContent = user.email;

    // 🔑 ACTUALIZAR FOTO DESDE EL SERVIDOR
    try {
        const perfil = await fetchAuth('/psicologos/perfil');
        const fotoUsuario = document.querySelector('.foto-usuario');
        if (fotoUsuario && perfil.fotoPerfil) {
            fotoUsuario.src = getImgUrl(perfil.fotoPerfil);
            
            const userActual = Auth.getUser();
            userActual.fotoPerfil = perfil.fotoPerfil;
            Auth.setUser(userActual);
        }
    } catch (error) {
        console.warn('No se pudo actualizar la foto de perfil:', error);
    }

    // ==========================================
    // 1. GESTIÓN DE DISPONIBILIDAD
    // ==========================================
    const formDisponibilidad = document.getElementById('form-disponibilidad');
    const listaDisponibilidad = document.getElementById('lista-disponibilidad');
    const dispFecha = document.getElementById('disp-fecha');
    
    if (dispFecha) {
        // Calculamos la fecha local correctamente para que no falle por la zona horaria
        const ahora = new Date();
        const year = ahora.getFullYear();
        const month = String(ahora.getMonth() + 1).padStart(2, '0');
        const day = String(ahora.getDate()).padStart(2, '0');
        const hoyLocal = `${year}-${month}-${day}`;
        
        dispFecha.setAttribute('min', hoyLocal);
    }

    async function cargarDisponibilidad() {
        try {
            const perfil = await fetchAuth('/psicologos/perfil');
            const bloques = perfil.disponibilidad || [];
            
            bloques.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            if (bloques.length === 0) {
                listaDisponibilidad.innerHTML = '<p class="text-suave" style="grid-column: 1/-1;">No has agregado horarios aún. ¡Agrega tu primer turno!</p>';
                return;
            }

            listaDisponibilidad.innerHTML = bloques.map(b => `
                <div class="tarjeta" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--verde);">
                    <div>
                        <h4 style="margin: 0; color: var(--texto);">${b.fecha}</h4>
                        <p class="text-suave text-sm" style="margin: 0;">De ${b.inicio} a ${b.fin}</p>
                    </div>
                    <button class="btn btn-fantasma" onclick="eliminarBloque('${b._id}')" style="color: var(--rojo);"><i class="fi fi-bs-trash"></i></button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando disponibilidad:', error);
        }
    }

    if (formDisponibilidad) {
        formDisponibilidad.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fecha = document.getElementById('disp-fecha').value;
            const inicio = document.getElementById('disp-inicio').value;
            const fin = document.getElementById('disp-fin').value;

            if (inicio >= fin) return mostrarToast('⚠️ La hora de inicio debe ser menor a la de fin');

            const btn = formDisponibilidad.querySelector('button');
            btn.disabled = true;

            try {
                await fetchAuth('/psicologos/disponibilidad', {
                    method: 'POST',
                    body: JSON.stringify({ fecha, inicio, fin })
                });
                mostrarToast('✅ Turno agregado');
                formDisponibilidad.reset();
                cargarDisponibilidad();
            } catch (error) {
                mostrarToast('❌ Error: ' + error.message);
            } finally {
                btn.disabled = false;
            }
        });
    }

    window.eliminarBloque = async function(id) {
        if (!confirm('¿Eliminar este turno?')) return;
        try {
            await fetchAuth(`/psicologos/disponibilidad/${id}`, { method: 'DELETE' });
            mostrarToast('🗑️ Turno eliminado');
            cargarDisponibilidad();
        } catch (error) {
            mostrarToast('❌ Error al eliminar');
        }
    };

    // ==========================================
    // 2. CARGAR ESTADÍSTICAS
    // ==========================================
    async function cargarEstadisticas() {
        try {
            let totalPacientes = 0;
            try {
                const pacientes = await fetchAuth('/usuarios/pacientes');
                totalPacientes = pacientes.length;
            } catch (e) {
                const chats = await fetchAuth('/chats');
                totalPacientes = chats.length;
            }
            document.getElementById('stat-pacientes').textContent = totalPacientes;

            const citas = await fetchAuth('/citas');
            const ahora = new Date();
            const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
            
            const citasHoy = citas.filter(c => {
                const fechaCita = new Date(c.fecha).toISOString().split('T')[0];
                return fechaCita === hoyStr && c.estado !== 'cancelada';
            });
            document.getElementById('stat-citas-hoy').textContent = citasHoy.length;

            const mesActual = new Date().getMonth();
            const citasMes = citas.filter(c => new Date(c.fecha).getMonth() === mesActual && c.estado !== 'cancelada');
            document.getElementById('stat-citas-mes').textContent = citasMes.length;

            let totalMensajes = 0;
            const chats = await fetchAuth('/chats').catch(() => []);
            if (chats.length > 0) {
                const promesasMensajes = chats.slice(0, 10).map(chat => fetchAuth(`/mensajes/${chat._id}`).catch(() => []));
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
    // 3. CARGAR PRÓXIMAS CITAS
    // ==========================================
    async function cargarCitas() {
        try {
            const citas = await fetchAuth('/citas');
            const proximas = citas
                .filter(c => c.estado !== 'cancelada' && c.estado !== 'completada')
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                .slice(0, 5);

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
    // 4. CARGAR PACIENTES RECIENTES
    // ==========================================
    async function cargarPacientes() {
        try {
            const contenedor = document.getElementById('lista-pacientes');
            let usuarios = [];
            try {
                usuarios = await fetchAuth('/usuarios/pacientes'); 
            } catch (error) {
                const chats = await fetchAuth('/chats');
                usuarios = chats.map(c => c.usuarioId).filter(Boolean);
            }

            const chats = await fetchAuth('/chats').catch(() => []);

            if (usuarios.length === 0) {
                contenedor.innerHTML = '<p class="text-suave">Aún no tienes pacientes.</p>';
                return;
            }

            contenedor.innerHTML = usuarios.slice(0, 5).map(u => {
                const nombre = u.nombre || 'Paciente';
                const email = u.email || '';
                const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const chatExistente = chats.find(c => c.usuarioId?._id === u._id);
                
                const botonChat = chatExistente 
                    ? `<a href="chat.html?chat=${chatExistente._id}" class="btn btn-secundario btn-sm"><i class="fi fi-bs-comment"></i> Chat</a>`
                    : `<a href="chat.html?nuevoChat=${u._id}" class="btn btn-secundario btn-sm"><i class="fi fi-bs-comment"></i> Iniciar</a>`;

                // 🔑 AQUÍ APLICAMOS LA FOTO AL PACIENTE
                const avatarHtml = u.fotoPerfil 
                    ? `<img src="${getImgUrl(u.fotoPerfil)}" class="avatar-grande" style="object-fit: cover;">` 
                    : `<div class="avatar-grande">${iniciales}</div>`;

                return `
                    <div class="paciente-item">
                        ${avatarHtml}
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
        }
    }

    // ==========================================
    // 5. MENÚ Y LOGOUT
    // ==========================================
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

    document.querySelectorAll('.logout-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); Auth.clear(); window.location.href = 'index.html';
        });
    });

    // Inicializar
    await Promise.all([
        cargarDisponibilidad(),
        cargarEstadisticas(),
        cargarCitas(),
        cargarPacientes()
    ]);
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