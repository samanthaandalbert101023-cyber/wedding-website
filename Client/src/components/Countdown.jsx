import { useState, useEffect } from "react";

const Countdown = () => {
  const calculateTimeLeft = () => {
    const targetDate = new Date("2026-02-14T14:00:00").getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // intersection observer (MOVED INSIDE COMPONENT)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    document
      .querySelectorAll(".venue-container")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const numberStyle = {
    fontFamily: "'DM Serif Text', serif",
    lineHeight: 1,
    fontSize: "18vw",
    minWidth: "4rem",
    textAlign: "center",
  };

  const labelStyle = {
    fontFamily: "'DM Serif Text', serif",
    fontSize: "3vw",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    opacity: 0.8,
    marginTop: "0.25rem",
    textAlign: "center",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "5vw",
        color: "white",
        alignItems: "center",
      }}
    >
      {["days", "hours", "minutes", "seconds"].map((unit) => (
        <div
          key={unit}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <span style={numberStyle}>
            {String(timeLeft[unit]).padStart(2, "0")}
          </span>
          <span style={labelStyle}>
            {unit.charAt(0).toUpperCase() + unit.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Countdown
