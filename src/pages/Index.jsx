import { useEffect, useRef } from "react";
import image1 from "../img/image1.JPG";
import image2 from "../img/image2.JPG";
import ido from "../song/ido.mp3";
import Countdown from "../components/Countdown";

const Index = () => {
  const audioRef = useRef(null);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const audio = audioRef.current;

    // Start muted to bypass browser autoplay restrictions
    if (audio) {
      audio.volume = 0.8;
      audio.muted = true;
      audio.play().catch(() => {});
    }

    // Unmute when user interacts (click/tap)
    const handleUserInteraction = () => {
      if (audio && audio.muted) {
        audio.muted = false;
        audio.play();
      }
    };

    window.addEventListener("click", handleUserInteraction);
    return () => window.removeEventListener("click", handleUserInteraction);
  }, []);

  return (
    <div className="w-full text-white bg-gray-900 scroll-smooth">
      {/* 🎵 Hidden Background Music */}
      <audio ref={audioRef} loop style={{ display: "none" }}>
        <source src={ido} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>

      {/* ===== PAGE 1: HERO ===== */}
      <section
        id="page1"
        className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden text-center"
      >
        {/* Background */}
        <img
          src={image1}
          alt="Wedding"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />

        {/* Names */}
        <div className="relative z-10 px-4 sm:px-8">
          <h1 className="font-[GreatVibes] text-white text-[4rem] sm:text-[6rem] md:text-[8rem] leading-tight drop-shadow-lg">
            Samantha <span className="text-amber-100">&amp;</span> Albert
          </h1>

          {/* Are Getting Married */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-100 tracking-[0.3em] font-light uppercase mt-3 drop-shadow-md">
            Are Getting Married
          </p>
        </div>

        {/* Bottom Text (date left, location right) */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-between px-6 sm:px-10 text-gray-200 text-xs sm:text-sm font-mono tracking-wider">
          <p>FEBRUARY 14, 2026, 2:00 PM</p>
          <p className="uppercase">National Shrine of Our Lady of Fatima</p>
        </div>
      </section>

      {/* ===== PAGE 2: COUNTDOWN ===== */}
      <section
        id="page2"
        className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
      >
        {/* Background Image */}
        <img
          src={image2}
          alt="Countdown Background"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />

        {/* Countdown Content */}
        <div className="relative flex flex-col items-center justify-center text-center px-6 sm:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-amber-100 font-light mb-8 tracking-wider uppercase">
            The Countdown Begins
          </h2>

          <div className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] font-light leading-tight tracking-widest drop-shadow-2xl">
            <Countdown />
          </div>

          <div className="mt-6 flex justify-center gap-10 sm:gap-20 text-sm sm:text-lg uppercase font-light tracking-widest text-gray-200 opacity-90">
            <span>Days</span>
            <span>Hours</span>
            <span>Mins</span>
            <span>Secs</span>
          </div>
        </div>
      </section>

      {/* ===== PAGE 3: OUR STORY ===== */}
      <section
        id="page3"
        className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-center px-6 sm:px-12"
      >
        <h2 className="text-4xl sm:text-5xl font-semibold mb-6">
          Our Story 💕
        </h2>
        <p className="max-w-3xl text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed">
          It all started with a smile... Samantha and Albert met in the most
          unexpected way, and what began as friendship blossomed into something
          truly beautiful. Their journey is filled with laughter, late-night
          talks, and countless shared dreams.
        </p>
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80"
          alt="Our Story"
          className="w-full sm:w-3/5 mt-10 rounded-2xl shadow-lg object-cover"
        />
      </section>

      {/* ===== PAGE 4: GALLERY ===== */}
      <section
        id="page4"
        className="min-h-screen flex flex-col items-center justify-center bg-gray-700 text-center px-6 sm:px-12"
      >
        <h2 className="text-4xl sm:text-5xl font-semibold mb-8">Gallery 📸</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <img
              key={i}
              src={`https://source.unsplash.com/random/400x400?couple,wedding,${i}`}
              alt={`Gallery ${i}`}
              className="w-full h-40 sm:h-56 object-cover rounded-lg shadow-lg hover:scale-105 transition-transform"
            />
          ))}
        </div>
      </section>

      {/* ===== PAGE 5: RSVP ===== */}
      <section
        id="page5"
        className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center px-6 sm:px-12"
      >
        <h2 className="text-4xl sm:text-5xl font-semibold mb-6">RSVP 💌</h2>
        <p className="max-w-2xl text-lg sm:text-xl text-gray-200 mb-8">
          We’d love to celebrate this special day with you! Please confirm your
          attendance by filling out our RSVP form below.
        </p>
        <form className="flex flex-col gap-4 w-full sm:w-2/3 md:w-1/3">
          <input
            type="text"
            placeholder="Full Name"
            className="p-3 rounded-md text-gray-900"
          />
          <input
            type="email"
            placeholder="Email Address"
            className="p-3 rounded-md text-gray-900"
          />
          <select className="p-3 rounded-md text-gray-900">
            <option>Will Attend</option>
            <option>Cannot Attend</option>
          </select>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-full transition"
          >
            Submit RSVP
          </button>
        </form>

        <button
          onClick={() => scrollToSection("page1")}
          className="mt-10 underline text-amber-400 hover:text-amber-300"
        >
          Back to Top ↑
        </button>
      </section>
    </div>
  );
};

export default Index;
