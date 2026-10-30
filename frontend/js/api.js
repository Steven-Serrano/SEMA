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
    const user = Auth.getUser();
    
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

        const esPeticionDeLogin = endpoint.includes('/auth/login') || endpoint.includes('/auth-psicologo/login') || endpoint.includes('/auth-admin/login');

        // 🔑 CORRECCIÓN: Redirigir al login correcto según el rol
        if (response.status === 401 && !esPeticionDeLogin) {
            Auth.clear();
            if (user.rol === 'administrador_sena' || user.rol === 'super_administrador') {
                window.location.href = 'login-admin.html';
            } else {
                window.location.href = 'login.html';
            }
            return;
        }

        if (response.status === 204) return { success: true };

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

function getImgUrl(ruta) {
    if (!ruta) return 'assets/avatar-default.png';
    if (ruta.startsWith('http') || ruta.startsWith('data:')) return ruta;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${ruta}`;
}