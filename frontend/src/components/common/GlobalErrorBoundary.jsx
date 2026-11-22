import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { reportSystemError } from '../../utils/errorReporter'

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected UI error occurred.'
    }
  }

  componentDidCatch(error, info) {
    reportSystemError({
      source: 'react-boundary',
      message: error?.message || 'React render crash',
      stack: `${error?.stack || ''}\n${info?.componentStack || ''}`
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#03091F] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl bg-[#071544] border border-rose-400/40 p-8 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h1 className="font-orbitron text-xl font-extrabold">
              Something went wrong
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              This issue has been <strong>automatically reported to the ExBOS Super Admin</strong> for immediate review.
            </p>
            {this.state.errorMessage && (
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-[11px] font-mono text-rose-300 break-words">
                {this.state.errorMessage}
              </div>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white text-xs font-bold cursor-pointer transition"
            >
              <RefreshCw className="w-4 h-4" /> Reload ExBOS
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

