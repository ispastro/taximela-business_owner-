import { apiRequest } from "@/lib/api-client";

export type BusinessRegistrationPayload = {
  business_name: string;
  category_id: string;
  latitude: number;
  longitude: number;
  government_id_fan: string;
  business_licence_number: string;
  government_id_photo_url: string;
  business_license_photo_url: string;
};

export type BusinessRegistrationResponse = {
  message: string;
  data: {
    id: string;
    business_name: string;
    status: string;
  };
};

export type ApplicationStatus = "pending_review" | "approved" | "rejected";

export type Application = {
  id: string;
  business_name: string;
  status: ApplicationStatus;
  rejection_reason: string | null;
};

export type ApplicationsResponse = {
  data: Application[];
  total: number;
  page: number;
  limit: number;
};

export type BusinessCategory = {
  id: string;
  name: string;
};

export async function submitBusinessRegistration(
  payload: BusinessRegistrationPayload,
  token: string,
) {
  return apiRequest<BusinessRegistrationResponse>(
    "/api/auth/business-registration",
    { method: "POST", body: payload, token },
  );
}

export async function getMyApplications(
  token: string,
  params?: { status?: ApplicationStatus; page?: number; limit?: number },
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const path = `/api/business-registrations${query.toString() ? `?${query.toString()}` : ""}`;
  return apiRequest<ApplicationsResponse>(path, { token });
}

export async function getMyApplication(token: string, id: string) {
  return apiRequest<{ data: Application }>(`/api/business-registrations/${id}`, { token });
}

export async function getBusinessCategories() {
  return apiRequest<BusinessCategory[]>("/api/business-categories");
}
