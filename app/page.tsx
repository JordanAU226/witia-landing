'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [formState, setFormState] = useState<'idle' | 'success'>('idle');
  const [formData, setFormData] = useState({ name: '', organisation: '', role: '', message: '' });
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
    revealRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const addReveal = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('success');
  };

  return (
    <>
      {/* NAV */}
      <nav style={{
        background: '#F7F6F3',
        borderBottom: '1px solid #E5E3DE',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', background: '#0a2342', flexShrink: 0 }} />
            <span className="logo" style={{ fontSize: '18px' }}>WITIA</span>
          </div>
          <a
            href="#contact"
            style={{
              border: '1px solid #0a2342',
              color: '#0a2342',
              fontSize: '13px',
              padding: '8px 20px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLAnchorElement).style.background = '#0a2342';
              (e.target as HTMLAnchorElement).style.color = 'white';
            }}
            onMouseLeave={e => {
              (e.target as HTMLAnchorElement).style.background = 'transparent';
              (e.target as HTMLAnchorElement).style.color = '#0a2342';
            }}
          >
            Get in touch
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '120px 0 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px' }}>
          {/* Pill */}
          <div ref={addReveal} className="reveal" style={{
            display: 'inline-block',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: '#0a2342',
            background: 'rgba(10,35,66,0.08)',
            padding: '6px 14px',
            borderRadius: '100px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            marginBottom: '40px',
          }}>
            ● LIVE PILOT IN PROGRESS
          </div>

          {/* Headline */}
          <h1
            ref={addReveal}
            className="reveal serif"
            style={{
              fontSize: 'clamp(40px, 6vw, 68px)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: '#1a1a1a',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            Procurement fraud costs governments<br />
            £81 billion. We make it<br />
            <span style={{ fontStyle: 'italic', color: '#0a2342' }}>economically irrational.</span>
          </h1>

          {/* Subheadline */}
          <p
            ref={addReveal}
            className="reveal"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              color: '#555',
              fontWeight: 400,
              maxWidth: '580px',
              margin: '24px auto 0',
              lineHeight: 1.6,
            }}
          >
            An AI-powered trust layer combining fraud detection, vendor trust scoring, and a cross-jurisdiction intelligence exchange.
          </p>

          {/* CTA */}
          <div ref={addReveal} className="reveal" style={{ marginTop: '40px' }}>
            <a
              href="#contact"
              style={{
                display: 'inline-block',
                background: '#0a2342',
                color: 'white',
                fontSize: '15px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                padding: '14px 36px',
                borderRadius: '6px',
                textDecoration: 'none',
                border: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => ((e.target as HTMLAnchorElement).style.opacity = '0.9')}
              onMouseLeave={e => ((e.target as HTMLAnchorElement).style.opacity = '1')}
            >
              Request a Pilot
            </a>
          </div>
        </div>

        {/* Divider */}
        <div style={{ maxWidth: '1100px', margin: '100px auto 0', padding: '0 48px' }}>
          <div style={{ borderTop: '1px solid #E5E3DE' }} />
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{ padding: '100px 0', background: '#F7F6F3' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px' }}>
          <div ref={addReveal} className="reveal">
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#888', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase' }}>
              The Problem
            </p>
            <h2 className="serif" style={{ fontSize: '40px', fontWeight: 600, marginTop: '12px', color: '#1a1a1a' }}>
              Three systemic failures keeping corruption alive.
            </h2>
          </div>

          <div
            ref={addReveal}
            className="reveal"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginTop: '56px',
            }}
          >
            {[
              {
                title: 'Broken Detection',
                body: 'Current fraud systems generate 90–95% false positives, overwhelming compliance teams while real fraud slips through.',
              },
              {
                title: 'Misaligned Incentives',
                body: 'Honest contractors face economic ruin for refusing to bribe. The system rewards corruption and punishes integrity.',
              },
              {
                title: 'Fragmented Enforcement',
                body: 'A shell company debarred in Birmingham can bid in Maricopa County tomorrow. Corruption doesn\'t respect jurisdiction.',
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  background: 'white',
                  border: '1px solid #E5E3DE',
                  borderRadius: '8px',
                  padding: '32px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  borderLeft: '3px solid #0a2342',
                }}
              >
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '17px', color: '#1a1a1a' }}>
                  {card.title}
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '15px', color: '#555', lineHeight: 1.65, marginTop: '12px' }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE SOLUTION */}
      <section style={{ padding: '100px 0', background: 'white' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px' }}>
          <div ref={addReveal} className="reveal">
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#888', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase' }}>
              The Solution
            </p>
            <h2 className="serif" style={{ fontSize: '40px', fontWeight: 600, marginTop: '12px', color: '#1a1a1a' }}>
              Three layers. One immune system.
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', color: '#555', maxWidth: '520px', marginTop: '16px', lineHeight: 1.6 }}>
              Each layer delivers value standalone. Together, they make procurement corruption economically irrational.
            </p>
          </div>

          <div style={{ marginTop: '64px' }}>
            {[
              {
                num: '01',
                title: 'Detection that cuts through the noise',
                subtitle: 'Fraud Detection',
                body: 'Ensemble AI combining five models — Isolation Forest, LOF, DBSCAN, One-Class SVM, and Autoencoder — reducing false positives from 90–95% to actionable, explainable alerts with full audit trails.',
                tags: ['Isolation Forest', 'Graph ML', 'Explainable AI', 'Entity Resolution'],
              },
              {
                num: '02',
                title: 'Incentives that make honesty rational',
                subtitle: 'Trust Scoring',
                body: 'Vendors scored continuously across six dimensions using TOPSIS ranking with Bayesian confidence intervals. Top-quartile vendors earn expedited payments. Falling scores trigger audit probability increases. Fraud becomes irrational before it starts.',
                tags: ['TOPSIS', 'Bayesian Scoring', '6 Dimensions', 'Continuous Monitoring'],
              },
              {
                num: '03',
                title: 'Collective learning across jurisdictions',
                subtitle: 'Intelligence Exchange',
                body: 'Fraud patterns caught in Birmingham train the model protecting Maricopa County. The credit bureau insight applied to procurement: reputation made portable, enforcement made collective.',
                tags: ['Cross-jurisdiction', 'Network Effects', 'Privacy-preserving'],
              },
            ].map((layer, i) => (
              <div
                key={layer.num}
                ref={addReveal}
                className="reveal"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: '40px',
                  padding: '40px 0',
                  borderTop: '1px solid #E5E3DE',
                  alignItems: 'start',
                }}
              >
                <div className="serif" style={{ fontSize: '48px', fontStyle: 'italic', color: '#E5E3DE', lineHeight: 1, userSelect: 'none' }}>
                  {layer.num}
                </div>
                <div>
                  <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#0a2342', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', marginBottom: '8px' }}>
                    {layer.subtitle}
                  </p>
                  <h3 className="serif" style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a' }}>
                    {layer.title}
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#555', lineHeight: 1.7, marginTop: '12px' }}>
                    {layer.body}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                    {layer.tags.map(tag => (
                      <span key={tag} style={{
                        background: '#F0EFE9',
                        color: '#555',
                        fontSize: '12px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        padding: '4px 12px',
                        borderRadius: '100px',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACTION */}
      <section style={{ padding: '60px 0', background: '#F7F6F3', borderTop: '1px solid #E5E3DE', borderBottom: '1px solid #E5E3DE' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px', textAlign: 'center' }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            letterSpacing: '0.08em',
            color: '#888',
            textTransform: 'uppercase',
          }}>
            UK Cabinet Office &nbsp;·&nbsp; Birmingham City Council &nbsp;·&nbsp; Emergent Ventures &nbsp;·&nbsp; Prometheus X Fellowship
          </p>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: '100px 0', background: 'white' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px' }}>
          <div
            ref={addReveal}
            className="reveal"
            style={{
              display: 'grid',
              gridTemplateColumns: '55% 1fr',
              gap: '80px',
              alignItems: 'start',
            }}
          >
            {/* Left */}
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#888', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', marginBottom: '20px' }}>
                The Founder
              </p>
              <h2 className="serif" style={{ fontSize: '36px', fontWeight: 600, color: '#1a1a1a' }}>
                Jordan Anthony Unokesan
              </h2>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#444',
                lineHeight: 1.75,
                marginTop: '20px',
              }}>
                Jordan is a Multi Award-Winning Starred First Class with Distinction Cambridge Graduate with a track record of historic academic achievements and excellent leadership experience. As the founder of both an AI-powered anti-corruption platform (witia.ai) and the charity Empowered Voices, he demonstrates entrepreneurial vision and leadership.
              </p>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#444',
                lineHeight: 1.75,
                marginTop: '16px',
              }}>
                With experience in legal research, consulting, and financial advisory roles at Doughty Street Chambers, McKinsey &amp; Co and Barings, alongside a Consulting Directorship at Bridges for Enterprise, he was ranked 7th out of 150 in the Powerlist Future Leaders Magazine.
              </p>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#444',
                lineHeight: 1.75,
                marginTop: '16px',
              }}>
                A recent winner of the Emergent Ventures Award from the Mercatus Center and a Prometheus X Fellow, Jordan holds the Jack Petchey Award for services to his local community and is a former member of Merton Youth Parliament and the British Youth Council.
              </p>
              <a
                href="mailto:jordan@witia.ai"
                style={{
                  display: 'inline-block',
                  marginTop: '24px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#0a2342',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => ((e.target as HTMLAnchorElement).style.borderBottomColor = '#0a2342')}
                onMouseLeave={e => ((e.target as HTMLAnchorElement).style.borderBottomColor = 'transparent')}
              >
                jordan@witia.ai
              </a>
            </div>

            {/* Right — credentials */}
            <div style={{
              background: '#F7F6F3',
              border: '1px solid #E5E3DE',
              borderRadius: '8px',
              padding: '32px',
            }}>
              {[
                'Starred First, Cambridge (Land Economy)',
                '#1 of 71 — Highest marks in subject history',
                'Emergent Ventures Fellow (Mercatus Center)',
                'Prometheus X Fellow (Digital Harbor Foundation)',
                'Powerlist Future Leaders — Ranked 7th of 150',
                'Jack Petchey Award',
                'Pro bono legal: Slaughter & May',
                'WITIA LTD — Companies House registered',
              ].map((cred) => (
                <div key={cred} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0a2342', flexShrink: 0, marginTop: '6px' }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#444', lineHeight: 1.5 }}>{cred}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: '100px 0', background: '#F7F6F3' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 48px' }}>
          <div
            ref={addReveal}
            className="reveal"
            style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}
          >
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#888', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase' }}>
              Contact
            </p>
            <h2 className="serif" style={{ fontSize: '40px', fontWeight: 600, marginTop: '12px', color: '#1a1a1a' }}>
              Work with us.
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#555', marginTop: '16px', lineHeight: 1.6 }}>
              Piloting with local authorities across the UK and US. We&apos;re selectively onboarding new jurisdictions.
            </p>

            {formState === 'success' ? (
              <p className="serif" style={{ fontStyle: 'italic', fontSize: '20px', color: '#1a1a1a', marginTop: '48px' }}>
                Message received. We&apos;ll be in touch.
              </p>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: '48px', textAlign: 'left' }}>
                {(['name', 'organisation', 'role'] as const).map((field) => (
                  <input
                    key={field}
                    type="text"
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={formData[field]}
                    onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                    required
                    style={{
                      display: 'block',
                      width: '100%',
                      background: 'white',
                      border: '1px solid #E5E3DE',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontSize: '15px',
                      fontFamily: 'Inter, sans-serif',
                      marginBottom: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#0a2342')}
                    onBlur={e => (e.target.style.borderColor = '#E5E3DE')}
                  />
                ))}
                <textarea
                  rows={4}
                  placeholder="Message"
                  value={formData.message}
                  onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'white',
                    border: '1px solid #E5E3DE',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: '16px',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0a2342')}
                  onBlur={e => (e.target.style.borderColor = '#E5E3DE')}
                />
                <button
                  type="submit"
                  style={{
                    display: 'block',
                    width: '100%',
                    background: '#0a2342',
                    color: 'white',
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    padding: '14px 36px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => ((e.target as HTMLButtonElement).style.opacity = '0.9')}
                  onMouseLeave={e => ((e.target as HTMLButtonElement).style.opacity = '1')}
                >
                  Send Message
                </button>
              </form>
            )}

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#888', marginTop: '32px' }}>
              or email directly{' '}
              <a
                href="mailto:jordan@witia.ai"
                style={{ color: '#0a2342', textDecoration: 'none' }}
                onMouseEnter={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'underline')}
                onMouseLeave={e => ((e.target as HTMLAnchorElement).style.textDecoration = 'none')}
              >
                jordan@witia.ai
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 0', borderTop: '1px solid #E5E3DE', background: '#F7F6F3' }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#888' }}>© 2026 WITIA LTD</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#888' }}>witia.ai</span>
        </div>
      </footer>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          nav > div, section > div, footer > div {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
          .about-grid {
            grid-template-columns: 1fr !important;
          }
          .solution-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
