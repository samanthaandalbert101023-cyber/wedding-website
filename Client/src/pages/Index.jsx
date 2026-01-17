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

const normalize = (str = '') =>
  str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const Index = () => {

  const BASE_URL = 'https://wedding-website1.onrender.com';
  const [, , fetchGuest] = useGET(`${BASE_URL}/api/guestlist`, false);

  const [openModal, setOpenModal] = useState(false);

  const [allGuests, setAllGuests] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [dropDown, setDropDown] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);

  const [openListModal, setOpenListModal] = useState({
    isActive: false,
    listNames: [],
  });

  /* ===============================
     OPEN MODAL → FETCH ONCE
  =============================== */
  const handleOpenModal = async () => {
    setOpenModal(true);

    if (allGuests.length === 0) {
      setIsLoadingGuests(true);
      try {
        const resp = await fetchGuest(`${BASE_URL}/api/guestlist`);

        // ✅ Normalize ONCE
        const cleaned = (Array.isArray(resp) ? resp : []).map(g => ({
          ...g,
          _normalizedName: normalize(g.FullName),
        }));

        setAllGuests(cleaned);
      } catch (err) {
        console.error('Failed to fetch guest list', err);
      } finally {
        setIsLoadingGuests(false);
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
     LOCAL SEARCH (FIXED)
  =============================== */
  const handleOnChange = (e) => {
    const value = e.target.value;
    setGuestName(value);
    setSelectedGuest(null);

    const search = normalize(value);

    if (search.length < 2) {
      setDropDown([]);
      return;
    }

    // 1️⃣ startsWith first
    const startsWith = allGuests.filter(g =>
      g._normalizedName.startsWith(search)
    );

    // 2️⃣ then includes (excluding duplicates)
    const includes = allGuests.filter(
      g =>
        !g._normalizedName.startsWith(search) &&
        g._normalizedName.includes(search)
    );

    const results = [...startsWith, ...includes].slice(0, 8);

    setDropDown(results);
  };

  const handleSelectGuest = (guest) => {
    setGuestName(guest.FullName);
    setSelectedGuest(guest);
    setDropDown([]);
  };

  /* ===============================
     SUBMIT
  =============================== */
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
  =============================== */
  useEffect(() => {
    const sections = document.querySelectorAll('.page');

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach(sec => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  /* ===============================
     RENDER
  =============================== */
  return (
    <div style={{ fontFamily: "'DM Serif Text', serif", color: 'white' }}>

      <div className="sticky-nav">
        <button onClick={handleOpenModal}>RSVP</button>
      </div>

      <div className="page hero" style={{ backgroundImage: `url(${image1})` }}>
        <div className="overlay" />
        <div className="hero-text">
          <h1>Samantha & Albert</h1>
        </div>
      </div>

      <div className="page countdown slim" style={{ backgroundImage: `url(${image2})` }}>
        <Countdown />
      </div>

      <div className="page venues slim" style={{ backgroundImage: `url(${cover3})` }}>
        <img src={Ceremony} alt="Ceremony" />
        <img src={Reception} alt="Reception" />
      </div>

      {/* RSVP MODAL */}
      <RSVPModal
        isOpen={openModal}
        title="Samantha & Albert"
        onClose={handleCloseModal}
        Children={
          <form onSubmit={handleOnSubmit} autoComplete="off">
            <input
              placeholder="Full Name"
              value={guestName}
              onChange={handleOnChange}
            />

            {isLoadingGuests && <p>Loading guest list…</p>}

            {dropDown.map((item) => (
              <div
                key={item.docId}   // ✅ ALWAYS UNIQUE
                className="guest-option"
                onClick={() => handleSelectGuest(item)}
              >
                {item.FullName}
              </div>
            ))}


            <button type="submit">FIND YOUR INVITATION</button>
          </form>
        }
      />

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
