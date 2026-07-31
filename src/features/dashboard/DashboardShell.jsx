import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '@/components/SEO'
import { PAGE_SEO } from '@/config/seo'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import DashboardTopbar from '@/components/layout/DashboardTopbar'
import ThemeSync from '@/components/ThemeSync'
import { SidebarInset, SidebarProvider, SidebarTrigger, TooltipProvider } from '@/components/ui'

export default function DashboardShell() {
  const location = useLocation()
  const isResumeRoute = /^\/dashboard\/resume(\/|$)/.test(location.pathname)
  // The full-screen builder editor (/dashboard/resume/<id>) has its own chrome,
  // so hide the dashboard topbar there.
  const isResumeBuilder = /^\/dashboard\/resume\/.+/.test(location.pathname)

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider defaultOpen className="dashboard-shell min-h-svh bg-background font-sans">
        <SEO {...PAGE_SEO.dashboard} path={location.pathname} />
        <ThemeSync />
        <DashboardSidebar />

        <SidebarInset
          id="dashboardMain"
          className="relative flex min-h-svh min-w-0 flex-col overflow-x-hidden px-4 py-4 sm:px-5 lg:pr-9 lg:pl-7"
        >
          <div className="fixed left-3 top-3 z-40 md:hidden">
            <SidebarTrigger />
          </div>

          {!isResumeRoute && (
            <div
              aria-hidden
              className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_70%),radial-gradient(ellipse_60%_50%_at_80%_10%,color-mix(in_srgb,var(--ai)_10%,transparent),transparent_65%)] opacity-40"
            />
          )}

          {/* Topbar stays mounted — only title/subtitle update on route change */}
          {!isResumeBuilder && <DashboardTopbar />}

          <div
            className={
              isResumeRoute
                ? 'min-h-0 flex-1 overflow-hidden'
                : '@container/dashboard flex min-h-0 w-full min-w-0 flex-1 flex-col'
            }
          >
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={isResumeRoute ? 'h-full min-h-0' : 'flex w-full min-w-0 flex-1 flex-col'}
            >
              <Outlet />
            </motion.div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
