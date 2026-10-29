const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.getElementById('sema-nav');
    if (!navContainer) return;

    const user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
    const esPsicologo = user && (user.rol === 'psicologo' || user.tipo === 'psicologo');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // 1. NAVBAR LIMPIO (Solo lo esencial)
    function generarNavbar() {
        if (esPsicologo) {
            return `
                <nav class="navbar">
                    <div class="flex align-center">
                        <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú"><i class="fi fi-bs-menu-burger"></i></button>
                        <div class="navbar__logo">
                            <img src="assets/logo.png" alt="SEMA" class="navbar__logo-img">
                            <div><h1>SEMA</h1><small>Comunicación que Sana</small></div>
                        </div>
                    </div>
                    <ul class="navbar__menu">
                        <li><a href="dashboard-psicologo.html" class="${currentPage === 'dashboard-psicologo.html' ? 'activo' : ''}"><i class="fi fi-bs-home"></i> Mi Panel</a></li>
                        <li><a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}"><i class="fi fi-bs-comment"></i> Chat</a></li>
                        <li><a href="pacientes.html" class="${currentPage === 'pacientes.html' ? 'activo' : ''}"><i class="fi fi-bs-users"></i> Mis Pacientes</a></li>
                    </ul>
                    <button class="navbar__theme-toggle" id="themeToggle" aria-label="Cambiar tema"><i class="fi ${savedTheme === 'light' ? 'fi-bs-moon' : 'fi-bs-sun'}"></i></button>
                </nav>`;
        }
        return `
            <nav class="navbar">
                <div class="flex align-center">
                    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú"><i class="fi fi-bs-menu-burger"></i></button>
                    <div class="navbar__logo">
                        <img src="assets/logo.png" alt="SEMA" class="navbar__logo-img">
                        <div><h1>SEMA</h1><small>Comunicación que Sana</small></div>
                    </div>
                </div>
                <ul class="navbar__menu">
                    <li><a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'activo' : ''}"><i class="fi fi-bs-home"></i> Dashboard</a></li>
                    <li><a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}"><i class="fi fi-bs-comment"></i> Chat</a></li>
                    <li><a href="comunidad.html" class="${currentPage === 'comunidad.html' ? 'activo' : ''}"><i class="fi fi-bs-users"></i> Comunidad</a></li>
                </ul>
                <button class="navbar__theme-toggle" id="themeToggle" aria-label="Cambiar tema"><i class="fi ${savedTheme === 'light' ? 'fi-bs-moon' : 'fi-bs-sun'}"></i></button>
            </nav>`;
    }

    navContainer.innerHTML = generarNavbar();

    // 2. LÓGICA DEL TEMA OSCURO
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.querySelector('i').className = newTheme === 'light' ? 'fi fi-bs-moon' : 'fi fi-bs-sun';
        });
    }

    // 3. SIDEBAR DINÁMICO
    const sidebarContainer = document.getElementById('sema-sidebar');
    if (sidebarContainer) {
        if (esPsicologo) {
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

    // 4. LÓGICA DEL MENÚ MÓVIL (HAMBUzRGUESA)
    const menuToggle = document.getElementById('menuToggle');
    
    // Creamos el fondo oscuro (overlay) dinámicamente si no existe
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (menuToggle && sidebarContainer) {
        // Abrir menú
        menuToggle.addEventListener('click', () => {
            sidebarContainer.classList.add('activo');
            overlay.classList.add('activo');
        });

        // Cerrar menú al tocar el fondo oscuro
        overlay.addEventListener('click', () => {
            sidebarContainer.classList.remove('activo');
            overlay.classList.remove('activo');
        });

        // Cerrar menú al hacer clic en un enlace (para que no estorbe)
        const sidebarLinks = sidebarContainer.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 800) {
                    sidebarContainer.classList.remove('activo');
                    overlay.classList.remove('activo');
                }
            });
        });
    }
}); 