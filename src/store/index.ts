import { create } from 'zustand'

export type Language = 'es' | 'en'
export type Theme = 'light' | 'dark'

interface AppState {
  language: Language
  theme: Theme
  sidebarCollapsed: boolean
  aiOpen: boolean
  selectedActivityId: number | null
  dateFrom: string | null
  dateTo: string | null

  setLanguage: (lang: Language) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  toggleAI: () => void
  setAIOpen: (v: boolean) => void
  setActivityFilter: (id: number | null) => void
  setDateRange: (from: string | null, to: string | null) => void
  clearFilters: () => void
}

export const useAppStore = create<AppState>((set) => ({
  language: 'es',
  theme: 'light',
  sidebarCollapsed: false,
  aiOpen: false,
  selectedActivityId: null,
  dateFrom: null,
  dateTo: null,

  setLanguage: (lang) => set({ language: lang }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleAI: () => set((s) => ({ aiOpen: !s.aiOpen })),
  setAIOpen: (v) => set({ aiOpen: v }),
  setActivityFilter: (id) => set({ selectedActivityId: id }),
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),
  clearFilters: () => set({ selectedActivityId: null, dateFrom: null, dateTo: null }),
}))
