import axios from 'axios';

// Create a centralized Axios instance pointing to our Node backend
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Automatically attach the JWT token to every single request!
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // If the token expires (15 mins), instantly wipe it and kick them to login
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
