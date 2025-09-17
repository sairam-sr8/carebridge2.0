import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import WorldClassHomePage from './pages/WorldClassHomePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorTriageDashboard from './pages/DoctorTriageDashboard'
import DoctorPatients from './pages/DoctorPatients'
import DoctorAlerts from './pages/DoctorAlerts'
import DoctorReports from './pages/DoctorReports'
import PatientHome from './pages/PatientHome'
import PatientJournal from './pages/PatientJournal'
import PatientHistory from './pages/PatientHistory'
import DoctorSidebar from './components/DoctorSidebar'
import PatientSidebar from './components/PatientSidebar'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<WorldClassHomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DoctorDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
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
            
            <Route path="/doctor/triage" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DoctorTriageDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/patients" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DoctorPatients />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/alerts" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DoctorAlerts />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/doctor/reports" element={
              <ProtectedRoute requiredRole="doctor">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <DoctorSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DoctorReports />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            {/* Patient Routes */}
            <Route path="/patient" element={
              <ProtectedRoute requiredRole="patient">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <PatientSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <PatientHome />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/patient/journal" element={
              <ProtectedRoute requiredRole="patient">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <PatientSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <PatientJournal />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/patient/history" element={
              <ProtectedRoute requiredRole="patient">
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                  <PatientSidebar />
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <PatientHistory />
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
