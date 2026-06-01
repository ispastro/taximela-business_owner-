import { apiRequest } from "@/lib/api-client";

/**
 * Backend contract for one-time mobile → web handoff exchange.
 *
 * Preferred: return a Firebase custom token so the web app can call
 * signInWithCustomToken() and stay in sync with AuthProvider.
 *
 * See features/auth/handoff/complete-handoff.ts
 */
export type HandoffExchangeResponse = {
  /** Preferred — Firebase custom token from Admin SDK */
  custom_token?: string;
  firebase_custom_token?: string;
  /** Legacy fallback if backend returns a ready ID token (discouraged) */
  access_token?: string;
  accessToken?: string;
  owner_id?: string;
  ownerId?: string;
};

const handoffExchangePath =
  process.env.NEXT_PUBLIC_HANDOFF_EXCHANGE_PATH ?? "/api/auth/handoff/exchange";

export async function exchangeHandoffToken(handoffToken: string) {
  return apiRequest<HandoffExchangeResponse>(handoffExchangePath, {
    method: "POST",
    body: { handoff_token: handoffToken },
  });
}
