import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Company APIs
export const companyAPI = {
    get: () => api.get('/company'),
    update: (data) => api.put('/company', data),
};

// Customer APIs
export const customerAPI = {
    create: (data) => api.post('/customers', data),
    getAll: () => api.get('/customers'),
    get: (id) => api.get(`/customers/${id}`),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// Pool APIs
export const poolAPI = {
    create: (data) => api.post('/pools', data),
    getAll: (customerId) => api.get('/pools', { params: { customer_id: customerId } }),
    get: (id) => api.get(`/pools/${id}`),
};

// AMC Plan APIs
export const amcPlanAPI = {
    create: (data) => api.post('/amc-plans', data),
    getAll: () => api.get('/amc-plans'),
    update: (id, data) => api.put(`/amc-plans/${id}`, data),
    delete: (id) => api.delete(`/amc-plans/${id}`),
};

// AMC Assignment APIs
export const amcAssignmentAPI = {
    create: (data) => api.post('/amc-assignments', data),
    getAll: (customerId) => api.get('/amc-assignments', { params: { customer_id: customerId } }),
    assignEngineer: (id, engineerId) => api.put(`/amc-assignments/${id}/engineer?engineer_id=${engineerId}`),
};

// Engineer APIs
export const engineerAPI = {
    create: (data) => api.post('/engineers', data),
    getAll: () => api.get('/engineers'),
    delete: (id) => api.delete(`/engineers/${id}`),
};

// Service APIs (Admin)
export const serviceAPI = {
    getAll: (params) => api.get('/services', { params }),
    assign: (id, engineerId) => api.put(`/services/${id}/assign?engineer_id=${engineerId}`),
};

// Engineer Service APIs
export const engineerServiceAPI = {
    getMyServices: (date) => api.get('/engineer/services', { params: { date } }),
    startService: (data) => api.post('/engineer/services/start', data),
    endService: (data) => api.post('/engineer/services/end', data),
    getServiceLog: (serviceId) => api.get(`/engineer/services/${serviceId}/log`),
};

// Customer Portal APIs
export const customerPortalAPI = {
    getProfile: () => api.get('/customer/profile'),
    getPools: () => api.get('/customer/pools'),
    getServices: () => api.get('/customer/services'),
    getAMCs: () => api.get('/customer/amcs'),
};

// Dashboard APIs
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
};

export default api;
