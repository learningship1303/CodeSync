import axios from 'axios';

// 1. Create a global Axios instance pointed to our secure backend port
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', // Maps perfectly to our system design refined backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. 🚀 Outgoing Request Interceptor: Attach the user's JWT token to headers on every single call
API.interceptors.request.use(
  (config) => {
    // Look up the active login session string inside browser storage
    const storedUser = localStorage.getItem('codesync_user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // If token explicitly exists, append it using the standard Bearer configuration scheme
        if (parsedUser && parsedUser.token) {
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      } catch (error) {
        console.error('Frontend interceptor session extraction leak:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Incoming Response Interceptor: Catch dynamic system level crashes (like 401 Session Expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("FAILED REQUEST:");
    console.log(error.config?.url);
    console.log(error.response?.status);

    const authMessage = String(error.response?.data?.message || '').toLowerCase();
    const isInvalidSession =
      error.response?.status === 401 &&
      (
        authMessage.includes('token') ||
        authMessage.includes('session expired') ||
        authMessage.includes('authorization')
      );

    if (isInvalidSession) {
      localStorage.removeItem('codesync_user');
    }

    return Promise.reject(error);
  }
);

export default API;
