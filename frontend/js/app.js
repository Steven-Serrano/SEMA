/* ============================================================
   SEMA — Script global
   - Navegación móvil
   - Cambio de tema claro/oscuro
   - Notificaciones toast
   ============================================================ */

(function () {
  // -------- Tema --------
  const raiz = document.documentElement;
  const guardado = localStorage.getItem('sema-tema');
  const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  raiz.setAttribute('data-theme', guardado || (prefiereOscuro ? 'dark' : 'light'));

  window.SEMA = window.SEMA || {};

  window.SEMA.cambiarTema = function () {
    const actual = raiz.getAttribute('data-theme');
    const nuevo = actual === 'dark' ? 'light' : 'dark';
    raiz.setAttribute('data-theme', nuevo);
    localStorage.setItem('sema-tema', nuevo);
    actualizarIconoTema();
  };

  function actualizarIconoTema() {
    const b = document.getElementById('tema-btn');
    if (!b) return;
    b.textContent = raiz.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  }

  // -------- Menú móvil --------
  window.SEMA.toggleMenu = function () {
    document.getElementById('nav-enlaces')?.classList.toggle('abierto');
  };

  // -------- Toast --------
  window.SEMA.toast = function (mensaje) {
    let t = document.getElementById('sema-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'sema-toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = mensaje;
    t.classList.add('activo');
    clearTimeout(t._to);
    t._to = setTimeout(() => t.classList.remove('activo'), 2600);
  };

  // -------- Marcar enlace activo --------
  const ruta = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__enlaces a, .sidebar a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.endsWith(ruta)) a.classList.add('activo');
  });

  document.addEventListener('DOMContentLoaded', actualizarIconoTema);
})();
