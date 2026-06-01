import { exchangeHandoffToken } from "@/features/auth/api/exchange-handoff";
import { signInWithCustomTokenAuth } from "@/lib/firebase";
import { useSessionStore } from "@/store/session-store";

export type HandoffSession = {
  ownerId: string;
  accessToken: string;
};

export class HandoffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HandoffError";
  }
}

function pickCustomToken(payload: Awaited<ReturnType<typeof exchangeHandoffToken>>) {
  return payload.custom_token ?? payload.firebase_custom_token ?? null;
}

function pickLegacyAccessToken(payload: Awaited<ReturnType<typeof exchangeHandoffToken>>) {
  return payload.access_token ?? payload.accessToken ?? null;
}

function pickOwnerId(payload: Awaited<ReturnType<typeof exchangeHandoffToken>>) {
  return payload.owner_id ?? payload.ownerId ?? null;
}

/**
 * Complete mobile → web authentication handoff.
 *
 * 1. Exchange one-time handoff token with backend (public, single-use)
 * 2. Sign in to Firebase via custom token (keeps AuthProvider in sync)
 * 3. Persist session for API calls
 */
export async function completeMobileHandoff(
  handoffToken: string,
): Promise<HandoffSession> {
  const exchange = await exchangeHandoffToken(handoffToken);

  const customToken = pickCustomToken(exchange);

  if (customToken) {
    const { uid, token } = await signInWithCustomTokenAuth(customToken);
    useSessionStore.getState().setSession({ ownerId: uid, accessToken: token });
    return { ownerId: uid, accessToken: token };
  }

  const legacyToken = pickLegacyAccessToken(exchange);
  const legacyOwnerId = pickOwnerId(exchange);

  if (legacyToken && legacyOwnerId) {
    // Fallback for backends that return an ID token directly.
    // AuthProvider may not auto-refresh until the user signs in again via Firebase.
    useSessionStore.getState().setSession({
      ownerId: legacyOwnerId,
      accessToken: legacyToken,
    });
    return { ownerId: legacyOwnerId, accessToken: legacyToken };
  }

  throw new HandoffError(
    "Handoff response was invalid. Backend must return custom_token (preferred) or access_token + owner_id.",
  );
}
