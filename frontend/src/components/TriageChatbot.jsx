import React, { useState, useEffect, useRef } from 'react';
import './TriageChatbot.css';

const TriageChatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState('greeting');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [sessionId] = useState(Date.now().toString());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startConversation();
    }
  }, [isOpen]);

  const addMessage = (text, type = 'bot', buttons = null, isTyping = false) => {
    const newMessage = {
      id: Date.now() + Math.random(), // Ensure unique keys
      text,
      type,
      buttons,
      isTyping,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const showTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
  };

  const startConversation = () => {
    addMessage("Hello there! I'm Dr. Sarah, your CareBridge AI assistant.");
    setTimeout(() => {
      addMessage("I'm here to have a gentle conversation with you about how you've been feeling lately. Think of this as a safe space where you can share openly.");
    }, 1500);
    setTimeout(() => {
      addMessage("Before we begin, I'd love to know what to call you. What's your name?", 'bot', null, false);
      setCurrentStep('name');
    }, 3000);
  };

  const handleNameSubmit = (name) => {
    if (!name.trim()) return;
    
    setPatientName(name.trim());
    addMessage(name.trim(), 'user');
    
    showTyping();
    setTimeout(() => {
      addMessage(`It's wonderful to meet you, ${name.trim()}!`, 'bot');
    }, 1500);
    setTimeout(() => {
      addMessage(`To make sure I can connect you with the right support if needed, could you share your email address with me?`, 'bot');
      setCurrentStep('email');
    }, 3000);
  };

  const handleEmailSubmit = (email) => {
    if (!email.trim() || !email.includes('@')) {
      addMessage("I'd love to help, but I need a valid email address to continue. Could you double-check that for me?", 'bot');
      return;
    }
    
    setPatientEmail(email.trim());
    addMessage(email.trim(), 'user');
    
    showTyping();
    setTimeout(() => {
      addMessage(`Perfect, thank you ${patientName}!`, 'bot');
    }, 1500);
    setTimeout(() => {
      addMessage("Now, I'd like to have a gentle conversation about how you've been feeling. There are no right or wrong answers - just share what feels true for you.", 'bot');
    }, 3000);
    setTimeout(() => {
      addMessage("Ready to start our check-in together?", 'bot', [
        { text: "Yes, let's start", value: "start" }
      ]);
      setCurrentStep('start_assessment');
    }, 4500);
  };

  const handleAssessmentStart = (choice) => {
    addMessage("Yes, let's start", 'user');
    showTyping();
    setTimeout(() => {
      startQuestions();
    }, 1500);
  };

  const startQuestions = () => {
    addMessage("Wonderful! I'm going to ask you some gentle questions about different aspects of your wellbeing. Take your time with each one.", 'bot');
    setTimeout(() => {
      addMessage("Here's our first question:", 'bot');
    }, 2000);
    setTimeout(() => {
      showQuestion(0);
    }, 3000);
  };

  const [triageFlow, setTriageFlow] = useState(null);

  // Fetch triage flow on component mount
  useEffect(() => {
    const fetchTriageFlow = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/triage/flow');
        if (!response.ok) return;
        const data = await response.json();
        
        setTriageFlow(data);
      } catch (error) {
        console.error('❌ Error fetching triage flow:', error);
      }
    };

    if (isOpen && !triageFlow) {
      fetchTriageFlow();
    }
  }, [isOpen, triageFlow]);

  const showQuestion = (questionIndex) => {
    if (!triageFlow || !triageFlow.steps) return;
    
    const question = triageFlow.steps[questionIndex];
    if (!question) return;
    
    const options = question.options.map(opt => ({
      text: opt.label,
      value: opt.value
    }));
    
    addMessage(question.bot_text, 'bot', options);
    setCurrentStep('questions');
    setCurrentQuestion(questionIndex);
  };

  const handleAnswer = async (answer) => {
    if (!triageFlow || !triageFlow.steps) return;
    
    const questionIndex = currentQuestion;
    const currentQ = triageFlow.steps[questionIndex];
    if (!currentQ) return;
    
    // Save answer with question ID as key
    const newAnswers = { ...answers, [currentQ.id]: answer.value };
    setAnswers(newAnswers);

    // Add user's answer to chat
    addMessage(answer.text, 'user');

    // Check for safety trigger - complete assessment first
    if (currentQ.safety && answer.value > 0) {
      // Still complete the assessment first
      if (questionIndex === triageFlow.steps.length - 1) {
        showTyping();
        setTimeout(() => {
          completeAssessment(newAnswers);
        }, 1500);
        return;
      }
      
      // If not final question, continue with gentle message
      showTyping();
      setTimeout(() => {
        addMessage("Thank you for sharing this. You're not alone. Let's continue with your assessment.", 'bot');
        setTimeout(() => {
          showQuestion(questionIndex + 1);
        }, 1500);
      }, 1500);
      return;
    }

    // Move to next question or finish
    if (questionIndex < triageFlow.steps.length - 1) {
      showTyping();
      setTimeout(() => {
        showQuestion(questionIndex + 1);
      }, 1500);
    } else {
      // All questions completed
      showTyping();
      setTimeout(() => {
        completeAssessment(newAnswers);
      }, 1500);
    }
  };

  const completeAssessment = async (finalAnswers) => {
    if (!patientName || !patientEmail || !finalAnswers || Object.keys(finalAnswers).length === 0) {
      addMessage("Please complete all questions first.", 'bot');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/triage/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          patient_email: patientEmail,
          answers: finalAnswers
        })
      });

      if (response.status !== 200) {
        addMessage("Assessment failed. Please try again.", 'bot');
        return;
      }

      const result = await response.json();
      if (!result.assessment_id) {
        addMessage("Assessment processing failed. Please try again.", 'bot');
        return;
      }

      setAssessmentResult(result);

      // DON'T show summary immediately - ask user to choose first
      setTimeout(() => {
        addMessage("Thank you for completing the assessment. What would you like to do?", 'bot', [
          { text: "Show Assessment", value: "show_assessment" },
          { text: "Contact Doctor", value: "contact_doctor" }
        ]);
        setCurrentStep('final_choices');
      }, 1500);

    } catch (error) {
      console.error('❌ Assessment error:', error);
      addMessage("I'm sorry, there was a connection error. Please check if the backend server is running and try again.", 'bot');
    }
  };

  const handleFinalChoice = async (choice) => {
    addMessage(choice.text, 'user');

    switch (choice.value) {
      case 'contact_doctor':
      case 'share':
        await assignDoctor();
        break;
      case 'show_assessment':
        showAssessment();
        break;
      case 'restart':
        restartAssessment();
        break;
      case 'private':
        addMessage("Your assessment will be kept private. Thank you for taking care of your mental health! 💙", 'bot');
        setTimeout(() => {
          addMessage("Would you like to restart the assessment or contact a doctor?", 'bot', [
            { text: "Contact Doctor", value: "contact_doctor" },
            { text: "Restart Assessment", value: "restart" }
          ]);
        }, 1000);
        break;
      case 'confirm_appointment':
        await confirmAppointment();
        break;
      case 'not_now':
        addMessage("No problem! You can contact us anytime. Take care! 💙", 'bot');
        break;
    }
  };

  const assignDoctor = async () => {
    if (!assessmentResult || !assessmentResult.assessment_id) {
      addMessage("Please complete the assessment first to assign a doctor.", 'bot');
      return;
    }

    showTyping();
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/triage/assign-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment_id: assessmentResult.assessment_id })
      });

      if (response.status !== 200) {
        addMessage("Failed to assign doctor. Please try again.", 'bot');
        return;
      }

      const result = await response.json();
      
      setTimeout(() => {
        addMessage(`Doctor assigned: ${result.doctor_name || 'Dr. Smith'}`, 'bot');
        setTimeout(() => {
          addMessage(`Specialization: ${result.doctor_specialization || 'General Practice'}\nHospital: ${result.hospital_name || 'CareBridge Medical Center'}\nAppointment: ${new Date(result.appointment_time).toLocaleString()}`, 'bot');
          setTimeout(() => {
            addMessage("Would you like to confirm and download your e-ticket?", 'bot', [
              { text: "Yes, Confirm & Download", value: "confirm_appointment" },
              { text: "Not Now", value: "not_now" }
            ]);
          }, 1000);
        }, 1000);
      }, 1500);

    } catch (error) {
      console.error('❌ DOCTOR ASSIGNMENT ERROR:', error);
      addMessage("Connection error. Please try again.", 'bot');
    }
  };

  const showAssessment = () => {
    if (!assessmentResult || !assessmentResult.assessment_id) {
      addMessage("No assessment results available. Please complete the assessment first.", 'bot');
      return;
    }
    
    // Show natural, human-like response
    if (assessmentResult.summary_text) {
      addMessage(assessmentResult.summary_text, 'bot');
    }
    
    // Show AI insights naturally without technical labels
    if (assessmentResult.ai_insights) {
      setTimeout(() => {
        addMessage(assessmentResult.ai_insights, 'bot');
      }, 2000);
    }
    
    // Show ONLY Contact Doctor option after assessment
    setTimeout(() => {
      addMessage("Would you like to contact a doctor now?", 'bot', [
        { text: "Contact Doctor", value: "contact_doctor" },
        { text: "Not Now", value: "not_now" }
      ]);
    }, 3000);
  };

  const confirmAppointment = async () => {
    showTyping();
    try {
      // Get the latest doctor assignment result
      const doctorResponse = await fetch('http://localhost:8000/api/v1/triage/assign-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment_id: assessmentResult.assessment_id
        }),
      });

      const doctorResult = await doctorResponse.json();
      
      // Create appointment
      const response = await fetch('http://localhost:8000/api/v1/triage/confirm-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: doctorResult.patient_id,
          doctor_id: doctorResult.doctor_id,
          appointment_date: doctorResult.appointment_time,
          hospital_name: doctorResult.hospital_name
        }),
      });

      const result = await response.json();
      
      setTimeout(() => {
        addMessage("✅ Appointment confirmed! Your e-ticket is ready for download.", 'bot');
        setTimeout(() => {
          // Generate and download PDF with actual doctor data
          downloadAppointmentTicket({
            ...result,
            doctor_name: doctorResult.doctor_name,
            doctor_specialization: doctorResult.doctor_specialization,
            hospital_name: doctorResult.hospital_name,
            appointment_time: doctorResult.appointment_time
          });
        }, 1000);
      }, 1500);

    } catch (error) {
      console.error('Appointment confirmation error:', error);
      addMessage("I'm sorry, there was an error confirming your appointment. Please try again.", 'bot');
    }
  };

  const downloadAppointmentTicket = (appointmentData) => {
    // Create a simple PDF content (in a real app, you'd use a PDF library)
    const appointmentDate = new Date(appointmentData.appointment_time || appointmentData.appointment_date);
    const ticketContent = `
CareBridge Medical Center
Appointment E-Ticket
=====================================

Patient Information:
Name: ${patientName}
Email: ${patientEmail}

Doctor Information:
Name: ${appointmentData.doctor_name || 'Dr. Smith'}
Specialization: ${appointmentData.doctor_specialization || 'General Practice'}

Appointment Details:
Date: ${appointmentDate.toLocaleDateString()}
Time: ${appointmentDate.toLocaleTimeString()}
Hospital: ${appointmentData.hospital_name || 'CareBridge Medical Center'}

Assessment Summary:
${assessmentResult ? Object.entries(assessmentResult.summary).map(([key, value]) => `${key}: ${value}`).join('\n') : 'N/A'}

Important Notes:
- Please arrive 15 minutes early
- Bring a valid ID and insurance card
- Contact us if you need to reschedule

Appointment ID: ${appointmentData.appointment_id || 'N/A'}

Thank you for choosing CareBridge!
    `;
    
    // Create and download the file
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-ticket-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    addMessage("📄 Your e-ticket has been downloaded! Check your downloads folder.", 'bot');
  };

  const restartAssessment = () => {
    setMessages([]);
    setCurrentStep('greeting');
    setCurrentQuestion(0);
    setAnswers({});
    setAssessmentResult(null);
    startConversation();
  };


  const handleInputSubmit = (e) => {
    e.preventDefault();
    const input = e.target.message.value.trim();
    if (!input) return;

    if (currentStep === 'name') {
      handleNameSubmit(input);
    } else if (currentStep === 'email') {
      handleEmailSubmit(input);
    }
    
    e.target.message.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="triage-chatbot-overlay">
      <div className="triage-chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-avatar">
            <div className="avatar-icon">⚕</div>
          </div>
          <div className="chatbot-info">
            <h3>Dr. Sarah</h3>
            <p>CareBridge AI Assistant • Online</p>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                {message.timestamp && (
                  <div className="message-time">{message.timestamp}</div>
                )}
              </div>
              {message.buttons && (
                <div className="message-buttons">
                  {message.buttons.map((button, index) => (
                    <button
                      key={index}
                      className="quick-reply-button"
                      onClick={() => {
                        
                        if (currentStep === 'start_assessment') {
                          handleAssessmentStart(button);
                        } else if (currentStep === 'questions') {
                          handleAnswer(button);
                        } else if (currentStep === 'safety' || currentStep === 'final_choices') {
                          handleFinalChoice(button);
                        } else {
                          console.error('❌ Unknown currentStep:', currentStep);
                        }
                      }}
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(currentStep === 'name' || currentStep === 'email') && (
          <form className="chatbot-input" onSubmit={handleInputSubmit}>
            <input
              type={currentStep === 'email' ? 'email' : 'text'}
              name="message"
              placeholder={currentStep === 'name' ? 'Enter your name...' : 'Enter your email...'}
              className="message-input"
              required
            />
            <button type="submit" className="send-button">Send</button>
          </form>
        )}

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <small>🔒 Your answers are confidential and only shared if you choose to contact a doctor.</small>
        </div>
      </div>
    </div>
  );
};

export default TriageChatbot;
