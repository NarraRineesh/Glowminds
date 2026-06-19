import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '@/components/SEO'
import { PAGE_SEO } from '@/config/seo'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import ThemeSync from '@/components/ThemeSync'
import DashboardModalsHost from '@/features/dashboard/modals/DashboardModalsHost'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui'

export default function DashboardShell() {
  const location = useLocation()
  const isResumeRoute = /\/dashboard\/resume\/?$/.test(location.pathname)

  return (
    <SidebarProvider defaultOpen className="dashboard-shell min-h-svh bg-background font-sans">
      <SEO {...PAGE_SEO.dashboard} path={location.pathname} />
      <ThemeSync />
      <DashboardSidebar />

      <SidebarInset
        id="dashboardMain"
        className={
          isResumeRoute
            ? 'relative min-h-svh min-w-0 overflow-hidden p-0'
            : 'relative min-h-svh min-w-0 overflow-x-hidden px-4 py-5 sm:px-5 lg:py-7 lg:pr-9 lg:pl-7'
        }
      >
        <div className="fixed left-3 top-3 z-40 md:hidden">
          <SidebarTrigger />
        </div>

        {!isResumeRoute && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_70%),radial-gradient(ellipse_60%_50%_at_80%_10%,color-mix(in_srgb,#34d399_10%,transparent),transparent_65%)] opacity-40"
          />
        )}

        {isResumeRoute ? (
          <Outlet />
        ) : (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="@container/dashboard flex w-full min-w-0 min-h-[calc(100svh-4.5rem)] flex-col pt-10 md:min-h-[calc(100svh-2.5rem)] md:pt-0"
          >
            <Outlet />
          </motion.div>
        )}
      </SidebarInset>

      <DashboardModalsHost />
    </SidebarProvider>
  )
}
