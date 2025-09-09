import React, { useState } from 'react';
import { Shield, Brain, Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const ExplainabilityPanel = ({ explainabilityData, isOpen, onClose }) => {
  if (!isOpen || !explainabilityData) return null;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
    if (confidence >= 0.6) return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
    return <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Brain style={{ width: '24px', height: '24px', color: '#3b82f6', marginRight: '8px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              AI Response Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Confidence Score */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            {getConfidenceIcon(explainabilityData.confidence)}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 0 8px' }}>
              Response Confidence
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: getConfidenceColor(explainabilityData.confidence),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {Math.round(explainabilityData.confidence * 100)}%
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {explainabilityData.confidence >= 0.8 ? 'High Confidence' : 
                 explainabilityData.confidence >= 0.6 ? 'Medium Confidence' : 'Low Confidence'}
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                Based on clarity, empathy, and appropriateness
              </p>
            </div>
          </div>
        </div>

        {/* Response Analysis */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
            Response Analysis
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Sentiment */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <TrendingUp style={{ width: '16px', height: '16px', color: '#6b7280', marginRight: '6px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Sentiment</span>
              </div>
              <span style={{
                fontSize: '12px',
                color: explainabilityData.sentiment_analysis === 'positive' ? '#10b981' : 
                       explainabilityData.sentiment_analysis === 'negative' ? '#ef4444' : '#6b7280',
                fontWeight: '500'
              }}>
                {explainabilityData.sentiment_analysis?.charAt(0).toUpperCase() + explainabilityData.sentiment_analysis?.slice(1) || 'Neutral'}
              </span>
            </div>

            {/* Length */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <Lightbulb style={{ width: '16px', height: '16px', color: '#6b7280', marginRight: '6px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Length</span>
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                {explainabilityData.response_length || 0} characters
              </span>
            </div>
          </div>
        </div>

        {/* Key Themes */}
        {explainabilityData.key_themes && explainabilityData.key_themes.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
              Key Themes
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {explainabilityData.key_themes.map((theme, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {theme.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Therapeutic Elements */}
        {explainabilityData.therapeutic_elements && explainabilityData.therapeutic_elements.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
              Therapeutic Elements
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {explainabilityData.therapeutic_elements.map((element, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {element.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Safety Indicators */}
        {explainabilityData.safety_indicators && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
              Safety Indicators
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(explainabilityData.safety_indicators).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    backgroundColor: value ? '#fef2f2' : '#f3f4f6',
                    borderRadius: '6px',
                    border: `1px solid ${value ? '#fecaca' : '#e5e7eb'}`
                  }}
                >
                  <Shield style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: value ? '#dc2626' : '#9ca3af',
                    marginRight: '6px'
                  }} />
                  <span style={{
                    fontSize: '12px',
                    color: value ? '#dc2626' : '#6b7280',
                    fontWeight: '500'
                  }}>
                    {key.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Factors */}
        {explainabilityData.confidence_factors && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
              Confidence Factors
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(explainabilityData.confidence_factors).map(([factor, score]) => (
                <div key={factor} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#374151', minWidth: '100px' }}>
                    {factor.charAt(0).toUpperCase() + factor.slice(1)}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${score * 100}%`,
                      height: '100%',
                      backgroundColor: getConfidenceColor(score),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '30px' }}>
                    {Math.round(score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityPanel;
