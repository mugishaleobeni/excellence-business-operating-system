import React from 'react'

export default function CountryFlag({ lang = 'en', className = 'w-5 h-3.5 rounded-sm shadow-sm shrink-0' }) {
  if (lang === 'rw') {
    // Official Flag of Rwanda (Blue top half with golden sun, Yellow middle stripe, Green bottom stripe)
    return (
      <svg
        viewBox="0 0 36 24"
        className={className}
        aria-label="Rwanda Flag"
        role="img"
      >
        <rect width="36" height="12" y="0" fill="#00A1DE" />
        <rect width="36" height="6" y="12" fill="#FAD201" />
        <rect width="36" height="6" y="18" fill="#20603D" />
        {/* Golden Sun in upper right */}
        <circle cx="28" cy="6" r="2.6" fill="#FAD201" />
        <circle cx="28" cy="6" r="3.6" fill="none" stroke="#FAD201" strokeWidth="0.7" strokeDasharray="1.1 0.9" />
      </svg>
    )
  }

  // Official Flag of the United States (American Flag for English)
  return (
    <svg
      viewBox="0 0 36 24"
      className={className}
      aria-label="United States Flag"
      role="img"
    >
      <rect width="36" height="24" fill="#FFFFFF" />
      {/* Red Stripes */}
      <rect width="36" height="1.85" y="0" fill="#B22234" />
      <rect width="36" height="1.85" y="3.7" fill="#B22234" />
      <rect width="36" height="1.85" y="7.4" fill="#B22234" />
      <rect width="36" height="1.85" y="11.1" fill="#B22234" />
      <rect width="36" height="1.85" y="14.8" fill="#B22234" />
      <rect width="36" height="1.85" y="18.5" fill="#B22234" />
      <rect width="36" height="1.85" y="22.15" fill="#B22234" />
      {/* Blue Canton */}
      <rect width="15.5" height="12.95" x="0" y="0" fill="#3C3B6E" />
      {/* Stars Grid */}
      <g fill="#FFFFFF">
        <circle cx="2.5" cy="2.2" r="0.65" />
        <circle cx="5.5" cy="2.2" r="0.65" />
        <circle cx="8.5" cy="2.2" r="0.65" />
        <circle cx="11.5" cy="2.2" r="0.65" />
        <circle cx="13.8" cy="2.2" r="0.65" />
        <circle cx="4" cy="4.4" r="0.65" />
        <circle cx="7" cy="4.4" r="0.65" />
        <circle cx="10" cy="4.4" r="0.65" />
        <circle cx="12.8" cy="4.4" r="0.65" />
        <circle cx="2.5" cy="6.6" r="0.65" />
        <circle cx="5.5" cy="6.6" r="0.65" />
        <circle cx="8.5" cy="6.6" r="0.65" />
        <circle cx="11.5" cy="6.6" r="0.65" />
        <circle cx="13.8" cy="6.6" r="0.65" />
        <circle cx="4" cy="8.8" r="0.65" />
        <circle cx="7" cy="8.8" r="0.65" />
        <circle cx="10" cy="8.8" r="0.65" />
        <circle cx="12.8" cy="8.8" r="0.65" />
        <circle cx="2.5" cy="10.8" r="0.65" />
        <circle cx="5.5" cy="10.8" r="0.65" />
        <circle cx="8.5" cy="10.8" r="0.65" />
        <circle cx="11.5" cy="10.8" r="0.65" />
        <circle cx="13.8" cy="10.8" r="0.65" />
      </g>
    </svg>
  )
}

