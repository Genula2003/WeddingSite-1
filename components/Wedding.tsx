'use client';



import { useEffect, useState, useRef } from 'react';

import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

import {
  Menu,
  CalendarDays,
  Clock3,
  Building2,
  Trees,

  MapPin,

  Heart,

  Send,

  Check,

  X,

  Phone,

  ArrowDown,

  Flower2,

  Navigation,

  Volume2,

  VolumeX,

} from 'lucide-react';

import BackgroundAnimation from './BackgroundAnimation';



export type Guest = {

  name: string;

  household?: string | null;

  token: string;

  seats: number;

  status: string;

  attending_count: number;

  attendee_names?: string[];

  guest_message?: string | null;

};



const mapUrl = 'https://maps.app.goo.gl/gwr9NAbTvqUno7ePA?g_st=iw';







export default function Wedding({ guest }: { guest?: Guest }) {

  const [opened, setOpened] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const welcomeVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforeLeaveRef = useRef(false);

  // Auto-pause when user leaves tab / window, and auto-resume when returning
  useEffect(() => {
    const pauseAudio = () => {
      if (audioRef.current && !audioRef.current.paused) {
        wasPlayingBeforeLeaveRef.current = true;
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    const resumeAudio = () => {
      if (audioRef.current && wasPlayingBeforeLeaveRef.current && opened) {
        audioRef.current.loop = true;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
        wasPlayingBeforeLeaveRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        pauseAudio();
      } else if (document.visibilityState === 'visible') {
        resumeAudio();
      }
    };

    const handlePageHide = () => {
      pauseAudio();
    };

    const handleWindowBlur = () => {
      pauseAudio();
    };

    const handleWindowFocus = () => {
      resumeAudio();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [opened]);



  const [time, setTime] = useState([0, 0, 0, 0]);

  const [status, setStatus] = useState(guest?.status || 'pending');

  const [count, setCount] = useState(guest?.attending_count || 1);

  const [attendeeNames, setAttendeeNames] = useState<string[]>(guest?.attendee_names || []);

  const [message, setMessage] = useState('');

  const [feedback, setFeedback] = useState('');

  const [busy, setBusy] = useState(false);



  const handleStartEntryVideo = () => {
    if (welcomeVideoRef.current) {
      if (!videoStarted) {
        setVideoStarted(true);
        welcomeVideoRef.current.currentTime = 0;
        welcomeVideoRef.current.play().catch(() => {});
      } else if (welcomeVideoRef.current.paused) {
        welcomeVideoRef.current.play().catch(() => {});
      }
    }
    // Prime the audio context on user touch gesture so music plays automatically when video ends
    if (audioRef.current) {
      audioRef.current.loop = true;
      if (audioRef.current.paused) {
        audioRef.current.load();
      }
    }
  };

  const handleVideoEnded = () => {
    setOpened(true);
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  // Ensure video waits at start until user touches/taps
  useEffect(() => {
    if (!opened && welcomeVideoRef.current && !videoStarted) {
      welcomeVideoRef.current.currentTime = 0;
      welcomeVideoRef.current.pause();
    }
  }, [opened, videoStarted]);



  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      wasPlayingBeforeLeaveRef.current = false;
    } else {
      audioRef.current.loop = true;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };



  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {

    stiffness: 100,

    damping: 30,

    restDelta: 0.001,

  });



  useEffect(() => {

    const tick = () => {

      const ms = Math.max(0, new Date('2026-12-03T07:30:00+05:30').getTime() - Date.now());

      setTime([

        Math.floor(ms / 86400000),

        Math.floor(ms / 3600000) % 24,

        Math.floor(ms / 60000) % 60,

        Math.floor(ms / 1000) % 60,

      ]);

    };

    tick();

    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);

  }, []);



  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      const navOffset = 82;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth',
      });
    }
  };



  const handleNameChange = (index: number, val: string) => {

    const next = [...attendeeNames];

    next[index] = val;

    setAttendeeNames(next);

  };



  async function respond(next: 'accepted' | 'declined') {
    if (!guest) {
      setStatus(next);
      setFeedback(
        next === 'accepted'
          ? 'Thank you! Your attendance has been confirmed. We warmly look forward to celebrating with you!'
          : 'Thank you for letting us know.'
      );
      return;
    }
    setBusy(true);
    try {
      const finalCount = next === 'accepted' ? count : 0;
      const filteredNames = next === 'accepted' ? attendeeNames.slice(0, count).filter(Boolean) : [];

      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: guest.token,
          status: next,
          count: finalCount,
          attendeeNames: filteredNames,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit response');
      setStatus(next);
      setFeedback(
        next === 'accepted'
          ? 'Thank you! We look forward to celebrating with you.'
          : 'Thank you for letting us know. You will be missed.'
      );
    } catch (e) {
      setFeedback((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!message.trim()) return;
    setBusy(true);
    try {
      if (guest) {
        const res = await fetch('/api/wishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: guest.token, message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send message');
      }
      setMessage('');
      setFeedback('Your lovely message has been sent to Gimasha & Chathura. Thank you!');
    } catch (e) {
      setMessage('');
      setFeedback('Thank you! Your lovely message has been sent.');
    } finally {
      setBusy(false);
    }
  }
  return (

    <>

      <audio
        ref={audioRef}
        src="/audio/wedding-melody.mp3"
        loop
        preload="auto"
        onEnded={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }}
      />



      {opened && (

        <motion.button

          className={`floating-music-btn ${isPlaying ? 'playing' : ''}`}

          onClick={toggleMusic}

          initial={{ opacity: 0, scale: 0.6 }}

          animate={{ opacity: 1, scale: 1 }}

          transition={{ duration: 0.4 }}

          aria-label={isPlaying ? 'Pause music' : 'Play music'}

          title={isPlaying ? 'Pause background music' : 'Play background music'}

        >

          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}

        </motion.button>

      )}



      <AnimatePresence mode="wait">
        {!opened && (
          <motion.div
            key="invitation-cover"
            className="invitation-cover-screen"
            onClick={handleStartEntryVideo}
            onTouchStart={handleStartEntryVideo}
            role="button"
            tabIndex={0}
            aria-label="Tap to play wedding invitation video"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleStartEntryVideo();
              }
            }}
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.03,
              filter: 'blur(10px)',
              transition: { duration: 0.9, ease: [0.77, 0, 0.175, 1] },
            }}
          >
            <div className="welcome-video-wrapper">
              <video
                ref={welcomeVideoRef}
                className="welcome-screen-video"
                muted
                playsInline
                preload="auto"
                onEnded={handleVideoEnded}
              >
                <source src="/welcome.mp4" type="video/mp4" />
              </video>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <main className="wedding-main-page">

        <motion.div className="scroll-progress-bar" style={{ scaleX }} />



        <BackgroundAnimation />



        <motion.header
          className="nav"
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.3 }}
        >
          {/* Mobile Navigation Toggle (Visible on Mobile/Tablet) */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            <span className="mobile-nav-toggle-text">{mobileMenuOpen ? 'CLOSE' : 'MENU'}</span>
          </button>

          {/* Desktop Navigation Links */}
          <nav>
            <a href="#home" onClick={(e) => handleSmoothScroll(e, 'home')}>
              HOME
            </a>
            <a href="#countdown" onClick={(e) => handleSmoothScroll(e, 'countdown')}>
              COUNTDOWN
            </a>
            <a href="#couple" onClick={(e) => handleSmoothScroll(e, 'couple')}>
              OUR STORY
            </a>
            <a href="#details" onClick={(e) => handleSmoothScroll(e, 'details')}>
              DETAILS
            </a>
            <a href="#rsvp" onClick={(e) => handleSmoothScroll(e, 'rsvp')}>
              RSVP
            </a>
            <a href="#location" onClick={(e) => handleSmoothScroll(e, 'location')}>
              LOCATION
            </a>
          </nav>

          {/* Cover Screen Button on Navbar Side */}
          <button
            className="nav-pill"
            onClick={() => {
              setMobileMenuOpen(false);
              setVideoStarted(false);
              setOpened(false);
              if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
                wasPlayingBeforeLeaveRef.current = false;
              }
              if (welcomeVideoRef.current) {
                welcomeVideoRef.current.currentTime = 0;
                welcomeVideoRef.current.pause();
              }
            }}
          >
            COVER SCREEN ♡
          </button>
        </motion.header>

        {/* Mobile Navigation Drawer & Backdrop */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="mobile-nav-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                className="mobile-nav-drawer"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mobile-nav-inner">
                  <a
                    href="#home"
                    className="mobile-nav-link"
                    onClick={(e) => {
                      handleSmoothScroll(e, 'home');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="mobile-nav-num">01</span>
                    <span>HOME</span>
                  </a>
                  <a
                    href="#countdown"
                    className="mobile-nav-link"
                    onClick={(e) => {
                      handleSmoothScroll(e, 'countdown');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="mobile-nav-num">02</span>
                    <span>COUNTDOWN</span>
                  </a>
                  <a
                    href="#couple"
                    className="mobile-nav-link"
                    onClick={(e) => {
                      handleSmoothScroll(e, 'couple');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="mobile-nav-num">03</span>
                    <span>OUR STORY</span>
                  </a>
                  <a
                    href="#details"
                    className="mobile-nav-link"
                    onClick={(e) => {
                      handleSmoothScroll(e, 'details');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="mobile-nav-num">04</span>
                    <span>DETAILS</span>
                  </a>
                  <a
                    href="#rsvp"
                    className="mobile-nav-link"
                    onClick={(e) => {
                      handleSmoothScroll(e, 'rsvp');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="mobile-nav-num">05</span>
                    <span>RSVP</span>
                  </a>
                  <a
                    href="#location"
                    className="mobile-nav-link"
                    onClick={(e) => {
                      handleSmoothScroll(e, 'location');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="mobile-nav-num">06</span>
                    <span>LOCATION</span>
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>



        <section className="hero" id="home">
          <motion.div
            className="hero-bg-container"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <video
              className="hero-bg-video"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/images/hero-couple-clean.jpg"
            >
              <source src="/hero.mp4" type="video/mp4" />
              <picture>
                <source media="(max-width: 640px)" srcSet="/images/hero-couple-mobile.jpg" />
                <img
                  src="/images/hero-couple-clean.jpg"
                  alt="Gimasha &amp; Chathura Wedding"
                  className="hero-bg-img"
                />
              </picture>
            </video>
            <div className="hero-shade" />
            <div className="hero-bottom-fade" />
          </motion.div>

          <div className="hero-content">
            <motion.div
              className="eyebrow light"
              initial={{ opacity: 0, y: -15, letterSpacing: '6px' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '3.5px' }}
              transition={{ duration: 1.0, delay: 0.25 }}
            >
              TOGETHER FOREVER
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.25, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="hero-name-line">Gimasha <em className="hero-amp">&amp;</em></span>
              <span className="hero-name-line">Chathura</span>
            </motion.h1>

            <motion.div
              className="hero-rule"
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.65 }}
            >
              ✦ &nbsp; ARE GETTING MARRIED &nbsp; ✦
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8 }}
            >
              With the blessings of our families, we warmly invite you to celebrate our special day of love and happiness.
            </motion.p>
          </div>

        </section>

        <section className="section countdown-section-wrapper" id="countdown">
          <motion.div
            className="countdown-luxury-card"
            initial={{ opacity: 0, scale: 0.94, y: 45 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="countdown-eyebrow"
              initial={{ opacity: 0, letterSpacing: '6px' }}
              whileInView={{ opacity: 1, letterSpacing: '3px' }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 }}
            >
              COUNTDOWN TO FOREVER
            </motion.div>

            <motion.h2
              className="countdown-main-title"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              COUNTING DOWN TO FOREVER
            </motion.h2>

            <motion.div
              className="countdown-flourish"
              aria-hidden="true"
              initial={{ opacity: 0, scaleX: 0.4 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="countdown-flourish-bar" />
              <motion.span
                className="countdown-flourish-diamond"
                initial={{ rotate: -90, scale: 0 }}
                whileInView={{ rotate: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.45 }}
              >
                ◇
              </motion.span>
              <span className="countdown-flourish-bar" />
            </motion.div>

            <div className="countdown-grid">
              {[
                { label: 'DAYS', value: time[0] },
                { label: 'HOURS', value: time[1] },
                { label: 'MINUTES', value: time[2] },
                { label: 'SECONDS', value: time[3] },
              ].map((item, idx) => (
                <motion.div
                  className="countdown-card"
                  key={item.label}
                  initial={{ opacity: 0, y: 40, rotateX: 20, scale: 0.88 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.8,
                    delay: 0.35 + idx * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <strong className="countdown-num">{String(item.value).padStart(2, '0')}</strong>
                  <span className="countdown-lbl">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>



        <section className="section couple couple-section-wrapper" id="couple">
          <motion.div
            className="couple-header-wrap"
            initial={{ opacity: 0, y: -26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="couple-top-flourish" aria-hidden="true">
              <span className="couple-flourish-dot">✦</span>
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                <path d="M12 2 C10.5 5.5 8.5 7.5 6 7.5 C4.5 7.5 3.5 6 4.5 4.8 C5.8 3.5 8.8 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 C13.5 5.5 15.5 7.5 18 7.5 C19.5 7.5 20.5 6 19.5 4.8 C18.2 3.5 15.2 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 L12 16" stroke="#c59b43" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="12" cy="7" r="1.5" fill="#f7eedb" />
              </svg>
              <span className="couple-flourish-dot">✦</span>
            </div>

            <div className="couple-eyebrow">THE HAPPY COUPLE</div>

            <h2 className="couple-main-title">TWO HEARTS, ONE JOURNEY</h2>

            <div className="couple-section-flourish" aria-hidden="true">
              <span className="couple-flourish-bar" />
              <span className="couple-flourish-diamond">◇</span>
              <span className="couple-flourish-bar" />
            </div>
          </motion.div>

          <div className="couple-arch-container">
            {/* Left Arch Card: THE BRIDE (GIMASHA) */}
            <motion.div
              className="couple-arch-card"
              initial={{ opacity: 0, x: -75, rotate: -3 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              {/* Botanical Foliage Accents */}
              <svg className="arch-botanical-tl" viewBox="0 0 110 90" fill="none" aria-hidden="true">
                <path d="M10 75 C 30 50, 50 35, 95 18" stroke="#366b47" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                <path d="M26 58 C 18 50, 18 36, 30 36 C 40 36, 36 50, 26 58 Z" fill="#2d5e3f" opacity="0.8" />
                <path d="M48 42 C 40 30, 48 18, 58 20 C 68 22, 60 38, 48 42 Z" fill="#38744f" opacity="0.85" />
                <circle cx="38" cy="52" r="2.8" fill="#d4af37" />
                <circle cx="70" cy="28" r="2.4" fill="#c59b43" />
              </svg>

              <svg className="arch-botanical-br" viewBox="0 0 110 90" fill="none" aria-hidden="true">
                <path d="M100 15 C 80 40, 55 60, 15 72" stroke="#366b47" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                <path d="M82 28 C 90 36, 88 48, 78 48 C 70 48, 74 36, 82 28 Z" fill="#2d5e3f" opacity="0.8" />
                <path d="M55 46 C 60 56, 52 66, 42 64 C 34 62, 42 50, 55 46 Z" fill="#38744f" opacity="0.85" />
                <circle cx="68" cy="38" r="2.6" fill="#d4af37" />
                <circle cx="36" cy="60" r="2.2" fill="#c59b43" />
              </svg>

              {/* Crown motif */}
              <div className="couple-crown-flourish" aria-hidden="true">
                <svg width="42" height="18" viewBox="0 0 42 18" fill="none">
                  <path d="M21 3 C18 6 12 7 8 8 C14 10 18 11 21 15 C24 11 28 10 34 8 C30 7 24 6 21 3 Z" fill="#c59b43" opacity="0.9" />
                  <circle cx="21" cy="4" r="1.5" fill="#f7eedb" />
                  <circle cx="11" cy="8" r="1.2" fill="#c59b43" />
                  <circle cx="31" cy="8" r="1.2" fill="#c59b43" />
                </svg>
              </div>

              <div className="couple-role-pill">✦ THE BRIDE ✦</div>

              <h3 className="couple-name">GIMASHA</h3>

              <div className="couple-parents-sub">Daughter of</div>
              <div className="couple-parents-names">Mr &amp; Mrs W.M.E. Warnasooriya</div>
            </motion.div>

            {/* Center Motif: INTERLOCKING RINGS */}
            <motion.div
              className="couple-rings-motif"
              initial={{ opacity: 0, scale: 0.45, rotate: -15 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.95, delay: 0.38, type: 'spring', bounce: 0.38 }}
            >
              <div className="couple-rings-wrapper">
                {/* Left olive branch */}
                <svg width="34" height="28" viewBox="0 0 34 28" fill="none" className="couple-rings-leaf left" aria-hidden="true">
                  <path d="M30 24 C 20 18, 12 14, 2 12" stroke="#366b47" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M24 18 C 18 12, 20 6, 28 8 C 32 10, 30 16, 24 18 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M12 14 C 6 8, 8 2, 16 4 C 20 6, 18 12, 12 14 Z" fill="#38744f" opacity="0.85" />
                </svg>

                {/* Interlocking Rings SVG with heart */}
                <svg width="76" height="52" viewBox="0 0 76 52" fill="none" className="couple-rings-svg">
                  <circle cx="28" cy="26" r="20" stroke="#d4af37" strokeWidth="3" />
                  <circle cx="28" cy="26" r="20" stroke="#fcf9f2" strokeWidth="1" opacity="0.4" />
                  <circle cx="48" cy="26" r="20" stroke="#3a6f4e" strokeWidth="3" opacity="0.9" />
                  <circle cx="48" cy="26" r="20" stroke="#d4af37" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
                  <path d="M38 23 C37 21 34.5 21 34 23 C33 26 38 29 38 29 C38 29 43 26 42 23 C41.5 21 39 21 38 23 Z" fill="#d4af37" />
                </svg>

                {/* Right olive branch */}
                <svg width="34" height="28" viewBox="0 0 34 28" fill="none" className="couple-rings-leaf right" aria-hidden="true">
                  <path d="M4 24 C 14 18, 22 14, 32 12" stroke="#366b47" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M10 18 C 16 12, 14 6, 6 8 C 2 10, 4 16, 10 18 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M22 14 C 28 8, 26 2, 18 4 C 14 6, 16 12, 22 14 Z" fill="#38744f" opacity="0.85" />
                </svg>
              </div>
              <span className="couple-forever-text">FOREVER &amp; ALWAYS</span>
            </motion.div>

            {/* Right Arch Card: THE GROOM (CHATHURA) */}
            <motion.div
              className="couple-arch-card"
              initial={{ opacity: 0, x: 75, rotate: 3 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              {/* Botanical Foliage Accents */}
              <svg className="arch-botanical-tr" viewBox="0 0 110 90" fill="none" aria-hidden="true">
                <path d="M100 75 C 80 50, 60 35, 15 18" stroke="#366b47" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                <path d="M84 58 C 92 50, 92 36, 80 36 C 70 36, 74 50, 84 58 Z" fill="#2d5e3f" opacity="0.8" />
                <path d="M62 42 C 70 30, 62 18, 52 20 C 42 22, 50 38, 62 42 Z" fill="#38744f" opacity="0.85" />
                <circle cx="72" cy="52" r="2.8" fill="#d4af37" />
                <circle cx="40" cy="28" r="2.4" fill="#c59b43" />
              </svg>

              <svg className="arch-botanical-bl" viewBox="0 0 110 90" fill="none" aria-hidden="true">
                <path d="M10 15 C 30 40, 55 60, 95 72" stroke="#366b47" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                <path d="M28 28 C 20 36, 22 48, 32 48 C 40 48, 36 36, 28 28 Z" fill="#2d5e3f" opacity="0.8" />
                <path d="M55 46 C 50 56, 58 66, 68 64 C 76 62, 68 50, 55 46 Z" fill="#38744f" opacity="0.85" />
                <circle cx="42" cy="38" r="2.6" fill="#d4af37" />
                <circle cx="74" cy="60" r="2.2" fill="#c59b43" />
              </svg>

              {/* Crown motif */}
              <div className="couple-crown-flourish" aria-hidden="true">
                <svg width="42" height="18" viewBox="0 0 42 18" fill="none">
                  <path d="M21 3 C18 6 12 7 8 8 C14 10 18 11 21 15 C24 11 28 10 34 8 C30 7 24 6 21 3 Z" fill="#c59b43" opacity="0.9" />
                  <circle cx="21" cy="4" r="1.5" fill="#f7eedb" />
                  <circle cx="11" cy="8" r="1.2" fill="#c59b43" />
                  <circle cx="31" cy="8" r="1.2" fill="#c59b43" />
                </svg>
              </div>

              <div className="couple-role-pill">✦ THE GROOM ✦</div>

              <h3 className="couple-name">CHATHURA</h3>

              <div className="couple-parents-sub">Son of</div>
              <div className="couple-parents-names">Mr &amp; Mrs W.K.D. Rathnayake</div>
            </motion.div>
          </div>
        </section>




        <section className="section details details-section-wrapper" id="details">
          <motion.div
            className="details-header-wrap"
            initial={{ opacity: 0, y: -22, filter: 'blur(5px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="details-top-flourish" aria-hidden="true">
              <span className="details-flourish-dot">✦</span>
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                <path d="M12 2 C10.5 5.5 8.5 7.5 6 7.5 C4.5 7.5 3.5 6 4.5 4.8 C5.8 3.5 8.8 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 C13.5 5.5 15.5 7.5 18 7.5 C19.5 7.5 20.5 6 19.5 4.8 C18.2 3.5 15.2 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 L12 16" stroke="#c59b43" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="12" cy="7" r="1.5" fill="#f7eedb" />
              </svg>
              <span className="details-flourish-dot">✦</span>
            </div>

            <h2 className="details-main-title">THE DETAILS</h2>

            <div className="details-section-flourish" aria-hidden="true">
              <span className="details-flourish-bar" />
              <span className="details-flourish-diamond">◇</span>
              <span className="details-flourish-bar" />
            </div>
          </motion.div>

          <motion.div
            className="details-card"
            initial={{ opacity: 0, rotateX: 14, y: 55, scale: 0.94 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 1200 }}
          >
            {/* Left Column: THE DATE */}
            <motion.div
              className="details-column"
              initial={{ opacity: 0, x: -45 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="details-badge-wrapper"
                aria-hidden="true"
                initial={{ scale: 0.5, rotate: -30 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, type: 'spring', bounce: 0.35 }}
              >
                <svg className="details-badge-leaf left" viewBox="0 0 60 40" fill="none">
                  <path d="M55 25 C40 22 25 15 5 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M42 20 C36 14 36 6 45 6 C52 6 50 16 42 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M25 16 C18 10 20 2 29 3 C36 4 33 13 25 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="34" cy="19" r="2" fill="#d4af37" />
                </svg>
                <div className="details-badge-circle">
                  <CalendarDays size={18} color="#e5c875" />
                </div>
                <svg className="details-badge-leaf right" viewBox="0 0 60 40" fill="none">
                  <path d="M5 25 C20 22 35 15 55 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M18 20 C24 14 24 6 15 6 C8 6 10 16 18 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M35 16 C42 10 40 2 31 3 C24 4 27 13 35 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="26" cy="19" r="2" fill="#d4af37" />
                </svg>
              </motion.div>

              <div className="details-item-eyebrow">THE DATE</div>
              <h3 className="details-item-title">Thursday, December 03, 2026</h3>
              <div className="details-item-sub">Time – From 10 AM to 4 PM</div>
              <div className="details-item-rule" />
              <p className="details-item-desc">
                Save the date to share this milestone with us
              </p>
            </motion.div>

            {/* Center Divider with Rosette Flower */}
            <div className="details-divider-col" aria-hidden="true">
              <motion.div
                className="details-divider-line top"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: 0.3 }}
                style={{ originY: 1 }}
              />
              <motion.div
                className="details-divider-flower"
                initial={{ scale: 0, rotate: 180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.45 }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="6" r="3" fill="#c59b43" />
                  <circle cx="16" cy="11" r="3" fill="#c59b43" />
                  <circle cx="11" cy="16" r="3" fill="#c59b43" />
                  <circle cx="6" cy="11" r="3" fill="#c59b43" />
                  <circle cx="11" cy="11" r="2.2" fill="#fcf9f2" />
                  <circle cx="11" cy="11" r="1.2" fill="#d4af37" />
                </svg>
              </motion.div>
              <motion.div
                className="details-divider-line bottom"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: 0.3 }}
                style={{ originY: 0 }}
              />
            </div>

            {/* Right Column: PORUWA CEREMONY */}
            <motion.div
              className="details-column"
              initial={{ opacity: 0, x: 45 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="details-badge-wrapper"
                aria-hidden="true"
                initial={{ scale: 0.5, rotate: 30 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45, type: 'spring', bounce: 0.35 }}
              >
                <svg className="details-badge-leaf left" viewBox="0 0 60 40" fill="none">
                  <path d="M55 25 C40 22 25 15 5 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M42 20 C36 14 36 6 45 6 C52 6 50 16 42 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M25 16 C18 10 20 2 29 3 C36 4 33 13 25 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="34" cy="19" r="2" fill="#d4af37" />
                </svg>
                <div className="details-badge-circle">
                  <Clock3 size={18} color="#e5c875" />
                </div>
                <svg className="details-badge-leaf right" viewBox="0 0 60 40" fill="none">
                  <path d="M5 25 C20 22 35 15 55 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M18 20 C24 14 24 6 15 6 C8 6 10 16 18 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M35 16 C42 10 40 2 31 3 C24 4 27 13 35 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="26" cy="19" r="2" fill="#d4af37" />
                </svg>
              </motion.div>

              <div className="details-item-eyebrow">PORUWA CEREMONY</div>
              <h3 className="details-item-title">Poruwa Ceremony – 7.30 AM</h3>
              <div className="details-item-sub">At the Auspicious Time</div>
              <div className="details-item-rule" />
              <p className="details-item-desc">
                Followed by wedding celebrations from 10 AM to 4 PM
              </p>
            </motion.div>
          </motion.div>
        </section>




        <section className="section rsvp rsvp-section-wrapper" id="rsvp">
          <motion.div
            className="rsvp-header-wrap"
            initial={{ opacity: 0, y: -24, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rsvp-eyebrow">YOUR PRESENCE MATTERS</div>

            <div className="rsvp-section-flourish" aria-hidden="true">
              <span className="rsvp-flourish-bar" />
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                <path d="M12 2 C10.5 5.5 8.5 7.5 6 7.5 C4.5 7.5 3.5 6 4.5 4.8 C5.8 3.5 8.8 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 C13.5 5.5 15.5 7.5 18 7.5 C19.5 7.5 20.5 6 19.5 4.8 C18.2 3.5 15.2 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 L12 16" stroke="#c59b43" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="12" cy="7" r="1.5" fill="#f7eedb" />
              </svg>
              <span className="rsvp-flourish-bar" />
            </div>

            <h2 className="rsvp-main-title">RSVP INVITATION</h2>

            <p className="rsvp-subtitle">
              We would be truly honored by your gracious presence on our auspicious wedding day.<br />
              Please kindly let us know if you will be attending.
            </p>
          </motion.div>

          <motion.div
            className="rsvp-card"
            initial={{ opacity: 0, y: 70, scale: 0.93 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.15, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Botanical watercolor top-left corner */}
            <motion.svg
              className="rsvp-card-botanical-tl"
              viewBox="0 0 140 100"
              fill="none"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.7, x: -20, y: -20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <path d="M5 80 C 25 60, 50 40, 110 18" stroke="#366b47" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M22 62 C 14 55, 12 40, 24 38 C 34 38, 30 54, 22 62 Z" fill="#2d5e3f" opacity="0.85" />
              <path d="M42 46 C 36 34, 42 22, 54 24 C 64 26, 56 42, 42 46 Z" fill="#38744f" opacity="0.9" />
              <path d="M68 32 C 64 18, 75 10, 86 14 C 95 18, 84 32, 68 32 Z" fill="#285437" opacity="0.88" />
              <path d="M96 22 C 95 12, 106 6, 115 10 C 122 14, 112 24, 96 22 Z" fill="#3d7e56" opacity="0.8" />
              <circle cx="36" cy="56" r="3.2" fill="#d4af37" />
              <circle cx="58" cy="38" r="2.8" fill="#d4af37" />
              <circle cx="86" cy="24" r="3" fill="#c59b43" />
              <circle cx="114" cy="14" r="2.5" fill="#e5c875" />
            </motion.svg>

            {/* Botanical watercolor bottom-right corner */}
            <motion.svg
              className="rsvp-card-botanical-br"
              viewBox="0 0 120 80"
              fill="none"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.7, x: 20, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <path d="M115 15 C 95 35, 65 55, 15 70" stroke="#366b47" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M95 28 C 102 36, 102 48, 92 50 C 82 50, 85 36, 95 28 Z" fill="#2d5e3f" opacity="0.85" />
              <path d="M65 44 C 70 54, 64 66, 52 64 C 44 62, 52 48, 65 44 Z" fill="#38744f" opacity="0.9" />
              <circle cx="78" cy="36" r="2.8" fill="#d4af37" />
              <circle cx="45" cy="56" r="2.5" fill="#e5c875" />
            </motion.svg>

            <div className="rsvp-card-flourish" aria-hidden="true">
              <span className="rsvp-card-flourish-bar" />
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <path d="M10 1 C8.8 4 7 5.5 5 5.5 C3.8 5.5 3 4.2 4 3.2 C5 2.2 7.5 1.8 10 1 Z" fill="#c59b43" />
                <path d="M10 1 C11.2 4 13 5.5 15 5.5 C16.2 5.5 17 4.2 16 3.2 C15 2.2 12.5 1.8 10 1 Z" fill="#c59b43" />
                <circle cx="10" cy="9" r="1.5" fill="#c59b43" />
              </svg>
              <span className="rsvp-card-flourish-bar" />
            </div>

            <div className="rsvp-card-eyebrow">CORDIALLY INVITED</div>

            <motion.h3
              className="rsvp-guest-name"
              initial={{ opacity: 0, letterSpacing: '4px', y: 12 }}
              whileInView={{ opacity: 1, letterSpacing: '1.8px', y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.3 }}
            >
              {guest ? (
                guest.household ? (
                  <>{guest.name} &amp; FAMILY</>
                ) : (
                  <>{guest.name}</>
                )
              ) : (
                <>HONOURED GUEST &amp; FAMILY</>
              )}
            </motion.h3>

            <div className="rsvp-card-diamond" aria-hidden="true">
              ◇
            </div>

            <motion.blockquote
              className="rsvp-quote"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              &ldquo;Together with our families, we warmly request the honour of your presence and blessings to celebrate our marriage and share this auspicious occasion with us.&rdquo;
            </motion.blockquote>

            {guest && guest.seats > 1 && (
              <div className="rsvp-party-selector">
                <label htmlFor="party-count">Attending party size:</label>
                <select
                  id="party-count"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="rsvp-select-control"
                >
                  {Array.from({ length: guest.seats }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'Person' : 'People'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {guest && guest.seats > 1 && count > 1 && (
              <div className="rsvp-names-container">
                <div className="rsvp-names-label">Names of attending guests (optional):</div>
                {Array.from({ length: count - 1 }, (_, i) => (
                  <input
                    key={i}
                    type="text"
                    className="rsvp-input-field"
                    placeholder={`Guest ${i + 2} full name`}
                    aria-label={`Guest ${i + 2} full name`}
                    value={attendeeNames[i] || ''}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                  />
                ))}
              </div>
            )}

            <motion.div
              className="rsvp-action-center"
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.button
                disabled={busy}
                className={`rsvp-attend-btn ${status === 'accepted' ? 'confirmed' : ''}`}
                onClick={() => respond('accepted')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
              >
                <span className="rsvp-btn-leaf" aria-hidden="true">
                  <svg width="22" height="15" viewBox="0 0 22 15" fill="none">
                    <path d="M1 14 C4 11 8 8 10 4 C12 1 15 0 20 1 C19 5 16 9 11 12 C7 14 3 14 1 14 Z" fill="#d4af37" opacity="0.9" />
                    <path d="M6 14 C8 11 11 9 17 8" stroke="#0e2e1c" strokeWidth="0.8" />
                  </svg>
                </span>
                <span className="rsvp-btn-title">
                  {busy ? 'CONFIRMING...' : status === 'accepted' ? 'ATTENDING CONFIRMED' : 'I WILL ATTEND'}
                </span>
                <span className="rsvp-btn-icon" aria-hidden="true">
                  {status === 'accepted' ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7 H11.5 M7.5 3 L11.5 7 L7.5 11" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </motion.button>
            </motion.div>

            <div className="rsvp-decline-center">
              <button
                disabled={busy}
                className={`rsvp-decline-link ${status === 'declined' ? 'declined' : ''}`}
                onClick={() => respond('declined')}
                type="button"
              >
                {status === 'declined' ? (
                  <span className="rsvp-declined-state">Response recorded: Unable to attend</span>
                ) : (
                  <span>Unable to attend? Let us know</span>
                )}
              </button>
            </div>

            {feedback && (
              <motion.div
                className="rsvp-feedback-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {feedback}
              </motion.div>
            )}
          </motion.div>
        </section>

        <section className="section wishes wishes-section-wrapper" id="wishes">
          <motion.div
            className="wishes-header-wrap"
            initial={{ opacity: 0, scale: 0.92, y: -18 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="wishes-eyebrow">SEND YOUR BLESSINGS</div>

            <h2 className="wishes-main-title">WARM WISHES</h2>

            <div className="wishes-section-flourish" aria-hidden="true">
              <span className="wishes-flourish-bar" />
              <span className="wishes-flourish-diamond">◇</span>
              <span className="wishes-flourish-bar" />
            </div>
          </motion.div>

          <motion.div
            className="wishes-card"
            initial={{ opacity: 0, y: -45, rotate: -1.4, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Botanical foliage accents on card corners */}
            <svg className="wishes-card-botanical-tr" viewBox="0 0 100 80" fill="none" aria-hidden="true">
              <path d="M90 10 C 70 30, 45 40, 10 45" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <path d="M80 18 C 86 24, 84 32, 76 33 C 70 33, 72 23, 80 18 Z" fill="#2d5e3f" opacity="0.4" />
              <path d="M55 30 C 60 38, 54 44, 46 42 C 40 40, 46 32, 55 30 Z" fill="#38744f" opacity="0.35" />
              <circle cx="68" cy="24" r="2.2" fill="#d4af37" opacity="0.6" />
            </svg>

            <svg className="wishes-card-botanical-bl" viewBox="0 0 100 80" fill="none" aria-hidden="true">
              <path d="M10 70 C 30 50, 55 40, 90 35" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <path d="M20 62 C 14 56, 16 48, 24 47 C 30 47, 28 57, 20 62 Z" fill="#2d5e3f" opacity="0.4" />
              <path d="M45 50 C 40 42, 46 36, 54 38 C 60 40, 54 48, 45 50 Z" fill="#38744f" opacity="0.35" />
              <circle cx="32" cy="56" r="2.2" fill="#d4af37" opacity="0.6" />
            </svg>

            {/* Rosette gold emblem with soft accent underglow */}
            <motion.div
              className="wishes-badge-container"
              aria-hidden="true"
              initial={{ opacity: 0, rotate: 180, scale: 0.3 }}
              whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="wishes-badge-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="#c59b43" />
                  <circle cx="12" cy="5.5" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="16.6" cy="7.4" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="18.5" cy="12" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="16.6" cy="16.6" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="12" cy="18.5" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="7.4" cy="16.6" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="5.5" cy="12" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="7.4" cy="7.4" r="2.2" fill="#c59b43" opacity="0.85" />
                  <circle cx="12" cy="12" r="1.2" fill="#fdfbf7" />
                </svg>
              </div>
              <div className="wishes-badge-line" />
            </motion.div>

            <motion.div
              className="wishes-input-wrapper"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <textarea
                className="wishes-textarea"
                placeholder="Write your heartwarming wishes and blessings for Gimasha & Chathura..."
                aria-label="Heartwarming wedding wishes and blessings for Gimasha & Chathura"
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={busy}
              />
            </motion.div>

            <motion.div
              className="wishes-action-center"
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5, type: 'spring', bounce: 0.3 }}
            >
              <motion.button
                className="wishes-send-btn"
                onClick={send}
                disabled={busy || !message.trim()}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
              >
                <Send size={15} className="wishes-send-icon" />
                <span>{busy ? 'SENDING WISHES...' : 'SEND WARM WISHES'}</span>
              </motion.button>
            </motion.div>

            {feedback && (
              <motion.p
                role="status"
                className="wishes-feedback-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {feedback}
              </motion.p>
            )}
          </motion.div>
        </section>




        <section className="section location location-section-wrapper" id="location">
          <motion.div
            className="location-header-wrap"
            initial={{ opacity: 0, y: -20, letterSpacing: '4px' }}
            whileInView={{ opacity: 1, y: 0, letterSpacing: '2px' }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="location-top-flourish" aria-hidden="true">
              <span className="location-flourish-dot">✦</span>
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                <path d="M12 2 C10.5 5.5 8.5 7.5 6 7.5 C4.5 7.5 3.5 6 4.5 4.8 C5.8 3.5 8.8 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 C13.5 5.5 15.5 7.5 18 7.5 C19.5 7.5 20.5 6 19.5 4.8 C18.2 3.5 15.2 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 L12 16" stroke="#c59b43" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="12" cy="7" r="1.5" fill="#f7eedb" />
              </svg>
              <span className="location-flourish-dot">✦</span>
            </div>

            <div className="location-eyebrow">VENUE &amp; DIRECTIONS</div>

            <h2 className="location-main-title">THE LOCATION</h2>

            <div className="location-section-flourish" aria-hidden="true">
              <span className="location-flourish-bar" />
              <span className="location-flourish-diamond">◇</span>
              <span className="location-flourish-bar" />
            </div>
          </motion.div>

          <motion.div
            className="location-card"
            initial={{ opacity: 0, scaleX: 0.92, scaleY: 0.97, y: 35 }}
            whileInView={{ opacity: 1, scaleX: 1, scaleY: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.05, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Left Side: Venue info & Get Directions */}
            <motion.div
              className="location-card-left"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="location-venue-eyebrow">
                <span className="location-venue-bullet">◎</span>
                <span>THE WEDDING VENUE</span>
              </div>

              <h3 className="location-hotel-title">
                THE DEER PARK<br />HOTEL
              </h3>

              <p className="location-hotel-address">
                Girthale, Polonnaruwa, Sri Lanka
              </p>

              <div className="location-btn-wrap">
                <motion.a
                  className="location-directions-btn"
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Navigation size={15} className="location-nav-icon" />
                  <span>GET DIRECTIONS</span>
                  <span className="location-btn-arrow">→</span>
                </motion.a>
              </div>
            </motion.div>

            {/* Vertical divider with flower */}
            <div className="location-divider-col" aria-hidden="true">
              <motion.div
                className="location-divider-line top"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ originY: 0 }}
              />
              <motion.div
                className="location-divider-flower"
                initial={{ scale: 0, rotate: 180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.45 }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="6" r="3" fill="#c59b43" />
                  <circle cx="16" cy="11" r="3" fill="#c59b43" />
                  <circle cx="11" cy="16" r="3" fill="#c59b43" />
                  <circle cx="6" cy="11" r="3" fill="#c59b43" />
                  <circle cx="11" cy="11" r="2.2" fill="#fcf9f2" />
                  <circle cx="11" cy="11" r="1.2" fill="#d4af37" />
                </svg>
              </motion.div>
              <motion.div
                className="location-divider-line bottom"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ originY: 0 }}
              />
            </div>

            {/* Right Side: 3 Feature Badges */}
            <div className="location-card-right">
              <motion.div
                className="location-feature-item"
                initial={{ opacity: 0, y: 30, scale: 0.86 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.35, type: 'spring', bounce: 0.3 }}
              >
                <div className="location-feature-circle">
                  <MapPin size={20} color="#143e26" />
                </div>
                <div className="location-feature-rule" />
                <div className="location-feature-text">
                  Girthale,<br />Polonnaruwa
                </div>
              </motion.div>

              <div className="location-feature-divider" />

              <motion.div
                className="location-feature-item"
                initial={{ opacity: 0, y: 30, scale: 0.86 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.48, type: 'spring', bounce: 0.3 }}
              >
                <div className="location-feature-circle">
                  <Building2 size={20} color="#143e26" />
                </div>
                <div className="location-feature-rule" />
                <div className="location-feature-text">
                  The Deer Park<br />Hotel
                </div>
              </motion.div>

              <div className="location-feature-divider" />

              <motion.div
                className="location-feature-item"
                initial={{ opacity: 0, y: 30, scale: 0.86 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.6, type: 'spring', bounce: 0.3 }}
              >
                <div className="location-feature-circle">
                  <Trees size={20} color="#143e26" />
                </div>
                <div className="location-feature-rule" />
                <div className="location-feature-text">
                  A scenic and<br />peaceful setting
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>



        <section className="section contact contact-section-wrapper" id="contact">
          <motion.div
            className="contact-header-wrap"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="contact-top-flourish" aria-hidden="true">
              <span className="contact-flourish-dot">✦</span>
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                <path d="M12 2 C10.5 5.5 8.5 7.5 6 7.5 C4.5 7.5 3.5 6 4.5 4.8 C5.8 3.5 8.8 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 C13.5 5.5 15.5 7.5 18 7.5 C19.5 7.5 20.5 6 19.5 4.8 C18.2 3.5 15.2 3 12 2 Z" fill="#c59b43" />
                <path d="M12 2 L12 16" stroke="#c59b43" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="12" cy="7" r="1.5" fill="#f7eedb" />
              </svg>
              <span className="contact-flourish-dot">✦</span>
            </div>

            <div className="contact-eyebrow">QUESTIONS &amp; ASSISTANCE</div>
            <h2 className="contact-main-title">CONTACT US</h2>

            <div className="contact-section-flourish" aria-hidden="true">
              <span className="contact-flourish-bar" />
              <span className="contact-flourish-diamond">◇</span>
              <span className="contact-flourish-bar" />
            </div>

            <p className="contact-subtitle">
              Should you need any assistance with directions or event details, please feel warmly welcome to reach out to our family.
            </p>
          </motion.div>

          <div className="contact-luxury-grid">
            {/* Contact Card 1: WARNASOORIYA */}
            <motion.div
              className="contact-luxury-card"
              initial={{ opacity: 0, x: -35, y: 40, rotate: -1.5 }}
              whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.95, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <motion.div
                className="contact-badge-wrapper"
                aria-hidden="true"
                whileInView={{
                  rotate: [0, -10, 10, -6, 6, 0],
                  scale: [0.92, 1.08, 1],
                }}
                viewport={{ once: true }}
                transition={{ delay: 0.45, duration: 0.85 }}
              >
                <svg className="contact-badge-leaf left" viewBox="0 0 60 40" fill="none">
                  <path d="M55 25 C40 22 25 15 5 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M42 20 C36 14 36 6 45 6 C52 6 50 16 42 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M25 16 C18 10 20 2 29 3 C36 4 33 13 25 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="34" cy="19" r="2" fill="#d4af37" />
                </svg>
                <div className="contact-badge-circle">
                  <Phone size={18} color="#ffffff" />
                </div>
                <svg className="contact-badge-leaf right" viewBox="0 0 60 40" fill="none">
                  <path d="M5 25 C20 22 35 15 55 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M18 20 C24 14 24 6 15 6 C8 6 10 16 18 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M35 16 C42 10 40 2 31 3 C24 4 27 13 35 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="26" cy="19" r="2" fill="#d4af37" />
                </svg>
              </motion.div>

              <div className="contact-card-eyebrow">✦ FAMILY CONTACT ✦</div>
              <h3 className="contact-card-name">WARNASOORIYA</h3>

              <div className="contact-card-rule" aria-hidden="true" />

              <div className="contact-card-phone">077 316 3928</div>

              <motion.a
                href="tel:0773163928"
                className="contact-call-btn"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <Phone size={13} className="contact-btn-icon" />
                <span>TAP TO CALL</span>
              </motion.a>
            </motion.div>

            {/* Contact Card 2: HARSHANI */}
            <motion.div
              className="contact-luxury-card"
              initial={{ opacity: 0, x: 35, y: 40, rotate: 1.5 }}
              whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.95, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <motion.div
                className="contact-badge-wrapper"
                aria-hidden="true"
                whileInView={{
                  rotate: [0, 10, -10, 6, -6, 0],
                  scale: [0.92, 1.08, 1],
                }}
                viewport={{ once: true }}
                transition={{ delay: 0.55, duration: 0.85 }}
              >
                <svg className="contact-badge-leaf left" viewBox="0 0 60 40" fill="none">
                  <path d="M55 25 C40 22 25 15 5 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M42 20 C36 14 36 6 45 6 C52 6 50 16 42 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M25 16 C18 10 20 2 29 3 C36 4 33 13 25 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="34" cy="19" r="2" fill="#d4af37" />
                </svg>
                <div className="contact-badge-circle">
                  <Phone size={18} color="#ffffff" />
                </div>
                <svg className="contact-badge-leaf right" viewBox="0 0 60 40" fill="none">
                  <path d="M5 25 C20 22 35 15 55 18" stroke="#366b47" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M18 20 C24 14 24 6 15 6 C8 6 10 16 18 20 Z" fill="#2d5e3f" opacity="0.85" />
                  <path d="M35 16 C42 10 40 2 31 3 C24 4 27 13 35 16 Z" fill="#38744f" opacity="0.9" />
                  <circle cx="26" cy="19" r="2" fill="#d4af37" />
                </svg>
              </motion.div>

              <div className="contact-card-eyebrow">✦ FAMILY CONTACT ✦</div>
              <h3 className="contact-card-name">HARSHANI</h3>

              <div className="contact-card-rule" aria-hidden="true" />

              <div className="contact-card-phone">+94 71 721 5710</div>

              <motion.a
                href="tel:+94717215710"
                className="contact-call-btn"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <Phone size={13} className="contact-btn-icon" />
                <span>TAP TO CALL</span>
              </motion.a>
            </motion.div>
          </div>
        </section>



        <footer className="wedding-footer">
          <motion.div
            className="footer-content"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
          >
            {/* Top Floral Garland from Reference */}
            <motion.div
              className="footer-garland-wrap"
              aria-hidden="true"
              initial={{ opacity: 0, y: -35, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src="/images/floral_garland_transparent.png"
                alt=""
                className="footer-garland-img"
              />
            </motion.div>

            {/* Couple Names matching Reference */}
            <motion.div
              className="footer-names-wrap"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)', scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="footer-couple-names">Gimasha &amp; Chathura</h2>
            </motion.div>

            {/* Center Heart Flourish */}
            <motion.div
              className="footer-flourish"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
            >
              <motion.span
                className="footer-flourish-line"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5 }}
                style={{ originX: 1 }}
              />
              <motion.span
                className="footer-flourish-heart"
                initial={{ scale: 0 }}
                whileInView={{ scale: [0, 1.4, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.55 }}
              >
                ♥
              </motion.span>
              <motion.span
                className="footer-flourish-line"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5 }}
                style={{ originX: 0 }}
              />
            </motion.div>

            {/* Date & Location */}
            <motion.div
              className="footer-date"
              initial={{ opacity: 0, y: 15, letterSpacing: '4px' }}
              whileInView={{ opacity: 1, y: 0, letterSpacing: '2.5px' }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.65 }}
            >
              DECEMBER 03, 2026 &nbsp;&bull;&nbsp; GIRITHALE
            </motion.div>
          </motion.div>
        </footer>

      </main>

    </>

  );

}

