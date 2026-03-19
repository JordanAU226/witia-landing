'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [formState, setFormState] = useState({ name: '', org: '', role: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el: HTMLElement | null, index: number) => {
    revealRefs.current[index] = el;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const container: React.CSSProperties = {
    maxWidth: '680px',
    margin: '0 auto',
    paddingLeft: '24px',
    paddingRight: '24px',
  };

  const ctaLink: React.CSSProperties = {
    fontSize: '10px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#000',
    textDecoration: 'none',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    display: 'inline',
  };

  const tagPill: React.CSSProperties = {
    background: '#E8E8E8',
    color: '#444',
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '100px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    display: 'inline-block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderBottom: '1px solid #E0E0E0',
    border: 'none',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E0E0E0',
    padding: '12px 0',
    background: 'transparent',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    color: '#000',
    outline: 'none',
  };

  return (
    <>
      {/* NAV */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: '1px solid #E0E0E0',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ ...container, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="logo-text">WITIA</span>
          <a href="#contact" style={{ ...ctaLink, fontSize: '10px' }}>GET IN TOUCH →</a>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section style={{ paddingTop: '80px', paddingBottom: '60px' }}>
          <div style={container}>
            <div
              className="reveal"
              ref={(el) => addRevealRef(el, 0)}
            >
              <p className="section-label">01 — THE MISSION</p>
              <h1
                className="serif"
                style={{
                  fontSize: 'clamp(32px, 6vw, 42px)',
                  fontWeight: 400,
                  lineHeight: 1.15,
                  color: '#000',
                  letterSpacing: '-0.01em',
                }}
              >
                Making procurement corruption<br />economically irrational.
              </h1>
              <p style={{
                marginTop: '20px',
                fontSize: '14px',
                color: '#555',
                lineHeight: 1.7,
                maxWidth: '520px',
                fontFamily: "'Inter', sans-serif",
              }}>
                WITIA is an AI-powered trust layer for government procurement — combining fraud detection, vendor trust scoring, and a cross-jurisdiction intelligence exchange.
              </p>
              <div style={{ marginTop: '28px' }}>
                <a href="#contact" style={{ ...ctaLink, fontSize: '11px' }}>REQUEST A PILOT →</a>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* WHY WITIA */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={container}>
            <div className="reveal" ref={(el) => addRevealRef(el, 1)}>
              <p className="section-label">02 — WHY WITIA</p>
              <h2 className="serif" style={{ fontSize: '34px', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                Economists who understand corruption.
              </h2>
              <p style={{
                marginTop: '20px',
                fontSize: '13px',
                color: '#555',
                lineHeight: 1.7,
                maxWidth: '540px',
              }}>
                Corruption is not a moral failing — it is an equilibrium. Sustained by broken detection, misaligned incentives, and fragmented enforcement. Changing it requires mechanism design, not moralising.
              </p>
              <div style={{ marginTop: '24px' }}>
                <a href="#contact" style={ctaLink}>READ OUR APPROACH →</a>
              </div>
            </div>

            <hr className="divider" style={{ marginTop: '40px' }} />

            <div className="reveal" ref={(el) => addRevealRef(el, 2)}>
              {[
                {
                  label: 'THE PROBLEM',
                  text: '£81 billion in UK public procurement fraud detected in 2023-24 alone. Current systems generate 90–95% false positives.',
                },
                {
                  label: 'THE INSIGHT',
                  text: 'Corruption is an equilibrium. The honest contractor faces economic ruin for refusing to bribe. Change the incentives, change the outcome.',
                },
                {
                  label: 'THE SOLUTION',
                  text: 'Three-layer infrastructure: fraud detection, continuous trust scoring, and a cross-jurisdiction fraud intelligence exchange.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    paddingTop: '20px',
                    paddingBottom: '20px',
                    borderTop: '1px solid #E0E0E0',
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: '24px',
                    alignItems: 'start',
                  }}
                >
                  <span style={{
                    fontSize: '9px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#888',
                    fontWeight: 500,
                    paddingTop: '2px',
                  }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '13px', color: '#000', lineHeight: 1.65 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* PLATFORM */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={container}>
            <div className="reveal" ref={(el) => addRevealRef(el, 3)}>
              <p className="section-label">03 — OUR PLATFORM</p>
              <h2 className="serif" style={{ fontSize: '34px', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                What We Do
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                Three layers of infrastructure, each valuable standalone, together forming an immune system for government procurement.
              </p>
              <div style={{ marginTop: '24px' }}>
                <a href="#contact" style={ctaLink}>VIEW TECHNICAL ARCHITECTURE →</a>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                {
                  topTags: ['DETECTION', 'ML'],
                  title: 'Fraud Detection',
                  body: 'Ensemble AI combining five models — Isolation Forest, LOF, DBSCAN, One-Class SVM, and Autoencoder — reducing false positives from 90–95% to actionable, explainable alerts with full audit trails.',
                  bottomTags: ['Isolation Forest', 'Graph ML', 'Explainable AI', 'Entity Resolution'],
                },
                {
                  topTags: ['TRUST', 'SCORING'],
                  title: 'Vendor Trust Scoring',
                  body: 'Vendors scored continuously across six dimensions using TOPSIS ranking with Bayesian confidence intervals. Top-quartile vendors earn expedited payments. Falling scores trigger audit probability increases.',
                  bottomTags: ['TOPSIS', 'Bayesian', 'Continuous', '6 Dimensions'],
                },
                {
                  topTags: ['INTELLIGENCE', 'EXCHANGE'],
                  title: 'Fraud Intelligence Exchange',
                  body: 'Fraud patterns caught in Birmingham train the model protecting Maricopa County. The credit bureau insight applied to procurement: reputation made portable, enforcement made collective.',
                  bottomTags: ['Cross-jurisdiction', 'Network Effects', 'Privacy-preserving'],
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="reveal"
                  ref={(el) => addRevealRef(el, 4 + i)}
                  style={{
                    background: '#F5F5F5',
                    borderRadius: '8px',
                    padding: '24px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {card.topTags.map((tag) => (
                      <span key={tag} style={tagPill}>{tag}</span>
                    ))}
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#000',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '10px',
                  }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.65 }}>
                    {card.body}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                    {card.bottomTags.map((tag) => (
                      <span key={tag} style={tagPill}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRACTION BAR */}
        <div style={{
          paddingTop: '32px',
          paddingBottom: '32px',
          borderTop: '1px solid #E0E0E0',
          borderBottom: '1px solid #E0E0E0',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: '#888',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
          }}>
            UK CABINET OFFICE · BIRMINGHAM CITY COUNCIL · EMERGENT VENTURES · PROMETHEUS X FELLOWSHIP
          </p>
        </div>

        {/* FOUNDER */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={container}>
            <div className="reveal" ref={(el) => addRevealRef(el, 7)}>
              <p className="section-label">04 — THE FOUNDER</p>
              <h2 className="serif" style={{ fontSize: '34px', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                Built by experience.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7, maxWidth: '560px' }}>
                Jordan Anthony Unokesan is a Multi Award-Winning Starred First Class with Distinction Cambridge Graduate. As the founder of both WITIA and the charity Empowered Voices, he brings entrepreneurial vision, academic rigour, and lived experience of the problem he is solving.
              </p>
              <div style={{ marginTop: '24px' }}>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={ctaLink}>
                  CONNECT ON LINKEDIN →
                </a>
              </div>
            </div>

            <hr className="divider" style={{ marginTop: '40px' }} />

            <div className="reveal" ref={(el) => addRevealRef(el, 8)}>
              {[
                { cat: 'EDUCATION', text: 'Starred First Class with Distinction, Land Economy, Gonville & Caius College, Cambridge — Ranked 1st of 71' },
                { cat: 'RECOGNITION', text: 'Powerlist Future Leaders — Ranked 7th of 150' },
                { cat: 'FELLOWSHIPS', text: 'Emergent Ventures Fellow (Mercatus Center) · Prometheus X Fellow (Digital Harbor Foundation)' },
                { cat: 'EXPERIENCE', text: 'Doughty Street Chambers · McKinsey & Co · Barings · Bridges for Enterprise (Consulting Director)' },
                { cat: 'COMMUNITY', text: 'Jack Petchey Award · Merton Youth Parliament · British Youth Council' },
                { cat: 'LEGAL', text: 'Pro bono counsel: Slaughter & May' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    borderTop: '1px solid #E0E0E0',
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr',
                    gap: '16px',
                    alignItems: 'start',
                  }}
                >
                  <span style={{
                    fontSize: '9px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#888',
                    fontWeight: 500,
                    paddingTop: '2px',
                  }}>
                    {item.cat}
                  </span>
                  <span style={{ fontSize: '13px', color: '#000', lineHeight: 1.65 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* CONTACT */}
        <section id="contact" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={container}>
            <div className="reveal" ref={(el) => addRevealRef(el, 9)}>
              <p className="section-label">05 — CONTACT</p>
              <h2 className="serif" style={{ fontSize: '34px', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                Work with us.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                We are selectively onboarding local authorities and procurement bodies across the UK and US.
              </p>
            </div>

            <div className="reveal" ref={(el) => addRevealRef(el, 10)} style={{ marginTop: '40px', maxWidth: '480px' }}>
              {submitted ? (
                <p style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: '#000',
                  lineHeight: 1.7,
                }}>
                  Message received. We&apos;ll be in touch.
                </p>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#000')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#E0E0E0')}
                  />
                  <input
                    type="text"
                    placeholder="Organisation"
                    required
                    value={formState.org}
                    onChange={(e) => setFormState({ ...formState, org: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#000')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#E0E0E0')}
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    required
                    value={formState.role}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#000')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#E0E0E0')}
                  />
                  <textarea
                    placeholder="Message"
                    rows={4}
                    required
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      marginTop: '8px',
                    }}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#000')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#E0E0E0')}
                  />
                  <button
                    type="submit"
                    style={{
                      ...ctaLink,
                      marginTop: '20px',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                    }}
                  >
                    SEND MESSAGE →
                  </button>
                </form>
              )}

              <p style={{ marginTop: '32px' }}>
                <a
                  href="mailto:jordan@witia.ai"
                  style={{ fontSize: '13px', color: '#000', textDecoration: 'underline', fontFamily: "'Inter', sans-serif" }}
                >
                  jordan@witia.ai
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          borderTop: '1px solid #E0E0E0',
          paddingTop: '24px',
          paddingBottom: '24px',
        }}>
          <div style={{ ...container, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#888', fontFamily: "'Inter', sans-serif" }}>© 2026 WITIA LTD</span>
            <span style={{ fontSize: '11px', color: '#888', fontFamily: "'Inter', sans-serif" }}>witia.ai</span>
          </div>
        </footer>
      </main>
    </>
  );
}
