document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    if (!user) return;

    // 1. ACTUALIZAR DATOS DEL USUARIO (Desde localStorage)
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

    // 🔑 1.5 ACTUALIZAR FOTO DESDE EL SERVIDOR (Para evitar problemas de caché)
    try {
        const perfil = await fetchAuth('/usuarios/perfil');
        const fotoUsuario = document.querySelector('.foto-usuario');
        if (fotoUsuario && perfil.fotoPerfil) {
            fotoUsuario.src = getImgUrl(perfil.fotoPerfil);
            
            // Actualizamos el localStorage por si acaso
            const userActual = Auth.getUser();
            userActual.fotoPerfil = perfil.fotoPerfil;
            Auth.setUser(userActual);
        }
    } catch (error) {
        console.warn('No se pudo actualizar la foto de perfil:', error);
    }

    // 2. CARGAR PRÓXIMA CITA
    try {
        const citas = await fetchAuth('/citas');
        const proximas = citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada');
        
        if (proximas.length > 0) {
            const cita = proximas[0];
            const fechaObj = new Date(cita.fecha);
            const dia = fechaObj.getUTCDate();
            const mes = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '');
            const nombrePsicologo = cita.psicologoId?.nombre || 'Psicólogo';
            
            const citaItem = document.querySelector('.cita-item');
            if (citaItem) {
                citaItem.querySelector('.cita-fecha').innerHTML = `<div class="dia">${dia}</div><div class="mes">${mes}</div>`;
                citaItem.querySelector('.cita-info').innerHTML = `<h4>${nombrePsicologo}</h4><p>${cita.hora} · Sesión online</p>`;
                const badge = citaItem.querySelector('.badge');
                badge.textContent = cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1);
                badge.className = `badge badge-${cita.estado === 'confirmada' ? 'verde' : 'azul'}`;
            }
        }
    } catch (error) {
        console.warn('No se pudieron cargar las citas:', error.message);
    }

    // 3. CARGAR NOTIFICACIONES
    try {
        const notificaciones = await fetchAuth('/notificaciones');
        const listaNotif = document.getElementById('lista-notificaciones');
        
        if (listaNotif) {
            if (notificaciones.length > 0) {
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
            } else {
                listaNotif.innerHTML = '<li class="text-center" style="padding:1rem; color:var(--texto-suave); font-size:.9rem">No tienes notificaciones pendientes ✨</li>';
            }
        }
    } catch (error) {
        console.warn('No se pudieron cargar las notificaciones:', error.message);
    }

    // 3.1 BORRAR NOTIFICACIONES
    const listaNotif = document.getElementById('lista-notificaciones');
    if (listaNotif) {
        listaNotif.addEventListener('click', async (e) => {
            const btnDelete = e.target.closest('.notif-delete');
            if (!btnDelete) return;

            const idNotificacion = btnDelete.dataset.id;
            const item = btnDelete.closest('.notif-item');
            
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            
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
                item.style.transform = 'translateX(0)';
                mostrarToast('Error al eliminar');
            }
        });
    }

    // 4. SELECTOR DE ÁNIMO
    const animoSelector = document.getElementById('animo-selector');
    if (animoSelector) {
        animoSelector.addEventListener('click', async (e) => {
            const btn = e.target.closest('.animo-btn');
            if (!btn) return;

            const estado = btn.dataset.animo;
            document.querySelectorAll('.animo-btn').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');

            try {
                await fetchAuth('/estados-emocionales', {
                    method: 'POST',
                    body: JSON.stringify({ estado: estado, descripcion: 'Registro desde dashboard' })
                });
                mostrarToast(`✅ Ánimo "${estado}" registrado`);
            } catch (error) {
                mostrarToast('❌ Error al registrar el ánimo');
            }
        });
    }

    // 5. MENÚ DESPLEGABLE
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

    // 6. CERRAR SESIÓN
    document.querySelectorAll('.logout-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.clear();
            window.location.href = 'index.html';
        });
    });
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