'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import {
  CalendarDays,
  Clock3,
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

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Wedding({ guest }: { guest?: Guest }) {
  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [time, setTime] = useState([0, 0, 0, 0]);
  const [status, setStatus] = useState(guest?.status || 'pending');
  const [count, setCount] = useState(guest?.attending_count || 1);
  const [attendeeNames, setAttendeeNames] = useState<string[]>(guest?.attendee_names || []);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  const handleOpenInvitation = () => {
    setOpened(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
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
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNameChange = (index: number, val: string) => {
    const next = [...attendeeNames];
    next[index] = val;
    setAttendeeNames(next);
  };

  async function respond(next: 'accepted' | 'declined') {
    if (!guest) return;
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
    if (!guest || !message.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: guest.token, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setMessage('');
      setFeedback('Your lovely message has been sent. Thank you!');
    } catch (e) {
      setFeedback((e as Error).message);
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
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              y: -80,
              scale: 1.04,
              filter: 'blur(10px)',
              transition: { duration: 0.85, ease: [0.77, 0, 0.175, 1] },
            }}
          >
            <div className="cover-floral-arch-wrap" aria-hidden="true">
              <img
                src="/images/floral-arch.png"
                alt="Watercolor floral arch"
                className="cover-floral-arch-img"
              />
            </div>

            <BackgroundAnimation />

            <div className="cover-header">
              <div className="cover-eyebrow">A CELEBRATION OF LOVE</div>
              <h1 className="cover-title">
                Chathura <span>&amp;</span> Gimasha
              </h1>
              <div className="cover-date-badge">
                DECEMBER 03, 2026
              </div>
            </div>

            <div className="cover-couple-center">
              <div className="cover-couple-halo" aria-hidden="true" />
              <img
                src="/images/kandyan-couple.png"
                alt="Chathura and Gimasha"
                className="cover-couple-img"
              />
            </div>

            <div className="cover-action-wrap">
              <motion.button
                className="cover-open-btn"
                onClick={handleOpenInvitation}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="cover-open-title">
                  <Heart size={14} fill="#782937" stroke="#782937" />
                  OPEN INVITATION
                  <Heart size={14} fill="#782937" stroke="#782937" />
                </span>
                <span className="cover-open-divider" />
                <span className="cover-open-subtitle">
                  TAP TO REVEAL
                </span>
              </motion.button>
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
          <a
            href="#home"
            className="brand"
            onClick={(e) => handleSmoothScroll(e, 'home')}
          >
            C <span>♥</span> G
          </a>
          <nav>
            <a href="#home" onClick={(e) => handleSmoothScroll(e, 'home')}>
              Home
            </a>
            <a href="#countdown" onClick={(e) => handleSmoothScroll(e, 'countdown')}>
              Countdown
            </a>
            <a href="#couple" onClick={(e) => handleSmoothScroll(e, 'couple')}>
              Our Story
            </a>
            <a href="#details" onClick={(e) => handleSmoothScroll(e, 'details')}>
              Details
            </a>
            <a href="#rsvp" onClick={(e) => handleSmoothScroll(e, 'rsvp')}>
              RSVP
            </a>
            <a href="#location" onClick={(e) => handleSmoothScroll(e, 'location')}>
              Location
            </a>
          </nav>
          <button
            className="nav-pill"
            onClick={() => setOpened(false)}
          >
            Cover Screen ♡
          </button>
        </motion.header>

        <section className="hero" id="home">
          <video autoPlay muted loop playsInline poster="/hero-poster.jpg">
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="hero-shade" />

          <div className="hero-content">
            <motion.div
              className="eyebrow light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
            >
              TOGETHER FOREVER
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              Chathura <em>&amp;</em>
              <br /> Gimasha
            </motion.h1>

            <motion.div
              className="hero-rule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8 }}
            >
              ✦ &nbsp; ARE GETTING MARRIED &nbsp; ✦
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.95 }}
            >
              With the blessings of our families, we warmly invite you to be a part of our special day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1 }}
            >
              <a
                className="btn light-btn"
                href="#countdown"
                onClick={(e) => handleSmoothScroll(e, 'countdown')}
              >
                View Invitation <ArrowDown size={17} />
              </a>
            </motion.div>
          </div>

          <motion.a
            href="#countdown"
            className="scroll-note"
            onClick={(e) => handleSmoothScroll(e, 'countdown')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1.0 }}
          >
            SCROLL TO EXPLORE ↓
          </motion.a>
        </section>

        <section className="section countdown-section" id="countdown">
          <Reveal>
            <div className="countdown-eyebrow">COUNTDOWN TO OUR WEDDING</div>
            <h2>Counting Down to Forever</h2>
            <div className="flourish">── ♥ ──</div>

            <div className="count-grid">
              {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, idx) => (
                <motion.div
                  className="count-box"
                  key={label}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <strong>{String(time[idx]).padStart(2, '0')}</strong>
                  <span>{label}</span>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="section couple" id="couple">
          <Reveal>
            <div className="eyebrow">THE HAPPY COUPLE</div>
            <h2>Two Hearts, One Beautiful Journey</h2>
            <div className="flourish">── ♥ ──</div>

            <div className="couple-grid">
              <motion.div
                className="person-card groom-card"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="portrait-container">
                  <div className="golden-halo-pulse" aria-hidden="true" />
                  <img
                    src="/images/groom.png"
                    alt="Chathura - The Groom"
                    className="portrait-img"
                  />
                </div>
                <div className="role-badge">THE GROOM</div>
                <h3>Chathura</h3>
                <p>
                  Son of<br />
                  Mr &amp; Mrs W.K.D. Rathnayake
                </p>
              </motion.div>

              <motion.div
                className="rings-connector"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="interlocking-rings-wrap">
                  <svg className="rings-svg" viewBox="0 0 130 80" fill="none">
                    <circle cx="48" cy="40" r="26" stroke="#c59b43" strokeWidth="4" />
                    <circle cx="82" cy="40" r="26" stroke="#faeccf" strokeWidth="4" />
                  </svg>
                  <div className="pulsing-heart-icon">
                    <Heart size={22} fill="#c59b43" stroke="#c59b43" />
                  </div>
                </div>
                <span className="forever-text">FOREVER &amp; ALWAYS</span>
              </motion.div>

              <motion.div
                className="person-card bride-card"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="portrait-container">
                  <div className="golden-halo-pulse" aria-hidden="true" />
                  <img
                    src="/images/bride.png"
                    alt="Gimasha - The Bride"
                    className="portrait-img"
                  />
                </div>
                <div className="role-badge">THE BRIDE</div>
                <h3>Gimasha</h3>
                <p>
                  Daughter of<br />
                  Mr &amp; Mrs W.M.E. Warnasooriya
                </p>
              </motion.div>
            </div>
          </Reveal>
        </section>

        <section className="section details" id="details">
          <Reveal>
            <div className="eyebrow">WEDDING DETAILS</div>
            <h2>A Celebration of Love</h2>
            <div className="flourish">── ♥ ──</div>
            <p className="section-sub">
              We kindly invite you to join us for our ceremonies, celebration and joyous memories.
            </p>

            <div className="detail-grid">
              <div className="detail-card">
                <div className="detail-icon-bubble">
                  <Flower2 size={24} />
                </div>
                <h3>Poruwa Ceremony</h3>
                <p>
                  <strong style={{ color: 'var(--emerald)' }}>07:30 AM</strong><br />
                  Traditional customs &amp; blessings
                </p>
              </div>

              <div className="detail-card">
                <div className="detail-icon-bubble">
                  <Clock3 size={24} />
                </div>
                <h3>Celebration &amp; Lunch</h3>
                <p>
                  <strong style={{ color: 'var(--emerald)' }}>10:00 AM – 04:00 PM</strong><br />
                  Banquet, music &amp; festivities
                </p>
              </div>

              <div className="detail-card">
                <div className="detail-icon-bubble">
                  <CalendarDays size={24} />
                </div>
                <h3>The Date</h3>
                <p>
                  <strong style={{ color: 'var(--emerald)' }}>Thursday</strong><br />
                  December 03, 2026
                </p>
              </div>

              <div className="detail-card">
                <div className="detail-icon-bubble">
                  <MapPin size={24} />
                </div>
                <h3>The Venue</h3>
                <p>
                  <strong style={{ color: 'var(--emerald)' }}>The Deer Park Hotel</strong><br />
                  Girithale, Sri Lanka
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section rsvp" id="rsvp">
          <Reveal>
            <div className="eyebrow">YOUR PRESENCE MATTERS</div>
            <h2>
              {guest ? (
                guest.household ? (
                  <>Dear {guest.name} &amp; Family,</>
                ) : (
                  <>Dear {guest.name},</>
                )
              ) : (
                <>Honored Guest,</>
              )}
            </h2>
            <div className="flourish">── ♥ ──</div>
            <p className="section-sub">
              We would be truly honored to have you with us on our special day. Please let us know if you will be
              attending.
            </p>

            <div className="rsvp-card-wrapper">
              {guest ? (
                <>
                  <p className="guest-note">
                    Your invitation is reserved for up to {guest.seats} {guest.seats === 1 ? 'person' : 'people'}.
                  </p>
                  <div className="rsvp-actions">
                    <div className="rsvp-choice">
                      <label>Number attending</label>
                      <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                        {Array.from({ length: guest.seats }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? 'Person' : 'People'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {guest.seats > 1 && count > 1 && (
                      <div className="rsvp-names-group">
                        <label className="rsvp-sublabel">Names of attending guests (optional):</label>
                        {Array.from({ length: count - 1 }, (_, i) => (
                          <input
                            key={i}
                            type="text"
                            className="rsvp-name-input"
                            placeholder={`Guest ${i + 2} name`}
                            value={attendeeNames[i] || ''}
                            onChange={(e) => handleNameChange(i, e.target.value)}
                          />
                        ))}
                      </div>
                    )}

                    <div className="rsvp-buttons-row">
                      <button
                        disabled={busy}
                        className={`btn rsvp-accept ${status === 'accepted' ? 'selected' : ''}`}
                        onClick={() => respond('accepted')}
                      >
                        <Check size={16} /> I'll Be There
                      </button>
                      <button
                        disabled={busy}
                        className={`btn outline rsvp-decline ${status === 'declined' ? 'selected' : ''}`}
                        onClick={() => respond('declined')}
                      >
                        <X size={16} /> Unable to Attend
                      </button>
                    </div>
                  </div>
                  <p className="response-note">
                    Current response: <b>{status}</b>
                  </p>
                </>
              ) : (
                <div className="guest-note">
                  Please open your personalized invitation link to respond to the RSVP.
                </div>
              )}
            </div>
          </Reveal>
        </section>

        <section className="section wishes" id="wishes">
          <Reveal>
            <div className="eyebrow">SEND US YOUR WISHES</div>
            <h2>Leave a Message for the Couple</h2>
            <div className="flourish">── ♥ ──</div>
            <div className="message-card">
              <textarea
                placeholder={
                  guest ? 'Write your lovely message here...' : 'Open your personalized invitation link to send wishes.'
                }
                disabled={!guest || busy}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                className="btn"
                onClick={send}
                disabled={!guest || busy || !message.trim()}
                style={{ width: '100%' }}
              >
                <Send size={16} /> Send Warm Wishes
              </button>
            </div>
            {feedback && (
              <p role="status" className="feedback">
                {feedback}
              </p>
            )}
          </Reveal>
        </section>

        <section className="section location" id="location">
          <div className="location-container">
            <div className="location-info-side">
              <Reveal>
                <div className="location-eyebrow">WEDDING LOCATION</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: 'var(--emerald-deep)', marginBottom: '8px' }}>
                  The Deer Park Hotel
                </h3>
                <p className="location-subtitle">Girithale, Polonnaruwa, Sri Lanka</p>

                <div className="location-pill-card">
                  <a
                    className="location-pill-btn"
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation size={15} />
                    <span>Get Directions</span>
                  </a>
                </div>
              </Reveal>
            </div>

            <div className="location-map-side">
              <iframe
                title="The Deer Park Hotel Location Map"
                src="https://maps.google.com/maps?q=The+Deer+Park+Hotel+Girithale+Sri+Lanka&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="map-iframe"
                loading="lazy"
                allowFullScreen
              />
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-floating-pin"
                title="Open in Google Maps"
              >
                <MapPin size={16} color="#e53935" />
                <div className="map-badge-text">
                  <strong>The Deer Park Hotel</strong>
                  <span>Girithale</span>
                </div>
              </a>
            </div>
          </div>
        </section>

        <section className="section contact" id="contact">
          <Reveal>
            <div className="eyebrow">FOR ANY INQUIRIES</div>
            <h2>Contact Us</h2>
            <div className="flourish">── ♥ ──</div>
            <div className="contact-grid">
              <a href="tel:0773163928">
                <div className="contact-icon-bubble">
                  <Phone size={18} />
                </div>
                <span>
                  Warnasooriya<br />
                  <b>077 316 3928</b>
                </span>
              </a>
              <a href="tel:+94717215710">
                <div className="contact-icon-bubble">
                  <Phone size={18} />
                </div>
                <span>
                  Harshani<br />
                  <b>+94 71 721 5710</b>
                </span>
              </a>
            </div>
          </Reveal>
        </section>

        <footer className="wedding-footer">
          <div className="footer-content">
            <h2 className="footer-couple-names">Chathura &amp; Gimasha</h2>
            <div className="footer-flourish">
              <span className="footer-flourish-line" />
              <Heart size={14} fill="#c59b43" stroke="#c59b43" />
              <span className="footer-flourish-line" />
            </div>
            <div className="footer-date">DECEMBER 03, 2026 • GIRITHALE</div>
          </div>
        </footer>
      </main>
    </>
  );
}
