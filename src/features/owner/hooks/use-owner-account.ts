"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchOwnerAccountState,
  type OwnerAccountState,
} from "@/lib/owner-account";
import { useSessionStore } from "@/store/session-store";

export const OWNER_ACCOUNT_QUERY_KEY = ["owner-account"] as const;

type UseOwnerAccountOptions = {
  /** Poll while applications are under review (e.g. on /status). */
  pollWhilePending?: boolean;
  pollIntervalMs?: number;
};

export function useOwnerAccount(options: UseOwnerAccountOptions = {}) {
  const { pollWhilePending = false, pollIntervalMs = 30_000 } = options;
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: OWNER_ACCOUNT_QUERY_KEY,
    queryFn: () => fetchOwnerAccountState(accessToken ?? ""),
    enabled: !!accessToken,
    refetchInterval: (query) => {
      if (!pollWhilePending) return false;
      const state = query.state.data as OwnerAccountState | undefined;
      if (!state) return false;
      return state.applications.some((a) => a.status === "pending_review")
        ? pollIntervalMs
        : false;
    },
  });
}
