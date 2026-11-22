/**
 * RRA (Rwanda Revenue Authority) Tax Calculation & Deadline Utilities
 * Supports:
 * - Optional Opt-In / Opt-Out (rraEnabled: false keeps daily POS clean)
 * - VAT 18% (Inclusive 18/118 or Exclusive +18%)
 * - Small Taxpayer 3% Turnover Tax
 * - Optional 15% Withholding Tax estimator
 * - Next 15th-of-Month (VAT/PAYE/WHT) & Quarterly IQP deadline countdowns
 */

export const DEFAULT_RRA_TAX_PROFILE = {
  rraEnabled: false,
  tin: '',
  regime: 'turnover_3', // 'vat_18' | 'turnover_3' | 'exempt'
  priceMode: 'inclusive', // 'inclusive' | 'exclusive'
  filingFrequency: 'monthly', // 'monthly' | 'quarterly'
  trackEbmNumbers: true,
  showOnReceipts: true,
  trackWithholdingTax: false,
  accountantEmail: ''
}

export function computeVatSplit(amount, regime = 'turnover_3', priceMode = 'inclusive', taxCategory = 'standard') {
  const amt = Math.max(0, Number(amount || 0))
  const cat = String(taxCategory || 'standard').trim().toLowerCase()
  if (regime !== 'vat_18' || ['exempt', 'zero_rated', 'zero-rated', 'non_vat', 'b', 'c'].includes(cat)) {
    return { netAmount: Math.round(amt * 100) / 100, vatAmount: 0, totalAmount: Math.round(amt * 100) / 100 }
  }
  if (priceMode === 'exclusive') {
    const vat = Math.round(amt * 0.18 * 100) / 100
    return {
      netAmount: Math.round(amt * 100) / 100,
      vatAmount: vat,
      totalAmount: Math.round((amt + vat) * 100) / 100
    }
  }
  const vat = Math.round((amt * 18 / 118) * 100) / 100
  const net = Math.round((amt - vat) * 100) / 100
  return { netAmount: net, vatAmount: vat, totalAmount: Math.round(amt * 100) / 100 }
}

export function getNextRraDeadlines(baseDate = new Date()) {
  const y = baseDate.getFullYear()
  const m = baseDate.getMonth()
  const d = baseDate.getDate()

  const nextMonthly = d <= 15 ? new Date(y, m, 15) : new Date(y, m + 1, 15)
  const iqpDates = [
    new Date(y, 2, 31),
    new Date(y, 5, 30),
    new Date(y, 8, 30),
    new Date(y, 11, 31),
    new Date(y + 1, 2, 31)
  ]
  const todayMidnight = new Date(y, m, d)
  const nextIqp = iqpDates.find((dt) => dt >= todayMidnight) || iqpDates[iqpDates.length - 1]

  const diffDays = (target) => Math.max(0, Math.round((target - todayMidnight) / 86400000))

  return {
    nextMonthlyDeadline: nextMonthly.toISOString().slice(0, 10),
    daysUntilMonthly: diffDays(nextMonthly),
    nextIqpDeadline: nextIqp.toISOString().slice(0, 10),
    daysUntilIqp: diffDays(nextIqp)
  }
}

