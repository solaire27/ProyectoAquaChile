import axios from 'axios';

const api = axios.create({
    baseURL: '/api', 
    timeout: 2500 // Falla rápido si no hay backend para activar los datos simulados
});

export default api;