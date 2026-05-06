import { useCallback, useMemo, useState } from 'react'
import { DashboardNavContext } from '@/context/dashboardNavContext'

export default function DashboardNavProvider({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((v) => !v)
  }, [])

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      mobileSidebarOpen,
      setMobileSidebarOpen,
      toggleMobileSidebar,
      closeMobileSidebar,
    }),
    [mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar],
  )

  return <DashboardNavContext.Provider value={value}>{children}</DashboardNavContext.Provider>
}
