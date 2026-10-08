/* ============================================================
   SEMA - LAYOUT (Navbar dinámico según rol)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.getElementById('sema-nav');
    
    if (!navContainer) return;

    // Detectar el rol del usuario
    const user = Auth ? Auth.getUser() : null;
    const esPsicologo = user && user.rol === 'psicologo';
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Función para generar el navbar según el rol
    function generarNavbar() {
        if (esPsicologo) {
            // NAVBAR PARA PSICÓLOGO
            return `
                <nav class="navbar">
                    <div class="navbar__logo">
                        <img src="assets/logo.png" alt="SEMA" class="navbar__logo-img">
                        <div>
                            <h1>SEMA</h1>
                            <small>Comunicación que Sana</small>
                        </div>
                    </div>
                    <ul class="navbar__menu">
                        <li>
                            <a href="dashboard-psicologo.html" class="${currentPage === 'dashboard-psicologo.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-home"></i> Mi Panel
                            </a>
                        </li>
                        <li>
                            <a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-comment"></i> Chat
                            </a>
                        </li>
                        <li>
                            <a href="citas-psicologo.html" class="${currentPage === 'citas-psicologo.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-calendar"></i> Mis Citas
                            </a>
                        </li>
                        <li>
                            <a href="pacientes.html" class="${currentPage === 'pacientes.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-users"></i> Mis Pacientes
                            </a>
                        </li>
                        <li>
                            <a href="perfil.html" class="${currentPage === 'perfil.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-user"></i> Perfil
                            </a>
                        </li>
                        <li>
                            <a href="configuracion.html" class="${currentPage === 'configuracion.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-settings"></i> Config
                            </a>
                        </li>
                    </ul>
                    <button class="navbar__theme-toggle" id="themeToggle" aria-label="Cambiar tema">
                        <i class="fi fi-bs-moon"></i>
                    </button>
                </nav>
            `;
        } else {
            // NAVBAR PARA ESTUDIANTE (original)
            return `
                <nav class="navbar">
                    <div class="navbar__logo">
                        <img src="assets/logo.png" alt="SEMA" class="navbar__logo-img">
                        <div>
                            <h1>SEMA</h1>
                            <small>Comunicación que Sana</small>
                        </div>
                    </div>
                    <ul class="navbar__menu">
                        <li>
                            <a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-home"></i> Dashboard
                            </a>
                        </li>
                        <li>
                            <a href="chat.html" class="${currentPage === 'chat.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-comment"></i> Chat
                            </a>
                        </li>
                        <li>
                            <a href="psicologos.html" class="${currentPage === 'psicologos.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-user-doctor"></i> Psicólogos
                            </a>
                        </li>
                        <li>
                            <a href="seguimiento.html" class="${currentPage === 'seguimiento.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-chart-line-up"></i> Seguimiento
                            </a>
                        </li>
                        <li>
                            <a href="citas.html" class="${currentPage === 'citas.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-calendar"></i> Citas
                            </a>
                        </li>
                        <li>
                            <a href="comunidad.html" class="${currentPage === 'comunidad.html' ? 'activo' : ''}">
                                <i class="fi fi-bs-users"></i> Comunidad
                            </a>
                        </li>
                    </ul>
                    <button class="navbar__theme-toggle" id="themeToggle" aria-label="Cambiar tema">
                        <i class="fi fi-bs-moon"></i>
                    </button>
                </nav>
            `;
        }
    }

    // Insertar el navbar
    navContainer.innerHTML = generarNavbar();

    // Toggle de tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            
            // Cambiar icono del tema
            const themeIcon = themeToggle.querySelector('i');
            if (themeIcon) {
                themeIcon.className = newTheme === 'light' ? 'fi fi-bs-moon' : 'fi fi-bs-sun';
            }
            
            localStorage.setItem('theme', newTheme);
        });

        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const themeIcon = themeToggle.querySelector('i');
            if (themeIcon) {
                themeIcon.className = savedTheme === 'light' ? 'fi fi-bs-moon' : 'fi fi-bs-sun';
            }
        }
    }
});