document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
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
    let mensajesRenderizados = new Set();

    // 1. CARGAR LISTA DE CHATS
    async function cargarListaChats() {
        try {
            listaChats.innerHTML = `<div class="text-center text-suave" style="padding: 1.5rem;"><i class="fi fi-bs-hourglass-end block mb-1"></i><p>Cargando...</p></div>`;
            const chats = await fetchAuth('/chats');
            
            if (!chats || chats.length === 0) {
                listaChats.innerHTML = `<div class="text-center text-suave" style="padding: 1.5rem;"><i class="fi fi-bs-comments block mb-1" style="font-size: 2rem;"></i><p>Sin conversaciones</p></div>`;
                return;
            }

            listaChats.innerHTML = chats.map(chat => {
                let nombre = esPsicologo ? (chat.usuarioId?.nombre || 'Estudiante') : (chat.psicologoId?.nombre || 'Psicólogo');
                let especialidad = esPsicologo ? 'Estudiante' : (chat.psicologoId?.especialidad || 'Psicología');
                let iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                let activo = chat._id === chatActivoId ? 'chat-item--activo' : '';
                
                const otroUser = esPsicologo ? chat.usuarioId : chat.psicologoId;
                const fotoChat = otroUser?.fotoPerfil ? getImgUrl(otroUser.fotoPerfil) : null;

                return `
                    <div class="chat-item ${activo}" data-chat-id="${chat._id}">
                        <div class="chat-item__avatar">
                            ${fotoChat ? `<img src="${fotoChat}" class="avatar-grande" style="object-fit: cover;">` : `<div class="avatar-grande">${iniciales}</div>`}
                        </div>
                        <div class="chat-item__info"><h4>${nombre}</h4><small>${especialidad}</small></div>
                    </div>
                `;
            }).join('');

            document.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    const chatId = item.dataset.chatId;
                    const chatData = chats.find(c => c._id === chatId);
                    seleccionarChat(chatId, chatData);
                });
            });

        } catch (error) {
            listaChats.innerHTML = `<p class="text-center mt-1" style="color: var(--error);">Error al cargar.</p>`;
        }
    }

    // 2. SELECCIONAR CHAT
    async function seleccionarChat(chatId, chatData) {
        if (intervaloRecarga) clearInterval(intervaloRecarga);
        chatActivoId = chatId;
        mensajesRenderizados.clear();
        chatMensajes.innerHTML = '';

        let nombre = esPsicologo ? (chatData.usuarioId?.nombre || 'Estudiante') : (chatData.psicologoId?.nombre || 'Psicólogo');
        let especialidad = esPsicologo ? 'Estudiante' : (chatData.psicologoId?.especialidad || 'Psicología');
        
        chatNombre.textContent = nombre;
        chatEstado.textContent = `En línea · ${especialidad}`;
        chatAvatar.textContent = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        chatInput.disabled = false;
        btnEnviar.disabled = false;
        chatInput.focus();

        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('chat-item--activo', item.dataset.chatId === chatId);
        });

        await cargarMensajes(chatId);
        // Polling: Recargar mensajes cada 4 segundos
        intervaloRecarga = setInterval(() => cargarMensajes(chatId, true), 4000);
    }

    // 3. CARGAR MENSAJES
    async function cargarMensajes(chatId, soloNuevos = false) {
        try {
            const mensajes = await fetchAuth(`/mensajes/${chatId}`);
            let hayNuevos = false;
            const estaCercaDelFinal = chatMensajes.scrollHeight - chatMensajes.scrollTop - chatMensajes.clientHeight < 150;

            mensajes.forEach(msg => {
                if (mensajesRenderizados.has(msg._id)) return;
                const esMio = esPsicologo ? msg.emisorModel === 'Psicologo' : msg.emisorModel === 'Usuario';
                const hora = new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const msgDiv = document.createElement('div');
                msgDiv.className = `msg ${esMio ? 'msg--yo' : 'msg--otro'}`;
                msgDiv.dataset.msgId = msg._id;
                msgDiv.innerHTML = `<div class="msg__contenido">${msg.contenido}</div><div class="msg__hora">${hora}</div>`;

                chatMensajes.appendChild(msgDiv);
                mensajesRenderizados.add(msg._id);
                hayNuevos = true;
            });

            if (!soloNuevos || (hayNuevos && estaCercaDelFinal)) {
                chatMensajes.scrollTop = chatMensajes.scrollHeight;
            }
        } catch (error) { console.error('Error cargando mensajes:', error); }
    }

    // 4. ENVIAR MENSAJE
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const contenido = chatInput.value.trim();
            if (!contenido || !chatActivoId) return;
            
            const textoOriginal = btnEnviar.innerHTML;
            chatInput.disabled = true; btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<i class="fi fi-bs-spinner animate-spin"></i>';

            try {
                await fetchAuth(`/mensajes/${chatActivoId}`, {
                    method: 'POST',
                    body: JSON.stringify({ contenido })
                });
                chatInput.value = '';
                chatMensajes.scrollTop = chatMensajes.scrollHeight;
                await cargarMensajes(chatActivoId, false); 
            } catch (error) {
                if (typeof mostrarToast === 'function') mostrarToast('❌ Error al enviar mensaje');
                else alert('Error al enviar mensaje');
            } finally {
                chatInput.disabled = false; btnEnviar.disabled = false;
                btnEnviar.innerHTML = textoOriginal;
                chatInput.focus();
            }
        });
    }

    window.addEventListener('beforeunload', () => {
        if (intervaloRecarga) clearInterval(intervaloRecarga);
    });

    // 5. INICIALIZAR
    await cargarListaChats();

    // Manejo de parámetros SOS o Nuevo Chat
    const urlParams = new URLSearchParams(window.location.search);
    const nuevoChatId = urlParams.get('nuevoChat');
    const esPanico = urlParams.get('panico');

    if (nuevoChatId) {
        try {
            const res = await fetchAuth('/chats', {
                method: 'POST',
                body: JSON.stringify({ usuarioId: nuevoChatId })
            });
            await cargarListaChats();
            seleccionarChat(res._id, res);
        } catch (e) {
            if (typeof mostrarToast === 'function') mostrarToast('No se pudo iniciar el chat.');
        }
    } else if (esPanico) {
        chatNombre.textContent = "Buscando ayuda...";
        chatMensajes.innerHTML = `<div class="flex-col align-center justify-center" style="height: 100%;"><i class="fi fi-bs-spinner animate-spin" style="font-size: 3rem; color: var(--azul);"></i><p class="mt-1">Conectando con un profesional...</p></div>`;
        try {
            const psicologos = await fetchAuth('/psicologos');
            if (!psicologos || psicologos.length === 0) throw new Error('No hay psicólogos disponibles');
            
            const res = await fetchAuth('/chats', {
                method: 'POST',
                body: JSON.stringify({ psicologoId: psicologos[0]._id })
            });
            await cargarListaChats();
            seleccionarChat(res._id, res);
        } catch (error) {
            chatMensajes.innerHTML = `<p class="text-center" style="color: var(--error); margin-top: 2rem;">No pudimos conectarte.</p>`;
        }
    }
});