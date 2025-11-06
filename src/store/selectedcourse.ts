'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CourseBundle } from '@/app/[locale]/study_practice/courses/types';

type SelectedCourseState = {
  selected: CourseBundle | null;
  setSelected: (bundle: CourseBundle | null) => void;
  clear: () => void;
};

export const useSelectedCourse = create<SelectedCourseState>()(
  persist(
    (set) => ({
      selected: null,
      setSelected: (bundle) => set({ selected: bundle }),
      clear: () => set({ selected: null }),
    }),
    {
      name: 'selectedCourseBundle',
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
    }
  )
);
