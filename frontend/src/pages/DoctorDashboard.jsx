import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Activity,
  Heart
} from 'lucide-react'
import { doctorsAPI } from '../services/api'

function DoctorDashboard() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeAlerts: 0,
    recentInteractions: 0,
    avgMoodScore: 0
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await doctorsAPI.getPatients()
      setPatients(response.data)
      setStats({
        totalPatients: response.data.length,
        activeAlerts: response.data.filter(p => p.status === 'Alert').length,
        recentInteractions: response.data.filter(p => p.last_contact).length,
        avgMoodScore: 0.7 // Mock data
      })
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">Doctor Dashboard</h1>
        <p className="text-secondary-600">Welcome back, Dr. Smith. Here's your patient overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Patients</p>
              <p className="text-2xl font-bold text-secondary-800">{stats.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Active Alerts</p>
              <p className="text-2xl font-bold text-secondary-800">{stats.activeAlerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Recent Interactions</p>
              <p className="text-2xl font-bold text-secondary-800">{stats.recentInteractions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Avg Mood Score</p>
              <p className="text-2xl font-bold text-secondary-800">{stats.avgMoodScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-800">Recent Patients</h2>
          <Link to="/doctor/patients" className="text-primary-600 hover:text-primary-700 font-medium">
            View All
          </Link>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No patients assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patients.slice(0, 5).map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-secondary-800">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-secondary-600">{patient.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    patient.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {patient.status}
                  </span>
                  <Link
                    to={`/doctor/patient/${patient.id}`}
                    className="btn-primary text-sm"
                  >
                    View Patient
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard
