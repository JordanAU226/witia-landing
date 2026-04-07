'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const PremiumGlobe = dynamic(() => import('../components/PremiumGlobe'), { ssr: false });


export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    revealRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el: HTMLElement | null, index: number) => {
    revealRefs.current[index] = el;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitError('Something went wrong. Please email team@witia.ai directly.');
      }
    } catch {
      setSubmitError('Something went wrong. Please email team@witia.ai directly.');
    }
    setSubmitting(false);
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
    border: 'none',
    borderBottom: '1px solid #DDD8D2',
    padding: '12px 0',
    background: 'transparent',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    color: '#000',
    outline: 'none',
  };

  const rowLabel: React.CSSProperties = {
    fontSize: '9px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#7a7570',
    fontWeight: 500,
    paddingTop: '2px',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <>
      <style>{`
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding-left: 48px;
          padding-right: 48px;
        }
        .content-col {
          max-width: 680px;
        }
        .cta-link {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #000;
          text-decoration: none;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: inline;
        }
        .cta-link:hover {
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }
        .cta-link:focus-visible {
          outline: 1px solid #000;
          outline-offset: 3px;
        }
        .row-grid {
          padding-top: 20px;
          padding-bottom: 20px;
          border-top: 1px solid #DDD8D2;
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 24px;
          align-items: start;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 48px;
          align-items: center;
        }
        .globe-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .hero-cta-mobile { display: none; }
        .hero-cta-desktop { display: block; }
        /* Tablet: 769-1024px - globe present but smaller */
        @media (max-width: 1024px) and (min-width: 769px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        /* Mobile: stack, headline first, globe below, CTA last */
        @media (max-width: 768px) {
          .hero-grid {
            display: flex;
            flex-direction: column;
            gap: 0;
          }
          .hero-text-block {
            order: 1;
          }
          .globe-container {
            order: 2;
            display: flex;
            justify-content: center;
            margin-top: 40px;
            margin-bottom: 0;
            overflow: hidden;
          }
          .hero-cta-block {
            order: 3;
          }
          .hero-cta-mobile {
            display: block;
            margin-top: 28px;
            padding-bottom: 16px;
          }
          .hero-cta-desktop {
            display: none;
          }
          .hero-section {
            padding-top: 64px;
            padding-bottom: 48px;
          }
        }
        @media (max-width: 600px) {
          .container {
            padding-left: 24px;
            padding-right: 24px;
          }
          .row-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .content-col {
            max-width: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fefefe', borderBottom: '1px solid #DDD8D2',
        height: '52px', display: 'flex', alignItems: 'center',
      }}>
        <div className="container" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="logo-text">WITIA</span>
          <a href="#contact" className="cta-link" style={{ fontSize: '10px' }}>GET IN TOUCH -&gt;</a>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero-section" style={{ paddingTop: 'clamp(80px, 8vw, 104px)', paddingBottom: 'clamp(60px, 6vw, 80px)', overflow: 'hidden' }}>
          <div className="container">
            <div className="hero-grid">
              {/* Left: Text */}
              <div className="reveal hero-text-block" ref={(el) => addRevealRef(el, 0)}>
                <h1 className="serif" style={{
                  fontSize: 'clamp(30px, 4.5vw, 56px)',
                  fontWeight: 400,
                  lineHeight: 1.06,
                  color: '#000',
                  letterSpacing: '-0.02em',
                }}>
                  Making procurement<br />corruption<br />economically<br />irrational.
                </h1>
                <p style={{
                  marginTop: '24px',
                  fontSize: 'clamp(13px, 1.4vw, 15px)',
                  color: '#444',
                  lineHeight: 1.7,
                  fontFamily: "'Inter', sans-serif",
                  maxWidth: '420px',
                }}>
                  Built to make honesty the rational choice - for every contractor, in every jurisdiction.
                </p>
                <p style={{
                  marginTop: '12px',
                  fontSize: '12.5px',
                  color: '#777',
                  lineHeight: 1.6,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  Built by Award Winning Cambridge Alum. Backed by Emergent Ventures and Prometheus X Talent.
                </p>
                {/* CTA visible on desktop, hidden on mobile */}
                <div className="hero-cta-desktop" style={{ marginTop: '32px' }}>
                  <a href="#contact" className="cta-link" style={{ fontSize: '11px' }}>REQUEST A PILOT -&gt;</a>
                </div>
              </div>

              {/* Globe */}
              <div className="globe-container">
                <PremiumGlobe
                  size={520}
                  quality="auto"
                  interactive={true}
                />
              </div>

              {/* Mobile-only CTA below globe */}
              <div className="hero-cta-mobile">
                <a href="#contact" className="cta-link" style={{ fontSize: '11px' }}>REQUEST A PILOT -&gt;</a>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* WHY WITIA */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 1)}>
              <p className="section-label">02 - WHY WITIA</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                Corruption is an equilibrium.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                It is not a moral failing - it is sustained by broken detection, misaligned incentives, and fragmented enforcement. Changing it requires mechanism design, not moralising.
              </p>
            </div>

            <hr className="divider" style={{ marginTop: '40px' }} />

            <div className="reveal" ref={(el) => addRevealRef(el, 2)}>
              {[
                { label: 'THE PROBLEM', text: 'Governments spend $9.5 trillion on public procurement annually (World Bank). The US federal government alone loses an estimated $233-521 billion to fraud each year (US GAO, 2024). Yet 60% of OECD countries have no systematic monitoring of anti-corruption effectiveness (OECD Anti-Corruption Outlook, 2024). In the UK, 4 in 5 government departments have procurement fraud measurement that is non-existent or clearly unreliable (UK National Audit Office, 2023). Most public bodies do not know what they are losing, or to whom - not because the tools do not exist, but because no one has built the infrastructure to find out.' },
                { label: 'THE INSIGHT', text: 'In most procurement systems, gaming the process pays better than running it honestly. Bid manipulation, inflated pricing, and shell structures persist not because enforcement fails - but because the incentives never rewarded integrity in the first place.' },
                { label: 'THE SOLUTION', text: 'Three-layer infrastructure: fraud detection that works, trust scoring that restructures incentives, and a cross-jurisdiction fraud intelligence exchange.' },
              ].map((item, i) => (
                <div key={i} className="row-grid">
                  <span style={rowLabel}>{item.label}</span>
                  <span style={{ fontSize: '13px', color: '#000', lineHeight: 1.65, fontFamily: "'Inter', sans-serif" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* PLATFORM */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 3)}>
              <p className="section-label">03 - THE PLATFORM</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                Three layers. One immune system.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                Each layer delivers value standalone. Together, they make procurement corruption economically irrational.
              </p>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px' }}>
              {[
                {
                  title: 'Fraud Detection',
                  body: 'AI-powered anomaly detection that cuts false positives from 90-95% to actionable, explainable alerts - with full audit trails for every finding.',
                  tags: [],
                },
                {
                  title: 'Vendor Trust Scoring',
                  body: 'A frontier innovation on traditional credit scoring - applying 8-dimensional trust analysis to public procurement. Top-quartile vendors earn expedited payments. Falling scores trigger audit probability increases. Fraud becomes irrational before it starts.',
                  tags: [],
                },
                {
                  title: 'Fraud Intelligence Exchange',
                  body: 'Fraud caught in one jurisdiction trains the model protecting the next. The credit bureau insight applied to procurement: reputation made portable, enforcement made collective.',
                  tags: [],
                },
              ].map((card, i) => (
                <div key={i} className="reveal" ref={(el) => addRevealRef(el, 4 + i)} style={{ background: '#F4F1EC', borderRadius: '6px', padding: '28px', border: '1px solid #E8E3DC' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#000', fontFamily: "'Inter', sans-serif", marginBottom: '10px' }}>{card.title}</h3>
                  <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.65, fontFamily: "'Inter', sans-serif" }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* CASE STUDY */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 7)} style={{ maxWidth: '780px' }}>
              <p className="section-label">04 - PROOF OF CONCEPT</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                This has already changed government policy.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                Before WITIA existed as a company, its founder applied the same analytical methodology to a major national procurement body in West Africa - surfacing anomalous spend patterns at scale that directly informed how a government jurisdiction changed the way it protects its citizens. The work, conducted as part of a Cambridge dissertation, was recognised as exceptional academic achievement and covered by Gonville & Caius College.
              </p>
              <p style={{ marginTop: '16px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                That engagement was bound by confidentiality obligations. What we can say: the methodology works. WITIA is its productisation.
              </p>
              <div style={{ marginTop: '24px' }}>
                <a href="https://www.cai.cam.ac.uk/news/following-north-star" target="_blank" rel="noopener noreferrer" className="cta-link" style={{ fontSize: '11px' }}>
                  READ THE CAMBRIDGE FEATURE -&gt;
                </a>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* FOUNDER */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 8)}>
              <p className="section-label">05 - THE FOUNDER</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                Why WITIA exists.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                Jordan Anthony Unokesan is a Multi Award-Winning Cambridge Graduate who achieved the highest attainment in the history of Land Economy (Law, Economics & Policy) at Gonville & Caius College - ranked 1st of 71 with a Starred First Class with Distinction. Founder of WITIA, Emergent Ventures Fellow, Prometheus X Fellow, and a top 10 future leader as recognised by the Powerlist Magazine.
              </p>
              <p style={{ marginTop: '16px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif", fontStyle: 'italic' }}>
                For Jordan, this is not just a company. It is an obligation.
              </p>
              <div style={{ marginTop: '24px' }}>
                <a href="https://www.linkedin.com/in/jordanu/" target="_blank" rel="noopener noreferrer" className="cta-link">
                  CONNECT ON LINKEDIN -&gt;
                </a>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* CONTACT */}
        <section id="contact" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 9)}>
              <p className="section-label">06 - CONTACT</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, lineHeight: 1.2, color: '#000' }}>
                Work with us.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                We are selectively onboarding local authorities and procurement bodies across the UK and US.
              </p>
            </div>

            {/* Two-track engagement */}
            <div className="reveal" ref={(el) => addRevealRef(el, 10)} style={{ marginTop: '48px', maxWidth: '560px' }}>

              {/* Track 1: Book a call */}
              <div style={{ paddingBottom: '32px', borderBottom: '1px solid #DDD8D2' }}>
                <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a7570', fontFamily: "'Inter', sans-serif", fontWeight: 500, marginBottom: '12px' }}>
                  FASTEST PATH
                </p>
                <p style={{ fontSize: '14px', color: '#000', fontFamily: 'Georgia, serif', fontWeight: 400, marginBottom: '16px', lineHeight: 1.4 }}>
                  Book a 30-minute intro call.
                </p>
                <p style={{ fontSize: '13px', color: '#555', fontFamily: "'Inter', sans-serif", lineHeight: 1.6, marginBottom: '20px' }}>
                  A short conversation to understand your procurement context and whether WITIA is the right fit.
                </p>
                <a
                  href="https://cal.eu/jordanu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-link"
                  style={{ fontSize: '11px' }}
                >
                  SCHEDULE A CALL -&gt;
                </a>
              </div>

              <p style={{ marginTop: '24px' }}>
                <a href="mailto:team@witia.ai" style={{ fontSize: '12px', color: '#aaa', fontFamily: "'Inter', sans-serif", textDecoration: 'none' }}>
                  or email team@witia.ai
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid #DDD8D2', paddingTop: '24px', paddingBottom: '24px' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#7a7570', fontFamily: "'Inter', sans-serif" }}>© 2026 WITIA LTD. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <a href="https://www.linkedin.com/in/jordanu/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#7a7570', fontFamily: "'Inter', sans-serif", textDecoration: 'none', letterSpacing: '0.08em' }}>LINKEDIN</a>
              <a href="mailto:team@witia.ai" style={{ fontSize: '11px', color: '#7a7570', fontFamily: "'Inter', sans-serif", textDecoration: 'none', letterSpacing: '0.08em' }}>team@witia.ai</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
