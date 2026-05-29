import { Outlet } from 'react-router-dom'
import PublicHeader from '@/components/layout/PublicHeader'
import Footer from '@/components/layout/Footer'

/** Shell for marketing / legal public pages — header + footer, no dashboard chrome. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <PublicHeader />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
