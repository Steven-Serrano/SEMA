// frontend/js/api.js

const API_URL = 'http://localhost:3000/api';

// Manejo seguro del token y usuario en el navegador
const Auth = {
    getToken: () => localStorage.getItem('sema_token'),
    setToken: (token) => localStorage.setItem('sema_token', token),
    removeToken: () => localStorage.removeItem('sema_token'),
    getUser: () => JSON.parse(localStorage.getItem('sema_user') || '{}'),
    setUser: (user) => localStorage.setItem('sema_user', JSON.stringify(user)),
    clear: () => {
        localStorage.removeItem('sema_token');
        localStorage.removeItem('sema_user');
    }
};

// Función genérica para hacer peticiones con el token automáticamente
async function fetchAuth(endpoint, options = {}) {
    const token = Auth.getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Error en la petición al servidor');
    }

    return data;
}