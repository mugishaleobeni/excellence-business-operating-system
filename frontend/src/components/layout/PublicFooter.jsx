import React from 'react'
import { Link } from 'react-router-dom'
import { SIX_ARCHITECTURES } from '../../data/architectures'
import { Shield, Globe2, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import exbosLogo from '../../../logo/exboslogo.png'

export default function PublicFooter() {
  return (
    <footer className="relative border-t border-blue-200/70 dark:border-[#9EDCFF]/15 bg-white/70 dark:bg-[#03091F]/95 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={exbosLogo}
                alt="EXCELLENCE BOS logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <span className="font-orbitron font-extrabold text-lg text-[#071544] dark:text-white">
                  EXCELLENCE <span className="text-[#218DFF]">BOS</span>
                </span>
                <span className="block text-[10px] font-bold tracking-widest text-[#1045CA] dark:text-[#9EDCFF]">
                  DEVELOPED BY <span className="font-pylarix">PYLARIX</span>
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
              ExBOS (Excellence Business Operations System) is an intelligent business operations platform designed to help entrepreneurs understand their costs, manage daily operations, track real profit, and build businesses that survive and grow.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#218DFF]/15 text-[#1045CA] dark:text-[#9EDCFF] border border-[#218DFF]/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#218DFF]" />
                Don&apos;t Just Run Your Business. Understand It.
              </span>
            </div>
          </div>

          {/* 6 Business Architectures SEO Links */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-wider text-[#071544] dark:text-[#9EDCFF]">
              Business Architectures
            </h3>
            <ul className="space-y-2 text-sm list-none p-0 m-0">
              {SIX_ARCHITECTURES.map((arch) => (
                <li key={arch.id}>
                  <Link
                    to={`/business-models/${arch.slug}`}
                    className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] dark:hover:text-[#9EDCFF] no-underline transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-[11px] font-mono text-[#218DFF]">{arch.number}</span>
                    <span>{arch.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Financial Tools & Platform */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-wider text-[#071544] dark:text-[#9EDCFF]">
              Platform & Tools
            </h3>
            <ul className="space-y-2 text-sm list-none p-0 m-0">
              <li>
                <Link to="/features" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  Core BOS Features
                </Link>
              </li>
              <li>
                <Link to="/business-tools" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  Break-Even Calculator
                </Link>
              </li>
              <li>
                <Link to="/business-tools" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  6-Month Survival Planner
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  Subscription Plans (RWF)
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  Entrepreneur Guides & SEO Resources
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  About ExBOS & <span className="font-pylarix">PYLARIX</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspaces & Access */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-wider text-[#071544] dark:text-[#9EDCFF]">
              Workspaces
            </h3>
            <ul className="space-y-2 text-sm list-none p-0 m-0">
              <li>
                <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline flex items-center gap-1">
                  <span>Business Dashboard</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#218DFF]" />
                </Link>
              </li>
              <li>
                <Link to="/super-admin" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline flex items-center gap-1">
                  <span>Super Administrator</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#218DFF]" />
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  7-Step Guided Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-[#218DFF] no-underline">
                  Sign In to Workspace
                </Link>
              </li>
            </ul>
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-[#071544]/5 dark:bg-[#071544]/70 border border-[#218DFF]/25 text-xs text-slate-600 dark:text-[#9EDCFF]/85">
                <div className="font-pylarix font-bold text-[#1045CA] dark:text-[#9EDCFF] mb-1">
                  PYLARIX
                </div>
                We Create Solutions, Not Technology.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-blue-200/50 dark:border-[#9EDCFF]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} <strong className="font-pylarix text-[#071544] dark:text-white">PYLARIX</strong> · ExBOS (Excellence Business Operations System). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#218DFF]" />
              Argon2id &amp; Role-Isolated Security
            </span>
            <span className="flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-[#218DFF]" />
              English &amp; Kinyarwanda · RWF
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

