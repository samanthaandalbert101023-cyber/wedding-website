import { useState, useEffect } from "react";

const Countdown = () => {
  const calculateTimeLeft = () => {
    // ✅ Target date: February 14, 2026, 2:00 PM
    const targetDate = new Date("2026-02-14T14:00:00").getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center gap-4 sm:gap-6 md:gap-10 text-white font-light">
      <div className="flex flex-col items-center">
        <span className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] leading-none font-thin">
          {String(timeLeft.days).padStart(2, "0")}
        </span>
        <span className="uppercase text-xs sm:text-sm opacity-80 tracking-widest">
          Days
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] leading-none font-thin">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="uppercase text-xs sm:text-sm opacity-80 tracking-widest">
          Hours
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] leading-none font-thin">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="uppercase text-xs sm:text-sm opacity-80 tracking-widest">
          Mins
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] leading-none font-thin">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className="uppercase text-xs sm:text-sm opacity-80 tracking-widest">
          Secs
        </span>
      </div>
    </div>
  );
};

export default Countdown;
