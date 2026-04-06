import { apiRequest } from "@/lib/api-client";

export type BusinessRegistrationPayload = {
  business_name: string;
  category_id: string;
  latitude: number;
  longitude: number;
  government_id_fan: string;
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

// --- Businesses (post-approval) ---

export type BusinessStatus = "active" | "suspended";

export type Business = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  government_id_fan: string;
  government_id_photo_url: string;
  business_logo: string | null;
  license_photo_url: string;
  status: BusinessStatus;
  approved_by: string | null;
  approver_name: string | null;
  category_id: string | null;
  category_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessesResponse = {
  data: Business[];
  total: number;
  page: number;
  limit: number;
};

export type DashboardSummary = {
  total_count: number;
  pending_application: number;
  accepted: number;
  rejected: number;
};

export type UpdateBusinessPayload = {
  business_name?: string;
  latitude?: number;
  longitude?: number;
  business_logo?: string;
  category_id?: string;
};

export async function getDashboardSummary(token: string) {
  return apiRequest<DashboardSummary>("/api/businesses/dashboard-summary", { token });
}

export async function getMyBusinesses(
  token: string,
  params?: { status?: BusinessStatus; page?: number; limit?: number },
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const path = `/api/businesses${query.toString() ? `?${query.toString()}` : ""}`;
  return apiRequest<BusinessesResponse>(path, { token });
}

export async function getBusinessById(token: string, businessId: string) {
  return apiRequest<{ data: Business }>(`/api/businesses/${businessId}`, { token });
}

export async function updateBusiness(
  token: string,
  businessId: string,
  payload: UpdateBusinessPayload,
) {
  return apiRequest<{ data: Business; message: string }>(
    `/api/businesses/${businessId}`,
    { method: "PATCH", body: payload, token },
  );
}
