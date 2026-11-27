import React from 'react'

const SIZE_CONFIG = {
  sm: {
    container: 'w-20 h-20',
    titleClass: 'text-sm font-medium',
    subtitleClass: 'text-xs leading-relaxed',
    spacing: 'space-y-2',
    maxWidth: 'max-w-48'
  },
  md: {
    container: 'w-32 h-32',
    titleClass: 'text-base font-medium',
    subtitleClass: 'text-sm leading-relaxed',
    spacing: 'space-y-2.5',
    maxWidth: 'max-w-60'
  },
  lg: {
    container: 'w-40 h-40',
    titleClass: 'text-lg font-semibold',
    subtitleClass: 'text-base leading-relaxed',
    spacing: 'space-y-3',
    maxWidth: 'max-w-64'
  }
}

export default function ExbosLoader({
  title = 'Loading ExBOS...',
  subtitle = 'Please wait while we prepare everything for you',
  size = 'md',
  className = '',
  ...props
}) {
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.md

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-7 p-8 select-none ${className}`}
      {...props}
    >
      <style>{`
        @keyframes exbosRingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes exbosRingSpinReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes exbosRingPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes exbosTextBreathe {
          0%, 100% { opacity: 0.92; }
          50% { opacity: 0.65; }
        }
        @keyframes exbosSubBreathe {
          0%, 100% { opacity: 0.68; }
          50% { opacity: 0.42; }
        }
      `}</style>

      {/* Multi-Ring Concentric ExBOS Sapphire Loader */}
      <div
        className={`relative ${config.container}`}
        style={{ animation: 'exbosRingPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      >
        {/* Outer elegant ring with sky shimmer */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, #9EDCFF 90deg, transparent 180deg)',
            mask: 'radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)',
            WebkitMask:
              'radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)',
            opacity: 0.85,
            animation: 'exbosRingSpin 3s linear infinite'
          }}
        />

        {/* Primary animated ring with ExBOS Sapphire gradient */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, #218DFF 120deg, rgba(16, 69, 202, 0.55) 240deg, transparent 360deg)',
            mask: 'radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)',
            WebkitMask:
              'radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)',
            opacity: 0.95,
            animation: 'exbosRingSpin 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />

        {/* Secondary elegant ring — counter rotation */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 180deg, transparent 0deg, rgba(158, 220, 255, 0.65) 45deg, transparent 90deg)',
            mask: 'radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)',
            WebkitMask:
              'radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)',
            opacity: 0.45,
            animation: 'exbosRingSpinReverse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />

        {/* Accent particle ring — ExBOS emerald highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 270deg, transparent 0deg, rgba(52, 211, 153, 0.7) 20deg, transparent 40deg)',
            mask: 'radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)',
            WebkitMask:
              'radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)',
            opacity: 0.65,
            animation: 'exbosRingSpin 3.5s linear infinite'
          }}
        />
      </div>

      {/* Typography with subtle breathing animation */}
      <div className={`text-center ${config.spacing} ${config.maxWidth}`}>
        <h1
          className={`${config.titleClass} text-[#EAF2FF] leading-[1.2] tracking-[-0.01em] antialiased`}
          style={{ animation: 'exbosTextBreathe 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={`${config.subtitleClass} text-[#9EDCFF]/70 tracking-[-0.01em] antialiased`}
            style={{ animation: 'exbosSubBreathe 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
