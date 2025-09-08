import { useState, useEffect } from 'react'
import { Eye, User, Clock, AlertTriangle, Activity } from 'lucide-react'

function AdminActivityMonitor() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, doctor, patient

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      // Mock data for now - in real app, this would come from backend
      const mockActivities = [
        {
          id: 1,
          user_type: 'doctor',
          user_name: 'Dr. Sarah Johnson',
          action: 'Viewed patient profile',
          details: 'Accessed John Smith\'s medical records',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
          severity: 'info'
        },
        {
          id: 2,
          user_type: 'patient',
          user_name: 'John Smith',
          action: 'Created journal entry',
          details: 'Mood: Anxious, Content: Feeling stressed about work',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          severity: 'normal'
        },
        {
          id: 3,
          user_type: 'doctor',
          user_name: 'Dr. Sarah Johnson',
          action: 'Added treatment note',
          details: 'Updated treatment plan for John Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
          severity: 'info'
        },
        {
          id: 4,
          user_type: 'patient',
          user_name: 'John Smith',
          action: 'Crisis alert triggered',
          details: 'High-risk keywords detected in journal entry',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          severity: 'high'
        },
        {
          id: 5,
          user_type: 'doctor',
          user_name: 'Dr. Sarah Johnson',
          action: 'Acknowledged alert',
          details: 'Responded to crisis alert for John Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 65), // 1h 5min ago
          severity: 'urgent'
        }
      ]
      setActivities(mockActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.user_type === filter
  )

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'urgent': return '#dc2626'
      case 'high': return '#ea580c'
      case 'info': return '#0284c7'
      case 'normal': return '#059669'
      default: return '#6b7280'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'urgent':
      case 'high':
        return <AlertTriangle style={{ width: '16px', height: '16px' }} />
      default:
        return <Activity style={{ width: '16px', height: '16px' }} />
    }
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading activities...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          Activity Monitor
        </h1>
        <p style={{ color: '#475569', marginTop: '4px' }}>
          Real-time monitoring of all user activities
        </p>
      </div>

      {/* Filter Buttons */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {[
          { key: 'all', label: 'All Activities', icon: Activity },
          { key: 'doctor', label: 'Doctor Actions', icon: User },
          { key: 'patient', label: 'Patient Actions', icon: User }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              border: '1px solid',
              borderColor: filter === key ? '#0284c7' : '#d1d5db',
              borderRadius: '8px',
              background: filter === key ? '#eff6ff' : 'white',
              color: filter === key ? '#0284c7' : '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <Icon style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            {label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {filteredActivities.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Activity style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280' }}>No activities found</p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              style={{
                padding: '16px 20px',
                borderBottom: index < filteredActivities.length - 1 ? '1px solid #e5e7eb' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              {/* Severity Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: getSeverityColor(activity.severity) + '20',
                color: getSeverityColor(activity.severity),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getSeverityIcon(activity.severity)}
              </div>

              {/* Activity Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'white',
                    background: activity.user_type === 'doctor' ? '#059669' : '#0284c7',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {activity.user_type}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                    {activity.user_name}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 4px 0' }}>
                  {activity.action}
                </h3>
                
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                  {activity.details}
                </p>
              </div>

              {/* Timestamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af', fontSize: '12px' }}>
                <Clock style={{ width: '12px', height: '12px' }} />
                {formatTimestamp(activity.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '500' }}>
                Total Activities
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                {activities.length}
              </p>
            </div>
            <Activity style={{ width: '32px', height: '32px', color: '#0284c7' }} />
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '500' }}>
                Critical Alerts
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                {activities.filter(a => a.severity === 'urgent' || a.severity === 'high').length}
              </p>
            </div>
            <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '500' }}>
                Doctor Actions
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                {activities.filter(a => a.user_type === 'doctor').length}
              </p>
            </div>
            <User style={{ width: '32px', height: '32px', color: '#059669' }} />
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '500' }}>
                Patient Actions
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7', margin: 0 }}>
                {activities.filter(a => a.user_type === 'patient').length}
              </p>
            </div>
            <User style={{ width: '32px', height: '32px', color: '#0284c7' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminActivityMonitor
