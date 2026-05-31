"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/features/owner/components/theme-toggle";
import { exchangeHandoffToken } from "@/features/auth/api/exchange-handoff";
import { resolvePostAuthDestinationFromToken } from "@/lib/owner-account";
import { ApiError } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";

const authErrorMessages: Record<string, string> = {
  expired_token: "This link has expired. Please open TaxiMela app and request a new link.",
  invalid_token: "This link is invalid. Please retry from TaxiMela app.",
  used_token:    "This link has already been used. Please request a fresh link in TaxiMela app.",
};

function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.code && authErrorMessages[error.code]) {
    return authErrorMessages[error.code];
  }
  if (error instanceof Error) return error.message;
  return "Unable to verify your link right now. Please try again.";
}

export default function RegisterClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const handoffToken = searchParams.get("handoff");
  const setSession   = useSessionStore((state) => state.setSession);
  const attemptedRef = useRef<string | null>(null);
  const [statusText, setStatusText] = useState("Verifying your link…");

  const exchangeMutation = useMutation({
    mutationFn: exchangeHandoffToken,
    onSuccess: async (result) => {
      // 1. Store session
      setSession({ ownerId: result.ownerId, accessToken: result.accessToken });

      // 2. Check submission history to decide where to send the owner
      setStatusText("Checking your account…");
      const destination = await resolvePostAuthDestinationFromToken(
        result.accessToken,
      ).catch(() => "/registration");

      // 3. Route
      router.push(destination);
    },
  });

  useEffect(() => {
    if (!handoffToken) return;
    if (attemptedRef.current === handoffToken) return;
    attemptedRef.current = handoffToken;
    exchangeMutation.mutate(handoffToken);
  }, [handoffToken, exchangeMutation]);

  /* ── No token in URL ── */
  if (!handoffToken) {
    return (
      <div style={pageStyle}>
        <div style={{ position: "absolute", top: "16px", right: "16px" }}>
          <ThemeToggle />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text2)", marginBottom: "16px" }}>
            No handoff token found. Please use the link from the TaxiMela app.
          </p>
          <a href="/login" style={linkStyle}>Go to login →</a>
        </div>
      </div>
    );
  }

  /* ── Token present — show exchange / routing state ── */
  return (
    <div style={pageStyle}>
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <ThemeToggle />
      </div>
      <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>

        {/* Brand */}
        <h1 style={brandStyle}>
          Taximela<span style={{ color: "var(--accent)" }}>.</span>
        </h1>

        {/* Pending / checking */}
        {(exchangeMutation.isPending || exchangeMutation.isSuccess) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            {/* Spinner */}
            <div style={{
              width:        "20px",
              height:       "20px",
              border:       "2px solid var(--border2)",
              borderTop:    "2px solid var(--accent)",
              borderRadius: "50%",
              animation:    "tx-spin 0.8s linear infinite",
            }} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text2)" }}>
              {statusText}
            </p>
          </div>
        )}

        {/* Error */}
        {exchangeMutation.isError && (
          <>
            <div style={errorBoxStyle}>
              {getAuthErrorMessage(exchangeMutation.error)}
            </div>
            <a href="/login" style={{ ...linkStyle, marginTop: "12px", display: "inline-block" }}>
              Go to login →
            </a>
          </>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes tx-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Shared styles ── */
const pageStyle: React.CSSProperties = {
  position:       "relative",
  display:        "flex",
  minHeight:      "100vh",
  alignItems:     "center",
  justifyContent: "center",
  background:     "var(--bg)",
  padding:        "16px",
};

const brandStyle: React.CSSProperties = {
  fontFamily:    "var(--font-sans)",
  fontWeight:    700,
  fontSize:      "22px",
  color:         "var(--text)",
  letterSpacing: "-0.02em",
  marginBottom:  "32px",
};

const errorBoxStyle: React.CSSProperties = {
  background:   "var(--red-dim)",
  border:       "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
  borderRadius: "0",
  padding:      "14px 16px",
  fontFamily:   "var(--font-sans)",
  fontSize:     "12.5px",
  color:        "var(--red)",
  textAlign:    "left",
  marginBottom: "16px",
};

const linkStyle: React.CSSProperties = {
  fontFamily:     "var(--font-sans)",
  fontSize:       "12px",
  color:          "var(--text3)",
  textDecoration: "none",
};
