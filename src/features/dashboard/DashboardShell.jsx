import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '@/components/SEO'
import { PAGE_SEO } from '@/config/seo'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import DashboardTopbar from '@/components/layout/DashboardTopbar'
import ThemeSync from '@/components/ThemeSync'
import { SidebarInset, SidebarProvider, TooltipProvider } from '@/components/ui'

export default function DashboardShell() {
  const location = useLocation()
  const isResumeRoute = /^\/dashboard\/resume(\/|$)/.test(location.pathname)
  // The full-screen builder editor (/dashboard/resume/<id>) has its own chrome,
  // so hide the dashboard topbar there.
  const isResumeBuilder = /^\/dashboard\/resume\/.+/.test(location.pathname)
  // GLOWMINDS AI needs a locked viewport so the message list can scroll inside.
  const isAiRoute = /^\/dashboard\/ai(\/|$)/.test(location.pathname)
  // Panels that own their own scroll (no outer outlet scroller).
  const isPanelScroll = isResumeRoute || isAiRoute

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider
        defaultOpen
        className={
          isResumeBuilder
            ? 'dashboard-shell min-h-svh bg-background font-sans'
            : 'dashboard-shell h-dvh max-h-dvh overflow-hidden bg-background font-sans'
        }
      >
        <SEO {...PAGE_SEO.dashboard} path={location.pathname} />
        <ThemeSync />
        <DashboardSidebar />

        <SidebarInset
          id="dashboardMain"
          className={
            isResumeBuilder
              ? 'relative flex min-h-svh min-w-0 flex-col overflow-x-hidden px-0 py-0'
              : 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-0'
          }
          style={{ '--dashboard-chrome': isResumeBuilder ? '0rem' : '7rem' }}
        >
          {!isResumeRoute && !isAiRoute && (
            <div
              aria-hidden
              className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_70%),radial-gradient(ellipse_60%_50%_at_80%_10%,color-mix(in_srgb,var(--ai)_10%,transparent),transparent_65%)] opacity-40"
            />
          )}

          {/* Full-bleed pinned topbar */}
          {!isResumeBuilder && (
            <div className="shrink-0">
              <DashboardTopbar />
            </div>
          )}

          <div
            className={
              isPanelScroll
                ? 'flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden px-3 pt-3 pb-3 sm:px-5 sm:pt-4 md:pb-4 lg:pr-9 lg:pl-7'
                : '@container/dashboard min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pt-3 pb-3 sm:px-5 sm:pt-4 md:pb-4 lg:pr-9 lg:pl-7 [-webkit-overflow-scrolling:touch]'
            }
          >
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={
                isPanelScroll
                  ? 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'
                  : 'flex w-full min-w-0 flex-col pb-[env(safe-area-inset-bottom)]'
              }
            >
              <Outlet />
            </motion.div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
