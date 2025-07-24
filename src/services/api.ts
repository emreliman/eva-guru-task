import axios from 'axios';
import type { AxiosInstance } from 'axios';
import store from '@/store';

const api: AxiosInstance = axios.create({
  baseURL: 'https://iapitest.eva.guru/',
});

// Add a request interceptor to attach the access token
api.interceptors.request.use((config) => {
  // Do not attach token for login
  if (!config.url?.includes('/oauth/token')) {
    const token = (store.state as { auth?: { accessToken?: string } }).auth?.accessToken;
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

export default api; 