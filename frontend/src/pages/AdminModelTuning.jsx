import React, { useState, useEffect } from 'react';
import { Brain, Settings, TrendingUp, AlertTriangle, CheckCircle, Save, RefreshCw } from 'lucide-react';
import { API_CONFIG } from '../config/api';

const AdminModelTuning = () => {
  const [modelSettings, setModelSettings] = useState({
    safety_thresholds: {
      crisis: 0.95,
      self_harm: 0.85,
      high_risk: 0.70,
      moderation: 0.60
    },
    ai_response_settings: {
      temperature: 0.7,
      max_tokens: 500,
      response_type: 'therapeutic'
    },
    escalation_settings: {
      sla_critical: 5,  // minutes
      sla_high: 15,     // minutes
      sla_medium: 120,  // minutes
      sla_low: 1440    // minutes
    }
  });
  
  const [performanceMetrics, setPerformanceMetrics] = useState({
    safety_accuracy: 0.92,
    response_quality: 0.88,
    escalation_time: 8.5,
    false_positive_rate: 0.05
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fetchModelSettings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/admin/model-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch model settings');
      }

      const data = await response.json();
      setModelSettings(data.settings);
    } catch (err) {
      console.error('Error fetching model settings:', err);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/admin/performance-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }

      const data = await response.json();
      setPerformanceMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
    }
  };

  const saveModelSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/admin/model-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: modelSettings })
      });

      if (!response.ok) {
        throw new Error('Failed to save model settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setModelSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const getPerformanceColor = (value, threshold) => {
    if (value >= threshold) return '#10b981'; // green
    if (value >= threshold * 0.8) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getPerformanceIcon = (value, threshold) => {
    if (value >= threshold) return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
    if (value >= threshold * 0.8) return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
    return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
  };

  useEffect(() => {
    fetchModelSettings();
    fetchPerformanceMetrics();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Brain style={{ width: '32px', height: '32px', color: '#3b82f6', marginRight: '12px' }} />
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Model Tuning Dashboard
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Configure AI models and safety thresholds
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={fetchPerformanceMetrics}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px', marginRight: '6px' }} />
            Refresh Metrics
          </button>
          
          <button
            onClick={saveModelSettings}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: saved ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Save style={{ width: '16px', height: '16px', marginRight: '6px' }} />
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Performance Metrics */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <TrendingUp style={{ width: '20px', height: '20px', marginRight: '8px', color: '#3b82f6' }} />
            Performance Metrics
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Safety Accuracy */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', margin: 0 }}>
                  Safety Accuracy
                </h3>
                {getPerformanceIcon(performanceMetrics.safety_accuracy, 0.9)}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getPerformanceColor(performanceMetrics.safety_accuracy, 0.9)
              }}>
                {(performanceMetrics.safety_accuracy * 100).toFixed(1)}%
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Target: 90%+
              </p>
            </div>

            {/* Response Quality */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', margin: 0 }}>
                  Response Quality
                </h3>
                {getPerformanceIcon(performanceMetrics.response_quality, 0.85)}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getPerformanceColor(performanceMetrics.response_quality, 0.85)
              }}>
                {(performanceMetrics.response_quality * 100).toFixed(1)}%
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Target: 85%+
              </p>
            </div>

            {/* Average Escalation Time */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', margin: 0 }}>
                  Avg Escalation Time
                </h3>
                {getPerformanceIcon(performanceMetrics.escalation_time, 10, true)} {/* Lower is better */}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getPerformanceColor(performanceMetrics.escalation_time, 10, true)
              }}>
                {performanceMetrics.escalation_time.toFixed(1)} min
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Target: &lt;10 min
              </p>
            </div>

            {/* False Positive Rate */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', margin: 0 }}>
                  False Positive Rate
                </h3>
                {getPerformanceIcon(performanceMetrics.false_positive_rate, 0.05, true)} {/* Lower is better */}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getPerformanceColor(performanceMetrics.false_positive_rate, 0.05, true)
              }}>
                {(performanceMetrics.false_positive_rate * 100).toFixed(1)}%
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Target: &lt;5%
              </p>
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Settings style={{ width: '20px', height: '20px', marginRight: '8px', color: '#3b82f6' }} />
            Model Settings
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Safety Thresholds */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 16px 0' }}>
                Safety Thresholds
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(modelSettings.safety_thresholds).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      minWidth: '100px',
                      textTransform: 'capitalize'
                    }}>
                      {key.replace('_', ' ')}:
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={value}
                      onChange={(e) => updateSetting('safety_thresholds', key, parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      minWidth: '40px'
                    }}>
                      {(value * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Response Settings */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 16px 0' }}>
                AI Response Settings
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151',
                    minWidth: '100px'
                  }}>
                    Temperature:
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={modelSettings.ai_response_settings.temperature}
                    onChange={(e) => updateSetting('ai_response_settings', 'temperature', parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    minWidth: '40px'
                  }}>
                    {modelSettings.ai_response_settings.temperature.toFixed(1)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151',
                    minWidth: '100px'
                  }}>
                    Max Tokens:
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={modelSettings.ai_response_settings.max_tokens}
                    onChange={(e) => updateSetting('ai_response_settings', 'max_tokens', parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    minWidth: '40px'
                  }}>
                    {modelSettings.ai_response_settings.max_tokens}
                  </span>
                </div>
              </div>
            </div>

            {/* Escalation Settings */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 16px 0' }}>
                Escalation SLA Settings
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(modelSettings.escalation_settings).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      minWidth: '100px',
                      textTransform: 'capitalize'
                    }}>
                      {key.replace('sla_', '').replace('_', ' ')}:
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="1440"
                      step="1"
                      value={value}
                      onChange={(e) => updateSetting('escalation_settings', key, parseInt(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      minWidth: '60px'
                    }}>
                      {value} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModelTuning;
