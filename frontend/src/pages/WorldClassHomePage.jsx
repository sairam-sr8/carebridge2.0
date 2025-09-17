import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TriageChatbot from '../components/TriageChatbot'

const WorldClassHomePage = () => {
  const navigate = useNavigate()
  const [isLoaded, setIsLoaded] = useState(false)
  const [showTriageChatbot, setShowTriageChatbot] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleLogin = () => {
    navigate('/login')
  }

  const handleGetStarted = () => {
    setShowTriageChatbot(true)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8074c9 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Advanced Animated Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at ${mousePosition.x * 0.1}% ${mousePosition.y * 0.1}%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(128, 116, 201, 0.2) 0%, transparent 50%),
          linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)
        `,
        animation: 'backgroundFlow 20s ease-in-out infinite'
      }} />
      
      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${20 + i * 10}px`,
          height: `${20 + i * 10}px`,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `particleFloat ${5 + i}s ease-in-out infinite ${i * 0.5}s`,
          backdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }} />
      ))}
      
      {/* Premium Header with Login */}
      <div style={{
        position: 'absolute',
        top: '30px',
        right: '30px',
        zIndex: 100
      }}>
        <button
          onClick={handleLogin}
          style={{
            padding: '14px 28px',
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.25)'
            e.target.style.transform = 'translateY(-3px) scale(1.05)'
            e.target.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.15)'
            e.target.style.transform = 'translateY(0) scale(1)'
            e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
          Sign In
        </button>
      </div>

      {/* HERO SECTION - WORLD CLASS */}
      <div style={{ 
        textAlign: 'center', 
        zIndex: 2,
        position: 'relative',
        maxWidth: '900px',
        animation: isLoaded ? 'heroReveal 1.2s ease-out' : 'none'
      }}>
        
        {/* Revolutionary Logo Design */}
        <div style={{
          width: '160px',
          height: '160px',
          background: 'linear-gradient(135deg, #8074c9 0%, #a855f7 30%, #c084fc 60%, #fbbf24 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `
            0 30px 80px rgba(128, 116, 201, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3)
          `,
          animation: 'none',
          position: 'relative',
          margin: '0 auto 40px auto',
          border: '6px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(30px)'
        }}>
          
          {/* Rotating Glow Ring */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            right: '-20px',
            bottom: '-20px',
            background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.4), transparent, rgba(168, 85, 247, 0.3), transparent)',
            borderRadius: '50%',
            animation: 'ringRotate 4s linear infinite',
            opacity: 0.7
          }} />
          
          {/* Original CareBridge Logo */}
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            zIndex: 2
          }}>
            {/* Human figure on bridge - ORIGINAL DESIGN */}
            <svg width="80" height="80" viewBox="0 0 100 100" style={{ fill: 'white' }}>
              {/* Bridge */}
              <path d="M10 70 Q50 50 90 70" stroke="white" strokeWidth="4" fill="none" />
              <path d="M10 73 Q50 53 90 73" stroke="white" strokeWidth="2" fill="none" />
              
              {/* Human figure */}
              <circle cx="50" cy="45" r="8" fill="white" />
              <rect x="46" y="53" width="8" height="15" fill="white" rx="2" />
              <rect x="44" y="56" width="4" height="10" fill="white" rx="1" />
              <rect x="52" y="56" width="4" height="10" fill="white" rx="1" />
              <rect x="46" y="68" width="3" height="8" fill="white" rx="1" />
              <rect x="51" y="68" width="3" height="8" fill="white" rx="1" />
            </svg>
          </div>
          
          {/* Pulse Rings */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            animation: 'pulseRing 3s ease-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '120%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            animation: 'pulseRing 3s ease-out infinite 1s'
          }} />
        </div>

        {/* Dynamic Title with Text Animation */}
        <h1 style={{ 
          fontSize: '5rem', 
          fontWeight: '900', 
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 30%, #e0e7ff 60%, #c7d2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'titleWave 2s ease-out',
          letterSpacing: '-3px',
          textShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
          position: 'relative'
        }}>
          CareBridge
          
          {/* Animated Underline */}
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0%',
            height: '4px',
            background: 'linear-gradient(90deg, #8074c9, #a855f7, #c084fc)',
            borderRadius: '2px',
            animation: 'underlineExpand 1.5s ease-out 0.5s both'
          }} />
        </h1>
        
        {/* Animated Tagline */}
        <p style={{ 
          fontSize: '1.5rem', 
          marginBottom: '60px',
          color: 'rgba(255, 255, 255, 0.95)',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          maxWidth: '800px',
          lineHeight: '1.8',
          margin: '0 auto 60px auto',
          animation: 'textReveal 1s ease-out 1s both',
          fontWeight: '500'
        }}>
          <span style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Your AI-powered mental health companion.
          </span>
          <br />
          <span style={{ opacity: 0.9, fontSize: '1.2rem' }}>
            Get personalized support, connect with healthcare professionals, and take control of your wellbeing journey.
          </span>
        </p>
        
        {/* Revolutionary CTA Button */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '22px 55px',
              fontSize: '1.3rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.9) 100%)',
              color: '#8074c9',
              border: 'none',
              borderRadius: '60px',
              cursor: 'pointer',
              boxShadow: `
                0 20px 50px rgba(0,0,0,0.2),
                0 0 0 1px rgba(255, 255, 255, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.5)
              `,
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              backdropFilter: 'blur(30px)',
              position: 'relative',
              overflow: 'hidden',
              animation: 'ctaEntrance 1s ease-out 1.5s both',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-10px) scale(1.08)'
              e.target.style.boxShadow = `
                0 35px 80px rgba(0,0,0,0.3),
                0 0 0 2px rgba(255, 255, 255, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.7)
              `
              e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)'
              e.target.style.boxShadow = `
                0 20px 50px rgba(0,0,0,0.2),
                0 0 0 1px rgba(255, 255, 255, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.5)
              `
              e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.9) 100%)'
            }}
          >
             <span style={{ position: 'relative', zIndex: 2 }}>
               Start Your Mental Health Journey
             </span>
            
            {/* Animated Shimmer */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(128, 116, 201, 0.4), transparent)',
              animation: 'shimmerSlide 3s ease-in-out infinite',
              borderRadius: '60px'
            }} />
          </button>
          
          {/* Button Glow Effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(circle, rgba(128, 116, 201, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'glowPulse 3s ease-in-out infinite',
            zIndex: -1
          }} />
        </div>
        
        {/* Feature Showcase */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          marginTop: '80px',
          maxWidth: '900px',
          animation: 'featuresSlide 1s ease-out 2s both'
        }}>
           {[
             { icon: '⚡', title: 'AI-Powered Assessment', desc: 'Advanced mental health analysis with personalized insights' },
             { icon: '⚕', title: 'Expert Care Network', desc: 'Connect with qualified mental health professionals' },
             { icon: '🛡', title: 'Privacy & Security', desc: 'Your data is encrypted and completely confidential' }
           ].map((feature, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '35px 25px',
              borderRadius: '25px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: `featureFloat ${3 + index}s ease-in-out infinite ${index * 0.5}s`,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-10px) scale(1.05)'
              e.target.style.background = 'rgba(255, 255, 255, 0.2)'
              e.target.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)'
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              e.target.style.boxShadow = 'none'
            }}
            >
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                animation: `iconBounce ${2 + index * 0.5}s ease-in-out infinite`
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                marginBottom: '15px',
                color: 'white'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.6',
                margin: 0
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Triage Chatbot */}
      <TriageChatbot 
        isOpen={showTriageChatbot} 
        onClose={() => setShowTriageChatbot(false)} 
      />

      {/* Ultra-Modern Floating Chat Icon */}
      <div
        onClick={() => setShowTriageChatbot(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #8074c9 0%, #a855f7 50%, #c084fc 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `
            0 15px 40px rgba(128, 116, 201, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.4)
          `,
          zIndex: 1000,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: 'chatIconFloat 4s ease-in-out infinite',
          border: '4px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.2) translateY(-5px) rotate(5deg)'
          e.target.style.boxShadow = `
            0 25px 60px rgba(128, 116, 201, 0.6),
            0 0 0 3px rgba(255, 255, 255, 0.5),
            inset 0 2px 0 rgba(255, 255, 255, 0.6)
          `
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1) translateY(0) rotate(0deg)'
          e.target.style.boxShadow = `
            0 15px 40px rgba(128, 116, 201, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.4)
          `
        }}
      >
         <div style={{
           fontSize: '32px',
           color: 'white',
           textShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
           animation: 'iconPulse 2s ease-in-out infinite'
         }}>
           ⚕
         </div>
        
        {/* Notification Dot */}
        <div style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '18px',
          height: '18px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
          borderRadius: '50%',
          animation: 'notificationPulse 2s ease-in-out infinite',
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)'
        }} />
      </div>

      {/* Advanced CSS Animations */}
      <style jsx>{`
        @keyframes heroReveal {
          0% { opacity: 0; transform: translateY(50px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes logoRevolution {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.05); }
          50% { transform: rotate(180deg) scale(1.1); }
          75% { transform: rotate(270deg) scale(1.05); }
        }
        
        @keyframes ringRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes iconBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        
        @keyframes titleWave {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes underlineExpand {
          0% { width: 0%; }
          100% { width: 80%; }
        }
        
        @keyframes textReveal {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes ctaEntrance {
          0% { opacity: 0; transform: translateY(30px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes shimmerSlide {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes featuresSlide {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes featureFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes chatIconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes notificationPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        
        @keyframes backgroundFlow {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}

export default WorldClassHomePage
