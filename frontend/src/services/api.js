import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_type')
      localStorage.removeItem('user_name')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const doctorsAPI = {
  getPatients: () => api.get('/doctor/patients'),
  getPatientSummary: (id) => api.get(`/doctor/patients/${id}/summary`),
  getAlerts: () => api.get('/doctor/alerts'),
  acknowledgeAlert: (id, data) => api.post(`/doctor/alerts/${id}/acknowledge`, data),
  createNote: (data) => api.post('/doctor/notes', data),
  getNotes: () => api.get('/doctor/notes'),
  getStats: () => api.get('/doctor/stats'),
}

export const patientsAPI = {
  // Patient-specific endpoints
  sendChat: (message) => api.post('/patient/chat', { message }),
  createJournal: (data) => api.post('/patient/journal', data),
  getHistory: () => api.get('/patient/history'),
  getSummary: () => api.get('/patient/summary'),
  // Admin endpoints
  getAll: () => api.get('/admin/patients'),
  getById: (id) => api.get(`/admin/patients/${id}`),
  create: (data) => api.post('/admin/patients', data),
  update: (id, data) => api.put(`/admin/patients/${id}`, data),
  delete: (id) => api.delete(`/admin/patients/${id}`),
}

export const interactionsAPI = {
  getAll: () => api.get('/interactions'),
  create: (data) => api.post('/interactions', data),
}

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getAudit: () => api.get('/admin/audit'),
  getHighRiskAlerts: () => api.get('/admin/alerts/high-risk'),
  getDoctors: () => api.get('/admin/doctors'),
  createDoctor: (data) => api.post('/admin/doctors', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),
  getPatients: () => api.get('/admin/patients'),
  createPatient: (data) => api.post('/admin/patients', data),
  updatePatient: (id, data) => api.put(`/admin/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/admin/patients/${id}`),
}

export const healthAPI = {
  check: () => api.get('/health'),
}

export { api }
export default api