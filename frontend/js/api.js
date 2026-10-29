// frontend/js/api.js

const API_URL = 'http://localhost:3000/api';

const Auth = {
    getToken: () => localStorage.getItem('sema_token'),
    setToken: (token) => localStorage.setItem('sema_token', token),
    removeToken: () => localStorage.removeItem('sema_token'),
    getUser: () => {
        try {
            return JSON.parse(localStorage.getItem('sema_user') || '{}');
        } catch (e) {
            return {};
        }
    },
    setUser: (user) => localStorage.setItem('sema_user', JSON.stringify(user)),
    clear: () => {
        localStorage.removeItem('sema_token');
        localStorage.removeItem('sema_user');
    }
};

async function fetchAuth(endpoint, options = {}) {
    const token = Auth.getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        // 🔑 CORRECCIÓN CLAVE: Detectamos si estamos intentando iniciar sesión
        const esPeticionDeLogin = endpoint.includes('/auth/login') || endpoint.includes('/auth-psicologo/login');

        // Si el token expiró (401) y NO es un intento de login, cerramos sesión.
        // Si SÍ es un intento de login, dejamos que el error fluya para que login.js lo atrape.
        if (response.status === 401 && !esPeticionDeLogin) {
            Auth.clear();
            window.location.href = 'login.html';
            return;
        }

        // Manejar respuestas sin contenido (ej. DELETE exitoso)
        if (response.status === 204) {
            return { success: true };
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Error en la petición al servidor');
        }

        return data;
    } catch (error) {
        console.error(`Error en fetchAuth [${endpoint}]:`, error);
        throw error;
    }
}

// 🔑 Función global para obtener la URL correcta de cualquier imagen
function getImgUrl(ruta) {
    if (!ruta) return 'assets/avatar-default.png'; // Si no hay foto, mostramos el default
    if (ruta.startsWith('http') || ruta.startsWith('data:')) return ruta; // Si ya es URL o base64, la dejamos
    const baseUrl = API_URL.replace('/api', ''); // Quitamos el /api para que apunte al backend base
    return `${baseUrl}${ruta}`;
}