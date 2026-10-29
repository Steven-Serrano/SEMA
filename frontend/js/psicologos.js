document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth === 'undefined' || !Auth.getToken()) {
        window.location.href = "login.html";
        return;
    }

    const listaContainer = document.getElementById('lista-psicologos');
    const buscador = document.getElementById('buscador-psicologos');
    let psicologosData = [];

    // 1. CARGAR PSICÓLOGOS DESDE EL BACKEND
    async function cargarPsicologos() {
        try {
            const psicologos = await fetchAuth('/psicologos');
            psicologosData = psicologos;
            renderizarPsicologos(psicologosData);
        } catch (error) {
            console.error('Error cargando psicólogos:', error);
            listaContainer.innerHTML = `
                <div class="tarjeta text-center" style="grid-column: 1 / -1; color: var(--rojo);">
                    <i class="fi fi-bs-warning" style="font-size: 2rem; display: block; margin-bottom: 1rem;"></i>
                    <p>Error al cargar el directorio. Intenta de nuevo más tarde.</p>
                </div>
            `;
        }
    }

    // 2. RENDERIZAR LAS TARJETAS
    function renderizarPsicologos(lista) {
        if (!lista || lista.length === 0) {
            listaContainer.innerHTML = `
                <div class="tarjeta text-center" style="grid-column: 1 / -1;">
                    <i class="fi fi-bs-user-doctor" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                    <p class="text-suave">No se encontraron psicólogos disponibles.</p>
                </div>
            `;
            return;
        }

        listaContainer.innerHTML = lista.map(p => {
            // Generar iniciales si no hay foto
            const iniciales = p.nombre ? p.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PS';
            
            // 🔑 AQUÍ ESTÁ EL ARREGLO: Usamos getImgUrl
            const foto = p.fotoPerfil ? getImgUrl(p.fotoPerfil) : null;

            return `
                <div class="tarjeta psi-card aparecer-2">
                    ${foto 
                        ? `<img src="${foto}" alt="${p.nombre}" class="avatar-grande" style="object-fit: cover;">` 
                        : `<div class="avatar-grande">${iniciales}</div>`
                    }
                    
                    <h3>${p.nombre || 'Psicólogo'}</h3>
                    <p class="especialidad">${p.especialidad || 'Psicología General'}</p>
                    
                    <div class="rating mb-1">
                        <i class="fi fi-sr-star"></i> ${p.rating || '5.0'} 
                        <span class="text-suave" style="font-size: 0.8rem;">(Reseñas)</span>
                    </div>

                    <p class="text-sm text-suave mb-1-5" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${p.biografia || 'Profesional comprometido con tu bienestar emocional.'}
                    </p>

                    <a href="citas.html?psicologoId=${p._id}" class="btn btn-primario" style="width: 100%;">
                        <i class="fi fi-bs-calendar-plus"></i> Agendar cita
                    </a>
                </div>
            `;
        }).join('');
    }

    // 3. BUSCADOR (Filtra en tiempo real)
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtrados = psicologosData.filter(p => 
                (p.nombre && p.nombre.toLowerCase().includes(query)) || 
                (p.especialidad && p.especialidad.toLowerCase().includes(query))
            );
            renderizarPsicologos(filtrados);
        });
    }

    // Iniciar
    await cargarPsicologos();
});