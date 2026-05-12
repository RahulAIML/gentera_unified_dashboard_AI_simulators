import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AIAssistant } from '../ai/AIAssistant'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6 max-w-[1600px] mx-auto page-fade">
            {children}
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
