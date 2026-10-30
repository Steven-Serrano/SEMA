document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. CARGAR ESTADÍSTICAS REALES DESDE EL BACKEND
    async function cargarEstadisticas() {
        try {
            const res = await fetch(`${API_URL}/estadisticas`);
            const data = await res.json();

            const formatearNumero = (num) => {
                if (!num) return "0";
                return num >= 1000 ? `+${(num / 1000).toFixed(1)}k` : num;
            };

            const statUsuarios = document.getElementById('stat-usuarios');
            const statPsicologos = document.getElementById('stat-psicologos');
            const statCitas = document.getElementById('stat-citas');
            const statPublicaciones = document.getElementById('stat-publicaciones');

            if (statUsuarios) statUsuarios.textContent = formatearNumero(data.usuarios);
            if (statPsicologos) statPsicologos.textContent = formatearNumero(data.psicologos);
            if (statCitas) statCitas.textContent = formatearNumero(data.citas);
            if (statPublicaciones) statPublicaciones.textContent = formatearNumero(data.publicaciones);

            const textoConfianza = document.getElementById('texto-confianza');
            if (textoConfianza && data.usuarios !== undefined) {
                textoConfianza.textContent = `Más de ${data.usuarios.toLocaleString('es-CO')} jóvenes confían en nosotros.`;
            }

        } catch (error) {
            console.error('Error cargando estadísticas reales:', error);
            const textoConfianza = document.getElementById('texto-confianza');
            if (textoConfianza) textoConfianza.textContent = 'Sé parte de nuestra comunidad.';
        }
    }

    // 2. CARGAR HISTORIAS REALES (Ruta Pública)
    async function cargarTestimonios() {
        const contenedor = document.getElementById('contenedor-testimonios');
        if (!contenedor) return;

        try {
            // 🔑 Usamos la nueva ruta pública que creamos en el backend
            const res = await fetch(`${API_URL}/comunidad/publicas`);
            const posts = await res.json();

            console.log("Posts recibidos:", posts); // Para depurar en consola

            if (!res.ok) throw new Error("Error en la petición al servidor");

            if (!posts || posts.length === 0) {
                contenedor.innerHTML = `
                    <div class="tarjeta text-center" style="grid-column: 1/-1; background: #111A2E; border-color: #1E293B; padding: 3rem;">
                        <i class="fa-regular fa-comments" style="font-size: 3rem; color: #64748B; margin-bottom: 1rem;"></i>
                        <h3 style="color: #fff;">Aún no hay historias</h3>
                        <p style="color: #94A3B8;">Sé el primero en compartir tu experiencia en la comunidad.</p>
                        <a href="register.html" class="btn btn-primario mt-1">Unirme a la comunidad</a>
                    </div>
                `;
                return;
            }

            // Renderizamos las 3 tarjetas
            contenedor.innerHTML = posts.map(post => {
                // Manejo seguro por si el autor viene como objeto o string
                const nombreAutor = post.autor?.nombre || post.autor || 'Usuario Anónimo';
                const inicial = nombreAutor.charAt(0).toUpperCase();
                const fecha = new Date(post.createdAt || post.fecha).toLocaleDateString('es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                });

                return `
                    <div class="tarjeta tarjeta-hover" style="background: #111A2E; border: 1px solid #1E293B;">
                        <div style="color: #F59E0B; margin-bottom: 1rem; font-size: 1.1rem;">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                        </div>
                        <p style="color: #E2E8F0; font-size: 0.95rem; line-height: 1.6;">
                            "${post.contenido || post.texto}"
                        </p>
                        <div class="testimonio__autor mt-1 flex align-center gap-0-5" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #1E293B;">
                            <div class="avatar" style="background: var(--gradiente); color: white;">${inicial}</div>
                            <div>
                                <strong style="color: #fff; display: block;">${nombreAutor}</strong>
                                <small style="color: #94A3B8;">Comunidad SEMA · ${fecha}</small>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error cargando testimonios reales:', error);
            contenedor.innerHTML = `
                <div class="tarjeta text-center" style="grid-column: 1/-1; background: #111A2E; border-color: #1E293B; padding: 3rem;">
                    <p style="color: #94A3B8;">No se pudieron cargar las historias. Verifica la consola.</p>
                </div>
            `;
        }
    }

    // Ejecutamos ambas funciones
    await cargarEstadisticas();
    await cargarTestimonios();
});