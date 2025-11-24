import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      neighbourhood: null,
      devMode: localStorage.getItem('dev-mode') === 'true',
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setNeighbourhood: (neighbourhood) => set({ neighbourhood }),
      setDevMode: (enabled) => {
        localStorage.setItem('dev-mode', enabled ? 'true' : 'false')
        set({ devMode: enabled })
      },
      clearUser: () => set({ user: null, session: null, neighbourhood: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

