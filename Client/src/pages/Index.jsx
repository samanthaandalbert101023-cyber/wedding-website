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

// --- hex helpers ---
const hexToBytes = (hex) =>
  Uint8Array.from(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));

const bytesToHex = (bytes) =>
  [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");

// --- import AES key ---
const getKey = async () => {
  const keyHex = import.meta.env.VITE_API_SECRET_KEY;

  return crypto.subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
};

export const decryptPayload = async (payload) => {
  const key = await getKey();

  const iv = hexToBytes(payload.iv);
  const data = hexToBytes(payload.data);
  const tag = hexToBytes(payload.tag);

  // AES-GCM expects ciphertext + tag combined
  const combined = new Uint8Array([...data, ...tag]);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
};

export const encryptPayload = async (data) => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const encryptedBytes = new Uint8Array(encrypted);

  return {
    iv: bytesToHex(iv),
    data: bytesToHex(encryptedBytes.slice(0, -16)),
    tag: bytesToHex(encryptedBytes.slice(-16)),
  };
};



const normalize = (str = '') => str.toLowerCase().replace(/\s+/g, ' ').trim();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const Index = () => {
  const pageRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const rsvpInputRef = useRef(null);

// const BASE_URL = window.location.hostname === 'localhost'
//   ? 'http://192.168.3.7:5173/'
//   : 'https://wedding-website1.onrender.com';
const BASE_URL = 'https://wedding-website1.onrender.com';
//const BASE_URL = 'http://localhost:5000';

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
  const res = await fetch(`${BASE_URL}/api/guestlist`);
  if (!res.ok) throw new Error("Server error");

  const json = await res.json();
  console.log("RAW RESPONSE:", json);

  if (json.encrypted) {
    try {
      const decrypted = await decryptPayload(json.payload);
      console.log("DECRYPTED DATA:", decrypted);
      return decrypted;
    } catch (e) {
      console.error("❌ DECRYPT FAILED:", e);
      throw e;
    }
  }

  return json;
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
    finalCheckedList = finalCheckedList.filter(
      name => name !== selectedGuest.FullName
    );
  } else if (isAttending && selectedGuest) {
    if (!finalCheckedList.includes(selectedGuest.FullName)) {
      finalCheckedList.push(selectedGuest.FullName);
    }
  }

  // ✅ SAME LOGIC
  const updates = groupGuests.map(g => ({
    ...g,
    attending: finalCheckedList.includes(g.FullName),
  }));

  try {
    // 🔐 ENCRYPT HERE (ONLY ADDITION)
    const encryptedPayload = await encryptPayload(updates);

    const res = await fetch(`${BASE_URL}/api/guestlist/attending`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encrypted: true,
        payload: encryptedPayload,
      }),
    });

    if (!res.ok) throw new Error("Server Error");

    await delay(500);

    setSuccessModal({
      isActive: true,
      message: isAttending
        ? "Thank you for your response! 💕\n\nYour attendance has been successfully recorded."
        : "Thank you for letting us know 🤍\n\nWhile we’ll miss celebrating with you, we truly appreciate your response.",
    });

    setOpenGroupModal(false);
  } catch (err) {
    setErrorModal({
      isActive: true,
      message:
        "Something went wrong while saving your response 🤍\n\nPlease try again or contact us directly.",
    });
  } finally {
    setLoadingGuests(false);
  }
};


