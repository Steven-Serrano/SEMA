document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    if (!user) return;

    // 1. ACTUALIZAR DATOS DEL USUARIO
    const saludo = document.getElementById('saludoUsuario');
    if (saludo) {
        const hora = new Date().getHours();
        let saludoTexto = 'Hola';
        if (hora >= 12 && hora < 19) saludoTexto = 'Buenas tardes';
        else if (hora >= 19) saludoTexto = 'Buenas noches';
        saludo.textContent = `${saludoTexto}, ${user.nombre || 'Usuario'}`;
    }

    const nombreUsuario = document.querySelector('.nombre-usuario');
    const correoUsuario = document.querySelector('.correo-usuario');
    if (nombreUsuario) nombreUsuario.textContent = user.nombre || 'Usuario SEMA';
    if (correoUsuario) correoUsuario.textContent = user.email || 'usuario@sema.com';

    // 2. ACTUALIZAR FOTO
    try {
        const perfil = await fetchAuth('/usuarios/perfil');
        const fotoUsuario = document.querySelector('.foto-usuario');
        if (fotoUsuario && perfil.fotoPerfil) {
            fotoUsuario.src = getImgUrl(perfil.fotoPerfil);
        }
    } catch (error) { console.warn('Error foto:', error); }

    // 3. CARGAR PRÓXIMA CITA
    async function cargarProximaCita() {
        const contenedor = document.getElementById('contenedor-cita-dashboard');
        if (!contenedor) return;
        try {
            const citas = await fetchAuth('/citas');
            const proximas = citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada').sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            
            if (proximas.length === 0) {
                contenedor.innerHTML = `<p class="text-suave text-sm text-center" style="margin-top:1rem;">No tienes citas programadas.</p>`;
                return;
            }
            const cita = proximas[0];
            const fechaObj = new Date(cita.fecha);
            const dia = fechaObj.getUTCDate();
            const mes = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '');
            const nombrePsicologo = cita.psicologoId?.nombre || 'Psicólogo';
            
            contenedor.innerHTML = `
                <div class="cita-item" style="margin-bottom: 0; border-left-color: var(--azul);">
                    <div class="cita-fecha">
                        <div class="dia">${dia}</div>
                        <div class="mes">${mes}</div>
                    </div>
                    <div class="cita-info">
                        <h4>${nombrePsicologo}</h4>
                        <p>${cita.hora} · Sesión online</p>
                    </div>
                    <span class="badge badge-${cita.estado === 'confirmada' ? 'verde' : 'azul'}">
                        ${cita.estado}
                    </span>
                </div>
            `;
        } catch (error) { console.error(error); }
    }

    // 4. CARGAR NOTIFICACIONES (Tarjeta grande)
    async function cargarNotificacionesTarjeta() {
        const listaNotif = document.getElementById('lista-notificaciones');
        if (!listaNotif) return;

        try {
            const notificaciones = await fetchAuth('/notificaciones');
            
            if (!notificaciones || notificaciones.length === 0) {
                listaNotif.innerHTML = '<li class="text-center" style="padding:1rem; color:var(--texto-suave); font-size:.9rem">No tienes notificaciones pendientes ✨</li>';
                return;
            }

            listaNotif.innerHTML = notificaciones.slice(0, 3).map(n => `
                <li class="notif-item" id="notif-${n._id}">
                    <div class="notif-content">
                        <i class="fi fi-bs-bell"></i> 
                        <span>${n.titulo}</span>
                        <small style="display:block; color:var(--texto-suave); font-size:0.8rem;">${n.mensaje}</small>
                    </div>
                    <button class="notif-delete" data-id="${n._id}" title="Eliminar">
                        <i class="fi fi-bs-trash"></i>
                    </button>
                </li>
            `).join('');

        } catch (error) {
            console.error('Error notificaciones:', error);
            listaNotif.innerHTML = '<li class="text-center" style="padding:1rem; color:var(--error);">Error al cargar.</li>';
        }
    }

    // Borrar notificación
    const listaNotif = document.getElementById('lista-notificaciones');
    if (listaNotif) {
        listaNotif.addEventListener('click', async (e) => {
            const btnDelete = e.target.closest('.notif-delete');
            if (!btnDelete) return;
            const idNotificacion = btnDelete.dataset.id;
            const item = btnDelete.closest('.notif-item');
            
            item.style.opacity = '0';
            try {
                await fetchAuth(`/notificaciones/${idNotificacion}`, { method: 'DELETE' });
                setTimeout(() => {
                    item.remove();
                    if (listaNotif.children.length === 0) {
                        listaNotif.innerHTML = '<li class="text-center" style="padding:1rem; color:var(--texto-suave); font-size:.9rem">No tienes notificaciones pendientes ✨</li>';
                    }
                }, 300);
                mostrarToast('Notificación eliminada');
            } catch (error) {
                item.style.opacity = '1';
                mostrarToast('Error al eliminar');
            }
        });
    }

    // 5. SELECTOR DE ÁNIMO
    const animoSelector = document.getElementById('animo-selector');
    if (animoSelector) {
        animoSelector.addEventListener('click', async (e) => {
            const btn = e.target.closest('.animo-btn');
            if (!btn) return;
            const estado = btn.dataset.animo;
            document.querySelectorAll('.animo-btn').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            try {
                await fetchAuth('/estados-emocionales', { method: 'POST', body: JSON.stringify({ estado: estado }) });
                mostrarToast(`✅ Ánimo registrado`);
            } catch (error) { mostrarToast('❌ Error'); }
        });
    }

    // 6. MENÚ
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

    // 🔑 7. ESCUCHAR EL EVENTO DE SOCKET.IO PARA ACTUALIZAR LA TARJETA
    document.addEventListener('actualizarNotificaciones', () => {
        console.log("🔄 Actualizando tarjeta de notificaciones...");
        cargarNotificacionesTarjeta();
    });

    // INICIALIZAR
    await cargarProximaCita();
    await cargarNotificacionesTarjeta();
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