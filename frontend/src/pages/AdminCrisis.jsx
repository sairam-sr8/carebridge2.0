import { useState, useEffect } from 'react'
import api from '../services/api'

const AdminCrisis = () => {
  const [highRiskAlerts, setHighRiskAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('created_at')

  useEffect(() => {
    fetchHighRiskAlerts()
  }, [])

  const fetchHighRiskAlerts = async () => {
    try {
      const response = await api.get('/admin/alerts/high-risk')
      setHighRiskAlerts(response.data)
    } catch (error) {
      console.error('Error fetching high-risk alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedAlerts = [...highRiskAlerts].sort((a, b) => {
    switch (sortBy) {
      case 'severity':
        return b.severity - a.severity
      case 'urgency_level':
        return b.urgency_level - a.urgency_level
      case 'created_at':
      default:
        return new Date(b.created_at) - new Date(a.created_at)
    }
  })

  const getSeverityColor = (severity) => {
    if (severity >= 5) return 'bg-red-100 text-red-800 border-red-200'
    if (severity >= 4) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getUrgencyIcon = (urgency) => {
    if (urgency >= 5) return '🚨'
    if (urgency >= 4) return '⚠️'
    if (urgency >= 3) return '⚡'
    return '📋'
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">Crisis Coordination</h1>
        <p className="text-secondary-600">Monitor and manage high-risk alerts requiring immediate attention</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total High-Risk Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{highRiskAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Severity (5)</p>
              <p className="text-2xl font-bold text-gray-900">
                {highRiskAlerts.filter(alert => alert.severity >= 5).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Urgency (5)</p>
              <p className="text-2xl font-bold text-gray-900">
                {highRiskAlerts.filter(alert => alert.urgency_level >= 5).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="created_at">Most Recent</option>
            <option value="severity">Highest Severity</option>
            <option value="urgency_level">Highest Urgency</option>
          </select>
        </div>
      </div>

      {/* High-Risk Alerts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">High-Risk Alerts</h3>
          <p className="text-sm text-gray-500">Unresolved critical alerts requiring immediate attention</p>
        </div>
        
        {sortedAlerts.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No high-risk alerts</h3>
            <p className="mt-1 text-sm text-gray-500">All systems are operating normally.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedAlerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getUrgencyIcon(alert.urgency_level)}</span>
                      <h4 className="text-lg font-medium text-gray-900">{alert.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        Severity {alert.severity}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Patient:</span> {alert.patient_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Doctor:</span> {alert.doctor_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Alert Type:</span> {alert.alert_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Urgency Level:</span> {alert.urgency_level}/5
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">{alert.message}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Created: {formatTimestamp(alert.created_at)}</span>
                      <span className="text-red-600 font-medium">{getTimeAgo(alert.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                      Escalate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCrisis
