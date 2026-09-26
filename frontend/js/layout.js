/* ============================================================
   SEMA — Layout compartido
   Inyecta navbar y footer en cada página automáticamente.
   ============================================================ */

const NAV_HTML = `
<header class="navbar">
  <div class="contenedor navbar__inner">
    <a href="index.html" class="logo" aria-label="Ir al inicio">
      <img src="assets/logo.png" alt="Logo SEMA" width="40" height="40" />
      <span class="logo__texto">
        <span class="logo__nombre">SEMA</span>
        <span class="logo__slogan">Comunicación que Sana</span>
      </span>
    </a>
    <nav class="nav__enlaces" id="nav-enlaces" aria-label="Navegación principal">
      <a href="dashboard.html">Dashboard</a>
      <a href="chat.html">Chat</a>
      <a href="psicologos.html">Psicólogos</a>
      <a href="seguimiento.html">Seguimiento</a>
      <a href="citas.html">Citas</a>
      <a href="comunidad.html">Comunidad</a>
    </nav>
    <div class="nav__acciones">
      <button id="tema-btn" class="tema-btn" onclick="SEMA.cambiarTema()" aria-label="Cambiar tema">🌙</button>
      <button class="menu-btn" onclick="SEMA.toggleMenu()" aria-label="Abrir menú">☰</button>
    </div>
  </div>
</header>`;

const FOOTER_HTML = `
<footer class="footer">
  <div class="contenedor">
    <div class="footer__grid">
      <div>
        <div class="logo">
          <img src="assets/logo.png" alt="Logo SEMA" width="40" height="40" />
          <span class="logo__texto">
            <span class="logo__nombre">SEMA</span>
            <span class="logo__slogan">Comunicación que Sana</span>
          </span>
        </div>
        <p style="margin-top:1rem; font-size:.9rem; max-width:280px">
          Acompañamos a jóvenes en su bienestar emocional con empatía, profesionalismo y tecnología.
        </p>
      </div>
      <div>
        <h4>Plataforma</h4>
        <ul>
          <li><a href="dashboard.html">Dashboard</a></li>
          <li><a href="psicologos.html">Psicólogos</a></li>
          <li><a href="seguimiento.html">Seguimiento</a></li>
          <li><a href="citas.html">Citas</a></li>
        </ul>
      </div>
      <div>
        <h4>Comunidad</h4>
        <ul>
          <li><a href="comunidad.html">Foros</a></li>
          <li><a href="chat.html">Chat</a></li>
          <li><a href="#">Recursos</a></li>
          <li><a href="#">Contacto</a></li>
        </ul>
      </div>
      <div>
        <h4>Síguenos</h4>
        <ul>
          <li><a href="#">Instagram</a></li>
          <li><a href="#">Twitter / X</a></li>
          <li><a href="#">Facebook</a></li>
          <li><a href="mailto:hola@sema.app">hola@sema.app</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__base">
      Hecho con 💙💚 por SEMA · © <span id="anio"></span> · Todos los derechos reservados
    </div>
  </div>
</footer>`;

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('sema-nav');
  const foot = document.getElementById('sema-footer');
  if (nav) nav.outerHTML = NAV_HTML;
  if (foot) foot.outerHTML = FOOTER_HTML;
  const y = document.getElementById('anio');
  if (y) y.textContent = new Date().getFullYear();

  // Re-marcar enlace activo tras inyección
  const ruta = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__enlaces a').forEach(a => {
    if (a.getAttribute('href') === ruta) a.classList.add('activo');
  });
});
