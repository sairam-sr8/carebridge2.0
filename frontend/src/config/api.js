// API Configuration
const isDevelopment = import.meta.env.MODE === 'development'
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isDevelopment ? 'http://localhost:8000' : 'https://carebridge-production-3c20.up.railway.app')

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      CREATE_USER: '/api/v1/auth/admin/create-user',
      ME: '/api/v1/auth/me'
    },
    HEALTH: '/api/v1/health',
    DOCTOR: '/api/v1/doctor',
    PATIENT: '/api/v1/patient',
    ADMIN: '/api/v1/admin'
  }
}

export default API_CONFIG
