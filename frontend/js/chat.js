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
    const btnEliminarChat = document.getElementById('btnEliminarChat');

    let chatActivoId = null;
    let receptorIdActual = null; 
    let mensajesRenderizados = new Set();
    let typingTimeout = null;

    // 1. OBTENER EL ID REAL
    let miIdReal = null;
    try {
        const rutaPerfil = esPsicologo ? '/psicologos/perfil' : '/usuarios/perfil';
        const perfil = await fetchAuth(rutaPerfil);
        miIdReal = perfil._id || perfil.id; 
    } catch (error) {
        miIdReal = user.id || user._id || user.userId; 
    }

    // 2. CONEXIÓN A SOCKET.IO
    const socket = io(API_URL.replace('/api', ''));

    socket.on('connect', () => {
        if (miIdReal) socket.emit('registrar_usuario', miIdReal.toString());
    });

    socket.on('nuevo_mensaje', (data) => {
        const msg = data.mensaje || data; 
        const idChat = data.chatId || msg.chatId;

        if (idChat === chatActivoId) {
            ocultarBurbuja(); 
            renderizarMensajeIndividual(msg);
            socket.emit('mensajes_vistos', { chatId: chatActivoId, emisorId: msg.emisorId });
        } else {
            if (typeof mostrarToast === 'function') mostrarToast('💬 Tienes un mensaje nuevo');
            cargarListaChats(); 
        }
    });

    socket.on('usuario_escribiendo', (idChat) => {
        if (idChat === chatActivoId) mostrarBurbuja();
    });

    socket.on('usuario_dejo_de_escribir', (idChat) => {
        if (idChat === chatActivoId) ocultarBurbuja();
    });

    socket.on('mensajes_marcados_leidos', (idChat) => {
        if (idChat === chatActivoId) {
            document.querySelectorAll('.msg--yo .msg__check').forEach(check => {
                check.innerHTML = '✓✓';
                check.style.color = '#60A5FA';
            });
        }
    });

    // 🔑 FUNCIÓN AUXILIAR: CALCULAR SI EL PSICÓLOGO ESTÁ EN LÍNEA
    function estaEnLinea(psicologo) {
        if (!psicologo || !psicologo.disponibilidad) return false;
        
        const ahora = new Date();
        // Generamos la fecha de hoy local en formato YYYY-MM-DD
        const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
        
        const turnoHoy = psicologo.disponibilidad.find(d => d.fecha === hoyStr);
        if (!turnoHoy) return false;

        const [hInicio, mInicio] = turnoHoy.inicio.split(':').map(Number);
        const [hFin, mFin] = turnoHoy.fin.split(':').map(Number);
        
        const minInicio = (hInicio * 60) + mInicio;
        const minFin = (hFin * 60) + mFin;
        const minActual = (ahora.getHours() * 60) + ahora.getMinutes();

        return minActual >= minInicio && minActual <= minFin;
    }

    // LÓGICA DE LA BURBUJA VISUAL
    function mostrarBurbuja() {
        if (document.getElementById('typing-bubble')) return;
        const bubble = document.createElement('div');
        bubble.id = 'typing-bubble';
        bubble.className = 'typing-indicator-bubble';
        bubble.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
        chatMensajes.appendChild(bubble);
        chatMensajes.scrollTop = chatMensajes.scrollHeight;
    }

    function ocultarBurbuja() {
        const bubble = document.getElementById('typing-bubble');
        if (bubble) bubble.remove();
    }

    // 3. CARGAR LISTA DE CHATS
    async function cargarListaChats() {
        try {
            const chats = await fetchAuth('/chats');
            if (!chats || chats.length === 0) {
                listaChats.innerHTML = `<div class="text-center text-suave" style="padding: 1.5rem;"><p>Sin conversaciones</p></div>`;
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

    // 4. SELECCIONAR CHAT
    async function seleccionarChat(chatId, chatData) {
        chatActivoId = chatId;
        mensajesRenderizados.clear();
        chatMensajes.innerHTML = '';
        ocultarBurbuja();
        
        const otroUser = esPsicologo ? chatData.usuarioId : chatData.psicologoId;
        receptorIdActual = otroUser?._id || otroUser; 

        let nombre = esPsicologo ? (chatData.usuarioId?.nombre || 'Estudiante') : (chatData.psicologoId?.nombre || 'Psicólogo');
        let especialidad = esPsicologo ? 'Estudiante' : (chatData.psicologoId?.especialidad || 'Psicología');
        
        chatNombre.textContent = nombre;
        
        // 🔑 LÓGICA PARA EL ESTADO (EN LÍNEA / FUERA DE HORARIO)
        if (!esPsicologo && chatData.psicologoId) {
            const enLinea = estaEnLinea(chatData.psicologoId);
            if (enLinea) {
                chatEstado.textContent = `En línea · ${especialidad}`;
                chatEstado.style.color = 'var(--verde)';
            } else {
                chatEstado.textContent = `Fuera de horario · ${especialidad}`;
                chatEstado.style.color = 'var(--amarillo)';
            }
        } else {
            // Si el que mira es el psicólogo, el estudiante siempre está "En línea"
            chatEstado.textContent = `En línea · ${especialidad}`;
            chatEstado.style.color = 'var(--verde)';
        }

        chatAvatar.textContent = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        chatInput.disabled = false;
        btnEnviar.disabled = false;
        if (btnEliminarChat) btnEliminarChat.style.display = 'block';
        chatInput.focus();

        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('chat-item--activo', item.dataset.chatId === chatId);
        });

        await cargarMensajes(chatId);
        
        if (receptorIdActual) {
            socket.emit('mensajes_vistos', { chatId, emisorId: receptorIdActual.toString() });
        }
    }

    // 5. CARGAR Y RENDERIZAR MENSAJES
    async function cargarMensajes(chatId) {
        try {
            const mensajes = await fetchAuth(`/mensajes/${chatId}`);
            mensajes.forEach(msg => renderizarMensajeIndividual(msg));
            chatMensajes.scrollTop = chatMensajes.scrollHeight;
        } catch (error) { 
            console.error('Error cargando mensajes:', error); 
        }
    }

    function renderizarMensajeIndividual(msg) {
        if (mensajesRenderizados.has(msg._id)) return;

        const esMio = esPsicologo ? msg.emisorModel === 'Psicologo' : msg.emisorModel === 'Usuario';
        const hora = new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const chulitos = esMio 
            ? `<span class="msg__check" style="color: ${msg.leido ? '#60A5FA' : 'rgba(255,255,255,0.6)'}; font-size: 0.7rem; margin-left: 5px;">${msg.leido ? '✓✓' : '✓'}</span>` 
            : '';

        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${esMio ? 'msg--yo' : 'msg--otro'}`;
        msgDiv.dataset.msgId = msg._id;
        msgDiv.innerHTML = `
            <div class="msg__contenido">${msg.contenido}</div>
            <div class="msg__hora">${hora} ${chulitos}</div>
        `;

        chatMensajes.appendChild(msgDiv);
        mensajesRenderizados.add(msg._id);
        chatMensajes.scrollTop = chatMensajes.scrollHeight;
    }

    // 6. ENVIAR Y DETECTAR "ESCRIBIENDO"
    chatInput.addEventListener('input', () => {
        if (!chatActivoId || !receptorIdActual) return;

        socket.emit('escribiendo', { chatId: chatActivoId, receptorId: receptorIdActual.toString() });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('dejo_de_escribir', { chatId: chatActivoId, receptorId: receptorIdActual.toString() });
        }, 1500);
    });

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const contenido = chatInput.value.trim();
            if (!contenido || !chatActivoId) return;
            
            clearTimeout(typingTimeout);
            if (receptorIdActual) {
                socket.emit('dejo_de_escribir', { chatId: chatActivoId, receptorId: receptorIdActual.toString() });
            }

            const textoOriginal = btnEnviar.innerHTML;
            chatInput.disabled = true; 
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<i class="fi fi-bs-spinner animate-spin"></i>';

            try {
                const res = await fetchAuth(`/mensajes/${chatActivoId}`, {
                    method: 'POST',
                    body: JSON.stringify({ contenido })
                });
                
                chatInput.value = '';
                
                if (res.data) {
                    renderizarMensajeIndividual(res.data);
                }
            } catch (error) {
                if (typeof mostrarToast === 'function') mostrarToast('❌ Error al enviar mensaje');
            } finally {
                chatInput.disabled = false; 
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = textoOriginal;
                chatInput.focus();
            }
        });
    }

    // 7. ELIMINAR CHAT
    if (btnEliminarChat) {
        btnEliminarChat.addEventListener('click', async () => {
            if (!chatActivoId) return;
            if (!confirm('¿Estás seguro de que deseas eliminar esta conversación? Se borrarán todos los mensajes.')) return;

            try {
                await fetchAuth(`/chats/${chatActivoId}`, { method: 'DELETE' });
                
                chatActivoId = null;
                mensajesRenderizados.clear();
                chatMensajes.innerHTML = `<div class="chat-empty-state" style="text-align: center; padding: 3rem 2rem; color: var(--texto-secundario);"><i class="fi fi-bs-comments"></i><p style="font-size: 1.1rem; margin: 0;">Conversación eliminada</p></div>`;
                chatNombre.textContent = "Selecciona una conversación";
                chatEstado.textContent = "Elige un chat de la lista";
                chatEstado.style.color = 'var(--texto-suave)';
                chatAvatar.textContent = "";
                chatInput.disabled = true;
                btnEnviar.disabled = true;
                btnEliminarChat.style.display = 'none';

                await cargarListaChats();
                
                if (typeof mostrarToast === 'function') mostrarToast('🗑️ Chat eliminado');
            } catch (error) {
                if (typeof mostrarToast === 'function') mostrarToast('❌ Error al eliminar el chat');
            }
        });
    }

    // ==========================================
    // 8. INICIALIZACIÓN Y LÓGICA DE URL
    // ==========================================
    await cargarListaChats();

    const urlParams = new URLSearchParams(window.location.search);
    const nuevoChatId = urlParams.get('nuevoChat');
    const chatExistenteId = urlParams.get('chat'); 
    const esPanico = urlParams.get('panico');

    if (chatExistenteId) {
        try {
            const chats = await fetchAuth('/chats');
            const chatData = chats.find(c => c._id === chatExistenteId);
            if (chatData) {
                seleccionarChat(chatExistenteId, chatData);
            }
        } catch (e) {
            if (typeof mostrarToast === 'function') mostrarToast('No se pudo abrir la conversación.');
        }
    } else if (nuevoChatId) {
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
        // 🔑 BOTÓN SOS INTELIGENTE
        if (typeof mostrarToast === 'function') mostrarToast('🚨 Buscando un psicólogo disponible en línea...');
        try {
            const psicologos = await fetchAuth('/psicologos');
            if (!psicologos || psicologos.length === 0) throw new Error('No hay psicólogos en el sistema');
            
            // Filtramos a los psicólogos que estén en línea
            const psicologosEnLinea = psicologos.filter(p => estaEnLinea(p));
            
            let psicologoAsignado = null;
            
            if (psicologosEnLinea.length > 0) {
                // Si hay alguien en línea, lo elegimos
                psicologoAsignado = psicologosEnLinea[0];
                if (typeof mostrarToast === 'function') mostrarToast(`✅ Conectado con ${psicologoAsignado.nombre}`);
            } else {
                // Si no hay nadie en línea, usamos el primero (fallback) y avisamos
                psicologoAsignado = psicologos[0];
                if (typeof mostrarToast === 'function') mostrarToast('⚠️ No hay psicólogos en línea ahora. Te conectamos con el primero disponible.');
            }
            
            const res = await fetchAuth('/chats', {
                method: 'POST',
                body: JSON.stringify({ psicologoId: psicologoAsignado._id })
            });
            await cargarListaChats();
            seleccionarChat(res._id, res);
        } catch (error) {
            chatMensajes.innerHTML = `<p class="text-center" style="color: var(--error); margin-top: 2rem;">No pudimos conectarte. Intenta de nuevo.</p>`;
        }
    }
});