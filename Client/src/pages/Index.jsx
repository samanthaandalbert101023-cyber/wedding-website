import React, { useState, useEffect } from 'react';
import Countdown from '../components/Countdown';
import RSVPModal from './RSVPModal';

import image1 from '../img/1.JPG';
import image2 from '../img/2.JPG';
import cover3 from '../img/3.JPG';
import Ceremony from '../img/ceremony.png';
import Reception from '../img/reception.png';

import './Index.css';

/* ===============================
   HELPERS
================================ */
const normalize = (str = '') =>
  str.toLowerCase().replace(/\s+/g, ' ').trim();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const Index = () => {
  const BASE_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : 'https://wedding-website1.onrender.com';

  /* ===============================
     STATE
  =============================== */
  const [loadingGuests, setLoadingGuests] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [openGroupModal, setOpenGroupModal] = useState(false);

  const [allGuests, setAllGuests] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [dropDown, setDropDown] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const [attendance, setAttendance] = useState(null); // 'yes' | 'no'

  const [groupGuests, setGroupGuests] = useState([]);
  const [checkedGuests, setCheckedGuests] = useState([]); // ✅ FullName based

  /* ===============================
     FETCH GUEST LIST
  =============================== */
  const fetchGuestList = async () => {
    const res = await fetch(`${BASE_URL}/api/guestlist`);
    if (!res.ok) throw new Error('Failed to fetch guest list');
    return res.json();
  };

  /* ===============================
     OPEN RSVP FLOW
  =============================== */
  const handleOpenRSVP = async () => {
    setLoadingGuests(true);

    setGuestName('');
    setDropDown([]);
    setSelectedGuest(null);
    setAttendance(null);
    setGroupGuests([]);
    setCheckedGuests([]);

    try {
      const resp = await fetchGuestList();
      await delay(2000);

      const cleaned = resp.map(g => ({
        ...g,
        _n: normalize(g.FullName),
      }));

      setAllGuests(cleaned);
      setOpenModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGuests(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setGuestName('');
    setDropDown([]);
    setSelectedGuest(null);
    setAttendance(null);
  };

  /* ===============================
     SEARCH
  =============================== */
  const handleNameChange = (e) => {
    const value = e.target.value;
    setGuestName(value);
    setSelectedGuest(null);
    setAttendance(null);

    const q = normalize(value);
    if (q.length < 2) {
      setDropDown([]);
      return;
    }

    const starts = allGuests.filter(g => g._n.startsWith(q));
    const includes = allGuests.filter(
      g => !g._n.startsWith(q) && g._n.includes(q)
    );

    setDropDown([...starts, ...includes].slice(0, 10));
  };

  const handleSelectGuest = (guest) => {
    setGuestName(guest.FullName);
    setSelectedGuest(guest);
    setDropDown([]);
  };

  /* ===============================
     CONTINUE
  =============================== */
const handleContinue = (e) => {
  e.preventDefault();
  if (!selectedGuest || !attendance) return;

  if (attendance === 'no') {
    alert('Thank you for your response 🤍');
    handleCloseModal();
    return;
  }

  const connected = allGuests.filter(
    g => g.id === selectedGuest.id
  );

  setGroupGuests(connected);

  // ✅ FIX: respect existing attending field
  setCheckedGuests(
    connected
      .filter(g => g.attending === true)
      .map(g => g.FullName)
  );

  setOpenModal(false);
  setOpenGroupModal(true);
};


  /* ===============================
     CHECKBOX TOGGLE (FIXED)
  =============================== */
const toggleGuest = (fullName) => {
  setCheckedGuests(prev =>
    prev.includes(fullName)
      ? prev.filter(name => name !== fullName)
      : [...prev, fullName]
  );
};

const handleConfirmGroup = async () => {
  // ✅ Build minimal update payload
  const finalPayload = groupGuests.map(g => ({
    ...g,
    attending: checkedGuests.includes(g.FullName),
  }));
  setLoadingGuests(true);
  try {
    await fetch(`${BASE_URL}/api/guestlist/attending`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates: finalPayload, // ✅ REQUIRED
      }),
    });

    console.log('FINAL RSVP PAYLOAD:', finalPayload);
    alert('RSVP confirmed 💕');
    setOpenGroupModal(false);
  } catch (err) {
    console.error(err);
    alert('Failed to save RSVP');
  }
  setLoadingGuests(false);
};

  const canContinue = Boolean(selectedGuest && attendance);

  /* ===============================
     SCROLL EFFECT
  =============================== */
  useEffect(() => {
    const sections = document.querySelectorAll('.page');
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }),
      { threshold: 0.3 }
    );
    sections.forEach(sec => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-root">

      {/* 🤍 HEART LOADER */}
      {loadingGuests && (
        <div className="heart-loader">
          {Array.from({ length: 50 }).map((_, i) => (
            <span
              key={i}
              className="heart"
              style={{
                left: `${Math.random() * 100}%`,
                fontSize: `${1.5 + Math.random() * 2.5}rem`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            >
              ❤
            </span>
          ))}
        </div>
      )}

      {/* NAV */}
      <div className="sticky-nav">
        <button onClick={handleOpenRSVP}>RSVP</button>
      </div>

      {/* HERO */}
      <div className="page hero" style={{ backgroundImage: `url(${image1})` }}>
        <div className="overlay" />
        <div className="hero-text">
          <h1>Samantha & Albert</h1>
        </div>
      </div>

      {/* COUNTDOWN */}
      <div className="page countdown slim" style={{ backgroundImage: `url(${image2})` }}>
        <Countdown />
      </div>

      {/* VENUES */}
      <div className="page venues slim" style={{ backgroundImage: `url(${cover3})` }}>
        <div className="venue-wrapper">
          <img src={Ceremony} alt="Ceremony" />
          <img src={Reception} alt="Reception" />
        </div>
      </div>

      {/* RSVP MODAL */}
      <RSVPModal
        isOpen={openModal}
        title="Samantha & Albert"
        onClose={handleCloseModal}
        Children={
          <form onSubmit={handleContinue}>
            <input
              placeholder="Full Name"
              value={guestName}
              onChange={handleNameChange}
            />

            {dropDown.length > 0 && (
              <div className="guest-options">
                {dropDown.map(g => (
                  <div
                    key={`${g.id}-${g.FullName}`}
                    className="guest-option"
                    onClick={() => handleSelectGuest(g)}
                  >
                    {g.FullName}
                  </div>
                ))}
              </div>
            )}

            {selectedGuest && (
              <div className="attendance-buttons">
                <button
                  type="button"
                  className={`attend-btn ${attendance === 'yes' ? 'active' : ''}`}
                  onClick={() => setAttendance('yes')}
                >
                  💖 Will Attend
                </button>

                <button
                  type="button"
                  className={`decline-btn ${attendance === 'no' ? 'active' : ''}`}
                  onClick={() => setAttendance('no')}
                >
                  🤍 Will Not Attend
                </button>
              </div>
            )}

            <button
              type="submit"
              className={`continue-btn ${canContinue ? 'enabled' : ''}`}
              disabled={!canContinue}
            >
              CONTINUE
            </button>
          </form>
        }
      />

      {/* GROUP MODAL */}
      <RSVPModal
        isOpen={openGroupModal}
        title="Who will attend?"
        onClose={() => setOpenGroupModal(false)}
        Children={
          <>
            {groupGuests.map(g => (
              <label
                key={`${g.id}-${g.FullName}`}
                className="checkbox-row"
              >
                <input
                  type="checkbox"
                  checked={checkedGuests.includes(g.FullName)}
                  onChange={() => toggleGuest(g.FullName)}
                />
                <span>{g.FullName}</span>
              </label>
            ))}

            <button
              className="continue-btn enabled"
              onClick={handleConfirmGroup}
            >
              CONFIRM RSVP
            </button>
          </>
        }
      />
    </div>
  );
};

export default Index;
