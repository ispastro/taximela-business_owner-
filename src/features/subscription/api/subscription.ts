import { apiRequest } from "@/lib/api-client";

/* ── Types ── */

export type ActiveSubscription = {
  id: string;
  status: "active" | "expired" | "failed" | "cancelled" | "pending";
  amount_etb: number;
  started_at: string;
  expires_at: string;
};

export type SubscriptionStatus = {
  is_featured: boolean;
  featured_until: string | null;
  active_subscription: ActiveSubscription | null;
};

export type InitiatePaymentResponse = {
  checkout_url: string;
  tx_ref: string;
  amount_etb: number;
  duration_days: number;
};

export type SubscriptionHistoryItem = {
  id: string;
  status: "active" | "expired" | "failed" | "cancelled" | "pending";
  amount_etb: number;
  started_at: string;
  expires_at: string;
  created_at: string;
};

export type SubscriptionHistoryResponse = {
  data: SubscriptionHistoryItem[];
  total: number;
  page: number;
  limit: number;
};

/* ── API functions ── */

export async function getSubscriptionStatus(
  token: string,
  businessId: string,
): Promise<SubscriptionStatus> {
  return apiRequest<SubscriptionStatus>(
    `/api/subscriptions/status/${businessId}`,
    { token },
  );
}

export async function initiateSubscription(
  token: string,
  businessId: string,
): Promise<InitiatePaymentResponse> {
  return apiRequest<InitiatePaymentResponse>("/api/subscriptions/initiate", {
    method: "POST",
    body:   { business_id: businessId },
    token,
  });
}

export async function getSubscriptionHistory(
  token: string,
  businessId: string,
  page = 1,
  limit = 10,
): Promise<SubscriptionHistoryResponse> {
  return apiRequest<SubscriptionHistoryResponse>(
    `/api/subscriptions/history/${businessId}?page=${page}&limit=${limit}`,
    { token },
  );
}
