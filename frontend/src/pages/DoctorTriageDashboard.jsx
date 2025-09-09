import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

const DoctorTriageDashboard = () => {
  const [triageItems, setTriageItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  const fetchTriageItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/safety/triage/inbox`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch triage items');
      }

      const data = await response.json();
      setTriageItems(data.triage_items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeItem = async (itemId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/safety/triage/${itemId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge item');
      }

      // Refresh the list
      await fetchTriageItems();
      setSelectedItem(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const resolveItem = async (itemId, actionTaken) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/safety/triage/${itemId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action_taken: actionTaken,
          notes: actionNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve item');
      }

      // Refresh the list
      await fetchTriageItems();
      setSelectedItem(null);
      setActionNotes('');
    } catch (err) {
      setError(err.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc2626'; // red
      case 'high': return '#ea580c'; // orange
      case 'medium': return '#d97706'; // amber
      case 'low': return '#16a34a'; // green
      default: return '#6b7280'; // gray
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isOverdue = (slaDeadline) => {
    return new Date(slaDeadline) < new Date();
  };

  useEffect(() => {
    fetchTriageItems();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTriageItems, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading triage items...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: 0
        }}>
          🚨 Triage Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchTriageItems}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {triageItems.filter(item => item.sla_status === 'overdue').length} overdue
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Triage Items List */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '16px'
          }}>
            Pending Items ({triageItems.length})
          </h2>
          
          {triageItems.length === 0 ? (
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              🎉 No pending triage items!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {triageItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    backgroundColor: selectedItem?.id === item.id ? '#eff6ff' : 'white',
                    border: `2px solid ${selectedItem?.id === item.id ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {item.patient_name}
                      </h3>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        margin: '4px 0 0 0'
                      }}>
                        {item.interaction_content}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '4px' }}>
                      <span style={{
                        backgroundColor: getPriorityColor(item.priority),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {item.priority.toUpperCase()}
                      </span>
                      <span style={{
                        backgroundColor: getSeverityColor(item.severity),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                    <span>🕒 {formatTimeAgo(item.created_at)}</span>
                    <span style={{ 
                      color: isOverdue(item.sla_deadline) ? '#dc2626' : '#16a34a',
                      fontWeight: '500'
                    }}>
                      {isOverdue(item.sla_deadline) ? '⚠️ OVERDUE' : '✅ On time'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div>
          {selectedItem ? (
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '16px'
              }}>
                Item Details
              </h2>
              
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                    Patient: {selectedItem.patient_name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                    ID: {selectedItem.patient_id}
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                    Safety Analysis
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: getSeverityColor(selectedItem.severity),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {selectedItem.severity.toUpperCase()}
                    </span>
                    <span style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {Math.round(selectedItem.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                    Evidence Snippets
                  </h4>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {selectedItem.evidence_snippets.map((snippet, index) => (
                      <div key={index} style={{ 
                        backgroundColor: '#f3f4f6',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        fontStyle: 'italic'
                      }}>
                        "{snippet}"
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                    Interaction Content
                  </h4>
                  <div style={{ 
                    backgroundColor: '#f9fafb',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#374151',
                    border: '1px solid #e5e7eb'
                  }}>
                    {selectedItem.interaction_content}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                    Action Notes
                  </h4>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add notes about the action taken..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => acknowledgeItem(selectedItem.id)}
                    disabled={selectedItem.state !== 'pending'}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedItem.state !== 'pending' ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: selectedItem.state !== 'pending' ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✓ Acknowledge
                  </button>
                  
                  <button
                    onClick={() => resolveItem(selectedItem.id, 'reviewed_and_safe')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✓ Resolve as Safe
                  </button>
                  
                  <button
                    onClick={() => resolveItem(selectedItem.id, 'requires_follow_up')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ea580c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📞 Follow Up Required
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>
                Select a triage item
              </h3>
              <p style={{ fontSize: '14px', margin: 0 }}>
                Click on an item from the list to view details and take action
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorTriageDashboard;
