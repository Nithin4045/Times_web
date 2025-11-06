// src/store/testSelection.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TestLinkOption = {
  status: boolean;
  test_link: string | null;
  vendorName?: string | null;
  [key: string]: any;
};

export type SelectedTest = {
  id: number;
  name: string | null;
  primary_link: string | null;
  has_primary_link?: boolean;
  test_links: TestLinkOption[] | null;
  description: string | null;
  submitted_at: string | null; // keep snake_case to match API
  viewedreport: boolean | null;
  solution: string | null;
  attempt_status: string | null;
  answers: string | null;
  area: string | null;
  level: string | null;
};

type State = {
  selected: SelectedTest | null;
  setSelected: (t: SelectedTest) => void;
  clear: () => void;
};

export const useTestSelection = create<State>()(
  persist(
    (set) => ({
      selected: null,
      setSelected: (t) => set({ selected: t }),
      clear: () => set({ selected: null }),
    }),
    {
      name: "test-selection", // localStorage key
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version === 1 && persisted?.selected) {
          const prev = persisted.selected as any;
          return {
            selected: {
              id: prev.id,
              name: prev.name ?? null,
              primary_link: prev.test_link ?? null,
              has_primary_link:
                typeof prev.test_link === "string"
                  ? prev.test_link.trim().length > 0
                  : false,
              test_links: null,
              description: prev.description ?? null,
              submitted_at: prev.submitted_at ?? null,
              viewedreport: prev.viewedreport ?? null,
              solution: prev.solution ?? null,
              attempt_status: prev.attempt_status ?? null,
              answers: prev.answers ?? null,
              area: prev.area ?? null,
              level: prev.level ?? null,
            },
          };
        }
        return persisted;
      },
      partialize: (state) => ({ selected: state.selected }), // persist only `selected`
    },
  ),
);
