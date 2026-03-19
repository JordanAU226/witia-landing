"use client";

import { useEffect, useRef, useState } from "react";
import { Linkedin, Mail, ChevronDown } from "lucide-react";

// ── Scroll reveal hook ──────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ── Navigation ──────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(10,10,15,0.85)",
        borderBottom: "1px solid #1e1e2e",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 5%",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            background: "#00c2ff",
            borderRadius: 2,
            boxShadow: "0 0 10px rgba(0,194,255,0.6)",
          }}
        />
        <span style={{ fontSize: 20, fontWeight: 700, color: "#f0f0f0", letterSpacing: "-0.02em" }}>
          WITIA
        </span>
      </div>

      {/* CTA */}
      <a href="#contact" className="nav-btn">
        Contact Us
      </a>
    </nav>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 5% 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated dot grid background */}
      <div
        className="dot-grid gradient-mesh"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          opacity: 0.6,
        }}
      />

      {/* Subtle glow orb */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,194,255,0.06) 0%, transparent 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto" }}>
        {/* Pill badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,194,255,0.08)",
            border: "1px solid rgba(0,194,255,0.25)",
            borderRadius: 100,
            padding: "6px 16px",
            marginBottom: 32,
            fontSize: 11,
            fontWeight: 600,
            color: "#00c2ff",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ fontSize: 8 }}>●</span>
          LIVE PILOT · EUROPE&apos;S LARGEST LOCAL AUTHORITY
        </div>

        {/* Main headline */}
        <h1
          className="glow"
          style={{
            fontSize: "clamp(44px, 7vw, 78px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 28,
            color: "#f0f0f0",
          }}
        >
          Corruption is an
          <br />
          <span style={{ color: "#00c2ff" }}>equilibrium.</span>
          <br />
          We&apos;re breaking it.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 18,
            color: "#8888a0",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.65,
            fontWeight: 400,
          }}
        >
          WITIA is an AI-powered trust layer for government procurement — combining fraud detection,
          vendor trust scoring, and a cross-jurisdiction intelligence exchange.
        </p>

        {/* CTA */}
        <div style={{ marginBottom: 56 }}>
          <a href="#contact" className="cta-btn">
            Request a Demo
          </a>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "£81B", label: "UK public procurement fraud (2023–24)" },
            { value: "90–95%", label: "Industry false positive rate we solve" },
            { value: "£59,984", label: "Pilot contract value secured" },
          ].map((stat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 40,
                    background: "#1e1e2e",
                    margin: "0 32px",
                  }}
                />
              )}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "clamp(22px, 3vw, 30px)",
                    fontWeight: 800,
                    color: "#f0f0f0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: "#8888a0", marginTop: 4, maxWidth: 160 }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div
          style={{
            marginTop: 64,
            display: "flex",
            justifyContent: "center",
            opacity: 0.4,
          }}
        >
          <ChevronDown size={20} color="#8888a0" />
        </div>
      </div>
    </section>
  );
}

