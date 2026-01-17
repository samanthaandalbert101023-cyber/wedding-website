import React, { useState, useEffect } from 'react';
import Countdown from '../components/Countdown';
import RSVPModal from './RSVPModal';
import { useGET } from '../hooks/useGET';

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

const Index = () => {
  /* ===============================
     API
  ================================ */
  const BASE_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : 'https://wedding-website1.onrender.com';

  const [, , fetchGuest] = useGET(`${BASE_URL}/api/guestlist`, false);

  /* ===============================
     STATE
  ================================ */
  const [openModal, setOpenModal] = useState(false);
  const [allGuests, setAllGuests] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [dropDown, setDropDown] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [loadingGuests, setLoadingGuests] = useState(false);

  const [openListModal, setOpenListModal] = useState({
    isActive: false,
    listNames: [],
  });

  /* ===============================
     OPEN RSVP → FETCH ONCE
  ================================ */
  const handleOpenModal = async () => {
    setOpenModal(true);

    if (allGuests.length === 0) {
      setLoadingGuests(true);
      try {
        const resp = await fetchGuest(`${BASE_URL}/api/guestlist`);
        const cleaned = (resp || []).map(g => ({
          ...g,
          _n: normalize(g.FullName),
        }));
        setAllGuests(cleaned);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGuests(false);
      }
    }
  };

  const handleCloseModal = () => {
    setGuestName('');
    setDropDown([]);
    setSelectedGuest(null);
    setOpenModal(false);
  };

  /* ===============================
     LOCAL SEARCH
  ================================ */
  const handleOnChange = (e) => {
    const value = e.target.value;
    setGuestName(value);
    setSelectedGuest(null);

    const q = normalize(value);
    if (q.length < 2) {
      setDropDown([]);
      return;
    }

    const startsWith = allGuests.filter(g => g._n.startsWith(q));
    const includes = allGuests.filter(
      g => !g._n.startsWith(q) && g._n.includes(q)
    );

    setDropDown([...startsWith, ...includes].slice(0, 8));
  };

  const handleSelectGuest = (guest) => {
    setGuestName(guest.FullName);
    setSelectedGuest(guest);
    setDropDown([]);
  };

  /* ===============================
     SUBMIT
  ================================ */
  const handleOnSubmit = (e) => {
    e.preventDefault();

    if (!selectedGuest) {
      alert('Please select your name from the list.');
      return;
    }

    setOpenListModal({
      isActive: true,
      listNames: [selectedGuest],
    });
  };

  /* ===============================
     SCROLL EFFECT
  ================================ */
  useEffect(() => {
    const sections = document.querySelectorAll('.page');

    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        }),
      { threshold: 0.3 }
    );

    sections.forEach(sec => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="app-root">

      {/* 🔵 FULLSCREEN LOADER */}
      {loadingGuests && (
        <div className="fullscreen-loader">
          <div className="loader-content">
            <span className="spinner" />
            <p>Loading guest list…</p>
          </div>
        </div>
      )}

      {/* STICKY NAV */}
      <div className="sticky-nav">
        <button>Venues</button>
        <button>Gallery</button>
        <button onClick={handleOpenModal}>RSVP</button>
      </div>

      {/* HERO */}
      <div className="page hero" style={{ backgroundImage: `url(${image1})` }}>
        <div className="overlay" />
        <div className="hero-text">
          <h1 className="hero-names">Samantha & Albert</h1>
          <p className="hero-subtitle">ARE GETTING MARRIED</p>
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
          <form onSubmit={handleOnSubmit} autoComplete="off">
            <p className="rsvp-text">
              If you're responding for you or your family, you’ll be able to RSVP for everyone.
            </p>

            <input
              placeholder="Full Name"
              value={guestName}
              onChange={handleOnChange}
            />

            {dropDown.length > 0 && (
              <div className="guest-options">
                {dropDown.map(g => (
                  <div
                    key={g.id}
                    className="guest-option"
                    onClick={() => handleSelectGuest(g)}
                  >
                    {g.FullName}
                  </div>
                ))}
              </div>
            )}

            <button type="submit">FIND YOUR INVITATION</button>
          </form>
        }
      />

      {/* CONFIRM MODAL */}
      <RSVPModal
        isOpen={openListModal.isActive}
        title="Samantha & Albert"
        onClose={() => setOpenListModal({ isActive: false, listNames: [] })}
        Children={<p>Guest found. Continue RSVP.</p>}
      />
    </div>
  );
};

export default Index;
