import { apiRequest } from "@/lib/api-client";

export type HandoffExchangeResponse = {
  accessToken: string;
  ownerId: string;
  user: {
    id: string;
    fullName?: string;
    phone?: string;
    email?: string;
  };
};

export async function exchangeHandoffToken(token: string) {
  return apiRequest<HandoffExchangeResponse>("/owner/auth/handoff-exchange", {
    method: "POST",
    body: { token },
  });
}