useEffect(() => {
  // Use a local variable to track if we've successfully started playback
  // to avoid multiple play attempts during re-renders.
  let started = false;

  const playAudio = () => {
    if (audioRef.current && !started) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          started = true;
          // We keep the listeners active for a moment or rely on the 'started' flag
          // to prevent "cutting" during the transition
        })
        .catch(err => {
          console.log("Waiting for user interaction to play audio...");
        });
    }
  };

  // Listeners for initial interaction
  window.addEventListener('click', playAudio);
  window.addEventListener('touchstart', playAudio);
  window.addEventListener('scroll', playAudio);

  // Intersection Observer for animations
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
}, []); // EMPTY dependency array is key: this runs once on mount

  return (
    <div className="app-root">
      <audio ref={audioRef} src={weddingSong} loop preload="auto" />
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
           <button onClick={() => scrollToSection(3)}>Entourage</button>
           <button onClick={() => scrollToSection(4)}>Attire</button>
           <button onClick={() => scrollToSection(5)}>Location</button>
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

      {/* New Entourage Section */}
      <div ref={pageRefs[3]} className="page location-section">
      <div className="page entourage-section">
        <div className="entourage-container">
          <h2 className="entourage-main-title">The Entourage</h2>
          
          <div className="parents-grid">
            <div className="parents-group">
              <h4>Parents of the Groom</h4>
              <p>Antonio Francisco Britanico</p>
              <p>Leilani Rosali Britanico</p>
            </div>
            <div className="parents-group">
              <h4>Parents of the Bride</h4>
              <p>Lucas Lumantao Enad</p>
              <p>Elisabeth Agad Enad</p>
            </div>
          </div>

          <h3 className="section-subtitle">Principal Sponsors</h3>
          <div className="sponsors-grid">
            <div className="sponsor-col">
              <p>PB Rizalino Ferrer</p>
              <p>Engr. Generoso O. Basiloña Jr.</p>
              <p>Hon. Edgardo Dizon</p>
              <p>Mr. Cesar Divinagracia</p>
              <p>Mr. Berlin De Leon</p>
              <p>Atty. Romeo Montefalco</p>
              <p>Mr. Felipe Agad</p>
              <p>Mr. Romeo Agad</p>
              <p>Mr. Jonathan Rosali</p>
              <p>Mr. Armando Agad</p>
              <p>Mr. Romelo Agad</p>
              <p>Mr. Aleben Ramos</p>
            </div>
            <div className="sponsor-col">
              <p>Mrs. Judith Cruz</p>
              <p>Dr. Joann Basiloña, MD FPPS</p>
              <p>Mrs. Ellaine Manalaysay</p>
              <p>Mrs. Josefa Oi</p>
              <p>Mrs. Lilian Isagani</p>
              <p>Mrs. Annabel Delos Reyes</p>
              <p>Mrs. Grace See</p>
              <p>Mrs. Ester Briñas</p>
              <p>Mrs. Rhoda Paule</p>
              <p>Mrs. Josie Agad</p>
              <p>Mrs. Nilda Monteroso</p>
              <p>Mrs. Jobelle Comia-Ramirez</p>
            </div>
          </div>

          <div className="wedding-party-grid">
            <div className="party-group">
              <div className="role-block">
                <h4>Best Man</h4>
                <p>Mr. Angelo Britanico</p>
              </div>
              <div className="role-block">
                <h4>Groomsmen</h4>
                <p>Mr. Gian Rosali</p>
                <p>Mr. Emman Baes</p>
                <p>Mr. Anthony Britanico</p>
                <p>Mr. Christopher Pacinio</p>
                <p>Mr. John Lemuel Capeña</p>
                <p>Mr. John Mark Llobrera</p>
                <p>Mr. Felix Agad Jr.</p>
                <p>Mr. Marc Amberlanz Aquino</p>
              </div>
            </div>

            <div className="party-group">
              <div className="role-block">
                <h4>Maid of Honor</h4>
                <p>Ms. Francheska Louise Enad</p>
              </div>
              <div className="role-block">
                <h4>Bridesmaids</h4>
                <p>Ms. Brizia Zamudio</p>
                <p>Ms. Angel Mikhayelle Frias</p>
                <p>Ms. Ann Lhoucell Oflian De Leon</p>
                <p>Ms. Kuryn Casinillo</p>
                <p>Ms. Romela Agad</p>
                <p>Ms. Roshel Agad</p>
                <p>Ms. Celine Agad</p>
                <p>Ms. Rowella Agad</p>
              </div>
            </div>
          </div>

          <h3 className="section-subtitle">Secondary Sponsors</h3>
          <div className="secondary-grid">
            <div className="secondary-item">
              <h5>To Light Our Path</h5>
              <p>Hon. Rizalino Ferrer</p>
              <p>Mrs. Judith Cruz</p>
            </div>
            <div className="secondary-item">
              <h5>To Clothe Us As One</h5>
              <p>Mrs. Rhoda Paule</p>
              <p>Mr. Jonathan Rosali</p>
            </div>
            <div className="secondary-item">
              <h5>To Bind Us Together</h5>
              <p>Mr. Armando Agad</p>
              <p>Mrs. Josie Agad</p>
            </div>
          </div>

          <div className="bearers-grid">
            <div className="bearer-item">
              <h5>Ring Bearer</h5>
              <p>Alonso Britanico</p>
            </div>
            <div className="bearer-item">
              <h5>Coin Bearer</h5>
              <p>Steve Zion Agad</p>
            </div>
            <div className="bearer-item">
              <h5>Bible Bearer</h5>
              <p>Gio Rosali</p>
            </div>
          </div>

          <div className="flower-girls">
            <h5>Flower Girls</h5>
            <p>Dana Brielle L. Arquero</p>
            <div className="flower-girls-sub">
              <p>Ruemiah Espaldon</p>
              <p>Cristina Rose</p>
              <p>Felicity Quijano</p>
              <p>Yana Rosali</p>
            </div>
          </div>
        </div>
      </div>
  </div>


      <div ref={pageRefs[4]} className="page attire-section">
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

      <div ref={pageRefs[5]} className="page location-section">
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


      <footer ref={pageRefs[5]} className="wedding-footer">
        <div className="footer-container">
          <div className="footer-content">
            <p className="footer-message">
              The greatest gift we could receive is your presence by our side on this special day.
            </p>
            <p className="footer-message">
              If you wish to bless us further, a contribution toward our new life together 
              would help us plant the seeds of our dreams and gather memories that 
              will bloom forever in our hearts.
            </p>
            <div className="footer-signature">
              <p>With all our love and gratitude,</p>
              <h3 className="couple-names">Sam & Bert</h3>
            </div>
          </div>
        </div>
      </footer>
      
        
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
          {/* <button className="continue-btn enabled" onClick={handleCloseAll}>CLOSE</button> */}
        </div>
      </Modal>

      {loadingGuests && (
        <div className="heart-loader">
          {/* ADD THIS TEXT CONTAINER */}
          <div className="loader-text-container">
            <h2 className="loading-title">Loading...</h2>
            <p className="loading-subtitle">Please wait, almost there...</p>
          </div>

          {/* KEEP YOUR EXISTING HEART MAPPING */}
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
    </div>
  );
};

export default Index;