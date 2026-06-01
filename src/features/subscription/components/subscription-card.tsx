"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getSubscriptionStatus,
  initiateSubscription,
} from "@/features/subscription/api/subscription";
import { useSessionStore } from "@/store/session-store";

type Props = {
  businessId: string;
};

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year:  "numeric",
    month: "long",
    day:   "numeric",
  });
}

export function SubscriptionCard({ businessId }: Props) {
  const accessToken = useSessionStore((s) => s.accessToken);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["subscription-status", businessId],
    queryFn:  () => getSubscriptionStatus(accessToken ?? "", businessId),
    enabled:  !!accessToken && !!businessId,
  });

  const initiateMutation = useMutation({
    mutationFn: () => initiateSubscription(accessToken ?? "", businessId),
    onSuccess: (res) => {
      /* Store business_id so the success page can poll */
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_subscription_business_id", businessId);
      }
      window.location.href = res.checkout_url;
    },
  });

  /* ── Loading skeleton ── */
  if (isLoading) {
    return <div className="tx-skeleton" style={{ height: "160px" }} />;
  }

  /* ── Error ── */
  if (isError) {
    return (
      <div className="tx-alert tx-alert-warn">
        Could not load subscription status.{" "}
        <button
          type="button"
          onClick={() => void refetch()}
          style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const isFeatured = data?.is_featured ?? false;
  const expiry     = data?.featured_until;

  /* ── Featured — active ── */
  if (isFeatured && expiry) {
    return (
      <div
        style={{
          background:   "var(--accent-dim)",
          border:       "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          padding:      "20px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "16px" }}>✦</span>
              <p style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize:   "13px",
                color:      "var(--accent)",
              }}>
                Featured Listing Active
              </p>
            </div>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize:   "12px",
              color:      "var(--text2)",
              marginBottom: "12px",
            }}>
              Your business appears at the top of results for nearby commuters.
            </p>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "11px",
              color:      "var(--text3)",
            }}>
              EXPIRES {formatExpiry(expiry).toUpperCase()}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => initiateMutation.mutate()}
              disabled={initiateMutation.isPending}
              className="tx-btn-ghost"
              style={{ fontSize: "12px", height: "34px" }}
            >
              {initiateMutation.isPending ? "Loading…" : "Renew Early"}
            </button>
          </div>
        </div>

        {initiateMutation.isError && (
          <p style={{ marginTop: "10px", fontSize: "12px", color: "var(--red)" }}>
            {getErrorMessage(initiateMutation.error)}
          </p>
        )}
      </div>
    );
  }

  /* ── Not featured — upsell ── */
  return (
    <div
      style={{
        background: "var(--panel)",
        border:     "1px solid var(--border)",
        padding:    "20px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "16px" }}>★</span>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize:   "13px",
              color:      "var(--text)",
            }}>
              Get Featured
            </p>
          </div>
          <p style={{
            fontFamily:   "var(--font-sans)",
            fontSize:     "12px",
            color:        "var(--text2)",
            marginBottom: "12px",
            maxWidth:     "320px",
          }}>
            Appear at the top of search results for commuters passing your area.
          </p>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize:   "18px",
            color:      "var(--text)",
          }}>
            1,500 <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text3)" }}>ETB / month</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => initiateMutation.mutate()}
          disabled={initiateMutation.isPending}
          className="tx-btn-primary"
          style={{ height: "40px", minWidth: "160px", fontSize: "12.5px", flexShrink: 0 }}
        >
          {initiateMutation.isPending ? "Loading…" : "Get Featured Now"}
        </button>
      </div>

      {initiateMutation.isError && (
        <p style={{ marginTop: "10px", fontSize: "12px", color: "var(--red)" }}>
          {getErrorMessage(initiateMutation.error)}
        </p>
      )}
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already has an active")) return "You already have an active subscription.";
    if (msg.includes("chapa")) return "Payment service unavailable. Please try again later.";
    if (msg.includes("403")) return "Access denied. Please go back to your dashboard.";
    if (msg.includes("404")) return "Business not found. Please go back to your dashboard.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
