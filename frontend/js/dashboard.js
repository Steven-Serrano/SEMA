/* ============================================================
   SEMA - DASHBOARD ESTUDIANTE (CORREGIDO)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // VERIFICAR SI ES ADMINISTRADOR
    // ==========================================
    const user = Auth ? Auth.getUser() : null;

    if (user && user.rol === 'administrador') {
        window.location.href = "dashboard-admin.html";
        return;
    }

    // ==========================================
    // 1. VERIFICAR AUTENTICACIÓN
    // ==========================================
    if (!Auth || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    // Si es psicólogo, redirigir a su dashboard
    if (user && user.rol === 'psicologo') {
        window.location.href = "dashboard-psicologo.html";
        return;
    }

    console.log('Usuario en dashboard:', user); // Debug

    // ==========================================
    // 2. ACTUALIZAR TODOS LOS CAMPOS DE USUARIO
    // ==========================================
    
    // A) Saludo grande ("Hola, [nombre]")
    const saludo = document.getElementById('saludoUsuario');
    if (saludo) {
        const hora = new Date().getHours();
        let saludoTexto = 'Hola';
        if (hora >= 12 && hora < 19) saludoTexto = 'Buenas tardes';
        else if (hora >= 19) saludoTexto = 'Buenas noches';
        
        saludo.textContent = `${saludoTexto}, ${user.nombre || 'Usuario'} 👋`;
    }

    // B) Menú de usuario (esquina superior derecha)
    const nombreUsuario = document.querySelector('.nombre-usuario');
    const correoUsuario = document.querySelector('.correo-usuario');
    
    if (nombreUsuario) {
        nombreUsuario.textContent = user.nombre || 'Usuario SEMA';
    }
    if (correoUsuario) {
        correoUsuario.textContent = user.email || 'usuario@sema.com';
    }

    console.log('Nombre actualizado:', nombreUsuario?.textContent);
    console.log('Correo actualizado:', correoUsuario?.textContent);

    // ==========================================
    // 3. CARGAR PRÓXIMA CITA REAL
    // ==========================================
    try {
        const citas = await fetchAuth('/citas');
        const proximas = citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada');
        
        if (proximas.length > 0) {
            const cita = proximas[0];
            const fechaObj = new Date(cita.fecha);
            const dia = fechaObj.getDate();
            const mes = fechaObj.toLocaleString('es', { month: 'short' }).replace('.', '');
            const nombrePsicologo = cita.psicologoId?.nombre || 'Psicólogo';
            
            const citaItem = document.querySelector('.cita-item');
            if (citaItem) {
                const fechaDiv = citaItem.querySelector('.cita-fecha');
                const infoDiv = citaItem.querySelector('.cita-info');
                const badge = citaItem.querySelector('.badge');
                
                if (fechaDiv) {
                    fechaDiv.innerHTML = `<div class="dia">${dia}</div><div class="mes">${mes}</div>`;
                }
                if (infoDiv) {
                    infoDiv.innerHTML = `<h4>${nombrePsicologo}</h4><p>${cita.hora} · Sesión online</p>`;
                }
                if (badge) {
                    badge.textContent = cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1);
                    badge.className = `badge badge-${cita.estado === 'confirmada' ? 'verde' : 'azul'}`;
                }
            }
        }
    } catch (error) {
        console.warn('No se pudieron cargar las citas:', error.message);
    }

    // ==========================================
    // 4. CARGAR NOTIFICACIONES REALES
    // ==========================================
    try {
        const notificaciones = await fetchAuth('/notificaciones');
        const listaNotif = document.querySelector('.tarjeta ul');
        
        if (listaNotif && notificaciones.length > 0) {
            listaNotif.innerHTML = notificaciones.slice(0, 3).map(n => `
                <li style="padding:.6rem 0; border-bottom:1px solid var(--borde)">
                    ${n.leida ? '✅' : '🔴'} ${n.titulo}
                    <br><small>${n.mensaje}</small>
                </li>
            `).join('');
        }
    } catch (error) {
        console.warn('No se pudieron cargar las notificaciones:', error.message);
    }

    // ==========================================
    // 5. SELECTOR DE ÁNIMO - GUARDAR EN BACKEND
    // ==========================================
    const animoSelector = document.getElementById('animo-selector');
    if (animoSelector) {
        animoSelector.addEventListener('click', async (e) => {
            if (e.target.classList.contains('animo-btn')) {
                const estado = e.target.dataset.animo;
                
                document.querySelectorAll('.animo-btn').forEach(btn => {
                    btn.classList.remove('activo');
                });
                
                e.target.classList.add('activo');

                try {
                    await fetchAuth('/estados-emocionales', {
                        method: 'POST',
                        body: JSON.stringify({
                            estado: estado,
                            descripcion: `Registro desde dashboard`
                        })
                    });
                    
                    if (typeof mostrarToast === 'function') {
                        mostrarToast(`✅ Ánimo "${estado}" registrado`);
                    }
                } catch (error) {
                    if (typeof mostrarToast === 'function') {
                        mostrarToast('Error al registrar: ' + error.message);
                    }
                }
            }
        });
    }

    // ==========================================
    // 6. MENÚ DESPLEGABLE DE USUARIO (CORREGIDO)
    // ==========================================
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    console.log('Botón menú:', userMenuBtn);
    console.log('Dropdown:', userDropdown);
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const estaActivo = userDropdown.classList.contains('activo');
            
            if (estaActivo) {
                userDropdown.classList.remove('activo');
                userMenuBtn.classList.remove('activo');
            } else {
                userDropdown.classList.add('activo');
                userMenuBtn.classList.add('activo');
            }
            
            console.log('Menú:', !estaActivo ? 'ABIERTO' : 'CERRADO');
        });

        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('activo');
                userMenuBtn.classList.remove('activo');
            }
        });
    } else {
        console.error('No se encontraron los elementos del menú desplegable');
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
});