import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import SimpleHomePage from './pages/SimpleHomePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientsList from './pages/PatientsList'
import PatientDetail from './pages/PatientDetail'
import AlertsPage from './pages/AlertsPage'
import PatientHome from './pages/PatientHome'
import PatientJournal from './pages/PatientJournal'
import DoctorSidebar from './components/DoctorSidebar'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SimpleHomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } />
            
            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DoctorDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/patients" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <PatientsList />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/patient/:id" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <PatientDetail />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/alerts" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <AlertsPage />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/reports" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <div style={{ padding: '24px' }}>
                      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Reports</h1>
                      <p style={{ color: '#475569', marginTop: '8px' }}>Reports page coming soon...</p>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/settings" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <div style={{ padding: '24px' }}>
                      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Settings</h1>
                      <p style={{ color: '#475569', marginTop: '8px' }}>Settings page coming soon...</p>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            {/* Patient Routes */}
            <Route path="/patient" element={
              <ProtectedRoute requiredRole="patient">
                <PatientHome />
              </ProtectedRoute>
            } />
            
            <Route path="/patient/journal" element={
              <ProtectedRoute requiredRole="patient">
                <PatientJournal />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<SimpleHomePage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App