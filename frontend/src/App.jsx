import React, { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ExbosProvider, useExbos } from './context/ExbosContext'
import { isTokenValid } from './utils/apiClient'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GlobalToastContainer from './components/common/GlobalToastContainer'
import GlobalKinyarwandaTranslator from './components/common/GlobalKinyarwandaTranslator'
import PreloaderScreen from './components/common/PreloaderScreen'
import {
  FeaturesPage,
  BusinessModelsIndexPage,
  SingleArchitectureSeoPage,
  BusinessToolsPage,
  PricingPage,
  AboutPage,
  ResourcesPage
} from './pages/SeoPublicPages'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'))
const PublicDocumentPage = lazy(() => import('./pages/PublicDocumentPage'))

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#03091F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-[#218DFF] border-t-transparent animate-spin" />
        <span className="text-xs font-orbitron uppercase tracking-wider text-[#9EDCFF]">
          Loading ExBOS...
        </span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user } = useExbos()
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('exbos_access_token') : null

  if (!user || !token || !isTokenValid(token)) {
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

  return (
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
      </BrowserRouter>
    </ExbosProvider>
  )
}
