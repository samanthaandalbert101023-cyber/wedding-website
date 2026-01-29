import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Envelope.css';

const Envelope = ({ onOpenComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Initialize the navigate function

  useEffect(() => {
    const hasOpened = localStorage.getItem('invitationOpened');
    if (hasOpened === 'true') {
      navigate('/Index', { replace: true });
    }
  }, [navigate]);

  const handleOpenInvitation = (e) => {
    e.stopPropagation(); 
    
    // 1. Call the completion prop logic if needed
    if (onOpenComplete) onOpenComplete();
    
    // 2. Redirect to the Index
    navigate('/Index', { replace: true}); 
  };

  return (
    <div className={`envelope-landing ${isOpen ? 'is-open' : ''}`}>
      <div className="envelope-container">
        <div className="envelope-wrapper" onClick={() => setIsOpen(true)}>
          <div className="envelope">
            <div className="top-flap"></div>
            
            <div className="pocket-container">
              <div className="letter-preview">
                {/* Corner Accents */}
                <span className="flower-accent top-right">✿</span>
                <span className="flower-accent bottom-left">✿</span>
                <span className="flower-accent top-left">❀</span>
                <span className="flower-accent bottom-right">❀</span>
                
                <div className="letter-content">
                  <p className="invite-question">The Wedding of</p>
                  
                  <h2 className="script-font">Albert</h2>
                  <span className="and-text">&</span>
                  <h2 className="script-font">Samantha</h2>
                  
                  <p className="date-font">FEBRUARY 14, 2026</p>
                  
                  <button 
                    className="enter-btn" 
                    onClick={handleOpenInvitation}
                  >
                    Open Invitation
                  </button>
                </div>
              </div>
            </div>

            <div className="front-cover"></div>

            <div className="seal">
              <div className="wax-texture">
                <span className="seal-initials">S&A</span>
              </div>
            </div>
          </div>
        </div>

        {!isOpen && (
          <div className="instruction-container">
            <p className="instruction-text">Please click the envelope</p>
            <p className="instruction-subtext">to reveal the invitation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Envelope;