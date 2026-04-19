"use client";

import { create } from "zustand";

import type { Platform } from "@/schemas/platform";

type ComposerState = {
  body: string;
  selectedPlatforms: Platform[];
  scheduleMode: "now" | "scheduled";
  scheduledAt: string | null;
  setBody: (body: string) => void;
  togglePlatform: (platform: Platform) => void;
  setScheduleMode: (mode: "now" | "scheduled") => void;
  setScheduledAt: (scheduledAt: string | null) => void;
  hydrateDraft: (draft: {
    body: string;
    selectedPlatforms: Platform[];
    scheduleMode?: "now" | "scheduled";
    scheduledAt?: string | null;
  }) => void;
  reset: () => void;
};

const initialState = {
  body: "",
  selectedPlatforms: ["instagram"] satisfies Platform[],
  scheduleMode: "now" as const,
  scheduledAt: null,
};

export const useComposerStore = create<ComposerState>((set) => ({
  ...initialState,
  setBody: (body) => set({ body }),
  togglePlatform: (platform) =>
    set((state) => {
      const exists = state.selectedPlatforms.includes(platform);
      const selectedPlatforms = exists
        ? state.selectedPlatforms.filter((item) => item !== platform)
        : [...state.selectedPlatforms, platform];

      return {
        selectedPlatforms: selectedPlatforms.length > 0 ? selectedPlatforms : state.selectedPlatforms,
      };
    }),
  setScheduleMode: (scheduleMode) => set({ scheduleMode }),
  setScheduledAt: (scheduledAt) => set({ scheduledAt }),
  hydrateDraft: (draft) =>
    set({
      body: draft.body,
      selectedPlatforms:
        draft.selectedPlatforms.length > 0
          ? draft.selectedPlatforms
          : initialState.selectedPlatforms,
      scheduleMode: draft.scheduleMode ?? initialState.scheduleMode,
      scheduledAt: draft.scheduledAt ?? null,
    }),
  reset: () => set(initialState),
}));
