import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ExbosProvider, useExbos } from './context/ExbosContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SuperAdminPage from './pages/SuperAdminPage'
import GlobalToastContainer from './components/common/GlobalToastContainer'
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

function ProtectedRoute({ children }) {
  const { user } = useExbos()
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('exbos_access_token') : null

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  const [loading, setLoading] = useState(true)

  return (
    <ExbosProvider>
      {loading && <PreloaderScreen onComplete={() => setLoading(false)} />}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
              <ProtectedRoute>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback to Landing Page */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
        <GlobalToastContainer />
      </BrowserRouter>
    </ExbosProvider>
  )
}
