import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import DashboardModalsHost from '@/features/dashboard/modals/DashboardModalsHost'

const DASHBOARD_FONT = "'Outfit', 'Inter', system-ui, -apple-system, sans-serif"

export default function DashboardShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="dashboard-shell relative min-h-screen bg-[var(--color-bg2)] pt-16"
      style={{ fontFamily: DASHBOARD_FONT }}
    >
      {/* Subtle ambient backdrop (v2-inspired) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-16 -z-0 h-[480px] opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 30% 0%, var(--color-glow), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 10%, var(--color-glow2), transparent 65%)',
        }}
      />

      <DashboardSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        id="dashboardMain"
        className={`relative z-[1] min-h-[calc(100dvh-4rem)] min-w-0 overflow-x-hidden px-4 py-5 transition-[margin] duration-300 sm:px-5 lg:py-8 lg:pr-10 lg:pl-8 ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        }`}
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      <DashboardModalsHost />
    </div>
  )
}
