import { lazy, Suspense, useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import useAuthListener from '@/hooks/useAuthListener'
import usePricingStore from '@/store/pricingStore'
import Toast from '@/components/Toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicOnlyRoute from '@/components/PublicOnlyRoute'
import AdminRoute from '@/components/AdminRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { PageLoader } from '@/components/Loader'
import AndroidAppAuthGate from '@/components/AndroidAppAuthGate'
import PublicLayout from '@/features/public/PublicLayout'

// Landing is eager so `/` does not blank on Suspense while the chunk downloads.
import LandingPage from '@/features/public/LandingPage'
const AboutPage = lazy(() => import('@/features/public/AboutPage'))
const FeaturesPage = lazy(() => import('@/features/public/FeaturesPage'))
const ContactPage = lazy(() => import('@/features/public/ContactPage'))
const PricingPage = lazy(() => import('@/features/public/PricingPage'))
const CareersDemoPage = lazy(() => import('@/features/public/CareersDemoPage'))
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
const ResumeHubSection = lazy(() => import('@/features/dashboard/sections/ResumeHubSection'))
const AISection = lazy(() => import('@/features/dashboard/sections/AISection'))
const ApplicationsSection = lazy(() => import('@/features/dashboard/sections/ApplicationsSection'))
const ProfileSection = lazy(() => import('@/features/dashboard/sections/ProfileSection'))
const InterviewSection = lazy(() => import('@/features/dashboard/sections/InterviewSection'))
const CoverLettersSection = lazy(() => import('@/features/dashboard/sections/CoverLettersSection'))
const LinkedInOptimizerSection = lazy(() => import('@/features/dashboard/sections/LinkedInOptimizerSection'))
const SalaryInsightsSection = lazy(() => import('@/features/dashboard/sections/SalaryInsightsSection'))
const SettingsSection = lazy(() => import('@/features/dashboard/sections/SettingsSection'))
const PlansSection = lazy(() => import('@/features/dashboard/sections/PlansSection'))
const GrammarCheckSection = lazy(() => import('@/features/dashboard/sections/GrammarCheckSection'))
const ParaphrasingSection = lazy(() => import('@/features/dashboard/sections/ParaphrasingSection'))
const LearningSection = lazy(() => import('@/features/dashboard/sections/LearningSection'))
const SkillsSection = lazy(() => import('@/features/dashboard/sections/SkillsSection'))
const VaultSection = lazy(() => import('@/features/dashboard/sections/VaultSection'))
const AnalyticsSection = lazy(() => import('@/features/dashboard/sections/AnalyticsSection'))
const TimelineSection = lazy(() => import('@/features/dashboard/sections/TimelineSection'))
const NotificationsSection = lazy(() => import('@/features/dashboard/sections/NotificationsSection'))
const AdminShell = lazy(() => import('@/features/admin/AdminShell'))
const AdminOverview = lazy(() => import('@/features/admin/AdminOverview'))
const AdminUsers = lazy(() => import('@/features/admin/AdminUsers'))
const AdminUserDetail = lazy(() => import('@/features/admin/AdminUserDetail'))
const AdminTokenUsage = lazy(() => import('@/features/admin/AdminTokenUsage'))
const AdminCreditUsage = lazy(() => import('@/features/admin/AdminCreditUsage'))
const AdminMessages = lazy(() => import('@/features/admin/AdminMessages'))
const AdminPricing = lazy(() => import('@/features/admin/AdminPricing'))
const AdminFeatureComparison = lazy(() => import('@/features/admin/AdminFeatureComparison'))
const AdminPricingFaqs = lazy(() => import('@/features/admin/AdminPricingFaqs'))
const AdminJobs = lazy(() => import('@/features/admin/AdminJobs'))
const DesignLabShell = lazy(() => import('@/features/design-lab/DesignLabShell'))
const DesignIndex = lazy(() => import('@/features/design-lab/DesignIndex'))
const DesignSystemGallery = lazy(() => import('@/features/design-lab/DesignSystemGallery'))
const DesignScreenView = lazy(() => import('@/features/design-lab/DesignScreenView'))


function AnimatedRoutes() {
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  
  return (
    <AndroidAppAuthGate>
    <Routes location={location}>
      {/* Public marketing pages — no auth gate so crawlers see content without waiting on Firebase Auth */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="features" element={<Suspense fallback={<PageLoader />}><FeaturesPage /></Suspense>} />
        <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
        <Route path="careers" element={<Suspense fallback={<PageLoader />}><CareersDemoPage /></Suspense>} />
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
        <Route path="resume" element={
          <Suspense fallback={<PageLoader />}>
            <ResumeHubSection />
          </Suspense>
        } />
        <Route path="resume/:resumeId" element={
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
        <Route path="plans" element={
          <Suspense fallback={<PageLoader />}>
            <PlansSection />
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
        <Route path="skills" element={
          <Suspense fallback={<PageLoader />}>
            <SkillsSection />
          </Suspense>
        } />
        <Route path="learning" element={
          <Suspense fallback={<PageLoader />}>
            <LearningSection />
          </Suspense>
        } />
        <Route path="upskilling" element={<Navigate to="/dashboard/learning" replace />} />
        <Route path="vault" element={
          <Suspense fallback={<PageLoader />}>
            <VaultSection />
          </Suspense>
        } />
        <Route path="analytics" element={
          <Suspense fallback={<PageLoader />}>
            <AnalyticsSection />
          </Suspense>
        } />
        <Route path="timeline" element={
          <Suspense fallback={<PageLoader />}>
            <TimelineSection />
          </Suspense>
        } />
        <Route path="notifications" element={
          <Suspense fallback={<PageLoader />}>
            <NotificationsSection />
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
        <Route path="feature-comparison" element={<Suspense fallback={<PageLoader />}><AdminFeatureComparison /></Suspense>} />
        <Route path="pricing-faqs" element={<Suspense fallback={<PageLoader />}><AdminPricingFaqs /></Suspense>} />
        <Route path="jobs" element={<Suspense fallback={<PageLoader />}><AdminJobs /></Suspense>} />
      </Route>
      {/* UX Revamp Design Lab — DEV or localStorage.gm_design_lab=1; no product UI */}
      <Route path="/design" element={
        <Suspense fallback={<PageLoader />}>
          <DesignLabShell />
        </Suspense>
      }>
        <Route index element={<Suspense fallback={<PageLoader />}><DesignIndex /></Suspense>} />
        <Route path="system" element={<Suspense fallback={<PageLoader />}><DesignSystemGallery /></Suspense>} />
        <Route path="wireframes/:screenId" element={<Suspense fallback={<PageLoader />}><DesignScreenView mode="wire" /></Suspense>} />
        <Route path="mocks/:screenId" element={<Suspense fallback={<PageLoader />}><DesignScreenView mode="mock" /></Suspense>} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
      </Route>
    </Routes>
    </AndroidAppAuthGate>
  )
}

function AppEffects() {
  // Must live under BrowserRouter — useAuthListener reads the current route to
  // defer Firebase on marketing pages.
  useAuthListener()

  useEffect(() => {
    usePricingStore.getState().load()
  }, [])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AppEffects />
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <ErrorBoundary>
            <main id="main-content" tabIndex={-1} className="outline-none">
              <AnimatedRoutes />
            </main>
          </ErrorBoundary>
          <Toast />
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  )
}

export default App
