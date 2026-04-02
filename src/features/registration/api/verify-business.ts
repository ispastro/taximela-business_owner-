import { apiRequest } from "@/lib/api-client";

export type BusinessVerificationRequest = {
  nationalId: string;
  businessTIN: string;
  businessName: string;
  ownerName: string;
};

export type BusinessVerificationResponse = {
  isValid: boolean;
  tinStatus: "valid" | "invalid" | "inactive" | "not_found";
  nationalIdStatus: "valid" | "invalid" | "not_found";
  businessNameMatch: boolean;
  ownerNameMatch: boolean;
  verificationId: string;
  message?: string;
};

export async function verifyBusiness(data: BusinessVerificationRequest) {
  return apiRequest<BusinessVerificationResponse>("/owner/verification/business", {
    method: "POST",
    body: data,
  });
}

export async function checkTINStatus(tin: string) {
  return apiRequest<{ isValid: boolean; businessName?: string; status: string }>("/owner/verification/tin", {
    method: "POST",
    body: { tin },
  });
}

export async function checkNationalIdStatus(nationalId: string) {
  return apiRequest<{ isValid: boolean; fullName?: string; status: string }>("/owner/verification/national-id", {
    method: "POST",
    body: { nationalId },
  });
}