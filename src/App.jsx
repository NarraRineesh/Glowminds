import { lazy, Suspense, useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import useAuthListener from '@/hooks/useAuthListener'
import usePricingStore from '@/store/pricingStore'
import { TooltipProvider } from '@/components/ui'
import Toast from '@/components/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicOnlyRoute from '@/components/PublicOnlyRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { PageLoader } from '@/components/Loader'
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
import PublicLayout from '@/features/public/PublicLayout'

const DashboardShell = lazy(() => import('@/features/dashboard/DashboardShell'))
const OverviewSection = lazy(() => import('@/features/dashboard/sections/OverviewSection'))
const JobsSection = lazy(() => import('@/features/dashboard/sections/JobsSection'))
const JobDetailSection = lazy(() => import('@/features/dashboard/sections/JobDetailSection'))
const GlowmindsResumeSection = lazy(() => import('@/features/dashboard/sections/GlowmindsResumeSection'))
const AISection = lazy(() => import('@/features/dashboard/sections/AISection'))
const ApplicationsSection = lazy(() => import('@/features/dashboard/sections/ApplicationsSection'))
const ProfileSection = lazy(() => import('@/features/dashboard/sections/ProfileSection'))
const InterviewSection = lazy(() => import('@/features/dashboard/sections/InterviewSection'))
const CoverLettersSection = lazy(() => import('@/features/dashboard/sections/CoverLettersSection'))
const LinkedInOptimizerSection = lazy(() => import('@/features/dashboard/sections/LinkedInOptimizerSection'))
const SalaryInsightsSection = lazy(() => import('@/features/dashboard/sections/SalaryInsightsSection'))
const SettingsSection = lazy(() => import('@/features/dashboard/sections/SettingsSection'))
const GrammarCheckSection = lazy(() => import('@/features/dashboard/sections/GrammarCheckSection'))
const ParaphrasingSection = lazy(() => import('@/features/dashboard/sections/ParaphrasingSection'))


function AnimatedRoutes() {
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  
  return (
    <Routes location={location}>
      {/* Public marketing pages */}
      <Route element={<PublicOnlyRoute><PublicLayout /></PublicOnlyRoute>}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="refund" element={<RefundPage />} />
      </Route>
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
        <Route path="jobs/:jobId" element={
          <Suspense fallback={<PageLoader />}>
            <JobDetailSection />
          </Suspense>
        } />
        <Route path="resume" element={
          <Suspense fallback={<PageLoader />}>
            <GlowmindsResumeSection />
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
        <Route path="jd-matcher" element={<Navigate to="/dashboard/jobs" replace />} />
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
        <Route path="settings" element={
          <Suspense fallback={<PageLoader />}>
            <SettingsSection />
          </Suspense>
        } />
        <Route path="grammar-check" element={
          <Suspense fallback={<PageLoader />}>
            <GrammarCheckSection />
          </Suspense>
        } />
        <Route path="paraphrase" element={
          <Suspense fallback={<PageLoader />}>
            <ParaphrasingSection />
          </Suspense>
        } />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  useAuthListener()

  useEffect(() => {
    usePricingStore.getState().load()
  }, [])

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <TooltipProvider delayDuration={300}>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <ErrorBoundary>
              <main id="main-content" tabIndex={-1} className="outline-none">
                <AnimatedRoutes />
              </main>
            </ErrorBoundary>
            <Toast />
          </TooltipProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  )
}

export default App
