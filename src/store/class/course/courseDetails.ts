
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Course {
  ActivityMessage:string;
  PointsMessage:string;
  CompletionMessage:string;
  VIEWED_DURATION_MINUTES:string;
  COURSE_TITLE: string;
  COURSE_SHORT_DESCRITION: string;
  COURSE_DETAILS: string;
  COURSE_IMAGE: string;
  COURSE_VIDEO: string;
  GRADE: number;
  COURSE_TYPE: number;
  COURSE_EXIT_CRITERIA: string | null;
  POINTS_TO_BE_AWARDED: number | null;
  USER_COURSE_ID: number;
  COURSE_ID: number;
  COMPLETED_COURSE: string | null;
  SCORE_PERCENTAGE: number | null;
  TOTAL: number;
  COMPLETED: number;
  TOTAL_SCORE: number;
  TOTAL_AVAILABLE_POINTS: number;
  LAST_ACTIVITY_DAYS: number;
  VIEWED_DURATION: number;
  TOTAL_SECONDS: number;
}

interface UserStore {
  courseObj: Course | null;
  grade: number | null;
  courseId:string | null;
  courseTitle:string | null;
  setCourseDetails: (courseDetails: Course) => void;
  setGrade: (grade: number) => void;
  setCourseId: (courseId: string | null) => void;
  setCourseTitle: (courseTitle: string | null) => void;
}

// Adapter for localStorage
const localStorageAdapter = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name);
    return item ? JSON.parse(item) : null;
  },
  setItem: (name: string, value: any) => {
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

const useStore = create<UserStore>()(
  persist(
    (set) => ({
      courseObj: null,
      grade: null,
      courseId: null,
      courseTitle: null,
      setCourseDetails: (courseDetails) =>
        set({ courseObj: courseDetails, grade: courseDetails.GRADE }),
      setGrade: (grade) => set({ grade }),
      setCourseId: (courseId) => set({ courseId }),
      setCourseTitle: (courseTitle) => set({ courseTitle }),
    }),
    {
      name: 'user-course-storage', // Name for localStorage
      storage: localStorageAdapter, // Use the adapter for storage
    }
  )
);

export default useStore;
