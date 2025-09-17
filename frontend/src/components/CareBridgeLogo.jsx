import React from 'react'

const CareBridgeLogo = () => {
  return (
    <div style={{
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
    }}>
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 24 24" 
        fill="white"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
  )
}

export default CareBridgeLogo
