// stores/streamStore.ts
import { create } from 'zustand'

type StreamState = {
  data: string
  append: (chunk: string) => void
  reset: () => void
}

export const useStreamStore = create<StreamState>((set) => ({
  data: '',
  append: (chunk) => set((state) => ({ data: state.data + chunk })),
  reset: () => set({ data: '' }),
}))
