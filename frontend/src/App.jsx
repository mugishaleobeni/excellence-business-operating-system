import React, { useState, useEffect, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ExbosProvider, useExbos } from './context/ExbosContext'
import { isTokenValid } from './utils/apiClient'
import { lazyWithRetry } from './utils/lazyWithRetry'
import { installGlobalErrorReporter } from './utils/errorReporter'
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GlobalToastContainer from './components/common/GlobalToastContainer'
import GlobalKinyarwandaTranslator from './components/common/GlobalKinyarwandaTranslator'
import PwaInstallBanner from './components/common/PwaInstallBanner'
import UpgradePromptModal from './components/common/UpgradePromptModal'
import PreloaderScreen from './components/common/PreloaderScreen'
import ExbosLoader from './components/common/ExbosLoader'
import {
  FeaturesPage,
  BusinessModelsIndexPage,
  SingleArchitectureSeoPage,
  BusinessToolsPage,
  PricingPage,
  AboutPage,
  ResourcesPage
} from './pages/SeoPublicPages'

const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'))
const SuperAdminPage = lazyWithRetry(() => import('./pages/SuperAdminPage'))
const PublicDocumentPage = lazyWithRetry(() => import('./pages/PublicDocumentPage'))
const BranchManagerInvitePage = lazyWithRetry(() => import('./pages/BranchManagerInvitePage'))

function RouteFallback() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#03091F]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 38%, rgba(16, 69, 202, 0.22) 0%, transparent 58%)'
      }}
    >
      <ExbosLoader
        title="Loading ExBOS..."
        subtitle="Please wait while we prepare your workspace"
        size="md"
      />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user } = useExbos()
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('exbos_access_token') : null
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  // Offline Grace Mode: if device is offline and cached user + token exist, keep dashboard accessible
  // so shopkeepers are never locked out of local POS/stock when JWT expires offline.
  if (!user || !token || (!isOffline && !isTokenValid(token))) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function SuperAdminRoute({ children }) {
  const { user } = useExbos()
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('exbos_access_token') : null

  if (!user || !token || !isTokenValid(token)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isSuper =
    Boolean(user.isSuperAdmin) ||
    String(user.email || '').trim().toLowerCase() === 'mugishaleobeni0@gmail.com'
  if (!isSuper) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    installGlobalErrorReporter()
    // Warm-cache core DashboardPage chunk while online so offline reload works seamlessly
    if (typeof navigator === 'undefined' || navigator.onLine) {
      const warm = () => {
        import('./pages/DashboardPage').catch(() => {})
      }
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(warm, { timeout: 4000 })
      } else {
        setTimeout(warm, 2000)
      }
    }
  }, [])

  return (
    <GlobalErrorBoundary>
      <ExbosProvider>
      {loading && <PreloaderScreen onComplete={() => setLoading(false)} />}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Marketing & SEO Routes (Section 4 SEO Page Architecture) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/business-models" element={<BusinessModelsIndexPage />} />
            <Route path="/business-models/:slug" element={<SingleArchitectureSeoPage />} />
            <Route path="/business-tools" element={<BusinessToolsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/resources" element={<ResourcesPage />} />

            {/* Public Shared Document Viewer (/d/:docId) */}
            <Route path="/d/:docId" element={<PublicDocumentPage />} />

            {/* Public Branch Manager Self-Setup Invite Route (/branch-invite/:token) */}
            <Route path="/branch-invite/:token" element={<BranchManagerInvitePage />} />

            {/* Authentication & 7-Step Guided Registration Routes (Section 4) */}
            <Route path="/login" element={<LoginPage isForgotPassword={false} />} />
            <Route path="/forgot-password" element={<LoginPage isForgotPassword={true} />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Business Operations Dashboard (Section 5, 6, 7) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Platform Super Administrator Workspace (Section 8) */}
            <Route
              path="/super-admin"
              element={
                <SuperAdminRoute>
                  <SuperAdminPage />
                </SuperAdminRoute>
              }
            />

            {/* Fallback to Landing Page */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Suspense>
        <GlobalToastContainer />
        <GlobalKinyarwandaTranslator />
        <PwaInstallBanner />
        <UpgradePromptModal />
      </BrowserRouter>
    </ExbosProvider>
    </GlobalErrorBoundary>
  )
}
