"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { ThemeToggle } from "@/features/owner/components/theme-toggle";
import { resolvePostAuthDestinationFromToken } from "@/lib/owner-account";
import { useSessionStore } from "@/store/session-store";
import { apiRequest } from "@/lib/api-client";

export default function LoginPage() {
  const router     = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleToggleMode = () => {
    setIsSignUp((v) => !v);
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUpWithEmail(email, password);
        try {
          await apiRequest("/api/users", {
            method: "POST",
            body: {
              full_name:          fullName || null,
              preferred_language: "en",
              is_commuter:        false,
              is_business_owner:  false,
            },
            token: result.token,
          });
        } catch (apiError: unknown) {
          const err = apiError as { status?: number };
          if (err.status !== 409 && err.status !== 400) throw apiError;
        }
        setSession({ ownerId: result.uid, accessToken: result.token });
        router.push(await resolvePostAuthDestinationFromToken(result.token));
      } else {
        const result = await signInWithEmail(email, password);
        setSession({ ownerId: result.uid, accessToken: result.token });
        router.push(await resolvePostAuthDestinationFromToken(result.token));
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      let msg = "Authentication failed";
      if      (e.code === "auth/email-already-in-use") msg = "This email is already registered. Please sign in instead.";
      else if (e.code === "auth/weak-password")         msg = "Password should be at least 6 characters.";
      else if (e.code === "auth/invalid-email")         msg = "Please enter a valid email address.";
      else if (e.code === "auth/user-not-found")        msg = "No account found with this email. Please sign up.";
      else if (e.code === "auth/wrong-password")        msg = "Incorrect password. Please try again.";
      else if (e.message)                               msg = e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── shared input style ── */
  const inputStyle: React.CSSProperties = {
    width:        "100%",
    height:       "44px",
    background:   "var(--bg3)",
    border:       "1px solid var(--border)",
    borderRadius: "0",           /* rectangular */
    padding:      "0 14px",
    fontFamily:   "var(--font-sans)",
    fontSize:     "13px",
    color:        "var(--text)",
    outline:      "none",
    boxSizing:    "border-box",
    transition:   "border-color 150ms",
  };

  const labelStyle: React.CSSProperties = {
    display:       "block",
    fontFamily:    "var(--font-sans)",
    fontWeight:    700,
    fontSize:      "9px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color:         "var(--text3)",
    marginBottom:  "6px",
  };

  return (
    <div
      style={{
        position:     "relative",
        display:      "flex",
        flexDirection:"column",
        alignItems:   "center",
        justifyContent:"center",
        minHeight:    "100vh",
        background:   "var(--bg)",
        padding:      "16px",
      }}
    >
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <ThemeToggle />
      </div>
      {/* ── Brand ── */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1
          style={{
            fontFamily:    "var(--font-sans)",
            fontWeight:    700,
            fontSize:      "26px",
            color:         "var(--text)",
            letterSpacing: "-0.02em",
            margin:        0,
          }}
        >
          Taximela<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p
          style={{
            fontFamily:    "var(--font-sans)",
            fontWeight:    500,
            fontSize:      "9px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         "var(--text3)",
            marginTop:     "6px",
          }}
        >
          Business Owner Portal
        </p>
      </div>

      {/* ── Card — seamless with bg, no border, no shadow ── */}
      <div
        style={{
          width:      "100%",
          maxWidth:   "400px",
          background: "var(--bg)",   /* same as page — seamless */
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Full name — sign up only */}
          {isSignUp && (
            <div>
              <label htmlFor="fullName" style={labelStyle}>
                Full Name (optional)
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: "44px" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  position:   "absolute",
                  right:      "12px",
                  top:        "50%",
                  transform:  "translateY(-50%)",
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  padding:    0,
                  color:      "var(--text3)",
                  display:    "flex",
                  alignItems: "center",
                }}
              >
                {showPw ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background:   "var(--red-dim)",
                border:       "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
                borderRadius: "0",
                padding:      "10px 14px",
                fontFamily:   "var(--font-sans)",
                fontSize:     "12px",
                color:        "var(--red)",
                display:      "flex",
                gap:          "8px",
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* CTA — rectangular, full-width, accent green */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:         "100%",
              height:        "46px",
              background:    "var(--accent)",
              border:        "none",
              borderRadius:  "0",           /* rectangular */
              fontFamily:    "var(--font-sans)",
              fontWeight:    700,
              fontSize:      "13px",
              letterSpacing: "0.04em",
              color:         "#0E1117",
              cursor:        loading ? "not-allowed" : "pointer",
              opacity:       loading ? 0.65 : 1,
              transition:    "background 150ms, opacity 150ms",
              marginTop:     "4px",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--accent)";
            }}
          >
            {loading ? "Signing in…" : isSignUp ? "Create Account" : "Enter Dashboard"}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p
            style={{
              fontFamily:    "var(--font-sans)",
              fontWeight:    500,
              fontSize:      "9px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color:         "var(--text3)",
            }}
          >
            {isSignUp ? "Already have an account?" : "Authorized personnel only"}
          </p>
          <button
            type="button"
            onClick={handleToggleMode}
            style={{
              background:  "none",
              border:      "none",
              cursor:      "pointer",
              fontFamily:  "var(--font-sans)",
              fontSize:    "11px",
              color:       "var(--text3)",
              marginTop:   "6px",
              transition:  "color 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
          >
            {isSignUp ? "Sign in instead →" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
