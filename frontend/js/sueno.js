document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) return;

    const slider = document.getElementById('horasSlider');
    const horasDisplay = document.getElementById('horasDisplay');
    const btnSumar = document.getElementById('btn-sumar');
    const btnRestar = document.getElementById('btn-restar');
    const btnGuardar = document.getElementById('btnGuardarSueno');
    const selectorCalidad = document.getElementById('calidadSueno');
    const contenedorHistorial = document.getElementById('historialSueno');
    const calidadAutoText = document.getElementById('calidadAutoText');
    
    // Variables para el motivo
    const motivoContainer = document.getElementById('motivoContainer');
    const motivoInput = document.getElementById('motivoSueno');
    
    let calidadSeleccionada = '';
    let calidadSugerida = '';
    let yaRegistroHoy = false;

    // 1. Lógica automática según las horas
    function determinarCalidad(horas) {
        if (horas < 5) return 'Malo';
        if (horas >= 5 && horas <= 6) return 'Regular';
        if (horas >= 7 && horas <= 9) return 'Excelente';
        return 'Excesivo'; 
    }

    function aplicarCalidadAutomatica(horas) {
        if (yaRegistroHoy) return;

        calidadSugerida = determinarCalidad(horas);
        calidadSeleccionada = calidadSugerida; 

        document.querySelectorAll('#calidadSueno .animo-btn').forEach(btn => {
            btn.classList.remove('activo');
            if (btn.dataset.calidad === calidadSugerida) btn.classList.add('activo');
        });

        const emojis = { 'Malo': '😴', 'Regular': '😐', 'Excelente': '🤩', 'Excesivo': '🥱' };
        calidadAutoText.innerHTML = `✨ Calidad sugerida: ${calidadSugerida} ${emojis[calidadSugerida]}`;
        calidadAutoText.style.color = calidadSugerida === 'Excelente' ? 'var(--verde)' : 'var(--texto-suave)';
        
        // Si vuelve a las horas sugeridas, ocultamos el motivo
        motivoContainer.style.display = 'none';
        motivoInput.value = '';
    }

    function actualizarHoras(valor) {
        if (valor < 1) valor = 1;
        if (valor > 12) valor = 12;
        slider.value = valor;
        horasDisplay.textContent = valor;
        aplicarCalidadAutomatica(valor);
    }

    slider.addEventListener('input', (e) => {
        horasDisplay.textContent = e.target.value;
        aplicarCalidadAutomatica(parseInt(e.target.value));
    });

    btnSumar.addEventListener('click', () => { if(!yaRegistroHoy) actualizarHoras(parseInt(slider.value) + 1); });
    btnRestar.addEventListener('click', () => { if(!yaRegistroHoy) actualizarHoras(parseInt(slider.value) - 1); });

    // 2. Selección manual (Lógica del "¿Por qué?")
    selectorCalidad.addEventListener('click', (e) => {
        if (yaRegistroHoy) return;
        const btn = e.target.closest('.animo-btn');
        if (!btn) return;
        
        document.querySelectorAll('.animo-btn').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        calidadSeleccionada = btn.dataset.calidad;
        
        if (calidadSeleccionada !== calidadSugerida) {
            // El usuario cambió el emoji, mostramos el "¿Por qué?"
            motivoContainer.style.display = 'block';
            calidadAutoText.innerHTML = `📝 Calidad seleccionada: ${calidadSeleccionada}`;
            calidadAutoText.style.color = 'var(--rojo)';
        } else {
            // Volvió al emoji sugerido, ocultamos
            motivoContainer.style.display = 'none';
            motivoInput.value = '';
            calidadAutoText.innerHTML = `✨ Calidad sugerida: ${calidadSugerida}`;
            calidadAutoText.style.color = 'var(--verde)';
        }
    });

    // 3. Guardar
    btnGuardar.addEventListener('click', async function() {
        if (yaRegistroHoy) return;

        const horas = parseInt(slider.value);
        const motivo = motivoInput.value.trim();

        // Validación del motivo
        if (calidadSeleccionada !== calidadSugerida && !motivo) {
            motivoInput.focus();
            return mostrarToast('⚠️ Debes explicar por qué no te sientes como lo recomendado.');
        }

        const textoOriginal = this.innerHTML;
        this.disabled = true;
        this.innerHTML = '<span class="spinner"></span> Guardando...';

        try {
            await fetchAuth('/habitos/sueno', {
                method: 'POST',
                body: JSON.stringify({ 
                    horas: horas, 
                    calidad: calidadSeleccionada,
                    motivo: (calidadSeleccionada !== calidadSugerida) ? motivo : '' 
                })
            });
            
            mostrarToast('✅ Registro guardado con éxito');
            cargarHistorial(); 

        } catch (error) {
            mostrarToast('❌ ' + (error.message || 'Error al guardar'));
            this.disabled = false;
            this.innerHTML = textoOriginal;
        }
    });

    // 4. Historial
    async function cargarHistorial() {
        try {
            const registros = await fetchAuth('/habitos/sueno');
            
            if (!registros || registros.length === 0) {
                contenedorHistorial.innerHTML = '<p class="text-suave text-center">Aún no tienes registros de sueño.</p>';
                aplicarCalidadAutomatica(parseInt(slider.value));
                return;
            }

            const hoyStr = new Date().toDateString();
            const primerRegistroFecha = new Date(registros[0].fecha).toDateString();
            
            if (hoyStr === primerRegistroFecha) {
                yaRegistroHoy = true;
                deshabilitarFormulario();
            } else {
                aplicarCalidadAutomatica(parseInt(slider.value));
            }

            const emojis = { 'Malo': '😴', 'Regular': '😐', 'Excelente': '🤩', 'Excesivo': '🥱' };

            contenedorHistorial.innerHTML = registros.map(reg => {
                const fecha = new Date(reg.fecha).toLocaleDateString('es', { 
                    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' 
                });
                const emoji = emojis[reg.calidad] || '💤';
                
                return `
                    <div class="historial-item">
                        <div class="historial-icono">${emoji}</div>
                        <div class="flex-1">
                            <h4>${reg.horas} horas de sueño</h4>
                            <small class="text-suave" style="text-transform: capitalize;">${fecha}</small>
                            ${reg.motivo ? `<p style="font-size: 0.85rem; color: var(--rojo); margin-top: 0.4rem; background: rgba(239, 68, 68, 0.05); padding: 0.4rem; border-radius: 4px;"><strong>Nota:</strong> "${reg.motivo}"</p>` : ''}
                        </div>
                        <span class="badge badge-azul">${reg.calidad}</span>
                    </div>
                `;
            }).join('');

        } catch (error) {
            contenedorHistorial.innerHTML = '<p class="text-suave text-center" style="color: var(--error);">Error al cargar el historial.</p>';
        }
    }

    function deshabilitarFormulario() {
        slider.disabled = true;
        btnSumar.disabled = true;
        btnRestar.disabled = true;
        selectorCalidad.style.pointerEvents = 'none';
        selectorCalidad.style.opacity = '0.5';
        motivoContainer.style.display = 'none';
        
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fi fi-bs-check"></i> Ya registrado hoy';
        btnGuardar.classList.replace('btn-primario', 'btn-secundario');
        
        calidadAutoText.innerHTML = '✅ Ya registraste tu sueño hoy';
        calidadAutoText.style.color = 'var(--texto-suave)';
    }

    cargarHistorial();
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