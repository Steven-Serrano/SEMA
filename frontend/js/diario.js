document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) return;

    const btnGuardar = document.getElementById('btnGuardar');
    const inputTexto = document.getElementById('textoDiario');
    const contenedorLista = document.getElementById('listaDiario');

    // 1. CARGAR ENTRADAS
    async function cargarEntradas() {
        try {
            const entradas = await fetchAuth('/habitos/diario');
            
            if (!entradas || entradas.length === 0) {
                contenedorLista.innerHTML = `
                    <div class="text-center text-suave" style="padding: 2rem;">
                        <i class="fi fi-bs-book-open" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                        <p>Aún no has escrito nada. ¡Anímate a plasmar tu día!</p>
                    </div>
                `;
                return;
            }

            contenedorLista.innerHTML = entradas.map(entry => {
                const fechaObj = new Date(entry.fecha);
                const fecha = fechaObj.toLocaleDateString('es', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                });
                const hora = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="diario-item" data-id="${entry._id}">
                        <div class="diario-item-header">
                            <span class="diario-fecha" style="text-transform: capitalize;">
                                <i class="fi fi-bs-calendar"></i> ${fecha}
                            </span>
                            <span class="text-suave" style="font-size: 0.8rem;">${hora}</span>
                        </div>
                        
                        <!-- Contenido normal -->
                        <p class="diario-contenido">${entry.contenido}</p>
                        
                        <!-- Botones de acción -->
                        <div class="diario-botones" id="botones-${entry._id}">
                            <button class="btn-accion-editar" onclick="editarEntrada('${entry._id}')">
                                <i class="fi fi-bs-edit"></i> Editar
                            </button>
                            <button class="btn-accion-borrar" onclick="eliminarEntrada('${entry._id}')">
                                <i class="fi fi-bs-trash"></i> Borrar
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error(error);
            contenedorLista.innerHTML = `
                <p class="text-center" style="color: var(--error);">
                    <i class="fi fi-bs-warning"></i> Error al cargar el diario.
                </p>
            `;
        }
    }

    // 2. GUARDAR NUEVA ENTRADA
    btnGuardar.addEventListener('click', async function() {
        const texto = inputTexto.value.trim();
        if (!texto) return mostrarToast('✍️ Escribe algo antes de guardar');

        const textoOriginal = this.innerHTML;
        this.disabled = true;
        this.innerHTML = '<span class="spinner"></span> Guardando...';

        try {
            await fetchAuth('/habitos/diario', {
                method: 'POST',
                body: JSON.stringify({ contenido: texto })
            });
            inputTexto.value = ''; 
            mostrarToast('✅ Entrada guardada');
            cargarEntradas();
        } catch (error) {
            mostrarToast('❌ Error al guardar');
        } finally {
            this.disabled = false;
            this.innerHTML = textoOriginal;
        }
    });

    // 3. ELIMINAR ENTRADA
    window.eliminarEntrada = async function(id) {
        if (!confirm('¿Estás seguro de que quieres borrar esta entrada?')) return;
        try {
            await fetchAuth(`/habitos/diario/${id}`, { method: 'DELETE' });
            mostrarToast('🗑️ Entrada eliminada');
            cargarEntradas();
        } catch (error) {
            mostrarToast('❌ Error al eliminar');
        }
    };

    // 4. EDITAR ENTRADA (En línea)
    window.editarEntrada = function(id) {
        const item = document.querySelector(`.diario-item[data-id="${id}"]`);
        const pContenido = item.querySelector('.diario-contenido');
        const divBotones = document.getElementById(`botones-${id}`);
        const textoActual = pContenido.textContent;

        // Ocultar párrafo y botones actuales
        pContenido.style.display = 'none';
        divBotones.style.display = 'none';

        // Crear textarea de edición
        const textarea = document.createElement('textarea');
        textarea.className = 'diario-textarea-edit';
        textarea.value = textoActual;
        textarea.id = `edit-input-${id}`;

        // Crear botones de guardar/cancelar
        const editActions = document.createElement('div');
        editActions.className = 'diario-botones mt-0-5';
        editActions.innerHTML = `
            <button class="btn btn-primario btn-sm" onclick="guardarEdicion('${id}')">Guardar</button>
            <button class="btn btn-secundario btn-sm" onclick="cargarEntradas()">Cancelar</button>
        `;

        // Insertar en el DOM
        pContenido.parentNode.insertBefore(textarea, pContenido.nextSibling);
        pContenido.parentNode.insertBefore(editActions, textarea.nextSibling);
        
        textarea.focus();
    };

    // 5. GUARDAR EDICIÓN
    window.guardarEdicion = async function(id) {
        const textarea = document.getElementById(`edit-input-${id}`);
        const nuevoTexto = textarea.value.trim();

        if (!nuevoTexto) return mostrarToast('⚠️ El texto no puede estar vacío');

        try {
            await fetchAuth(`/habitos/diario/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ contenido: nuevoTexto })
            });
            mostrarToast('✅ Entrada actualizada');
            cargarEntradas(); // Recargar para ver el cambio
        } catch (error) {
            mostrarToast('❌ Error al actualizar');
        }
    };

    // Iniciar
    cargarEntradas();
});

function mostrarToast(texto) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = texto;
    toast.classList.add("activo");
    setTimeout(() => toast.classList.remove("activo"), 3000);
}