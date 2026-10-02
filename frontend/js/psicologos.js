document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('psi-grid');
    const buscador = document.getElementById('buscador-psi');
    
    try {
        // Cargar psicólogos reales desde el backend
        const psicologos = await fetchAuth('/psicologos');
        
        function render(lista) {
            grid.innerHTML = lista.map(p => `
                <article class="tarjeta psi-card">
                    <div class="avatar-grande">${p.nombre.charAt(0)}${p.nombre.split(' ')[1]?.charAt(0) || ''}</div>
                    <h3>${p.nombre}</h3>
                    <p class="especialidad">${p.especialidad}</p>
                    <p class="rating">⭐ ${p.verificado ? 'Verificado' : 'Pendiente'}</p>
                    <a href="citas.html?psicologo=${p._id}" class="btn btn-primario" style="margin-top:.5rem">
                        Agendar cita
                    </a>
                </article>
            `).join('');
        }
        
        render(psicologos);
        
        // Buscador funcional
        if (buscador) {
            buscador.addEventListener('input', e => {
                const q = e.target.value.toLowerCase();
                render(psicologos.filter(p => 
                    (p.nombre + ' ' + p.especialidad).toLowerCase().includes(q)
                ));
            });
        }
        
    } catch (error) {
        grid.innerHTML = `<p style="color: var(--error)">Error al cargar psicólogos: ${error.message}</p>`;
    }
});