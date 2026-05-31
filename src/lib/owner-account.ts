import {
  getMyApplications,
  getMyBusinesses,
  type Application,
  type Business,
} from "@/features/registration/api/registration";

export type OwnerAccountState = {
  businesses: Business[];
  applications: Application[];
};

export async function fetchOwnerAccountState(
  accessToken: string,
): Promise<OwnerAccountState> {
  const [businessesRes, applicationsRes] = await Promise.all([
    getMyBusinesses(accessToken),
    getMyApplications(accessToken),
  ]);

  return {
    businesses: businessesRes.data,
    applications: applicationsRes.data,
  };
}

/** Where to send the owner immediately after authentication. */
export function resolvePostAuthDestination(state: OwnerAccountState): string {
  if (state.applications.length > 0) return "/status";
  return "/registration";
}

export async function resolvePostAuthDestinationFromToken(
  accessToken: string,
): Promise<string> {
  const state = await fetchOwnerAccountState(accessToken);
  return resolvePostAuthDestination(state);
}

/** Dashboard is only meaningful once at least one business is approved. */
export function canAccessDashboard(state: OwnerAccountState): boolean {
  return state.businesses.length > 0;
}

/** Where to redirect when dashboard access is denied. */
export function resolveDashboardFallback(state: OwnerAccountState): string {
  if (state.applications.length > 0) return "/status";
  return "/registration";
}

export function countPendingApplications(state: OwnerAccountState): number {
  return state.applications.filter((a) => a.status === "pending_review").length;
}

export function hasPendingApplications(state: OwnerAccountState): boolean {
  return countPendingApplications(state) > 0;
}
