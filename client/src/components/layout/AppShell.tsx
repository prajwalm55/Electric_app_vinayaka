import { Outlet } from 'react-router-dom'
import { Sidebar, MobileNav } from './AppLayout'

export function AppShell() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </div>
      <MobileNav />
    </div>
  )
}
