import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  User,
  Eye,
  XCircle
} from 'lucide-react'
import { doctorsAPI } from '../services/api'

function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [acknowledging, setAcknowledging] = useState(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await doctorsAPI.getAlerts()
      setAlerts(response.data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (alertId) => {
    setAcknowledging(alertId)
    try {
      await doctorsAPI.acknowledgeAlert(alertId, { resolved_by: 1 })
      await fetchAlerts() // Refresh alerts
    } catch (error) {
      if (error.response?.status === 400) {
        alert('Alert already resolved')
      } else {
        alert('Failed to acknowledge alert')
      }
    } finally {
      setAcknowledging(null)
    }
  }

  const getSeverityColor = (severity) => {
    if (severity >= 4) return 'bg-red-100 text-red-800 border-red-200'
    if (severity >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const getSeverityText = (severity) => {
    if (severity >= 4) return 'Critical'
    if (severity >= 3) return 'High'
    if (severity >= 2) return 'Medium'
    return 'Low'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const activeAlerts = alerts.filter(alert => !alert.is_resolved)
  const resolvedAlerts = alerts.filter(alert => alert.is_resolved)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">Alerts</h1>
        <p className="text-secondary-600">Monitor and manage patient alerts and red flags</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Active Alerts</p>
              <p className="text-2xl font-bold text-secondary-800">{activeAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Resolved</p>
              <p className="text-2xl font-bold text-secondary-800">{resolvedAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Alerts</p>
              <p className="text-2xl font-bold text-secondary-800">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-secondary-800 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          Active Alerts ({activeAlerts.length})
        </h2>

        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-secondary-600">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {getSeverityText(alert.severity)}
                      </span>
                      <span className="ml-2 text-xs text-secondary-500">
                        {formatDate(alert.created_at)}
                      </span>
                    </div>
                    <h3 className="font-medium text-secondary-800 mb-1">{alert.title}</h3>
                    <p className="text-sm text-secondary-600 mb-2">{alert.message}</p>
                    <div className="flex items-center text-sm text-secondary-500">
                      <User className="h-4 w-4 mr-1" />
                      <span>Patient: {alert.patient_name}</span>
                      <span className="mx-2">•</span>
                      <span>Type: {alert.alert_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/doctor/patient/${alert.patient_id}`}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Patient
                    </Link>
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledging === alert.id}
                      className="btn-primary text-sm flex items-center disabled:opacity-50"
                    >
                      {acknowledging === alert.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            Resolved Alerts ({resolvedAlerts.length})
          </h2>

          <div className="space-y-3">
            {resolvedAlerts.map((alert) => (
              <div key={alert.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Resolved
                      </span>
                      <span className="ml-2 text-xs text-secondary-500">
                        Resolved: {formatDate(alert.resolved_at)}
                      </span>
                    </div>
                    <h3 className="font-medium text-secondary-800 mb-1">{alert.title}</h3>
                    <p className="text-sm text-secondary-600 mb-2">{alert.message}</p>
                    <div className="flex items-center text-sm text-secondary-500">
                      <User className="h-4 w-4 mr-1" />
                      <span>Patient: {alert.patient_name}</span>
                      <span className="mx-2">•</span>
                      <span>Type: {alert.alert_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/doctor/patient/${alert.patient_id}`}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Patient
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertsPage
