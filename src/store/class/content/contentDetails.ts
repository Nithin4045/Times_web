// import {create} from 'zustand';
// import { persist } from 'zustand/middleware';

// // Define the CourseContent interface
// interface CourseContent {
//   CONTENT_TYPE?: number;
//   CONTENT_VIDEO?: string;
//   CONTENT_ID?: number;
//   PARENT_ID?: number;
//   WATCH_COUNT?: number;
//   SCORE?: number;
//   CURRENT_PROGRESS?: number;
//   CONTENT_PROGRESS_STATUS?: number;
//   POINTS_TO_BE_AWARDED?: number;
//   CONTENT_TITLE?: string;
//   CONTENT_SHORT_DESCRIPTION?: string;
//   CONTENT_VIDEO_DURATION?: number;
//   PERCENTAGE_VIEWED?: number;

// }
// // Define the Zustand store interface
// interface ContentStore {
//   contentsObj: CourseContent[] | null; // Array to store multiple course contents
//   contentId: number | null;
//   setContents: (contents: CourseContent[]) => void; // Method to set contents
//   setContentId: (id: number) => void;
// }

// // Persist middleware configuration
// const useContentStore = create<ContentStore>()(
//   persist(
//     (set) => ({
//       contentsObj: null,
//       contentId: null, 
//       setContents: (contents) => set({ contentsObj: contents }),
//       setContentId: (id) => set({ contentId: id }),
//     }),
//     {
//       name: 'course-content-storage', // Name for localStorage
//       getStorage: () => localStorage, // Persist data in localStorage
//     }
//   )
// );

// export default useContentStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the CourseContent interface
interface CourseContent {
  CONTENT_TYPE?: number;
  CONTENT_VIDEO?: string;
  CONTENT_ID?: number;
  PARENT_ID?: number;
  WATCH_COUNT?: number;
  SCORE?: number;
  CURRENT_PROGRESS?: number;
  CONTENT_PROGRESS_STATUS?: number;
  POINTS_TO_BE_AWARDED?: number;
  CONTENT_TITLE?: string;
  CONTENT_SHORT_DESCRIPTION?: string;
  CONTENT_VIDEO_DURATION?: number;
  PERCENTAGE_VIEWED?: number;

}

// Define the Zustand store interface
interface ContentStore {
  contentsObj: CourseContent[] | null; // Array to store multiple course contents
  contentId: number | null;
  activeContentId: number | null;
  setContents: (contents: CourseContent[]) => void; // Method to set contents
  setContentId: (id: number | null) => void;
  setActiveContentId: (id: number | null) => void;
}

// Adapter for localStorage to conform to PersistStorage
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

// Persist middleware configuration
const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      contentsObj: null,
      contentId: null, 
      activeContentId: null,
      setContents: (contents) => set({ contentsObj: contents }),
      setContentId: (id) => set({ contentId: id }),
      setActiveContentId: (id) => set({ activeContentId: id }),
    }),
    {
      name: 'course-content-storage', // Name for localStorage
      storage: localStorageAdapter, // Use the adapter
    }
  )
);

export default useContentStore;
