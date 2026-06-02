"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getSubscriptionStatus } from "@/features/subscription/api/subscription";
import { useSessionStore } from "@/store/session-store";

function getStoredBusinessId(): string | null {
  if (typeof window === "undefined") return null;

  // Try localStorage first (same-session)
  const fromStorage = localStorage.getItem("pending_subscription_business_id");
  if (fromStorage) return fromStorage;

  // Try cookie fallback (cross-tab, survives Chapa redirect to fresh tab)
  const match = document.cookie.match(/(?:^|;\s*)psb_id=([^;]+)/);
  return match ? match[1] : null;
}

function clearStoredBusinessId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pending_subscription_business_id");
  document.cookie = "psb_id=;path=/;max-age=0";
}

const MAX_POLLS     = 10;
const POLL_INTERVAL = 3000;

function SuccessContent() {
  const searchParams = useSearchParams();
  const txRef        = searchParams.get("tx_ref");
  const accessToken  = useSessionStore((s) => s.accessToken);

  const [state,      setState]      = useState<"polling" | "success" | "timeout" | "error">("polling");
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!txRef || !accessToken) {
      setState("error");
      return;
    }

    const bid = getStoredBusinessId();
    if (!bid) {
      setState("error");
      return;
    }

    setBusinessId(bid);

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      if (pollCount.current >= MAX_POLLS) {
        setState("timeout");
        return;
      }
      pollCount.current += 1;
      try {
        const data = await getSubscriptionStatus(accessToken!, bid!);
        if (data.is_featured && data.featured_until) {
          if (!cancelled) {
            setExpiryDate(data.featured_until);
            setState("success");
            clearStoredBusinessId();
          }
        } else {
          setTimeout(poll, POLL_INTERVAL);
        }
      } catch {
        setTimeout(poll, POLL_INTERVAL);
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [txRef, accessToken]);

  return (
    <div style={{
      display:        "flex",
      minHeight:      "100vh",
      alignItems:     "center",
      justifyContent: "center",
      background:     "var(--bg)",
      padding:        "24px",
    }}>
      <div style={{
        width:      "100%",
        maxWidth:   "420px",
        background: "var(--panel)",
        border:     "1px solid var(--border)",
        padding:    "36px 32px",
        textAlign:  "center",
      }}>

        {/* Brand */}
        <p style={{
          fontFamily:    "var(--font-sans)",
          fontWeight:    700,
          fontSize:      "15px",
          letterSpacing: "-0.02em",
          color:         "var(--text)",
          marginBottom:  "28px",
        }}>
          Taximela<span style={{ color: "var(--accent)" }}>.</span>
        </p>

        {/* Polling */}
        {state === "polling" && (
          <>
            <div style={{
              width:        "32px",
              height:       "32px",
              border:       "2px solid var(--border2)",
              borderTop:    "2px solid var(--accent)",
              borderRadius: "50%",
              animation:    "tx-spin 0.8s linear infinite",
              margin:       "0 auto 16px",
            }} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>
              Confirming your payment…
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text2)" }}>
              This usually takes a few seconds.
            </p>
          </>
        )}

        {/* Success */}
        {state === "success" && (
          <>
            <div style={{
              width:           "48px",
              height:          "48px",
              background:      "var(--accent-dim)",
              border:          "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              margin:          "0 auto 20px",
              fontSize:        "22px",
            }}>
              ✦
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--accent)", marginBottom: "8px" }}>
              You&apos;re now Featured!
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text2)", marginBottom: "6px" }}>
              Your business now appears at the top of search results for nearby commuters.
            </p>
            {expiryDate && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text3)", marginBottom: "24px" }}>
                ACTIVE UNTIL {new Date(expiryDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
              </p>
            )}
            <Link
              href="/dashboard"
              className="tx-btn-primary"
              style={{ display: "inline-flex", height: "40px", minWidth: "160px", fontSize: "12.5px" }}
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {/* Timeout */}
        {state === "timeout" && (
          <>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--amber)", marginBottom: "8px" }}>
              Payment received — still confirming
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text2)", marginBottom: "24px" }}>
              Your payment was processed but the featured status is still being activated. Check back in a few minutes.
            </p>
            <Link
              href={businessId ? `/businesses/${businessId}` : "/dashboard"}
              className="tx-btn-primary"
              style={{ display: "inline-flex", height: "40px", minWidth: "160px", fontSize: "12.5px" }}
            >
              Back to Business
            </Link>
          </>
        )}

        {/* Error */}
        {state === "error" && (
          <>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--red)", marginBottom: "8px" }}>
              Something went wrong
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text2)", marginBottom: "24px" }}>
              We couldn&apos;t verify your payment. Please check your dashboard or contact support.
            </p>
            <Link
              href="/dashboard"
              className="tx-btn-primary"
              style={{ display: "inline-flex", height: "40px", minWidth: "160px", fontSize: "12.5px" }}
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>

      <style>{`@keyframes tx-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text3)" }}>Loading…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
