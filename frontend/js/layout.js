console.log("🚀 [Layout] El archivo layout.js se ha cargado correctamente.");

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

document.addEventListener('DOMContentLoaded', async () => {
    const navContainer = document.getElementById('sema-nav');
    if (!navContainer) return;

    const user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
    
    // DETECTAR ROLES
    const esPsicologo = user && (user.rol === 'psicologo' || user.tipo === 'psicologo');
    const esAdminSENA = user && (user.rol === 'administrador_sena' || user.tipo === 'administrador_sena');
    const esSuperAdmin = user && (user.rol === 'super_administrador' || user.tipo === 'super_administrador');
    const esAdmin = esAdminSENA || esSuperAdmin;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let miIdReal = user ? (user.id || user._id || user.userId) : null;
    let fotoPerfilUrl = user && user.fotoPerfil ? getImgUrl(user.fotoPerfil) : 'assets/avatar-default.png';

    // Actualizar foto si no está en caché (solo para estudiantes/psicólogos)
    if (user && (!miIdReal || !user.fotoPerfil) && !esAdmin) {
        try {
            const rutaPerfil = esPsicologo ? '/psicologos/perfil' : '/usuarios/perfil';
            const perfil = await fetchAuth(rutaPerfil);
            miIdReal = perfil._id || perfil.id;
            if (perfil.fotoPerfil) fotoPerfilUrl = getImgUrl(perfil.fotoPerfil);
            
            const userActualizado = Auth.getUser();
            userActualizado.id = miIdReal;
            if (perfil.fotoPerfil) userActualizado.fotoPerfil = perfil.fotoPerfil;
            Auth.setUser(userActualizado);
        } catch (error) {
            console.error("❌ [Layout] No se pudo obtener el perfil:", error);
        }
    }

    setTimeout(() => {
        document.querySelectorAll('.user-menu .foto-usuario').forEach(img => img.src = fotoPerfilUrl);
    }, 100);

    // 1. GENERAR NAVBAR
    function generarNavbar() {
        // NAVBAR ADMIN (FontAwesome)
        if (esAdmin) {
            return `
                <nav class="navbar">
                    <div class="flex align-center">
                        <button class="menu-toggle" id="menuToggle"><i class="fi fi-bs-menu-burger"></i></button>
                        <div class="navbar__logo">
                            <img src="assets/logo.png" alt="SEMA" class="navbar__logo-img">
                            <div><h1>SEMA Admin</h1><small>Gestión Institucional</small></div>
                        </div>
                    </div>
                    <ul class="navbar__menu">
                        <li><a href="dashboard-admin.html" class="${currentPage === 'dashboard-admin.html' ? 'activo' : ''}"><i class="fa-solid fa-chart-pie"></i> Panel Global</a></li>
                        <li><a href="gestion-psicologos.html" class="${currentPage === 'gestion-psicologos.html' ? 'activo' : ''}"><i class="fa-solid fa-user-doctor"></i> Psicólogos</a></li>
                    </ul>
                    <button class="navbar__theme-toggle" id="themeToggle"><i class="${savedTheme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}"></i></button>
                </nav>`;
        }
        
        // NAVBAR PSICÓLOGO (Uicons)
        if (esPsicologo) {
            return `
                <nav class="navbar">
                    <div class="flex align-center">
                        <button class="menu-toggle" id="menuToggle"><i class="fi fi-bs-menu-burger"></i></button>
                        <div class="navbar__logo"><img src="assets/logo.png" alt="SEMA" class="navbar__logo-img"><div><h1>SEMA</h1><small>Comunicación que Sana</small></div></div>
                    </div>
                    <ul class="navbar__menu">
                        <li><a href="dashboard-psicologo.html" class="${currentPage === 'dashboard-psicologo.html' ? 'activo' : ''}"><i class="fi fi-bs-home"></i> Mi Panel</a></li>
                        <li><a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}"><i class="fi fi-bs-comment"></i> Chat</a></li>
                        <li><a href="pacientes.html" class="${currentPage === 'pacientes.html' ? 'activo' : ''}"><i class="fi fi-bs-users"></i> Pacientes</a></li>
                    </ul>
                    <button class="navbar__theme-toggle" id="themeToggle"><i class="fi ${savedTheme === 'light' ? 'fi-bs-moon' : 'fi-bs-sun'}"></i></button>
                </nav>`;
        }

        // NAVBAR ESTUDIANTE (Uicons)
        return `
            <nav class="navbar">
                <div class="flex align-center">
                    <button class="menu-toggle" id="menuToggle"><i class="fi fi-bs-menu-burger"></i></button>
                    <div class="navbar__logo"><img src="assets/logo.png" alt="SEMA" class="navbar__logo-img"><div><h1>SEMA</h1><small>Comunicación que Sana</small></div></div>
                </div>
                <ul class="navbar__menu">
                    <li><a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'activo' : ''}"><i class="fi fi-bs-home"></i> Dashboard</a></li>
                    <li><a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}"><i class="fi fi-bs-comment"></i> Chat</a></li>
                    <li><a href="comunidad.html" class="${currentPage === 'comunidad.html' ? 'activo' : ''}"><i class="fi fi-bs-users"></i> Comunidad</a></li>
                </ul>
                <button class="navbar__theme-toggle" id="themeToggle"><i class="fi ${savedTheme === 'light' ? 'fi-bs-moon' : 'fi-bs-sun'}"></i></button>
            </nav>`;
    }

    navContainer.innerHTML = generarNavbar();

    // 2. SIDEBAR DINÁMICO
    const sidebarContainer = document.getElementById('sema-sidebar');
    if (sidebarContainer) {
        if (esAdmin) {
            // SIDEBAR ADMIN (FontAwesome)
            sidebarContainer.innerHTML = `
                <h5>Administración</h5>
                <a href="dashboard-admin.html" class="${currentPage === 'dashboard-admin.html' ? 'activo' : ''}"><i class="fa-solid fa-chart-pie"></i> Panel Global</a>
                <a href="gestion-psicologos.html" class="${currentPage === 'gestion-psicologos.html' ? 'activo' : ''}"><i class="fa-solid fa-user-doctor"></i> Psicólogos</a>
                <h5>Cuenta</h5>
                <a href="index.html" class="logout-link"><i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión</a>`;
        } else if (esPsicologo) {
            sidebarContainer.innerHTML = `
                <h5>Panel Profesional</h5>
                <a href="dashboard-psicologo.html" class="${currentPage === 'dashboard-psicologo.html' ? 'activo' : ''}"><i class="fi fi-bs-home"></i> Mi Panel</a>
                <a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}"><i class="fi fi-bs-comment"></i> Mensajes</a>
                <a href="citas-psicologo.html" class="${currentPage === 'citas-psicologo.html' ? 'activo' : ''}"><i class="fi fi-bs-calendar"></i> Mis Citas</a>
                <a href="pacientes.html" class="${currentPage === 'pacientes.html' ? 'activo' : ''}"><i class="fi fi-bs-users"></i> Mis Pacientes</a>
                <h5>Cuenta</h5>
                <a href="perfil.html" class="${currentPage === 'perfil.html' ? 'activo' : ''}"><i class="fi fi-bs-user"></i> Mi Perfil</a>
                <a href="configuracion.html" class="${currentPage === 'configuracion.html' ? 'activo' : ''}"><i class="fi fi-bs-settings"></i> Configuración</a>
                <a href="index.html" class="logout-link"><i class="fi fi-bs-exit"></i> Cerrar sesión</a>`;
        } else {
            sidebarContainer.innerHTML = `
                <h5>Mi espacio</h5>
                <a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'activo' : ''}"><i class="fi fi-bs-home"></i> Dashboard</a>
                <a href="perfil.html" class="${currentPage === 'perfil.html' ? 'activo' : ''}"><i class="fi fi-bs-user"></i> Mi Perfil</a>
                <a href="seguimiento.html" class="${currentPage === 'seguimiento.html' ? 'activo' : ''}"><i class="fi fi-bs-chart-line-up"></i> Seguimiento</a>
                <a href="citas.html" class="${currentPage === 'citas.html' ? 'activo' : ''}"><i class="fi fi-bs-calendar"></i> Mis citas</a>
                <a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}"><i class="fi fi-bs-comment"></i> Mensajes</a>
                <h5>Explorar</h5>
                <a href="psicologos.html" class="${currentPage === 'psicologos.html' ? 'activo' : ''}"><i class="fi fi-bs-user-doctor"></i> Psicólogos</a>
                <a href="comunidad.html" class="${currentPage === 'comunidad.html' ? 'activo' : ''}"><i class="fi fi-bs-users"></i> Comunidad</a>
                <h5>Cuenta</h5>
                <a href="configuracion.html" class="${currentPage === 'configuracion.html' ? 'activo' : ''}"><i class="fi fi-bs-settings"></i> Configuración</a>
                <a href="index.html" class="logout-link"><i class="fi fi-bs-exit"></i> Cerrar sesión</a>`;
        }
    }

    // 3. TEMA OSCURO CONDICIONAL
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Cambiar el icono dependiendo del rol
            if (esAdmin) {
                themeToggle.querySelector('i').className = newTheme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
            } else {
                themeToggle.querySelector('i').className = newTheme === 'light' ? 'fi fi-bs-moon' : 'fi fi-bs-sun';
            }
        });
    }

    // 4. LÓGICA DE SOCKET.IO (Notificaciones en tiempo real)
    if (miIdReal && typeof io !== 'undefined' && !esAdmin) {
        const socket = io(API_URL.replace('/api', ''));
        socket.on('connect', () => {
            socket.emit('registrar_usuario', miIdReal.toString());
        });

        socket.on('nuevo_mensaje', (data) => {
            if (currentPage !== 'chat.html') {
                const mensaje = data.nombreEmisor ? `💬 Nuevo mensaje de ${data.nombreEmisor}` : '💬 Tienes un nuevo mensaje';
                if (window.SEMA && typeof window.SEMA.toast === 'function') {
                    window.SEMA.toast(mensaje);
                } else if (typeof mostrarToast === 'function') {
                    mostrarToast(mensaje);
                }
                document.dispatchEvent(new CustomEvent('actualizarNotificaciones'));
            }
        });

        socket.on('nueva_notificacion', (notif) => {
            const mensajeToast = `🔔 ${notif.titulo}`;
            if (window.SEMA && typeof window.SEMA.toast === 'function') {
                window.SEMA.toast(mensajeToast);
            } else if (typeof mostrarToast === 'function') {
                mostrarToast(mensajeToast);
            }
            if (currentPage === 'dashboard-psicologo.html') {
                document.dispatchEvent(new CustomEvent('actualizarNotificaciones'));
            }
        });
    }

    // 5. MENÚ HAMBURGUESA
    const menuToggle = document.getElementById('menuToggle');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (menuToggle && sidebarContainer) {
        menuToggle.addEventListener('click', () => {
            sidebarContainer.classList.add('activo');
            overlay.classList.add('activo');
        });
        overlay.addEventListener('click', () => {
            sidebarContainer.classList.remove('activo');
            overlay.classList.remove('activo');
        });
        sidebarContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                sidebarContainer.classList.remove('activo');
                overlay.classList.remove('activo');
            });
        });
    }
});