document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) return;

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    
    document.getElementById('nombre-mes').textContent = meses[mesActual];

    const emojisEmociones = { 'Muy bien': '😄', 'Bien': '🙂', 'Neutro': '😐', 'Triste': '😔', 'Ansioso': '😰' };
    const emojisSueno = { 'Malo': '😴', 'Regular': '😐', 'Excelente': '🤩', 'Excesivo': '🥱' };

    // ==========================================
    // 1. CARGAR TODOS LOS DATOS EN PARALELO
    // ==========================================
    async function cargarTodo() {
        try {
            // Pedimos los 3 endpoints al mismo tiempo
            const [stats, estados, suenos] = await Promise.all([
                fetchAuth('/habitos/resumen-mensual').catch(() => null),
                fetchAuth('/estados-emocionales').catch(() => []),
                fetchAuth('/habitos/sueno').catch(() => [])
            ]);

            // Una vez que tenemos los datos, los dibujamos
            renderResumenMensual(stats);
            renderEmociones(estados);
            renderCalendarioSueno(suenos);
            generarResumenGeneral(stats, estados);

        } catch (error) {
            console.error("Error cargando seguimiento:", error);
        }
    }

    // ==========================================
    // 2. GENERAR EL RESUMEN INTELIGENTE
    // ==========================================
    function generarResumenGeneral(stats, estados) {
        const icono = document.getElementById('resumen-icono');
        const titulo = document.getElementById('resumen-titulo');
        const desc = document.getElementById('resumen-descripcion');

        // Contar emociones positivas y negativas
        let positivas = 0;
        let negativas = 0;
        
        estados.forEach(e => {
            if (e.estado === 'Muy bien' || e.estado === 'Bien') positivas++;
            if (e.estado === 'Triste' || e.estado === 'Ansioso') negativas++;
        });

        // Contar hábitos totales
        const totalHabitos = (stats?.meditacion || 0) + (stats?.diario || 0) + (stats?.sueno || 0);

        // Lógica del veredicto
        if (totalHabitos === 0 && estados.length === 0) {
            icono.textContent = '🌱';
            titulo.textContent = 'Es un nuevo comienzo';
            desc.textContent = 'Aún no tienes registros este mes. ¡Empieza a usar tus herramientas y llena este espacio!';
        } 
        else if (positivas > negativas && totalHabitos >= 5) {
            icono.textContent = '🌟';
            titulo.textContent = '¡Estás imparable!';
            desc.textContent = 'Tu ánimo es muy positivo y estás siendo muy constante con tus hábitos. ¡Sigue así, campeón!';
        } 
        else if (negativas > positivas) {
            icono.textContent = '💙';
            titulo.textContent = 'Hemos notado días pesados';
            desc.textContent = 'No estás solo. Recuerda que puedes hablar con un psicólogo en el chat o usar el botón SOS si lo necesitas.';
        } 
        else {
            icono.textContent = '🚀';
            titulo.textContent = 'Vas por buen camino';
            desc.textContent = 'Tus emociones están equilibradas y estás construyendo hábitos. ¡Un paso a la vez!';
        }
    }

    // ==========================================
    // 3. RENDERIZAR TOTALES
    // ==========================================
    function renderResumenMensual(stats) {
        if (stats) {
            document.getElementById('total-meditacion').textContent = stats.meditacion || 0;
            document.getElementById('total-diario').textContent = stats.diario || 0;
            document.getElementById('total-sueno').textContent = stats.sueno || 0;
        }
    }

    // ==========================================
    // 4. RENDERIZAR EMOCIONES
    // ==========================================
    function renderEmociones(estados) {
        const graficoContainer = document.getElementById('grafico-emociones');
        const listaContainer = document.getElementById('lista-emociones');

        if (!estados || estados.length === 0) {
            graficoContainer.innerHTML = '<p class="text-suave text-center" style="width:100%;">Aún no hay registros.</p>';
            listaContainer.innerHTML = '<p class="text-suave text-center">Sin registros recientes.</p>';
            return;
        }

        const conteo = {};
        estados.forEach(e => { conteo[e.estado] = (conteo[e.estado] || 0) + 1; });
        const maxConteo = Math.max(...Object.values(conteo));

        graficoContainer.innerHTML = Object.keys(conteo).map(emocion => {
            const cantidad = conteo[emocion];
            const alturaPorcentaje = maxConteo > 0 ? (cantidad / maxConteo) * 100 : 0;
            return `
                <div class="bar" style="height: ${Math.max(alturaPorcentaje, 15)}%; min-height: 40px;" title="${emocion}: ${cantidad} veces">
                    <em>${cantidad}</em>
                    <span style="font-size: 1.2rem;">${emojisEmociones[emocion] || '😐'}</span>
                    <span style="bottom: -25px; font-size: 0.7rem;">${emocion}</span>
                </div>
            `;
        }).join('');

        listaContainer.innerHTML = estados.slice(0, 5).map(reg => {
            const fecha = new Date(reg.fecha).toLocaleDateString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `
                <div class="historial-item" style="padding: 0.8rem 0;">
                    <div class="historial-icono" style="width: 40px; height: 40px; font-size: 1.4rem; background: var(--superficie);">
                        ${emojisEmociones[reg.estado] || '😐'}
                    </div>
                    <div class="flex-1">
                        <h4 style="font-size: 0.95rem;">${reg.estado}</h4>
                        <small class="text-suave">${fecha}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==========================================
    // 5. RENDERIZAR CALENDARIO
    // ==========================================
    function renderCalendarioSueno(registros) {
        const wrapper = document.getElementById('calendario-sueno');
        const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
        
        let primerDia = new Date(anioActual, mesActual, 1).getDay();
        primerDia = primerDia === 0 ? 6 : primerDia - 1; 

        let html = `
            <div class="calendario-header">
                <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
            </div>
            <div class="calendario-grid">
        `;

        for (let i = 0; i < primerDia; i++) {
            html += `<div class="calendario-dia vacio"></div>`;
        }

        for (let dia = 1; dia <= diasEnMes; dia++) {
            const registroDia = registros.find(r => {
                const fechaReg = new Date(r.fecha);
                return fechaReg.getDate() === dia && fechaReg.getMonth() === mesActual && fechaReg.getFullYear() === anioActual;
            });

            let contenidoDia = `<span class="calendario-numero">${dia}</span>`;
            let claseExtra = '';

            if (registroDia) {
                claseExtra = `tiene-sueno calidad-${registroDia.calidad.toLowerCase()}`;
                contenidoDia += `
                    <div class="calendario-info">
                        <span class="calendario-horas">${registroDia.horas}h</span>
                        <span class="calendario-emoji" title="${registroDia.calidad}">${emojisSueno[registroDia.calidad] || ''}</span>
                    </div>
                `;
            } else if (dia === fechaActual.getDate()) {
                claseExtra = 'hoy';
            }

            html += `<div class="calendario-dia ${claseExtra}">${contenidoDia}</div>`;
        }

        html += `</div>`;
        wrapper.innerHTML = html;
    }

    // Iniciar
    cargarTodo();
});