export function openPrintableRraTaxPack({ businessName, profile, period, totals, warnings = [] }) {
  const fmt = (n) => `${Math.round(Number(n || 0)).toLocaleString()} RWF`
  const regimeLabel =
    profile?.regime === 'vat_18'
      ? 'VAT Registered (18% Standard)'
      : profile?.regime === 'exempt'
      ? 'Exempt / Non-VAT'
      : 'Small Taxpayer (3% Turnover Tax)'

  const win = window.open('', '_blank', 'width=900,height=780')
  if (!win) return false

  const warningsHtml = warnings
    .map(
      (w) =>
        `<li style="margin-bottom:6px;color:${w.severity === 'warning' ? '#b45309' : w.severity === 'ok' ? '#047857' : '#1d4ed8'};">${w.message}</li>`
    )
    .join('')

  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ExBOS RRA Tax-Ready Summary — ${businessName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 32px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 800; color: #0f172a; }
    .sub { font-size: 12px; color: #475569; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; }
    .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .card-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 13px; }
    th { background: #f8fafc; font-weight: 700; }
    .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
    .highlight { background: #ecfdf5; font-weight: 800; }
    .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
    .sig-line { border-top: 1px solid #475569; padding-top: 8px; font-size: 12px; color: #475569; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${businessName || 'ExBOS Business'}</div>
      <div class="sub">RRA Tax-Ready Compliance &amp; Filing Summary Pack</div>
      <div class="sub" style="margin-top:4px;">Business TIN: <strong>${profile?.tin || 'Not Set'}</strong> &nbsp;|&nbsp; Regime: <strong>${regimeLabel}</strong></div>
    </div>
    <div style="text-align:right;">
      <div class="badge">ExBOS Audited Tax Pack</div>
      <div class="sub" style="margin-top:6px;">Period: <strong>${period?.startDate || ''}</strong> to <strong>${period?.endDate || ''}</strong></div>
      <div class="sub">Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Total Gross Sales (${totals?.salesCount || 0} transactions)</div>
      <div class="card-val">${fmt(totals?.totalGrossSales)}</div>
    </div>
    <div class="card">
      <div class="card-label">${profile?.regime === 'vat_18' ? 'Net VAT Payable / (Credit)' : 'Estimated 3% Turnover Tax'}</div>
      <div class="card-val" style="color:#0369a1;">${fmt(profile?.regime === 'vat_18' ? totals?.netVatPayable : totals?.turnoverTax3Percent)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>RRA Declaration Line Item</th><th class="num">Amount (RWF)</th></tr>
    </thead>
    <tbody>
      <tr><td>Total Gross Sales</td><td class="num">${fmt(totals?.totalGrossSales)}</td></tr>
      <tr><td>Taxable Sales (Net of VAT)</td><td class="num">${fmt(totals?.taxableSalesNet)}</td></tr>
      <tr><td>Exempt / Zero-Rated Sales</td><td class="num">${fmt(totals?.exemptSalesTotal)}</td></tr>
      <tr><td>Output VAT Collected (18%)</td><td class="num">${fmt(totals?.outputVat)}</td></tr>
      <tr><td>Claimable Input VAT (Valid Supplier TIN + EBM #)</td><td class="num">${fmt(totals?.claimableInputVat)}</td></tr>
      <tr><td>Non-Claimable Input VAT (Missing TIN or EBM #)</td><td class="num">${fmt(totals?.nonClaimableInputVat)}</td></tr>
      <tr class="highlight"><td>Net VAT Payable / (Credit Carry-Forward)</td><td class="num">${fmt(totals?.netVatPayable)}</td></tr>
      <tr><td>Estimated 3% Turnover Tax (Small Taxpayer Regime)</td><td class="num">${fmt(totals?.turnoverTax3Percent)}</td></tr>
      <tr><td>Estimated 15% Withholding Tax Base</td><td class="num">${fmt(totals?.estimatedWht15Percent)}</td></tr>
      <tr><td>Total Purchases &amp; Operating Expenses</td><td class="num">${fmt(totals?.totalPurchasesAndExpenses)}</td></tr>
      <tr class="highlight"><td>Estimated Net Operating Profit</td><td class="num">${fmt(totals?.estimatedNetProfit)}</td></tr>
    </tbody>
  </table>

  ${
    warningsHtml
      ? `<div style="margin-top:24px;"><div class="card-label" style="margin-bottom:8px;">Pre-Filing Readiness Checks</div><ul style="font-size:12px;padding-left:18px;">${warningsHtml}</ul></div>`
      : ''
  }

  <div class="sig">
    <div class="sig-line">Prepared By (Business Owner / Manager) &amp; Date</div>
    <div class="sig-line">Reviewed By (Accountant / Tax Representative) &amp; Stamp</div>
  </div>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`)
  win.document.close()
  return true
}

