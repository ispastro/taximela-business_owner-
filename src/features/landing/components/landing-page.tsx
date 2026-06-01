"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/store/session-store";

/* ─────────────────────────────────────────────
   LANDING PAGE
   Public marketing page — default route /
   ───────────────────────────────────────────── */

function useIsAuthenticated() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? isAuthenticated : false;
}

/* ── Topbar ── */
function LandingNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header style={{
      position:        "fixed",
      top:             0,
      left:            0,
      right:           0,
      zIndex:          50,
      borderBottom:    "1px solid var(--border)",
      background:      "color-mix(in srgb, var(--bg) 85%, transparent)",
      backdropFilter:  "blur(12px)",
    }}>
      <div style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        maxWidth:        "72rem",
        margin:          "0 auto",
        padding:         "0 24px",
        height:          "56px",
      }}>
        {/* Brand */}
        <span style={{
          fontFamily:    "var(--font-sans)",
          fontWeight:    700,
          fontSize:      "16px",
          letterSpacing: "-0.02em",
          color:         "var(--text)",
        }}>
          Taximela<span style={{ color: "var(--accent)" }}>.</span>
        </span>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <a href="#features" style={navLinkStyle}>Features</a>
          <a href="#pricing"  style={navLinkStyle}>Pricing</a>
        </nav>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isAuthenticated ? (
            <Link href="/dashboard" className="tx-btn-primary" style={{ height: "36px", fontSize: "12.5px" }}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" style={{
                fontFamily:     "var(--font-sans)",
                fontSize:       "12.5px",
                fontWeight:     500,
                color:          "var(--text2)",
                textDecoration: "none",
                padding:        "0 12px",
                height:         "36px",
                display:        "inline-flex",
                alignItems:     "center",
                transition:     "color 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text2)")}
              >
                Log in
              </Link>
              <Link href="/login" className="tx-btn-primary" style={{ height: "36px", fontSize: "12.5px" }}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Hero ── */
