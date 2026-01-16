import React, { useState, useEffect } from 'react';
import Countdown from '../components/Countdown';
import RSVPModal from './RSVPModal';
import { useGET } from '../hooks/useGET';

// Images
import image1 from '../img/1.JPG';
import image2 from '../img/2.JPG';
import cover3 from '../img/3.JPG';
import Ceremony from '../img/ceremony.png';
import Reception from '../img/reception.png';

import './Index.css';


const Index = () => {

  // Hooks
  const BASE_URL = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : `http://${window.location.hostname}:5000`;
  
  const [loading, data, fetchGuest, error] = useGET(`${BASE_URL}/api/guestlist`, false);
  

  // State 
  const [openModal, setOpenModal] = useState(false);
  const [dropDown, setDropDown] = useState([]);
  const [openListModal, setOpenListModal] = useState({
    isActive: false,
    listNames: [],
  });
  const [guestName, setNameGuest] = useState({
    name: "",
    ip: "",
  })


  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setDropDown([]);
    setNameGuest({name: "", ip: ""})
    setOpenModal(false);
  }

  // IntersectionObserver for fade-in and nav highlighting
  useEffect(() => {
    const sections = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.sticky-nav button');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const sectionName = entry.target.dataset.section;
            navButtons.forEach((btn) => {
              btn.classList.toggle('active', btn.dataset.target === sectionName);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((sec) => observer.observe(sec));

    const venues = document.querySelectorAll('.venue-container');
    const venueObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.2 }
    );
    venues.forEach((v) => venueObserver.observe(v));

    return () => {
      observer.disconnect();
      venueObserver.disconnect();
    };
  }, []);

  const handleNavClick = (target) => {
    const section = document.querySelector(`.page[data-section="${target}"]`);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const validateList = async(value) => {
    const resp = await fetchGuest(`${BASE_URL}/api/guestlist/search?name=${value}`);
    console.log('validateList', resp)
    if(resp.length !== 1 || resp.length !== 0 ) {
      setDropDown(resp)
      return false
    };
    return true;
  }

  const handleFetchGuestList = (name) => {
    const resp = "";
    if(resp?.length === 0) return [];
    return resp; 
  }

  const handleOnSubmit = async(e) => {
    e.preventDefault(); 
    const name = guestName?.name;
    const isValid = await validateList(name);
    if(isValid){
      const list = await handleFetchGuestList(name)
      // Open Open and add related list
      setOpenListModal({
        isActive: true,
        listNames: list,
      });
    }
  }

  const handleOnChange = (e) => {
    const {name, value} = e.target;
    setNameGuest(prevValue => ({
      ...prevValue,
      name: value,
    }));
  }

  return (
    <div style={{ fontFamily: "'DM Serif Text', serif", color: 'white' }}>
      {/* Sticky Navigation */}
      <div className="sticky-nav">
        {['Venues', 'Entourage', 'Gallery'].map((label) => (
          <button
            key={label}
            data-target={label.toLowerCase()}
            onClick={() => handleNavClick(label.toLowerCase())}
          >
            {label}
          </button>
        ))}
        <button onClick={handleOpenModal}>RSVP</button>
      </div>

      {/* Page 1 - Hero */}
      <div className="page hero" data-section="hero" style={{ backgroundImage: `url(${image1})` }}>
        <div className="overlay" />
        <div className="hero-text">
          <h7 className="hero-names">Samantha & Albert</h7>
          <h6 className="hero-subtitle">ARE GETTING MARRIED</h6>
          <div className="hero-subtext">
            <span>FEBRUARY 14, 2025, 2:00 PM</span>
            <span>NATIONAL SHRINE OF OUR LADY OF FATIMA</span>
            <span>DALANDANAN EVENTS PLACE</span>
          </div>
        </div>
      </div>

      {/* Page 2 - Countdown (Slim) */}
      <div
        className="page countdown slim"
        data-section="countdown"
        style={{ backgroundImage: `url(${image2})` }}
      >
        <div className="overlay" />
        <div className="countdown-content">
          <Countdown />
          <div>Countdown to eternity…Together.</div>
        </div>
      </div>

      {/* Page 3 - Venues */}
      <div
          className="page venues slim"
          data-section="venues"
          style={{ backgroundImage: `url(${cover3})` }}
>

        <div className="venue-wrapper">
          <div className="venue-container">
            <img src={Ceremony} alt="Ceremony Venue" className="venue-image" />
            <a href="https://goo.gl/maps/..." target="_blank" rel="noopener noreferrer">📌 Google Map</a>
          </div>
          <div className="venue-container">
            <img src={Reception} alt="Reception Venue" className="venue-image" />
            <a href="https://goo.gl/maps/..." target="_blank" rel="noopener noreferrer">📌 Google Map</a>
          </div>
        </div>
      </div>

      {/* Page 4 - Entourage */}
      <div className="page entourage">
        <div className="entourage-list">
          <h2 className="entourage-title">Entourage</h2>
          {/* Bride & Groom */}
          <div className="two-grid">
            <div><p className="name">Samantha Lois Agad Enad, CPA</p></div>
            <div><p className="name">Albert Rosali Britanico</p></div>
          </div>
          {/* Parents */}
          <h3>Parents</h3>
          <div className="two-grid">
            <div>
              <p className="name">Elisabeth Agad Enad</p>
              <p className="name">Lucas Lumantao Enad</p>
            </div>
            <div>
              <p className="name">Leilani Rosali Britanico</p>
              <p className="name">Antonio Francisco Britanico</p>
            </div>
          </div>
          {/* Maid of Honor & Best Man */}
          <div className="two-grid">
            <div>
              <h4 className="role-title">Maid of Honor</h4>
              <p className="name">Francheska Louise Enad</p>
            </div>
            <div>
              <h4 className="role-title">Best Man</h4>
              <p className="name">Angelo Britanico</p>
            </div>
          </div>
         
    {/* Principal Sponsors */}
    <h3>Principal Sponsors</h3>
    <div className="sponsors-grid">
      <div className="sponsor-column">
        <p className="name">Mrs. Judith Cruz</p>
        <p className="name">Dr. Joann Basiloña, MD FPPS</p>
        <p className="name">Mrs. Ellaine Manalaysay</p>
        <p className="name">Mrs. Josefa Oi</p>
        <p className="name">Mrs. Lilian Isagani</p>
        <p className="name">Mrs. Annabel Delos Reyes</p>
        <p className="name">Mrs. Grace See</p>
        <p className="name">Mrs. Ester Briñas</p>
        <p className="name">Mrs. Rhoda Paule</p>
        <p className="name">Mrs. Josie Agad</p>
        <p className="name">Mrs. Nilda Monteroso</p>
        <p className="name">Mrs. Joebelle Comia-Ramirez</p>
      </div>
      <div className="sponsor-column">
        <p className="name">PB Rizalino Ferrer</p>
        <p className="name">Engr. Generoso O. Basiloña Jr.</p>
        <p className="name">Hon. Edgardo Dizon</p>
        <p className="name">Mr. Cesar Divinagracia</p>
        <p className="name">Mr. Berlin De Leon</p>
        <p className="name">Atty. Romeo Montefalco</p>
        <p className="name">Mr. Felipe Agad</p>
        <p className="name">Mr. Romeo Agad</p>
        <p className="name">Mr. Jonathan Rosali</p>
        <p className="name">Mr. Armando Agad</p>
        <p className="name">Mr. Romelo Agad</p>
        <p className="name">Mr. Aleben Ramos</p>
      </div>
    </div>

    {/* Secondary Sponsors */}
    <h3>Secondary Sponsors</h3>
    <div className="sponsors-grid">
      <div className="sponsor-column">
        <p className="name">Ms. Brizia Zamudio</p>
        <p className="name">Ms. Angel Mikhayelle Frias</p>
        <p className="name">Ms. Ann Lhoucell Oflian De Leon</p>
        <p className="name">Ms. Kuryn Casinillo</p>
        <p className="name">Ms. Romela Agad</p>
        <p className="name">Ms. Roshel Agad</p>
        <p className="name">Ms. Celine Agad</p>
        <p className="name">Ms. Rowella Agad</p>
      </div>
      <div className="sponsor-column">
        <p className="name">Mr. Gian Rosali</p>
        <p className="name">Mr. Emman Baes</p>
        <p className="name">Mr. Anthony Britanico</p>
        <p className="name">Mr. Christopher Pacinio</p>
        <p className="name">Mr. John Lemuel Capeña</p>
        <p className="name">Mr. John Mark Llobrera</p>
        <p className="name">Mr. Felix Agad Jr</p>
        <p className="name">Mr. Marc Amberlanz Aquino</p>
      </div>
    </div>

    {/* Candle, Veil, Cord */}
    <div className="three-grid">
      <div>
        <h4 className="role-title">Candle</h4>
        <p className="name">Mrs. Judith Cruz & Hon. Rizalino Ferrer</p>
      </div>
      <div>
        <h4 className="role-title">Veil</h4>
        <p className="name">Mrs. Rhoda Paule & Mr. Jonathan Rosali</p>
      </div>
      <div>
        <h4 className="role-title">Cord</h4>
        <p className="name">Mrs. Josie Agad & Mr. Armando Agad</p>
      </div>
    </div>

    {/* Coin, Bible, Ring */}
    <div className="three-grid">
      <div>
        <h4 className="role-title">Coin Bearer</h4>
        <p className="name">Steve Zion Agad</p>
      </div>
      <div>
        <h4 className="role-title">Bible Bearer</h4>
        <p className="name">Gio Rosali</p>
      </div>
      <div>
        <h4 className="role-title">Ring Bearer</h4>
        <p className="name">Alonso Britanico</p>
      </div>
    </div>

    {/* Flower Girls */}
    <h3 className="role-title">Flower Girls</h3>
    <div className="flower-girls">
      <p className="name">Ruemiah Espaldon</p>
      <p className="name">Felicity Quijano</p>
      <p className="name">Cristina Rose</p>
      <p className="name">Yana Rosali</p>
      <p className="name">Dana Brielle L. Arquero</p>
    </div>

        </div>
      </div>

      {/* Page 5 - Gallery */}
      <div className="page gallery" data-section="gallery">
        <h2>Gallery</h2>
        <div className="gallery-grid">
          <img src={image1} alt="Gallery 1" />
          <img src={image2} alt="Gallery 2" />
          <img src={cover3} alt="Gallery 3" />
        </div>
      </div>

      <RSVPModal
  isOpen={openModal}
  title="Samantha & Albert"
  onClose={handleCloseModal}
  Children={
    <form onSubmit={handleOnSubmit}>
      <p>
        If you're responding for you and a guest (or your family), you'll be
        able to RSVP for your entire group.
      </p>
      <input
        className='uppercase'
        placeholder="Full Name"
        value={guestName?.name}
        onChange={handleOnChange}
      />

      {dropDown?.length > 0 && (
        <div className="guest-options">
          {dropDown.map((item, index) => (
            <label key={index} className="guest-option">
              <input
                className='uppercase'
                type="radio"
                name="selectedGuest"
                value={item?.FullName}
                onChange={handleOnChange}
              />
              <span>{item?.FullName}</span>
            </label>
          ))}
        </div>
      )}

      <button
        type="submit"
        // ßdisabled={dropDown?.length > 0 && !selectedGuest}
      >
        FIND YOUR INVITATION
      </button>
    </form>
  }
/>


      {/* List Guest Modal */}
        <RSVPModal isOpen={openListModal?.isActive} title="Samantha & Albert" onClose={(e) => setOpenListModal({isActive: false, listNames: [],})}
          Children={
             <>
              List GUEST
             </>
            }
          >
      </RSVPModal>
    </div>
  );
};

export default Index;