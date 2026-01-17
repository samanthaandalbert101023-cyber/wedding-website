import React, { useState } from 'react';
import './RSVPModal.css';

const RSVPModal = ({ isOpen, title, onClose, Children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal wedding-modal">

        {/* FLORAL DECOR */}
        <div className="floral floral-top-left" />
        <div className="floral floral-top-right" />
        <div className="floral floral-bottom-left" />
        <div className="floral floral-bottom-right" />

        <div className="modal-content">
          {/* TITLE */}
          <div className="modal-title-container">
            <h2>Albert & Samantha</h2>
            <h3>Wedding RSVP</h3>
          </div>

          {/* BODY */}
          <div className="modal-body">
            {Children}
          </div>

          {/* CLOSE */}
          <div className="modal-close-container">
            <button onClick={onClose} className="close-button">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSVPModal;
