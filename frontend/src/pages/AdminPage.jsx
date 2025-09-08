import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminDashboard from './AdminDashboard'
import AdminUserManagement from './AdminUserManagement'
import AdminCompliance from './AdminCompliance'
import AdminCrisis from './AdminCrisis'
import AdminActivityMonitor from './AdminActivityMonitor'

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminDashboard />
      case 'users':
        return <AdminUserManagement />
      case 'activity':
        return <AdminActivityMonitor />
      case 'compliance':
        return <AdminCompliance />
      case 'crisis':
        return <AdminCrisis />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  )
}

export default AdminPage
