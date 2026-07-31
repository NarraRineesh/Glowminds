import UpskillingSection from '@/features/dashboard/sections/UpskillingSection'
import { Navigate } from 'react-router-dom'

/** [v2:learning] Learning hub — title lives in DashboardTopbar */
export default function LearningSection() {
  return <UpskillingSection />
}

/** Keep old bookmarks working */
export function UpskillingRedirect() {
  return <Navigate to="/dashboard/learning" replace />
}
