import axios from 'axios';

// Ortak axios instance
export const apiClient = axios.create({
  baseURL: __DEV__ ? 'http://localhost:3000/api' : 'https://your-api.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
