/* Lógica del chat: enviar mensajes y respuesta automática */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const cont = document.getElementById('chat-mensajes');
  if (!form) return;

  const respuestas = [
    'Gracias por compartirlo conmigo 💙',
    '¿Cómo te sentiste después?',
    'Estoy aquí para acompañarte.',
    'Eso es un gran paso. Sigamos explorándolo.'
  ];

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    agregar(texto, 'yo');
    input.value = '';
    setTimeout(() => agregar(respuestas[Math.floor(Math.random()*respuestas.length)], 'otro'), 900);
  });

  function agregar(texto, tipo) {
    const div = document.createElement('div');
    div.className = 'msg msg--' + tipo;
    div.textContent = texto;
    cont.appendChild(div);
    cont.scrollTop = cont.scrollHeight;
  }

  // Cambiar de conversación
  document.querySelectorAll('.chat__item').forEach(it => {
    it.addEventListener('click', () => {
      document.querySelectorAll('.chat__item').forEach(x => x.classList.remove('activo'));
      it.classList.add('activo');
    });
  });
});
