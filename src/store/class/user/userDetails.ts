// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// interface AppState {
//   userId: string | null | number;
//   grade: number | null;
//   userName: string| null;
//   email: string | null;
//   score: number | null;
//   testUrl: string | null;
//   mobile: number | null;
//   lastName: string | null;
//   schoolName: string | null;
//   photoUpdated:any;
//   setUserId: (id: string | null) => void;
//   setGrade: (grade: number) => void;
//   setUserName: (username: string | null) => void;
//   setScore: (score: number | null) => void;
//   setTestUrl: (testurl: string | null) => void;
//   setEmail: (email: string | null) => void;
//   setMobile: (mobile: number | null) => void;
//   setLastName: (lastname: string | null) => void;
//   setSchoolName: (schoolname: string | null) => void;
//   setPhotoUpdated:(photoUpdated:any) => void;
// }

// const useAppStore = create<AppState>()(
//   persist(
//     (set) => ({
//       userId: null,
//       grade: null,
//       userName: null,
//       score: null,
//       testUrl: null,
//       email: null,
//       mobile: null,
//       lastName: null,
//       schoolName: null,
//       photoUpdated: false,
//       setUserId: (id) => set({ userId: id }),
//       setGrade: (grade) => set({ grade }),
//       setUserName: (username) => set({ userName: username }),
//       setScore: (score) => set({ score }),
//       setTestUrl: (testurl) => set({ testUrl: testurl }),
//       setEmail: (email) => set({ email }),
//       setMobile: (mobile) => set({ mobile }),
//       setLastName: (lastName) => set({ lastName }),
//       setSchoolName: (schoolName) => set({ schoolName }),
//       setPhotoUpdated: (value) => set({ photoUpdated: value }),
//     }),
//     {
//       name: 'app-storage', // Name of the key in localStorage
//       getStorage: () => localStorage, // Use localStorage to persist data
//     }
//   )
// );

// export default useAppStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  userId: string | number | null | undefined;
  role: string | null;
  grade: number | null;
  userName: string| null;
  email: string | null;
  score: number | null;
  testUrl: string | null;
  mobile: number | null;
  lastName: string | null;
  schoolName: string | null;
  photoUpdated:any;
  setUserId: (id: string | null) => void;
      setRole: (role: any) => void,
  setGrade: (grade: number) => void;
  setUserName: (username: string | null) => void;
  setScore: (score: number | null) => void;
  setTestUrl: (testurl: string | null) => void;
  setEmail: (email: string | null) => void;
  setMobile: (mobile: number | null) => void;
  setLastName: (lastname: string | null) => void;
  setSchoolName: (schoolname: string | null) => void;
  setPhotoUpdated:(photoUpdated:any) => void;
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

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      grade: null,
      userName: null,
      score: null,
      testUrl: null,
      email: null,
      mobile: null,
      lastName: null,
      schoolName: null,
      photoUpdated: false,
      setUserId: (id) => set({ userId: id }),
      setRole: (role: any) => set({ role }),
      setGrade: (grade) => set({ grade }),
      setUserName: (username) => set({ userName: username }),
      setScore: (score) => set({ score }),
      setTestUrl: (testurl) => set({ testUrl: testurl }),
      setEmail: (email) => set({ email }),
      setMobile: (mobile) => set({ mobile }),
      setLastName: (lastName) => set({ lastName }),
      setSchoolName: (schoolName) => set({ schoolName }),
      setPhotoUpdated: (value) => set({ photoUpdated: value }),
    }),
    {
      name: 'app-storage', // Name of the key in localStorage
      storage: localStorageAdapter, // Use the adapter for storage
    }
  )
);

export default useAppStore;
