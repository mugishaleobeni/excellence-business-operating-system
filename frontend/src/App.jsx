import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ExbosProvider } from './context/ExbosContext'
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

          {/* Business Operations Dashboard (Section 5, 6, 7 & Farming Enhancements) */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Protected Platform Super Administrator Workspace (Section 8) */}
          <Route path="/super-admin" element={<SuperAdminPage />} />

          {/* Fallback to Landing Page */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
        <GlobalToastContainer />
      </BrowserRouter>
    </ExbosProvider>
  )
}

