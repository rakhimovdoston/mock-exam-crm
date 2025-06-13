import axios from 'axios';

export const apiUrl = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
    baseURL: apiUrl,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    console.error('Bad Request:', data?.message || 'Invalid request.');
                    break;
                case 401:
                    console.error('Unauthorized:', data?.message || 'Authentication required.');
                    break;
                case 403:
                    console.error('Forbidden:', data?.message || 'Access denied.');
                    break;
                case 404:
                    console.error('Not Found:', data?.message || 'Resource not found.');
                    break;
                case 500:
                    console.error('Server Error:', data?.message || 'Internal server error.');
                    break;
                default:
                    console.error('Unexpected Error:', data?.message || 'An error occurred.');
            }
        } else if (error.request) {
            console.error('No response received from the server:', error.request);
        } else {
            console.error('Request setup error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;