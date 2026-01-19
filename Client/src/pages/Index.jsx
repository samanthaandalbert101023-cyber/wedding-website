import React, { useState, useEffect, useRef } from 'react';
import Countdown from '../components/Countdown';
import RSVPModal from './RSVPModal';
import Modal from '../components/Modal';

import image1 from '../img/1.JPG';
import image2 from '../img/2.JPG';
import cover3 from '../img/3.JPG';
import Church from "../img/Church.jpg";
import Event from "../img/Event.jpg"
import weddingSong from "../song/ido.mp3"

import './Index.css';

const normalize = (str = '') => str.toLowerCase().replace(/\s+/g, ' ').trim();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const Index = () => {
  const pageRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const rsvpInputRef = useRef(null);

// const BASE_URL = window.location.hostname === 'localhost'
//   ? 'http://192.168.3.7:5173/'
//   : 'https://wedding-website1.onrender.com';
const BASE_URL = 'https://wedding-website1.onrender.com';

  const [loadingGuests, setLoadingGuests] = useState(false);
  const [successModal, setSuccessModal] = useState({ isActive: false, message: '' });
  // ADDITIONAL: Error modal state
  const [errorModal, setErrorModal] = useState({ isActive: false, message: '' });
  
  const [openModal, setOpenModal] = useState(false);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [allGuests, setAllGuests] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [dropDown, setDropDown] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [groupGuests, setGroupGuests] = useState([]);
  const [checkedGuests, setCheckedGuests] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const audioRef = useRef(null);
  const dropdownRef = useRef(null);

  const scrollToSection = (index) => {
    pageRefs[index].current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (openModal) {
      setTimeout(() => {
        rsvpInputRef.current?.focus();
      }, 100);
    }
  }, [openModal]);
  
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const container = dropdownRef.current;
      const selectedItem = container.children[highlightedIndex];
      if (selectedItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const itemTop = selectedItem.offsetTop;
        const itemBottom = itemTop + selectedItem.clientHeight;

        if (itemTop < containerTop) {
          container.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
          container.scrollTop = itemBottom - container.clientHeight;
        }
      }
    }
  }, [highlightedIndex]);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

