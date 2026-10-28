document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DATOS DE PRUEBA (Fallback si la API falla)
    // ==========================================
    let posts = [
        {
            id: 1, autor: 'Mario', ini: 'M', tiempo: 'hace 2h',
            texto: 'Logré terminar mis exámenes finales. Fue duro, pero SEMA me ayudó a mantenerme enfocado.',
            likes: 24, gustado: false, comentado: false, compartido: false,
            comentarios: [], categoria: 'Logro Personal'
        },
        {
            id: 2, autor: 'Sofía', ini: 'S', tiempo: 'hace 5h',
            texto: 'Compartir aquí me hace sentir menos sola. Gracias a todos por leer.',
            likes: 42, gustado: false, comentado: false, compartido: false,
            comentarios: [], categoria: 'Reflexión'
        },
        {
            id: 3, autor: 'Diego', ini: 'D', tiempo: 'hace 1d',
            texto: 'Empecé a meditar 10 min al día. La diferencia es real.',
            likes: 31, gustado: false, comentado: false, compartido: false,
            comentarios: [], categoria: 'Motivación'
        }
    ];

    // Función auxiliar para mostrar toasts
    function toast(msg) {
        if (typeof mostrarToast === 'function') return mostrarToast(msg);
        if (window.SEMA && window.SEMA.toast) return window.SEMA.toast(msg);
        alert(msg); // Último recurso
    }

    // ==========================================
    // 2. INTENTAR CARGAR DESDE EL BACKEND
    // ==========================================
    async function cargarPublicaciones() {
        try {
            // Descomentar cuando el backend esté listo
            /*
            const data = await fetchAuth('/posts');
            if (data && data.length > 0) posts = data;
            */
            render(posts);
        } catch (error) {
            console.warn('Usando datos de prueba para comunidad:', error);
            render(posts);
        }
    }

    // ==========================================
    // 3. RENDERIZAR PUBLICACIONES
    // ==========================================
    const contenedorPosts = document.getElementById('posts');

    function render(lista = posts) {
        if (!lista.length) {
            contenedorPosts.innerHTML = `
                <div class="tarjeta comunidad-vacio">
                    <div class="comunidad-vacio-icono"><i class="fi fi-bs-seedling"></i></div>
                    <h3>No hay publicaciones aquí todavía</h3>
                    <p>Cuando haya contenido disponible, aparecerá en esta sección.</p>
                </div>
            `;
            return;
        }

        contenedorPosts.innerHTML = lista.map(p => `
            <article class="post" data-id="${p.id}">
                <div class="avatar">${p.ini}</div>
                <div class="flex-1">
                    <h4>${p.autor}</h4>
                    <div class="meta">${p.tiempo} · <span style="color:var(--azul); font-weight:600;">${p.categoria}</span></div>
                    <p class="post-texto">${p.texto}</p>

                    <div class="acciones">
                        <button type="button" class="${p.gustado ? 'gustado' : ''}" onclick="darLike(${p.id})">
                            <i class="fi fi-bs-heart"></i> ${p.likes}
                        </button>
                        <button type="button" onclick="abrirComentario(${p.id})">
                            <i class="fi fi-bs-comment"></i> Comentar
                        </button>
                        <button type="button" onclick="compartir(${p.id})">
                            <i class="fi fi-bs-share"></i> Compartir
                        </button>
                    </div>

                    ${p.comentarios && p.comentarios.length ? `
                        <div class="comentarios-lista">
                            ${p.comentarios.map(c => `
                                <div class="comentario">
                                    <div class="comentario-avatar">${c.autor.charAt(0)}</div>
                                    <div class="comentario-contenido">
                                        <strong>${c.autor}</strong>
                                        <span class="comentario-tiempo">· ${c.tiempo}</span>
                                        <p>${c.texto}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </article>
        `).join('');
    }

    // ==========================================
    // 4. INTERACCIONES (Likes, Comentarios, Compartir)
    // ==========================================
    window.darLike = async function(id) {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        
        post.gustado = !post.gustado;
        post.likes += post.gustado ? 1 : -1;
        render(); // Renderizado optimista

        try {
            // Descomentar cuando el backend esté listo
            // await fetchAuth(`/posts/${id}/like`, { method: 'POST' });
        } catch (e) {
            console.error('Error al dar like en backend', e);
        }
    };

    window.abrirComentario = function(id) {
        const post = posts.find(p => p.id === id);
        if (!post) return;

        // Evitar duplicar el formulario si ya está abierto
        const postElement = document.querySelector(`.post[data-id="${id}"]`);
        if (postElement.querySelector('.comentario-form')) return;

        const formHtml = `
            <div class="comentario-form">
                <textarea class="comentario-input" id="input-comentario-${id}" placeholder="Escribe tu comentario..."></textarea>
                <div class="comentario-acciones">
                    <button type="button" class="btn btn-primario" onclick="publicarComentario(${id})">
                        <i class="fi fi-bs-check"></i> Publicar
                    </button>
                    <button type="button" class="btn btn-secundario" onclick="this.closest('.comentario-form').remove()">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        postElement.querySelector('.acciones').insertAdjacentHTML('afterend', formHtml);
        document.getElementById(`input-comentario-${id}`).focus();
    };

    window.publicarComentario = async function(id) {
        const post = posts.find(p => p.id === id);
        const input = document.getElementById(`input-comentario-${id}`);
        const texto = input.value.trim();

        if (!texto) return toast('Escribe un comentario antes de publicar.');

        // Guardado local (Optimista)
        post.comentarios.push({ autor: 'Tú', texto: texto, tiempo: 'ahora' });
        post.comentado = true;
        render();
        toast('Comentario publicado');

        try {
            // Descomentar cuando el backend esté listo
            /*
            await fetchAuth(`/posts/${id}/comment`, {
                method: 'POST',
                body: JSON.stringify({ texto })
            });
            */
        } catch (e) {
            console.error('Error al comentar en backend', e);
        }
    };

    window.compartir = function(id) {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        post.compartido = true;
        render();
        toast('Publicación marcada como compartida');
    };

    // ==========================================
    // 5. CREAR NUEVA PUBLICACIÓN
    // ==========================================
    document.getElementById('form-post').addEventListener('submit', async (e) => {
        e.preventDefault();
        const texto = document.getElementById('post-texto').value.trim();
        const categoria = document.getElementById('post-categoria').value;

        if (!texto) return;

        const nuevaPub = {
            id: Date.now(), autor: 'Tú', ini: 'T', tiempo: 'ahora',
            texto: texto, likes: 0, gustado: false, comentado: false, 
            compartido: false, categoria: categoria, comentarios: []
        };

        posts.unshift(nuevaPub);
        e.target.reset();
        render();
        toast('Publicación creada con éxito');

        try {
            // Descomentar cuando el backend esté listo
            /*
            await fetchAuth('/posts', {
                method: 'POST',
                body: JSON.stringify({ texto, categoria })
            });
            */
        } catch (error) {
            console.error('Error al publicar en backend', error);
        }
    });

    // ==========================================
    // 6. TABS Y FILTROS
    // ==========================================
    document.querySelectorAll('.comunidad-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.comunidad-tab').forEach(t => t.classList.remove('activo'));
            tab.classList.add('activo');
            cambiarSeccion(tab.dataset.seccion);
        });
    });

    function cambiarSeccion(seccion) {
        let resultado = [];
        switch (seccion) {
            case 'comunidad': resultado = posts; break;
            case 'mis-publicaciones': resultado = posts.filter(post => post.autor === 'Tú'); break;
            case 'me-gusta': resultado = posts.filter(post => post.gustado === true); break;
            case 'comentados': resultado = posts.filter(post => post.comentado === true); break;
            case 'compartidos': resultado = posts.filter(post => post.compartido === true); break;
            default: resultado = posts;
        }
        render(resultado);
    }

    document.getElementById('filtro-categoria').addEventListener('change', (e) => {
        const cat = e.target.value;
        if (cat === 'Todas') return render(posts);
        render(posts.filter(post => post.categoria === cat));
    });

    // Iniciar
    cargarPublicaciones();
});