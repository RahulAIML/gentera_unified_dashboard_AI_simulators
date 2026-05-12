import { create } from 'zustand'

export type Language = 'es' | 'en'

interface AppState {
  language: Language
  sidebarCollapsed: boolean
  aiOpen: boolean
  selectedActivityId: number | null
  dateFrom: string | null
  dateTo: string | null

  setLanguage: (lang: Language) => void
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
  sidebarCollapsed: false,
  aiOpen: false,
  selectedActivityId: null,
  dateFrom: null,
  dateTo: null,

  setLanguage: (lang) => set({ language: lang }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleAI: () => set((s) => ({ aiOpen: !s.aiOpen })),
  setAIOpen: (v) => set({ aiOpen: v }),
  setActivityFilter: (id) => set({ selectedActivityId: id }),
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),
  clearFilters: () => set({ selectedActivityId: null, dateFrom: null, dateTo: null }),
}))