const fetchGuestList = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/guestlist`);
    
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    // You MUST await res.json() to actually get the data
    const data = await res.json(); 
    
    console.log('Guest List Data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

  const handleOpenRSVP = async () => {
    setLoadingGuests(true);
    setGuestName('');
    setDropDown([]);
    setSelectedGuest(null);
    setGroupGuests([]);
    setCheckedGuests([]);

    try {
      const resp = await fetchGuestList();
      await delay(500);
      const cleaned = resp.map(g => ({ ...g, _n: normalize(g.FullName) }));
      setAllGuests(cleaned);
      setOpenModal(true);
    } catch (err) {
      console.error(err);
      // ADDITIONAL: Pop error modal if server fails to load list
      setErrorModal({ 
        isActive: true, 
        message: 'We could not load the guest list at this moment.\n\nPlease check your internet connection or try again later.' 
      });
    } finally {
      setLoadingGuests(false);
    }
  };

  const handleCloseAll = () => {
    setOpenModal(false);
    setOpenGroupModal(false);
    setSuccessModal({ isActive: false, message: '' });
    setErrorModal({ isActive: false, message: '' }); // Clear error modal
  };

  const handleNameChange = (e) => {
    const value = e.target.value.toUpperCase();
    setGuestName(value);
    setSelectedGuest(null);

    const q = normalize(value);
    if (q.length < 2) {
      setDropDown([]);
      return;
    }

    const starts = allGuests.filter(g => g._n.startsWith(q));
    const includes = allGuests.filter(g => !g._n.startsWith(q) && g._n.includes(q));
    setDropDown([...starts, ...includes].slice(0, 10));
  };

  const handleSelectGuest = (guest) => {
    setGuestName(guest.FullName.toUpperCase());
    setSelectedGuest(guest);
    setDropDown([]);
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!selectedGuest) return;

    const connected = allGuests.filter(g => g.id === selectedGuest.id);
    setGroupGuests(connected);
    setCheckedGuests(connected.filter(g => g.attending === true).map(g => g.FullName));
    setOpenModal(false);
    setOpenGroupModal(true);
  };

  const toggleGuest = (fullName) => {
    setCheckedGuests(prev =>
      prev.includes(fullName) ? prev.filter(n => n !== fullName) : [...prev, fullName]
    );
  };

  const submitAttendance = async (isAttending) => {
    setLoadingGuests(true);

    let finalCheckedList = [...checkedGuests];
    
    if (!isAttending && selectedGuest) {
      finalCheckedList = finalCheckedList.filter(name => name !== selectedGuest.FullName);
    } else if (isAttending && selectedGuest) {
      if (!finalCheckedList.includes(selectedGuest.FullName)) {
        finalCheckedList.push(selectedGuest.FullName);
      }
    }

    const payload = groupGuests.map(g => ({
      ...g,
      attending: finalCheckedList.includes(g.FullName),
    }));

    try {
      const res = await fetch(`${BASE_URL}/api/guestlist/attending`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload }),
      });
      
      if (!res.ok) throw new Error('Server Error');

      await delay(500);
      setSuccessModal({
        isActive: true,
        message: isAttending 
          ? 'Thank you for your response! 💕\n\nYour attendance has been successfully recorded.'
          : 'Thank you for letting us know 🤍\n\nWhile we’ll miss celebrating with you, we truly appreciate your response.',
      });
      setOpenGroupModal(false);
    } catch (err) {
      // ADDITIONAL: Specific error modal for submission failure
      setErrorModal({ 
        isActive: true, 
        message: 'Something went wrong while saving your response 🤍\n\nPlease try again or contact us directly.' 
      });
    } finally {
      setLoadingGuests(false);
    }
  };

  useEffect(() => {
    const playAudio = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            window.removeEventListener('click', playAudio);
            window.removeEventListener('touchstart', playAudio);
            window.removeEventListener('scroll', playAudio);
          })
          .catch(err => console.log("Autoplay blocked, waiting for user interaction."));
      }
    };

    window.addEventListener('click', playAudio);
    window.addEventListener('touchstart', playAudio);
    window.addEventListener('scroll', playAudio);

    const sections = document.querySelectorAll('.page');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.3 }
    );
    sections.forEach(s => observer.observe(s));

    return () => {
      observer.disconnect();
      window.removeEventListener('click', playAudio);
      window.removeEventListener('touchstart', playAudio);
      window.removeEventListener('scroll', playAudio);
    };
  }, [isPlaying]);

  return (
    <div className="app-root">
      <audio ref={audioRef} src={weddingSong} loop />
      {loadingGuests && (
        <div className="heart-loader">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="heart"
              style={{
                left: `${Math.random() * 100}%`,
                fontSize: `${1.5 + Math.random() * 2.5}rem`,
                animationDuration: `${3 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              ❤
            </span>
          ))}
        </div>
      )}

      <div className="sticky-nav">
        <div className="nav-controls">
           <button className="nav-rsvp-btn" onClick={handleOpenRSVP}>RSVP</button>
           <button onClick={() => scrollToSection(0)}>Home</button>
           <button onClick={() => scrollToSection(1)}>Dates</button>
           <button onClick={() => scrollToSection(2)}>Program</button>
           <button onClick={() => scrollToSection(3)}>Attire</button>
           <button onClick={() => scrollToSection(4)}>Location</button>
        </div>
      </div>

      <div ref={pageRefs[0]} className="page hero" style={{ backgroundImage: `url(${image1})` }}>
        <div className="overlay" />
        <div className="hero-text">
          <div className="hero-welcome">Welcome to</div>
          <h1>Albert & Samantha</h1>
          <div className="hero-wedding">Wedding</div>
        </div>
      </div>

      <div ref={pageRefs[1]} className="page countdown slim" style={{ backgroundImage: `url(${image2})` }}>
        <Countdown />
      </div>

      <div ref={pageRefs[2]} className="page venues slim" style={{ backgroundImage: `url(${cover3})` }}>
        <div className="overlay" />
        <div className="venues-roadmap-elegant">
          <h2 className="venues-title">The Wedding Program</h2>
          <div className="tree-v-container">
            <div className="tree-v-trunk"></div>
            <div className="tree-v-item branch-right ev-1">
              <div className="tree-v-node">💍</div>
              <div className="tree-v-content">
                <span className="tree-v-time">01:45 PM</span>
                <h3>Wedding Ceremony</h3>
              </div>
            </div>
            <div className="tree-v-item branch-left ev-2">
              <div className="tree-v-node">📸</div>
              <div className="tree-v-content">
                <span className="tree-v-time">04:00 PM</span>
                <h3>Pre-Event</h3>
                <p>Grazing Table & Socials</p>
              </div>
            </div>
            <div className="tree-v-item branch-right ev-3">
              <div className="tree-v-node">🥂</div>
              <div className="tree-v-content">
                <span className="tree-v-time">04:45 PM</span>
                <h3>Welcome Toast</h3>
              </div>
            </div>
            <div className="tree-v-item branch-left ev-4">
              <div className="tree-v-node">🍽️</div>
              <div className="tree-v-content">
                <span className="tree-v-time">05:15 PM</span>
                <h3>Wedding Dinner</h3>
              </div>
            </div>
            <div className="tree-v-item branch-right ev-5">
              <div className="tree-v-node">🍸</div>
              <div className="tree-v-content">
                <span className="tree-v-time">05:20 PM</span>
                <h3>Cocktail Hour</h3>
              </div>
            </div>
            <div className="tree-v-item branch-left ev-6">
              <div className="tree-v-node">💃</div>
              <div className="tree-v-content">
                <span className="tree-v-time">05:45 PM</span>
                <h3>Celebration Dance</h3>
              </div>
            </div>
            <div className="tree-v-item branch-right ev-7">
              <div className="tree-v-node">🎞️</div>
              <div className="tree-v-content">
                <span className="tree-v-time">06:15 PM</span>
                <h3>Same Day Edit Presentation</h3>
              </div>
            </div>
            <div className="tree-v-item branch-left ev-8">
              <div className="tree-v-node">✨</div>
              <div className="tree-v-content">
                <span className="tree-v-time">07:00 PM</span>
                <h3>End of Program</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={pageRefs[3]} className="page attire-section">
        <div className="attire-container">
          <div className="attire-header">
            <h2 className="attire-title">What to wear?</h2>
            <div className="title-divider"></div>
          </div>
          <div className="attire-grid">
            <div className="sponsor-attire">
              <div className="attire-card-mini">
                <h4>Principal Sponsors</h4>
                <p className="color-label navy">Navy Blue Formal Attire</p>
              </div>
              <div className="attire-card-mini">
                <h4>Secondary Sponsors</h4>
                <p className="color-label dusty">Dusty Blue Formal Attire</p>
              </div>
            </div>
          <div className="guest-attire-main">
              <h3 className="dress-code">For Guests</h3>
              <p className="semi-formal">Semi-Formal attire in the following hues:</p>
              <p className="hue-list">Champagne, Beige, Soft Grey, Blue Gray & Dusty Blue</p>
              <div className="color-palette-large">
                <div className="swatch" style={{ backgroundColor: '#E3D2B4' }}></div>
                <div className="swatch" style={{ backgroundColor: '#C5B49E' }}></div>
                <div className="swatch" style={{ backgroundColor: '#A3A3A3' }}></div>
                <div className="swatch" style={{ backgroundColor: '#8E9CAF' }}></div>
                <div className="swatch" style={{ backgroundColor: '#718EA4' }}></div>
              </div>
              <div className="guest-guide">
                <div className="guide-item">
                  <strong>Gentlemen</strong>
                  <p>Long Sleeves Polo and Slacks</p>
                </div>
                <div className="guide-item">
                  <strong>Ladies</strong>
                  <p>Sunday Dress, Cocktail or Long Dress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={pageRefs[4]} className="page location-section">
        <div className="location-container">
          <div className="location-header">
            <h2 className="location-title">Locations</h2>
            <p className="location-subtitle">Google Maps directions</p>
            <div className="title-divider"></div>
          </div>
          <div className="location-grid">
            <div className="location-card">
              <div className="qr-frame">
                <img src={Church} alt="Church" className="qr-image" />
              </div>
              <div className="location-details">
                <h3>National Shrine and Parish of Our Lady of Fatima</h3>
                <div className="location-underline"></div>
                <a href="https://maps.app.goo.gl/DoykaVgzTJeZtCCp8" target="_blank" rel="noreferrer" className="maps-btn">
                  Open in Maps
                </a>
              </div>
            </div>
            <div className="location-card">
              <div className="qr-frame">
                <img src={Event} alt="Venue" className="qr-image" />
              </div>
              <div className="location-details">
                <h3>Dalandanan Events Space</h3>
                <div className="location-underline"></div>
                <a href="https://maps.app.goo.gl/ubeDC4arvKWScP3r9" target="_blank" rel="noreferrer" className="maps-btn">
                  Open in Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RSVPModal
        isOpen={openModal}
        title="Samantha & Albert"
        onClose={handleCloseAll}
        Children={
          <form onSubmit={handleContinue}>
            <input
              ref={rsvpInputRef}
              className='uppercase'
              placeholder="FULL NAME"
              value={guestName}
              onChange={handleNameChange}
              onKeyDown={(e) => {
                if (dropDown.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex(prev => (prev < dropDown.length - 1 ? prev + 1 : prev));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                  e.preventDefault();
                  handleSelectGuest(dropDown[highlightedIndex]);
                }
              }}
            />
            <div className="guest-dropdown-scroll" ref={dropdownRef}>
              {dropDown.map((g, index) => (
                <div
                  key={`${g.id}-${g.FullName}`}
                  className={`guest-option ${highlightedIndex === index ? 'highlighted' : ''}`}
                  onClick={() => handleSelectGuest(g)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {g.FullName.toUpperCase()}
                </div>
              ))}
            </div>
            
            <button
              type="submit"
              className={`continue-btn ${selectedGuest ? 'enabled' : ''}`}
              disabled={!selectedGuest}
            >
              CONTINUE
            </button>
            <h5 className='rsvp-formal-note'> While we extend a warm welcome to guests of all ages, we graciously suggest an adults-only celebration... </h5>
          </form>
        }
      />

      <RSVPModal
        isOpen={openGroupModal}
        title="Your Attendance"
        onClose={handleCloseAll}
        Children={
          <>
            <div className="guest-checkbox-scroll">
              {groupGuests.map(g => (
                <label key={`${g.id}-${g.FullName}`} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={checkedGuests.includes(g.FullName)}
                    onChange={() => toggleGuest(g.FullName)}
                  />
                  <span className='uppercase'>{g.FullName.toUpperCase()}</span>
                </label>
              ))}
            </div>
            <button className="continue-btn enabled" onClick={() => submitAttendance(true)}>
              💖 I WILL ATTEND
            </button>
            <button className="continue-btn" onClick={() => submitAttendance(false)}>
              🤍 I WILL NOT ATTEND
            </button>
          </>
        }
      />

      {/* Success Modal */}
      <Modal
        isOpen={successModal.isActive}
        onClose={handleCloseAll}
        title="RSVP Update"
      >
        <p style={{ whiteSpace: 'pre-line' }}>{successModal.message}</p>
      </Modal>

      {/* ADDITIONAL: Error Modal */}
      <Modal
        isOpen={errorModal.isActive}
        onClose={handleCloseAll}
        title="Notice"
      >
        <p style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{errorModal.message}</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button className="continue-btn enabled" onClick={handleCloseAll}>CLOSE</button>
        </div>
      </Modal>
    </div>
  );
};

export default Index;