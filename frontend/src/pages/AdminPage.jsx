import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import AdminDashboard from './AdminDashboard'
import AdminUserManagement from './AdminUserManagement'
import AdminActivityMonitor from './AdminActivityMonitor'

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUserManagement />} />
          <Route path="/activity" element={<AdminActivityMonitor />} />
        </Routes>
      </div>
    </div>
  )
}

export default AdminPage
