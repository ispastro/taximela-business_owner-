"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  ownerId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (payload: { ownerId: string; accessToken: string }) => void;
  clearSession: () => void;
};

const defaultState = {
  ownerId: null,
  accessToken: null,
  isAuthenticated: false,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...defaultState,
      setSession: ({ ownerId, accessToken }) =>
        set({ ownerId, accessToken, isAuthenticated: true }),
      clearSession: () => set(defaultState),
    }),
    {
      name: "owner-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ownerId: state.ownerId,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