// ── The Problem ─────────────────────────────────────────────────────────────
function Problem() {
  const problems = [
    {
      icon: "🔍",
      title: "Broken Detection",
      body: "Current fraud systems generate 90–95% false positives, drowning compliance teams in noise and letting real fraud through.",
    },
    {
      icon: "⚖️",
      title: "Misaligned Incentives",
      body: "Honest contractors face economic death for refusing to bribe. The system rewards corruption and punishes integrity.",
    },
    {
      icon: "🏛️",
      title: "Fragmented Enforcement",
      body: "A shell company debarred in Birmingham can bid in Maricopa County tomorrow. Enforcement operates in silos. Corruption does not.",
    },
  ];

  return (
    <section
      style={{
        padding: "100px 5%",
        background: "#080810",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            The broken status quo
          </h2>
          <p style={{ fontSize: 17, color: "#8888a0" }}>
            Three systemic failures that make corruption rational.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {problems.map((p, i) => (
            <div
              key={i}
              className="reveal"
              style={{
                background: "#111118",
                border: "1px solid #1e1e2e",
                borderRadius: 12,
                padding: 24,
                transition: "border-color 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,194,255,0.3)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#1e1e2e";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 16 }}>{p.icon}</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#f0f0f0",
                  marginBottom: 12,
                }}
              >
                {p.title}
              </h3>
              <p style={{ fontSize: 15, color: "#8888a0", lineHeight: 1.65 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── The Solution ────────────────────────────────────────────────────────────
function Solution() {
  const layers = [
    {
      num: "01",
      icon: "🎯",
      title: "Detection that cuts through the noise",
      body: "Ensemble AI combining Isolation Forest, LOF, DBSCAN, One-Class SVM, and Autoencoder models — cutting false positives from 90-95% to actionable, explainable alerts. Because you can't change the game if you can't see the board.",
      tags: ["Isolation Forest", "Graph ML", "Explainable AI", "Entity Resolution"],
      label: "Fraud Detection",
    },
    {
      num: "02",
      icon: "📊",
      title: "Incentives that make honesty rational",
      body: "Vendors scored continuously across six dimensions using TOPSIS ranking with Bayesian confidence intervals. Top-quartile vendors gain expedited payments. Falling scores trigger increased audit probability. Fraud becomes irrational before it starts.",
      tags: ["TOPSIS Ranking", "Bayesian Scoring", "6 Dimensions", "Real-time"],
      label: "Trust Scoring",
    },
    {
      num: "03",
      icon: "🌐",
      title: "Collective learning across jurisdictions",
      body: "Fraud caught in Birmingham trains the model that protects Maricopa County. Each new client joins an immune system. This is the credit bureau insight applied to corruption — reputation made portable, learning made collective.",
      tags: ["Cross-jurisdiction", "Network Effects", "Privacy-preserving", "Federated"],
      label: "Intelligence Exchange",
    },
  ];

  return (
    <section style={{ padding: "100px 5%" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 14,
            }}
          >
            Three layers. One immune system.
          </h2>
          <p style={{ fontSize: 17, color: "#8888a0", maxWidth: 540, margin: "0 auto" }}>
            Each layer works standalone. Together, they make corruption economically irrational.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {layers.map((layer, i) => (
            <div key={i} className="reveal layer-card" style={{ padding: "36px 40px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                {/* Number badge */}
                <div style={{ flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#00c2ff",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    Layer {layer.num}
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 900,
                      color: "rgba(0,194,255,0.12)",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {layer.num}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{layer.icon}</span>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#00c2ff",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 4,
                        }}
                      >
                        {layer.label}
                      </div>
                      <h3
                        style={{
                          fontSize: "clamp(17px, 2.2vw, 21px)",
                          fontWeight: 700,
                          color: "#f0f0f0",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {layer.title}
                      </h3>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 15,
                      color: "#8888a0",
                      lineHeight: 1.7,
                      marginBottom: 20,
                      maxWidth: 680,
                    }}
                  >
                    {layer.body}
                  </p>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {layer.tags.map((tag, j) => (
                      <span key={j} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Traction Bar ────────────────────────────────────────────────────────────
function Traction() {
  return (
    <section
      style={{
        padding: "48px 5%",
        background: "#080810",
        borderTop: "1px solid #1e1e2e",
        borderBottom: "1px solid #1e1e2e",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#8888a0",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        Trusted By
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#8888a0",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          lineHeight: 2,
        }}
      >
        UK Cabinet Office
        <span style={{ margin: "0 12px", color: "#1e1e2e" }}>·</span>
        Birmingham City Council
        <span style={{ margin: "0 12px", color: "#1e1e2e" }}>·</span>
        Emergent Ventures
        <span style={{ margin: "0 12px", color: "#1e1e2e" }}>·</span>
        Prometheus X Fellowship
      </div>
    </section>
  );
}

// ── About Jordan ────────────────────────────────────────────────────────────
function About() {
  const achievements = [
    { label: "University", value: "Cambridge University" },
    { label: "Rank", value: "#1 of 71 students" },
    { label: "Academic record", value: "Highest marks in subject history" },
    { label: "Fellowship", value: "Emergent Ventures Fellow" },
    { label: "Fellowship", value: "Prometheus X Fellow" },
    { label: "Legal support", value: "Slaughter & May (Pro bono)" },
    { label: "Company", value: "WITIA LTD — Companies House" },
  ];

  return (
    <section style={{ padding: "100px 5%" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 56,
          alignItems: "start",
        }}
      >
        {/* Left — Story */}
        <div className="reveal">
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#00c2ff",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            The Founder
          </div>

          <h2
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 28,
              color: "#f0f0f0",
            }}
          >
            Jordan Anthony Unokesan
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              "When I was fourteen, I watched my father's construction company build hospitals in Nigeria's Niger Delta. The work was completed. Certified. Approved. The payments never came.",
              "Fifteen years of watching a man navigate a system designed to exhaust honest people. Those who paid bribes got paid. Those who didn't, didn't.",
              "At Cambridge, I studied Land Economy — law, economics, policy — ranked first among 71 students, achieving the highest marks in the subject's history. My dissertation uncovered $2 billion in anomalous procurement spend that changed Nigerian government policy.",
              "I built WITIA because I know exactly who it's for: my father, and every contractor like him.",
            ].map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 16,
                  color: i === 3 ? "#f0f0f0" : "#8888a0",
                  lineHeight: 1.75,
                  fontStyle: i === 3 ? "italic" : "normal",
                  fontWeight: i === 3 ? 500 : 400,
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 20, marginTop: 32, flexWrap: "wrap" }}>
            <a
              href="https://www.linkedin.com/in/jordanunokesan"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#00c2ff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <Linkedin size={16} />
              Connect
            </a>
            <a
              href="mailto:jordan@witia.ai"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#00c2ff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <Mail size={16} />
              jordan@witia.ai
            </a>
          </div>
        </div>

        {/* Right — Credentials card */}
        <div
          className="reveal"
          style={{
            background: "#111118",
            border: "1px solid #1e1e2e",
            borderRadius: 12,
            padding: 32,
            animation: "pulse-glow 4s ease-in-out infinite",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#00c2ff",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Credentials
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {achievements.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 16,
                  borderBottom: i < achievements.length - 1 ? "1px solid #1e1e2e" : "none",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12, color: "#8888a0", letterSpacing: "0.05em" }}>
                  {a.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0", textAlign: "right" }}>
                  {a.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Contact ─────────────────────────────────────────────────────────────────
function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", org: "", role: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="contact"
      style={{
        padding: "100px 5%",
        background: "#080810",
        borderTop: "1px solid #1e1e2e",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 14,
            }}
          >
            Work with us
          </h2>
          <p style={{ fontSize: 17, color: "#8888a0" }}>
            Piloting with local authorities across the UK and US. Get in touch.
          </p>
        </div>

        {submitted ? (
          <div
            className="reveal visible"
            style={{
              background: "#111118",
              border: "1px solid rgba(0,194,255,0.3)",
              borderRadius: 12,
              padding: 48,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Message sent</h3>
            <p style={{ color: "#8888a0", fontSize: 15 }}>
              Thank you for reaching out. Jordan will be in touch shortly.
            </p>
          </div>
        ) : (
          <form
            className="reveal"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <input
              className="form-input"
              type="text"
              placeholder="Full name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="form-input"
              type="text"
              placeholder="Organisation"
              required
              value={form.org}
              onChange={(e) => setForm({ ...form, org: e.target.value })}
            />
            <input
              className="form-input"
              type="text"
              placeholder="Role / Title"
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <textarea
              className="form-input"
              placeholder="How can WITIA help you?"
              rows={4}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              style={{ resize: "vertical" }}
            />
            <button type="submit" className="submit-btn">
              Send Message
            </button>
          </form>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: 28,
            fontSize: 14,
            color: "#8888a0",
          }}
        >
          Or email directly:{" "}
          <a
            href="mailto:jordan@witia.ai"
            style={{ color: "#00c2ff", textDecoration: "none" }}
          >
            jordan@witia.ai
          </a>
        </p>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        padding: "24px 5%",
        borderTop: "1px solid #1e1e2e",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: "#8888a0" }}>
        © 2026 WITIA LTD. All rights reserved.
      </span>
      <a
        href="https://witia.ai"
        style={{ fontSize: 13, color: "#8888a0", textDecoration: "none" }}
      >
        witia.ai
      </a>
    </footer>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Page() {
  useReveal();

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Traction />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
