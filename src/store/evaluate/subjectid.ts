import { create } from 'zustand';

type SubjectStore = {
  subjectId: string | null;
  setSubjectId: (id: string) => void;
};

const useSubjectStore = create<SubjectStore>((set) => ({
  subjectId: null,
  setSubjectId: (id: string) => set({ subjectId: id }),
}));

export default useSubjectStore;
