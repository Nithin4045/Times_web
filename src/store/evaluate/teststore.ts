
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the store type
type TestStore = {
  testId: string | null;
  userTestId: string | null; // Correctly named to match the state structure
  setUserTestId: (id: string) => void;
  setTestId: (id: string) => void;
};

// Create the store with persistence
const useTestStore = create<TestStore>()(
  persist(
    (set) => ({
      testId: null,
      userTestId: null, // Ensure initial state matches the type
      setTestId: (id: string) => set({ testId: id }),
      setUserTestId: (id: string) => set({ userTestId: id }), // Correct key here
    }),
    {
      name: "testStore", // Key for localStorage
      partialize: (state) => ({ testId: state.testId, userTestId: state.userTestId }), // Persist both properties
    }
  )
);

export default useTestStore;
