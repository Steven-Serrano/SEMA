/* ============================================================
   SEMA - CHAT (Compatible con Usuario y Psicólogo)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 1. VERIFICAR AUTENTICACIÓN
    // ==========================================
    if (!Auth || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const user = Auth.getUser();
    const esPsicologo = user.rol === 'psicologo';

    const listaChats = document.getElementById('lista-chats');
    const chatMensajes = document.getElementById('chat-mensajes');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const btnEnviar = document.getElementById('btn-enviar');
    const chatNombre = document.getElementById('chat-nombre');
    const chatEstado = document.getElementById('chat-estado');
    const chatAvatar = document.getElementById('chat-avatar');

    let chatActivoId = null;
    let intervaloRecarga = null;

    // ==========================================
    // 2. CARGAR LISTA DE CHATS
    // ==========================================
    async function cargarListaChats() {
        try {
            const chats = await fetchAuth('/chats');
            
            if (!chats || chats.length === 0) {
                listaChats.innerHTML = `
                    <div style="padding: 1.5rem; text-align: center; color: var(--texto-secundario, #64748b);">
                        <p style="font-size: 2rem; margin-bottom: 0.5rem;">💬</p>
                        <p>No tienes conversaciones activas.</p>
                        <p style="font-size: 0.85rem; margin-top: 0.5rem;">
                            ${esPsicologo 
                                ? 'Los estudiantes con los que tengas citas aparecerán aquí.' 
                                : 'Agenda una cita con un psicólogo para iniciar un chat.'}
                        </p>
                    </div>
                `;
                return;
            }

            listaChats.innerHTML = chats.map(chat => {
                // ✅ DETECTAR QUIÉN ES EL "OTRO" EN LA CONVERSACIÓN
                let nombre, especialidad, iniciales;
                
                if (esPsicologo) {
                    // Si soy psicólogo, el "otro" es el estudiante (usuarioId)
                    nombre = chat.usuarioId?.nombre || 'Estudiante';
                    especialidad = 'Estudiante';
                } else {
                    // Si soy estudiante, el "otro" es el psicólogo (psicologoId)
                    nombre = chat.psicologoId?.nombre || 'Psicólogo';
                    especialidad = chat.psicologoId?.especialidad || '';
                }
                
                iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const activo = chat._id === chatActivoId ? 'chat-item--activo' : '';
                
                return `
                    <div class="chat-item ${activo}" data-chat-id="${chat._id}">
                        <div class="avatar-grande" style="width: 45px; height: 45px; font-size: 0.9rem;">
                            ${iniciales}
                        </div>
                        <div class="chat-item__info">
                            <h4>${nombre}</h4>
                            <small>${especialidad}</small>
                        </div>
                    </div>
                `;
            }).join('');

            // Agregar event listeners a cada chat
            document.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    const chatId = item.dataset.chatId;
                    const chatData = chats.find(c => c._id === chatId);
                    seleccionarChat(chatId, chatData);
                });
            });

        } catch (error) {
            listaChats.innerHTML = `
                <p style="padding: 1rem; color: var(--error, #ef4444);">
                    Error al cargar los chats.
                </p>
            `;
            console.error('Error cargando chats:', error);
        }
    }

    // ==========================================
    // 3. SELECCIONAR UN CHAT Y CARGAR MENSAJES
    // ==========================================
    async function seleccionarChat(chatId, chatData) {
        chatActivoId = chatId;
        
        // ✅ DETECTAR QUIÉN ES EL "OTRO"
        let nombre, especialidad, iniciales;
        
        if (esPsicologo) {
            nombre = chatData.usuarioId?.nombre || 'Estudiante';
            especialidad = 'Estudiante';
        } else {
            nombre = chatData.psicologoId?.nombre || 'Psicólogo';
            especialidad = chatData.psicologoId?.especialidad || '';
        }
        
        iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        chatNombre.textContent = nombre;
        chatEstado.textContent = `En línea · ${especialidad}`;
        chatAvatar.textContent = iniciales;
        
        // Habilitar formulario
        chatInput.disabled = false;
        btnEnviar.disabled = false;
        chatInput.focus();
        
        // Marcar chat activo en la lista
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('chat-item--activo');
            if (item.dataset.chatId === chatId) {
                item.classList.add('chat-item--activo');
            }
        });
        
        // Cargar mensajes
        await cargarMensajes(chatId);
        
        // Iniciar recarga automática cada 4 segundos
        if (intervaloRecarga) clearInterval(intervaloRecarga);
        intervaloRecarga = setInterval(() => cargarMensajes(chatId), 4000);
    }

    // ==========================================
    // 4. CARGAR MENSAJES DEL CHAT ACTIVO
    // ==========================================
    async function cargarMensajes(chatId) {
        try {
            const mensajes = await fetchAuth(`/mensajes/${chatId}`);
            
            chatMensajes.innerHTML = mensajes.map(msg => {
                // ✅ DETECTAR SI EL MENSAJE ES MÍO (según el rol)
                let esMio;
                if (esPsicologo) {
                    esMio = msg.emisorModel === 'Psicologo';
                } else {
                    esMio = msg.emisorModel === 'Usuario';
                }
                
                const hora = new Date(msg.fecha).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                return `
                    <div class="msg ${esMio ? 'msg--yo' : 'msg--otro'}">
                        <div class="msg__contenido">${msg.contenido}</div>
                        <div class="msg__hora">${hora}</div>
                    </div>
                `;
            }).join('');
            
            // Auto-scroll al final
            chatMensajes.scrollTop = chatMensajes.scrollHeight;
            
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    }

    // ==========================================
    // 5. ENVIAR MENSAJE
    // ==========================================
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const contenido = chatInput.value.trim();
            if (!contenido || !chatActivoId) return;
            
            chatInput.disabled = true;
            btnEnviar.disabled = true;
            btnEnviar.textContent = 'Enviando...';
            
            try {
                await fetchAuth(`/mensajes/${chatActivoId}`, {
                    method: 'POST',
                    body: JSON.stringify({ contenido })
                });
                
                chatInput.value = '';
                await cargarMensajes(chatActivoId);
                
            } catch (error) {
                if (typeof mostrarToast === 'function') {
                    mostrarToast('❌ Error al enviar: ' + error.message);
                }
            } finally {
                chatInput.disabled = false;
                btnEnviar.disabled = false;
                btnEnviar.textContent = 'Enviar';
                chatInput.focus();
            }
        });
    }

    // ==========================================
    // 6. INICIALIZAR
    // ==========================================
    await cargarListaChats();
});