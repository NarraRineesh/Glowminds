import { lazy, Suspense, useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import useAuthListener from '@/hooks/useAuthListener'
import usePricingStore from '@/store/pricingStore'
import { TooltipProvider } from '@/components/ui'
import Toast from '@/components/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicOnlyRoute from '@/components/PublicOnlyRoute'
import AdminRoute from '@/components/AdminRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { PageLoader } from '@/components/Loader'
import PublicLayout from '@/features/public/PublicLayout'

const LandingPage = lazy(() => import('@/features/public/LandingPage'))
const AboutPage = lazy(() => import('@/features/public/AboutPage'))
const FeaturesPage = lazy(() => import('@/features/public/FeaturesPage'))
const ContactPage = lazy(() => import('@/features/public/ContactPage'))
const PricingPage = lazy(() => import('@/features/public/PricingPage'))
const PrivacyPage = lazy(() => import('@/features/public/PrivacyPage'))
const TermsPage = lazy(() => import('@/features/public/TermsPage'))
const RefundPage = lazy(() => import('@/features/public/RefundPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const SignupPage = lazy(() => import('@/features/auth/SignupPage'))
const NotFoundPage = lazy(() => import('@/features/public/NotFoundPage'))

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
const AdminShell = lazy(() => import('@/features/admin/AdminShell'))
const AdminOverview = lazy(() => import('@/features/admin/AdminOverview'))
const AdminUsers = lazy(() => import('@/features/admin/AdminUsers'))
const AdminUserDetail = lazy(() => import('@/features/admin/AdminUserDetail'))
const AdminTokenUsage = lazy(() => import('@/features/admin/AdminTokenUsage'))
const AdminCreditUsage = lazy(() => import('@/features/admin/AdminCreditUsage'))
const AdminMessages = lazy(() => import('@/features/admin/AdminMessages'))
const AdminPricing = lazy(() => import('@/features/admin/AdminPricing'))
const AdminJobs = lazy(() => import('@/features/admin/AdminJobs'))


function AnimatedRoutes() {
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  
  return (
    <Routes location={location}>
      {/* Public marketing pages (lazy — keep marketing CSS/JS out of first paint) */}
      <Route element={<PublicOnlyRoute><PublicLayout /></PublicOnlyRoute>}>
        <Route index element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
        <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="features" element={<Suspense fallback={<PageLoader />}><FeaturesPage /></Suspense>} />
        <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
        <Route path="privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>} />
        <Route path="terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
        <Route path="refund" element={<Suspense fallback={<PageLoader />}><RefundPage /></Suspense>} />
      </Route>
      <Route path="/login" element={<Suspense fallback={<PageLoader />}><PublicOnlyRoute><LoginPage /></PublicOnlyRoute></Suspense>} />
      <Route path="/signup" element={<Suspense fallback={<PageLoader />}><PublicOnlyRoute><SignupPage /></PublicOnlyRoute></Suspense>} />
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
        <Route path="resume/:resumeId?" element={
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
      <Route path="/admin" element={
        <Suspense fallback={<PageLoader />}>
          <AdminRoute><AdminShell /></AdminRoute>
        </Suspense>
      }>
        <Route index element={<Suspense fallback={<PageLoader />}><AdminOverview /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
        <Route path="users/:uid" element={<Suspense fallback={<PageLoader />}><AdminUserDetail /></Suspense>} />
        <Route path="subscriptions" element={<Navigate to="/admin/users?filter=pro" replace />} />
        <Route path="usage/tokens" element={<Suspense fallback={<PageLoader />}><AdminTokenUsage /></Suspense>} />
        <Route path="usage/credits" element={<Suspense fallback={<PageLoader />}><AdminCreditUsage /></Suspense>} />
        <Route path="messages" element={<Suspense fallback={<PageLoader />}><AdminMessages /></Suspense>} />
        <Route path="pricing" element={<Suspense fallback={<PageLoader />}><AdminPricing /></Suspense>} />
        <Route path="jobs" element={<Suspense fallback={<PageLoader />}><AdminJobs /></Suspense>} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
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
