'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
    borderBottom: '1px solid #E0E0E0',
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
    color: '#888',
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
        .row-grid {
          padding-top: 20px;
          padding-bottom: 20px;
          border-top: 1px solid #E0E0E0;
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 600px) {
          .container {
            padding-left: 20px;
            padding-right: 20px;
          }
          .row-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .content-col {
            max-width: 100%;
          }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #E0E0E0',
        height: '52px', display: 'flex', alignItems: 'center',
      }}>
        <div className="container" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="logo-text">WITIA</span>
          <a href="#contact" className="cta-link" style={{ fontSize: '10px' }}>GET IN TOUCH -&gt;</a>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section style={{ paddingTop: '80px', paddingBottom: '60px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 0)}>
              <p className="section-label">01 - THE MISSION</p>
              <h1 className="serif" style={{ fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 400, lineHeight: 1.15, color: '#000', letterSpacing: '-0.01em' }}>
                Making procurement corruption<br />economically irrational.
              </h1>
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                WITIA is an AI-powered trust layer for government procurement - combining fraud detection, vendor trust scoring, and a cross-jurisdiction intelligence exchange.
              </p>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#888', lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                Built by Award Winning Cambridge Alum. Backed by Emergent Ventures and Prometheus X Talent.
              </p>
              <div style={{ marginTop: '28px' }}>
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
                { label: 'THE PROBLEM', text: 'Governments spend $9.5 trillion on public procurement annually. The UN estimates $2.6 trillion is lost to corruption each year - 5% of global GDP. In the UK alone, the National Audit Office estimates £81 billion lost to fraud and error in 2023-24. Current detection systems generate 90-95% false positives, drowning teams in noise while real fraud passes through.' },
                { label: 'THE INSIGHT', text: 'The honest contractor faces economic ruin for refusing to bribe when competitors do not. Change the payoffs, change the equilibrium.' },
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

        {/* CASE STUDY */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 3)}>
              <p className="section-label">03 - PROOF OF CONCEPT</p>
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

        {/* PLATFORM */}
        <section style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div className="container">
            <div className="reveal content-col" ref={(el) => addRevealRef(el, 4)}>
              <p className="section-label">04 - THE PLATFORM</p>
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
                  topTags: ['DETECTION'],
                  title: 'Fraud Detection',
                  body: 'AI-powered anomaly detection that cuts false positives from 90-95% to actionable, explainable alerts - with full audit trails for every finding.',
                  bottomTags: ['Ensemble ML', 'Explainable AI', 'Entity Resolution', 'Graph Analysis'],
                },
                {
                  topTags: ['TRUST SCORING'],
                  title: 'Vendor Trust Scoring',
                  body: 'A frontier innovation on traditional credit scoring - applying 8-dimensional trust analysis to public procurement. Vendors scored continuously across eight dimensions. Top-quartile vendors earn expedited payments. Falling scores trigger audit probability increases. Fraud becomes irrational before it starts.',
                  bottomTags: ['8-Dimensional', 'Continuous Monitoring', 'Bayesian Scoring', 'Frontier Credit Innovation'],
                },
                {
                  topTags: ['INTELLIGENCE EXCHANGE'],
                  title: 'Fraud Intelligence Exchange',
                  body: 'Fraud caught in one jurisdiction trains the model protecting the next. The credit bureau insight applied to procurement: reputation made portable, enforcement made collective.',
                  bottomTags: ['Cross-jurisdiction', 'Network Effects', 'Privacy-preserving'],
                },
              ].map((card, i) => (
                <div key={i} className="reveal" ref={(el) => addRevealRef(el, 5 + i)} style={{ background: '#F5F5F5', borderRadius: '8px', padding: '24px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {card.topTags.map((tag) => (<span key={tag} style={tagPill}>{tag}</span>))}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#000', fontFamily: "'Inter', sans-serif", marginBottom: '10px' }}>{card.title}</h3>
                  <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.65, fontFamily: "'Inter', sans-serif" }}>{card.body}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                    {card.bottomTags.map((tag) => (<span key={tag} style={tagPill}>{tag}</span>))}
                  </div>
                </div>
              ))}
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
                Built by experience.
              </h2>
              <p style={{ marginTop: '20px', fontSize: '13px', color: '#555', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                Jordan Anthony Unokesan is a Multi Award-Winning Starred First Class with Distinction Cambridge Graduate, ranked 1st of 71 in Land Economy at Gonville & Caius College. Founder of WITIA, Emergent Ventures Fellow, Prometheus X Fellow, and a top 10 future leader as recognised by the Powerlist Magazine - with prior experience at McKinsey, Barings, and Doughty Street Chambers.
              </p>
              <div style={{ marginTop: '24px' }}>
                <a href="https://www.linkedin.com/in/jordan-unokesan" target="_blank" rel="noopener noreferrer" className="cta-link">
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

            <div className="reveal" ref={(el) => addRevealRef(el, 10)} style={{ marginTop: '40px', maxWidth: '480px' }}>
              {submitted ? (
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '15px', color: '#000', lineHeight: 1.7 }}>
                  Message received. We&apos;ll be in touch.
                </p>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { placeholder: 'Name', type: 'text' },
                    { placeholder: 'Organisation', type: 'text' },
                    { placeholder: 'Role', type: 'text' },
                  ].map(({ placeholder, type }) => (
                    <input
                      key={placeholder}
                      type={type}
                      placeholder={placeholder}
                      required
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderBottomColor = '#000')}
                      onBlur={(e) => (e.target.style.borderBottomColor = '#E0E0E0')}
                    />
                  ))}
                  <textarea
                    placeholder="Message"
                    rows={4}
                    required
                    style={{ ...inputStyle, resize: 'vertical', marginTop: '8px' }}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#000')}
                    onBlur={(e) => (e.target.style.borderBottomColor = '#E0E0E0')}
                  />
                  <button type="submit" className="cta-link" style={{ marginTop: '20px', fontSize: '11px', letterSpacing: '0.1em' }}>
                    SEND MESSAGE -&gt;
                  </button>
                </form>
              )}
              <p style={{ marginTop: '32px' }}>
                <a href="mailto:team@witia.ai" style={{ fontSize: '13px', color: '#000', textDecoration: 'underline', fontFamily: "'Inter', sans-serif" }}>
                  team@witia.ai
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid #E0E0E0', paddingTop: '24px', paddingBottom: '24px' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#888', fontFamily: "'Inter', sans-serif" }}>© 2026 WITIA LTD</span>
            <span style={{ fontSize: '11px', color: '#888', fontFamily: "'Inter', sans-serif" }}>witia.ai</span>
          </div>
        </footer>
      </main>
    </>
  );
}
