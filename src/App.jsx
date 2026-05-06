import { lazy, Suspense, useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import useAuthListener from '@/hooks/useAuthListener'
import DashboardNavProvider from '@/context/DashboardNavProvider'
import Navbar from '@/components/layout/Navbar'
import Toast from '@/components/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicOnlyRoute from '@/components/PublicOnlyRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import Loader from '@/components/Loader'
import LandingPage from '@/features/public/LandingPage'
import AboutPage from '@/features/public/AboutPage'
import FeaturesPage from '@/features/public/FeaturesPage'
import ContactPage from '@/features/public/ContactPage'
import PricingPage from '@/features/public/PricingPage'
import PrivacyPage from '@/features/public/PrivacyPage'
import TermsPage from '@/features/public/TermsPage'
import RefundPage from '@/features/public/RefundPage'
import LoginPage from '@/features/auth/LoginPage'
import SignupPage from '@/features/auth/SignupPage'
import NotFoundPage from '@/features/public/NotFoundPage'

const DashboardShell = lazy(() => import('@/features/dashboard/DashboardShell'))
const OverviewSection = lazy(() => import('@/features/dashboard/sections/OverviewSection'))
const JobsSection = lazy(() => import('@/features/dashboard/sections/JobsSection'))
const ResumeSection = lazy(() => import('@/features/dashboard/sections/ResumeSection'))
const AISection = lazy(() => import('@/features/dashboard/sections/AISection'))
const ApplicationsSection = lazy(() => import('@/features/dashboard/sections/ApplicationsSection'))
const ProfileSection = lazy(() => import('@/features/dashboard/sections/ProfileSection'))
const InterviewSection = lazy(() => import('@/features/dashboard/sections/InterviewSection'))
const DailyQuizSection = lazy(() => import('@/features/dashboard/sections/DailyQuizSection'))
const JDMatcherSection = lazy(() => import('@/features/dashboard/sections/JDMatcherSection'))
const CoverLettersSection = lazy(() => import('@/features/dashboard/sections/CoverLettersSection'))
const LinkedInOptimizerSection = lazy(() => import('@/features/dashboard/sections/LinkedInOptimizerSection'))
const SalaryInsightsSection = lazy(() => import('@/features/dashboard/sections/SalaryInsightsSection'))
const BadgesSection = lazy(() => import('@/features/dashboard/sections/BadgesSection'))
const SettingsSection = lazy(() => import('@/features/dashboard/sections/SettingsSection'))

function PageLoader() {
  return <Loader variant="section" />
}

function AnimatedRoutes() {
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  
  return (
    <Routes location={location}>
      {/* Public pages — redirect to /dashboard if already logged in */}
      <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
      <Route path="/about" element={<PublicOnlyRoute><AboutPage /></PublicOnlyRoute>} />
      <Route path="/features" element={<PublicOnlyRoute><FeaturesPage /></PublicOnlyRoute>} />
      <Route path="/contact" element={<PublicOnlyRoute><ContactPage /></PublicOnlyRoute>} />
      <Route path="/pricing" element={<PublicOnlyRoute><PricingPage /></PublicOnlyRoute>} />
      <Route path="/privacy" element={<PublicOnlyRoute><PrivacyPage /></PublicOnlyRoute>} />
      <Route path="/terms" element={<PublicOnlyRoute><TermsPage /></PublicOnlyRoute>} />
      <Route path="/refund" element={<PublicOnlyRoute><RefundPage /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
      {/* Dashboard (protected) */}
      <Route path="/dashboard" element={
        <Suspense fallback={<PageLoader />}>
          <ProtectedRoute><DashboardShell /></ProtectedRoute>
        </Suspense>
      }>
        <Route index element={
          <Suspense fallback={<PageLoader />}>
            <OverviewSection />
          </Suspense>
        } />
        <Route path="jobs" element={
          <Suspense fallback={<PageLoader />}>
            <JobsSection />
          </Suspense>
        } />
        <Route path="resume" element={
          <Suspense fallback={<PageLoader />}>
            <ResumeSection />
          </Suspense>
        } />
        <Route path="ai" element={
          <Suspense fallback={<PageLoader />}>
            <AISection />
          </Suspense>
        } />
        <Route path="interview" element={
          <Suspense fallback={<PageLoader />}>
            <InterviewSection />
          </Suspense>
        } />
        <Route path="applications" element={
          <Suspense fallback={<PageLoader />}>
            <ApplicationsSection />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<PageLoader />}>
            <ProfileSection />
          </Suspense>
        } />
        <Route path="quiz" element={
          <Suspense fallback={<PageLoader />}>
            <DailyQuizSection />
          </Suspense>
        } />
        <Route path="jd-matcher" element={
          <Suspense fallback={<PageLoader />}>
            <JDMatcherSection />
          </Suspense>
        } />
        <Route path="cover-letters" element={
          <Suspense fallback={<PageLoader />}>
            <CoverLettersSection />
          </Suspense>
        } />
        <Route path="linkedin" element={
          <Suspense fallback={<PageLoader />}>
            <LinkedInOptimizerSection />
          </Suspense>
        } />
        <Route path="salary" element={
          <Suspense fallback={<PageLoader />}>
            <SalaryInsightsSection />
          </Suspense>
        } />
        <Route path="badges" element={
          <Suspense fallback={<PageLoader />}>
            <BadgesSection />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<PageLoader />}>
            <SettingsSection />
          </Suspense>
        } />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  useAuthListener()

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <DashboardNavProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Navbar />
            <ErrorBoundary>
              <main id="main-content" tabIndex={-1} className="outline-none">
                <AnimatedRoutes />
              </main>
            </ErrorBoundary>
            <Toast />
          </DashboardNavProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  )
}

export default App