function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section style={{
      paddingTop:    "140px",
      paddingBottom: "100px",
      paddingLeft:   "24px",
      paddingRight:  "24px",
      textAlign:     "center",
      position:      "relative",
      overflow:      "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position:     "absolute",
        top:          "10%",
        left:         "50%",
        transform:    "translateX(-50%)",
        width:        "600px",
        height:       "400px",
        background:   "radial-gradient(ellipse, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 70%)",
        pointerEvents:"none",
      }} />

      <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative" }}>
        {/* Eyebrow badge */}
        <div style={{
          display:        "inline-flex",
          alignItems:     "center",
          gap:            "6px",
          padding:        "4px 12px",
          background:     "var(--accent-dim)",
          border:         "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
          marginBottom:   "24px",
          fontFamily:     "var(--font-sans)",
          fontWeight:     600,
          fontSize:       "11px",
          color:          "var(--accent)",
          letterSpacing:  "0.04em",
        }}>
          <span>✦</span>
          <span>Business Owner Portal</span>
        </div>

        <h1 style={{
          fontFamily:    "var(--font-sans)",
          fontWeight:    700,
          fontSize:      "clamp(32px, 5vw, 56px)",
          lineHeight:    1.1,
          color:         "var(--text)",
          letterSpacing: "-0.03em",
          marginBottom:  "20px",
        }}>
          Reach commuters<br />
          <span style={{ color: "var(--accent)" }}>exactly where they are</span>
        </h1>

        <p style={{
          fontFamily:   "var(--font-sans)",
          fontSize:     "16px",
          lineHeight:   1.6,
          color:        "var(--text2)",
          maxWidth:     "520px",
          margin:       "0 auto 36px",
        }}>
          List your business on TaxiMela and get discovered by thousands of
          commuters passing through your area every day.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link href={isAuthenticated ? "/dashboard" : "/login"} className="tx-btn-primary" style={{
            height:    "48px",
            padding:   "0 28px",
            fontSize:  "14px",
            fontWeight: 700,
          }}>
            {isAuthenticated ? "Go to Dashboard →" : "Register your business →"}
          </Link>
          <a href="#pricing" style={{
            display:        "inline-flex",
            alignItems:     "center",
            height:         "48px",
            padding:        "0 24px",
            fontFamily:     "var(--font-sans)",
            fontSize:       "14px",
            fontWeight:     500,
            color:          "var(--text2)",
            textDecoration: "none",
            border:         "1px solid var(--border)",
            transition:     "border-color 150ms, color 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
          >
            See pricing
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        gap:           "48px",
        marginTop:     "64px",
        flexWrap:      "wrap",
      }}>
        {[
          { value: "10K+",  label: "Daily commuters" },
          { value: "500+",  label: "Listed businesses" },
          { value: "30 days", label: "Featured duration" },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 400,
              fontSize:   "28px",
              color:      "var(--text)",
              lineHeight: 1,
            }}>
              {stat.value}
            </p>
            <p style={{
              fontFamily:   "var(--font-sans)",
              fontSize:     "11px",
              color:        "var(--text3)",
              marginTop:    "6px",
              letterSpacing:"0.06em",
              textTransform:"uppercase",
            }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features ── */
function Features() {
  const items = [
    {
      icon:  "◈",
      title: "Easy Registration",
      desc:  "Submit your business details, documents, and location in minutes. Our admin team reviews and approves within 24 hours.",
    },
    {
      icon:  "⊕",
      title: "Location-Based Discovery",
      desc:  "Commuters see businesses near their route. Your listing appears automatically to passengers passing your area.",
    },
    {
      icon:  "✦",
      title: "Featured Placement",
      desc:  "Upgrade to Featured and appear at the top of search results. Get maximum visibility for 1,500 ETB per month.",
    },
    {
      icon:  "◎",
      title: "Full Dashboard",
      desc:  "Track your application status, manage business details, update your location, and monitor your featured subscription.",
    },
  ];

  return (
    <section id="features" style={{
      padding:      "80px 24px",
      borderTop:    "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{
            fontFamily:    "var(--font-sans)",
            fontWeight:    700,
            fontSize:      "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color:         "var(--text3)",
            marginBottom:  "12px",
          }}>
            Features
          </p>
          <h2 style={{
            fontFamily:    "var(--font-sans)",
            fontWeight:    700,
            fontSize:      "clamp(24px, 3vw, 36px)",
            color:         "var(--text)",
            letterSpacing: "-0.02em",
          }}>
            Everything you need to grow
          </h2>
        </div>

        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap:                 "1px",
          background:          "var(--border)",
          border:              "1px solid var(--border)",
        }}>
          {items.map((item) => (
            <div key={item.title} style={{
              background:  "var(--bg)",
              padding:     "32px 28px",
            }}>
              <div style={{
                width:          "36px",
                height:         "36px",
                background:     "var(--accent-dim)",
                border:         "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "16px",
                color:          "var(--accent)",
                marginBottom:   "16px",
              }}>
                {item.icon}
              </div>
              <p style={{
                fontFamily:   "var(--font-sans)",
                fontWeight:   600,
                fontSize:     "14px",
                color:        "var(--text)",
                marginBottom: "8px",
              }}>
                {item.title}
              </p>
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize:   "12.5px",
                lineHeight: 1.6,
                color:      "var(--text2)",
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ── */
function Pricing() {
  const tiers = [
    {
      name:      "Free",
      price:     "0",
      unit:      "ETB",
      period:    "forever",
      highlight: false,
      features:  [
        "List your business on TaxiMela",
        "Appear in location-based search",
        "Full dashboard access",
        "Document management",
        "Standard ranking",
      ],
      cta:       "Get started free",
      href:      "/login",
    },
    {
      name:      "Featured",
      price:     "1,500",
      unit:      "ETB",
      period:    "per month",
      highlight: true,
      features:  [
        "Everything in Free",
        "Priority ranking in search results",
        "Appear first for nearby commuters",
        "Featured badge on your listing",
        "30-day subscription via Chapa",
      ],
      cta:       "Get Featured",
      href:      "/login",
    },
  ];

  return (
    <section id="pricing" style={{
      padding:   "80px 24px",
      borderTop: "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{
            fontFamily:    "var(--font-sans)",
            fontWeight:    700,
            fontSize:      "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color:         "var(--text3)",
            marginBottom:  "12px",
          }}>
            Pricing
          </p>
          <h2 style={{
            fontFamily:    "var(--font-sans)",
            fontWeight:    700,
            fontSize:      "clamp(24px, 3vw, 36px)",
            color:         "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom:  "12px",
          }}>
            Simple, transparent pricing
          </h2>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "14px",
            color:      "var(--text2)",
          }}>
            Start free. Upgrade when you want more visibility.
          </p>
        </div>

        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap:                 "16px",
        }}>
          {tiers.map((tier) => (
            <div key={tier.name} style={{
              background:  tier.highlight ? "var(--bg2)" : "var(--bg)",
              border:      tier.highlight
                ? "1px solid color-mix(in srgb, var(--accent) 40%, transparent)"
                : "1px solid var(--border)",
              padding:     "32px 28px",
              position:    "relative",
            }}>
              {tier.highlight && (
                <div style={{
                  position:      "absolute",
                  top:           "-1px",
                  left:          "28px",
                  right:         "28px",
                  height:        "2px",
                  background:    "var(--accent)",
                }} />
              )}

              <p style={{
                fontFamily:    "var(--font-sans)",
                fontWeight:    700,
                fontSize:      "9px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color:         tier.highlight ? "var(--accent)" : "var(--text3)",
                marginBottom:  "16px",
              }}>
                {tier.name}
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 400,
                  fontSize:   "36px",
                  color:      "var(--text)",
                  lineHeight: 1,
                }}>
                  {tier.price}
                </span>
                <span style={{
                  fontFamily: "var(--font-sans)",
                  fontSize:   "13px",
                  color:      "var(--text3)",
                }}>
                  {tier.unit}
                </span>
              </div>
              <p style={{
                fontFamily:   "var(--font-sans)",
                fontSize:     "11px",
                color:        "var(--text3)",
                marginBottom: "28px",
              }}>
                {tier.period}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ color: "var(--accent)", fontSize: "12px", marginTop: "1px", flexShrink: 0 }}>✓</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "12.5px", color: "var(--text2)", lineHeight: 1.5 }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={tier.highlight ? "tx-btn-primary" : "tx-btn-ghost"}
                style={{ display: "flex", height: "40px", fontSize: "12.5px", justifyContent: "center" }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer style={{
      borderTop:  "1px solid var(--border)",
      padding:    "32px 24px",
    }}>
      <div style={{
        maxWidth:        "72rem",
        margin:          "0 auto",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        flexWrap:        "wrap",
        gap:             "12px",
      }}>
        <span style={{
          fontFamily:    "var(--font-sans)",
          fontWeight:    700,
          fontSize:      "14px",
          letterSpacing: "-0.02em",
          color:         "var(--text)",
        }}>
          Taximela<span style={{ color: "var(--accent)" }}>.</span>
        </span>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize:   "11px",
          color:      "var(--text3)",
        }}>
          © {new Date().getFullYear()} TaxiMela. Business Owner Portal.
        </p>
      </div>
    </footer>
  );
}

/* ── Shared styles ── */
const navLinkStyle: React.CSSProperties = {
  fontFamily:     "var(--font-sans)",
  fontSize:       "12.5px",
  fontWeight:     500,
  color:          "var(--text2)",
  textDecoration: "none",
  padding:        "0 12px",
  height:         "32px",
  display:        "inline-flex",
  alignItems:     "center",
  transition:     "color 150ms",
};

/* ── Main export ── */
export default function LandingPage() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <LandingNav isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
