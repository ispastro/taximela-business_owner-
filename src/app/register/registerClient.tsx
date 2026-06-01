"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/features/owner/components/theme-toggle";
import { HandoffError, completeMobileHandoff } from "@/features/auth/handoff/complete-handoff";
import { resolvePostAuthDestinationFromToken } from "@/lib/owner-account";
import { ApiError } from "@/lib/api-client";

const authErrorMessages: Record<string, string> = {
  expired_token: "This link has expired. Please open TaxiMela app and request a new link.",
  invalid_token: "This link is invalid. Please retry from TaxiMela app.",
  used_token:    "This link has already been used. Please request a fresh link in TaxiMela app.",
  handoff_expired: "This link has expired. Please open TaxiMela app and request a new link.",
  handoff_invalid: "This link is invalid. Please retry from TaxiMela app.",
  handoff_used:    "This link has already been used. Please request a fresh link in TaxiMela app.",
};

function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.code && authErrorMessages[error.code]) {
    return authErrorMessages[error.code];
  }
  if (error instanceof HandoffError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unable to verify your link right now. Please try again.";
}

export default function RegisterClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const handoffToken = searchParams.get("handoff");
  const attemptedRef = useRef<string | null>(null);
  const [statusText, setStatusText] = useState("Verifying your link…");

  const handoffMutation = useMutation({
    mutationFn: completeMobileHandoff,
    onSuccess: async ({ accessToken }) => {
      setStatusText("Checking your account…");
      const destination = await resolvePostAuthDestinationFromToken(accessToken).catch(
        () => "/registration",
      );
      // Navigate away — removes handoff token from browser history
      router.replace(destination);
    },
  });

  useEffect(() => {
    if (!handoffToken) return;
    if (attemptedRef.current === handoffToken) return;
    attemptedRef.current = handoffToken;
    handoffMutation.mutate(handoffToken);
  }, [handoffToken, handoffMutation]);

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

  return (
    <div style={pageStyle}>
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <ThemeToggle />
      </div>
      <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <h1 style={brandStyle}>
          Taximela<span style={{ color: "var(--accent)" }}>.</span>
        </h1>

        {(handoffMutation.isPending || handoffMutation.isSuccess) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
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

        {handoffMutation.isError && (
          <>
            <div style={errorBoxStyle}>
              {getAuthErrorMessage(handoffMutation.error)}
            </div>
            <a href="/login" style={{ ...linkStyle, marginTop: "12px", display: "inline-block" }}>
              Go to login →
            </a>
          </>
        )}
      </div>

      <style>{`@keyframes tx-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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
