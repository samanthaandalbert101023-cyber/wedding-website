import React, { useState } from 'react';
import './Envelope.css';

const Envelope = ({ onOpenComplete }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <div className={`envelope-landing ${isOpen ? 'is-open' : ''}`}>
      <div className="envelope-wrapper" onClick={handleOpen}>
        <div className="envelope">
          <div className="top-flap"></div>
          <div className="front">
            <div className="seal">
              <span className="seal-initials">S & A</span>
            </div>
          </div>
          <div className="letter-preview">
            <div className="letter-content">
              <h2 className="script-font">Samantha & Albert</h2>
              <p className="date-font">FEBRUARY 14, 2025</p>
              <button 
                className="enter-btn" 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent re-triggering handleOpen
                  onOpenComplete();
                }}
              >
                Open Invitation
              </button>
            </div>
          </div>
        </div>
      </div>
      {!isOpen && <p className="instruction-text">Click to Open Invitation</p>}
    </div>
  );
};

export default Envelope;