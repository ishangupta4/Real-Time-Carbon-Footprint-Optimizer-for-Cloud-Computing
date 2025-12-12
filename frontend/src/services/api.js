

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});


api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const carbonAPI = {
    
    health: async () => {
        const response = await api.get('/health');
        return response.data;
    },

    
    getCarbonIntensity: async (includeForecast = false) => {
        const response = await api.get('/carbon-intensity', {
            params: { include_forecast: includeForecast }
        });
        return response.data;
    },

    
    getForecast: async (hours = 24) => {
        const response = await api.get('/carbon-intensity/forecast', {
            params: { hours }
        });
        return response.data;
    },

    
    getDatacenters: async () => {
        const response = await api.get('/datacenters');
        return response.data;
    },

    
    optimize: async (workloads, algorithm = 'greedy', datacenters = null) => {
        const response = await api.post('/optimize', {
            workloads,
            algorithm,
            datacenters
        });
        return response.data;
    },

    
    simulate: async (count = 50, timeSpanHours = 24, mode = 'normal') => {
        const response = await api.post('/simulate', {
            count,
            time_span_hours: timeSpanHours,
            mode
        });
        return response.data;
    },

    
    compare: async (workloads, algorithms = null) => {
        const response = await api.post('/compare', {
            workloads,
            algorithms
        });
        return response.data;
    },

    
    uploadWorkloads: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_BASE_URL}/upload/parse`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
        });
        return response.data;
    },

    
    downloadCSVTemplate: () => {
        window.open(`${API_BASE_URL}/upload/template/csv`, '_blank');
    },

    
    downloadJSONTemplate: () => {
        window.open(`${API_BASE_URL}/upload/template/json`, '_blank');
    },
};

export default carbonAPI;