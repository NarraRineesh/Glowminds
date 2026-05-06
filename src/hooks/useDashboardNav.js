import { useContext } from 'react'
import { DashboardNavContext } from '@/context/dashboardNavContext'

export default function useDashboardNav() {
  return useContext(DashboardNavContext)
}
