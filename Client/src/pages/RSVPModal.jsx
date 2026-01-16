import React, { useState } from 'react';
import { usePOST } from '../hooks/usePOST';
import './RSVPModal.css';

const RSVPModal = ({ isOpen, title, onClose, Children }) => {
  const [values, setValues] = useState({ name: '', email: '', attending: true });
  const [success, setSuccess] = useState(false);

  const BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : `http://${window.location.hostname}:5000`;

  const [loading, fetch, error] = usePOST(`${BASE_URL}/api/rsvps`);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'select-one' ? value === 'true' : value,
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const res = await fetch(values);
  //   if (res.success) {
  //     setSuccess(true);
  //     setValues({ name: '', email: '', attending: true });
  //   } else {
  //     console.log('response', res);
  //     setSuccess(false);
  //   }
  // };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          {/* Title Section */}
          <div className="modal-title-container">
            <h2>Samantha & Albert</h2>
            <h3>Wedding</h3>
          </div>

          {/* {success ? (
            <p className="text-green-600 font-semibold">
              RSVP submitted successfully!
            </p>
          ) : ( */}
            {/* <form onSubmit={handleSubmit} className="modal-form"> */}
              {Children}
            {/* </form> */}
          {/* )} */}

          {/* Close button always visible */}
          <div className="modal-close-container text-right">
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
