import { create } from 'zustand';

export type NavSource = 'tests' | 'buttons' | 'accordion' | 'general_info';

export type ClickedNavItem = {
  id: string;
  label: string;
  href: string;
  source: NavSource;
  icon?: string;
  extra?: Record<string, any>;
  timestamp: number;
  test_type_id?: number;
  study_resource_name?: String | null;
};

type State = {
  selected: ClickedNavItem | null;
  history: ClickedNavItem[];
  setSelected: (item: Omit<ClickedNavItem, 'timestamp'>) => void;
  clearSelected: () => void;
};

export const useNavSelection = create<State>((set) => ({
  selected: null,
  history: [],
  setSelected: (item) =>
    set((s) => {
      const full: ClickedNavItem = { ...item, timestamp: Date.now() };
      const nextHistory = [full, ...s.history].slice(0, 20);
      return { selected: full, history: nextHistory };
    }),
  clearSelected: () => set({ selected: null }),
}));
