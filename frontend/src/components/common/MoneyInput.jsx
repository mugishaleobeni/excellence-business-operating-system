import React from 'react'
import { formatWithCommas, parseNumericInput, amountToWords } from '../../utils/currencyWords'
import { Coins } from 'lucide-react'

export default function MoneyInput({
  label,
  value,
  onChange,
  placeholder = '0',
  currency = 'RWF',
  language = 'en',
  helperText,
  id,
  required = false,
  className = '',
}) {
  const numericValue = parseNumericInput(value)
  const displayValue = value === '' || value === null || value === undefined ? '' : formatWithCommas(numericValue)
  const words = numericValue > 0 ? amountToWords(numericValue, language) : ''

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      onChange('')
      return
    }
    onChange(Number(raw))
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/80 leading-normal">
          {label} {required && <span className="text-[#218DFF]">*</span>}
        </label>
      )}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#218DFF]">
          <Coins className="w-4 h-4" />
        </div>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-white/85 dark:bg-[#071544]/80 border border-blue-200/80 dark:border-[#9EDCFF]/25 text-[#071544] dark:text-white font-mono tabular-nums font-semibold text-sm tracking-tight focus:outline-none focus:border-[#218DFF] focus:ring-2 focus:ring-[#218DFF]/40 transition-all duration-150 shadow-inner"
        />
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#218DFF]/15 text-[#1045CA] dark:text-[#9EDCFF]">
            {currency}
          </span>
        </div>
      </div>
      {words ? (
        <p className="text-xs font-medium text-[#1045CA] dark:text-[#9EDCFF] italic pl-1 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#218DFF] shrink-0" />
          <span>{words}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">{helperText}</p>
      ) : null}
    </div>
  )
}

