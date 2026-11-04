import React, { useState, useEffect } from 'react'
import { useExbos } from '../../context/ExbosContext'
import { formatRWF } from '../../utils/currencyWords'
import { printReportDocument } from '../../utils/printDocument'
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Mail,
  HardDrive,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Search,
  Send,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

const FOLDERS = [
  'Report Center',
  'Generated Reports',
  'Saved Documents',
  'Recent Documents',
  'Export History'
]

const FORMATS = [
  { ext: 'PDF', mime: '.pdf', desc: 'Professional reports & printing (Default)' },
  { ext: 'Excel', mime: '.xlsx', desc: 'Financial data & spreadsheet formulas' },
  { ext: 'Word', mime: '.docx', desc: 'Editable business reports' },
  { ext: 'CSV', mime: '.csv', desc: 'Raw data & accounting imports' }
]

export default function DocumentsAndIntegrationsPanel({
  mode = 'documents',
  activePage = 'Sales',
  activeArchId = 'buy-and-sell'
}) {
  const {
    user,
    hideFinancials,
    integrations,
    setIntegrations,
    exportHistory,
    setExportHistory,
    addTransaction
  } = useExbos()

  const [activeFolder, setActiveFolder] = useState('Report Center')
  const [selectedFormat, setSelectedFormat] = useState('PDF')
  const [selectedPeriod, setSelectedPeriod] = useState('October 2026')
  const [reportType, setReportType] = useState('Executive Profit, Cash & Survival Summary')
  const [searchDoc, setSearchDoc] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('partner@kigaliprime.rw')
  const [statusBanner, setStatusBanner] = useState(null)

  // Synchronize Report / Document Category with Active Subpage Selection
  useEffect(() => {
    if (mode === 'reports' && activePage) {
      const lower = activePage.toLowerCase()
      if (lower.includes('profit') || lower.includes('loss')) {
        setReportType('Executive Profit, Cash & Survival Summary')
      } else if (lower.includes('cash')) {
        setReportType('Where Is My Money? Balance & Debt Statement')
      } else if (lower.includes('stock') || lower.includes('material') || lower.includes('input')) {
        setReportType('Inventory Landed Cost & Dead Stock Report')
      } else if (lower.includes('feed') || lower.includes('animal') || lower.includes('crop')) {
        setReportType('Six-Month Farming Survival & Feed Forecast')
      } else if (lower.includes('debt') || lower.includes('balance') || lower.includes('owed')) {
        setReportType('Accounts Receivable & Customer Debt Schedule')
      } else if (lower.includes('sale')) {
        setReportType('Sales & Revenue Performance Statement')
      } else if (lower.includes('purchase')) {
        setReportType('Procurement & Vendor Invoices Summary')
      } else {
        setReportType(`${activePage} Performance & Audit Report`)
      }
    }
  }, [mode, activePage])

  // WhatsApp Interactive Simulator State
  const [waMessages, setWaMessages] = useState([
    {
      from: 'bot',
      text: 'EXCELLENCE BOS Official WhatsApp (+250 788 000 900): Linked to your business workspace. Send a sale/expense or request a report!'
    }
  ])
  const [waInput, setWaInput] = useState('')

  const triggerExportAction = (destination) => {
    const entry = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      title: `${reportType} (${selectedFormat})`,
      format: selectedFormat,
      period: selectedPeriod,
      destination,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: `Completed via ${destination}`
    }
    setExportHistory((prev) => [entry, ...prev])
    setStatusBanner(
      `✓ ${reportType} (${selectedFormat}) processed via ${destination} and logged in Export Audit History.`
    )
    setTimeout(() => setStatusBanner(null), 4500)

    if (destination === 'Browser Print') {
      printReportDocument({
        title: reportType,
        period: selectedPeriod,
        businessName: user?.businessName || 'Kigali Prime Hardware',
        summaryCards: [
          { title: 'Spendable Money', value: formatRWF(5070000, hideFinancials) },
          { title: 'Stock on Shelf', value: formatRWF(4380000, hideFinancials) },
          { title: 'Customer Debts', value: formatRWF(780000, hideFinancials) },
          { title: '6-Month Reserve', value: formatRWF(5100000, hideFinancials) }
        ],
        columns: [
          { header: 'Ledger Category', key: 'category' },
          { header: 'Item / Transaction', key: 'item' },
          { header: 'Amount (RWF)', key: 'amount' },
          { header: 'Verification Status', key: 'status' }
        ],
        rows: [
          { category: 'Cash & Bank', item: 'Operating Float (Cash + MoMo + Bank)', amount: '5,070,000 RWF', status: 'Reconciled' },
          { category: 'Inventory', item: 'Stock on Shelf & Warehouse Balance', amount: '4,380,000 RWF', status: 'Audited' },
          { category: 'Receivables', item: 'Active Customer Debts Receivable', amount: '780,000 RWF', status: 'Current' },
          { category: 'Payables', item: 'Supplier Accounts Payable', amount: '350,000 RWF', status: 'Scheduled' }
        ]
      })
    } else if (destination === 'Direct Download') {
      const content = `EXCELLENCE BOS REPORT\nTitle: ${reportType}\nPeriod: ${selectedPeriod}\nFormat: ${selectedFormat}\nBusiness: ${user?.businessName || 'Kigali Prime Hardware'}\nGenerated: ${entry.timestamp}\nNet Spendable Money: 4,820,000 RWF\nSix-Month Survival Reserve: 5,100,000 RWF\n`
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ExBOS_${reportType.replace(/\s+/g, '_')}.${selectedFormat.toLowerCase()}`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleWhatsAppSend = (e) => {
    e.preventDefault()
    if (!waInput.trim()) return
    const msg = waInput.trim()
    const next = [...waMessages, { from: 'owner', text: msg }]
    const lower = msg.toLowerCase()

    if (lower.includes('export') || lower.includes('drive')) {
      next.push({
        from: 'bot',
        text: `Verified business identity. Exporting "${reportType}" (${selectedFormat}) directly to Google Drive folder "${integrations.googleDrive.folderName}".`
      })
      triggerExportAction('Google Drive via WhatsApp')
    } else if (lower.includes('sold') || lower.includes('sale')) {
      addTransaction({
        title: `WhatsApp Recorded: ${msg}`,
        type: 'in',
        category: 'Sales Revenue',
        amountRWF: 120000,
        source: 'WhatsApp'
      })
      next.push({
        from: 'bot',
        text: '✓ Sale of 120,000 RWF recorded to your Dashboard & Cash Ledger with source tag: WhatsApp.'
      })
    } else {
      next.push({
        from: 'bot',
        text: 'Summary: Today Money In: +750,000 RWF | Money Out: −368,000 RWF | Spendable Cash + MoMo + Bank: 4,820,000 RWF. PDF report attached.'
      })
    }
    setWaMessages(next)
    setWaInput('')
  }

  return (
    <div className="space-y-6">
      {statusBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* Document Explorer & Live Print-Ready Preview */}
      {mode === 'documents' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Folder Explorer */}
        <div className="lg:col-span-4 liquid-glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-orbitron text-sm font-bold text-[#071544] dark:text-white uppercase">
              Document &amp; Report Explorer
            </h3>
            <Folder className="w-4 h-4 text-[#218DFF]" />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              placeholder="Search reports & exports..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 dark:bg-[#071544]/80 border border-blue-200 dark:border-[#9EDCFF]/25 text-xs text-[#071544] dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            {FOLDERS.map((folder) => {
              const active = activeFolder === folder
              return (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setActiveFolder(folder)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-all border ${
                    active
                      ? 'bg-[#218DFF]/20 border-[#218DFF] text-[#1045CA] dark:text-[#9EDCFF]'
                      : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#218DFF]" />
                    <span>{folder}</span>
                  </span>
                  <span className="text-[10px] opacity-70">
                    {folder === 'Export History' ? exportHistory.length : '4'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Format Selector (PDF, XLSX, DOCX, CSV) */}
          <div className="pt-3 border-t border-blue-200/50 dark:border-[#9EDCFF]/15 space-y-2">
            <div className="text-xs font-orbitron uppercase text-slate-500 dark:text-[#9EDCFF]/80">
              Select Export Format (Section 7.2)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.ext}
                  type="button"
                  onClick={() => setSelectedFormat(f.ext)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedFormat === f.ext
                      ? 'bg-[#1045CA] text-white border-[#9EDCFF] shadow-sapphire-glow'
                      : 'bg-white/70 dark:bg-[#071544]/60 border-blue-200 dark:border-[#9EDCFF]/20 text-[#071544] dark:text-white'
                  }`}
                >
                  <div className="font-orbitron text-xs font-bold">
                    {f.ext} <span className="opacity-75 font-mono">{f.mime}</span>
                  </div>
                  <div className="text-[10px] opacity-80 line-clamp-1">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Document Preview & Multi-Channel Export Toolbar */}
        <div className="lg:col-span-8 liquid-glass rounded-3xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-[#218DFF]/20 border border-[#218DFF]/40 text-[#1045CA] dark:text-[#9EDCFF] text-xs font-orbitron font-bold">
                {activePage}
              </span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-semibold text-[#071544] dark:text-white"
              >
                <option>Executive Profit, Cash &amp; Survival Summary</option>
                <option>Where Is My Money? Balance &amp; Debt Statement</option>
                <option>Inventory Landed Cost &amp; Dead Stock Report</option>
                <option>Six-Month Farming Survival &amp; Feed Forecast</option>
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs font-semibold text-[#071544] dark:text-white"
              >
                <option>October 2026</option>
                <option>Q4 2026</option>
                <option>Nov 2026 – Apr 2027 (6-Month Forecast)</option>
              </select>
            </div>

            {/* Action Toolbar: Download, Print, Gmail, Google Drive, WhatsApp */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => triggerExportAction('Direct Download')}
                className="btn-sapphire px-3.5 py-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {selectedFormat}</span>
              </button>
              <button
                type="button"
                onClick={() => triggerExportAction('Browser Print')}
                className="px-3 py-2 rounded-xl bg-white/80 dark:bg-[#071544] border border-[#218DFF]/40 text-xs font-semibold text-[#071544] dark:text-[#9EDCFF] cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => triggerExportAction(`Gmail (${recipientEmail})`)}
                className="px-3 py-2 rounded-xl bg-white/80 dark:bg-[#071544] border border-[#218DFF]/40 text-xs font-semibold text-[#071544] dark:text-[#9EDCFF] cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Send Gmail</span>
              </button>
              <button
                type="button"
                onClick={() => triggerExportAction(`Google Drive (${integrations.googleDrive.folderName})`)}
                className="px-3 py-2 rounded-xl bg-white/80 dark:bg-[#071544] border border-[#218DFF]/40 text-xs font-semibold text-[#071544] dark:text-[#9EDCFF] cursor-pointer flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Google Drive</span>
              </button>
            </div>
          </div>

          {/* Print-Ready Document Preview Sheet */}
          <div className="p-6 rounded-2xl bg-white text-[#071544] border border-blue-200 shadow-inner space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="font-orbitron font-black text-lg text-[#071544]">
                  EXCELLENCE <span className="text-[#218DFF]">BOS</span> · OFFICIAL BUSINESS REPORT
                </div>
                <div className="text-xs text-slate-500">
                  Business: <strong>{user?.businessName || 'Kigali Prime Hardware & Mart'}</strong> · Currency: RWF
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Format: <strong>{selectedFormat}</strong></div>
                <div>Period: <strong>{selectedPeriod}</strong></div>
                <div>Generated: 2026-10-30</div>
              </div>
            </div>

            <div>
              <h4 className="font-orbitron text-base font-bold text-[#071544]">{reportType}</h4>
              <p className="text-xs text-slate-600 mt-1">
                Verified operational and financial summary generated by ExBOS (<span className="font-pylarix font-bold">PYLARIX</span>).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Spendable Money</span>
                <strong className="font-orbitron text-sm text-[#071544]">
                  {formatRWF(5070000, hideFinancials)}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Stock on Shelf</span>
                <strong className="font-orbitron text-sm text-[#1045CA]">
                  {formatRWF(4380000, hideFinancials)}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Customer Debts</span>
                <strong className="font-orbitron text-sm text-amber-600">
                  {formatRWF(780000, hideFinancials)}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">6-Month Reserve</span>
                <strong className="font-orbitron text-sm text-emerald-600">
                  {formatRWF(5100000, hideFinancials)}
                </strong>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 flex justify-between">
              <span>Authenticated via EXCELLENCE BOS Security</span>
              <span>Developed by <span className="font-pylarix font-bold">PYLARIX</span> — We Create Solutions, Not Technology.</span>
            </div>
          </div>

          {/* Export Audit History Table */}
          <div className="space-y-2">
            <div className="text-xs font-orbitron uppercase text-slate-500 dark:text-[#9EDCFF]/80">
              Recent Export &amp; Delivery Audit Log
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {exportHistory
                .filter((e) =>
                  `${e.title} ${e.destination}`.toLowerCase().includes(searchDoc.toLowerCase())
                )
                .map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-white/70 dark:bg-[#03091F]/65 border border-blue-200/50 dark:border-[#9EDCFF]/15 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-[#071544] dark:text-white">{exp.title}</strong>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {exp.destination} · {exp.timestamp}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold text-[11px]">
                      {exp.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SECTION 7.1: EXTERNAL INTEGRATIONS (GMAIL, GOOGLE DRIVE, EXCELLENCE BOS WHATSAPP) */}
      {mode === 'integrations' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Gmail Integration */}
        <div className="sapphire-analytics-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#218DFF]/20 flex items-center justify-center text-[#218DFF]">
              <Mail className="w-5 h-5" />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-orbitron font-bold ${
                integrations.gmail.connected
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              {integrations.gmail.connected ? 'Google OAuth 2.0 Active' : 'Disconnected'}
            </span>
          </div>
          <div>
            <h3 className="font-orbitron text-base font-bold text-[#071544] dark:text-white">
              Gmail Integration
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Send invoices, receipts, and financial reports directly via connected Gmail ({integrations.gmail.email}).
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
              Recipient Email for Reports
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => triggerExportAction(`Gmail (${recipientEmail})`)}
              className="btn-sapphire px-4 py-2 text-xs"
            >
              Email Current Report
            </button>
            <button
              type="button"
              onClick={() =>
                setIntegrations((prev) => ({
                  ...prev,
                  gmail: { ...prev.gmail, connected: !prev.gmail.connected }
                }))
              }
              className="text-xs font-semibold text-rose-400 hover:underline bg-transparent border-0 cursor-pointer"
            >
              {integrations.gmail.connected ? 'Revoke OAuth' : 'Connect Gmail'}
            </button>
          </div>
        </div>

        {/* B. Google Drive Integration */}
        <div className="sapphire-analytics-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#218DFF]/20 flex items-center justify-center text-[#218DFF]">
              <HardDrive className="w-5 h-5" />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-orbitron font-bold ${
                integrations.googleDrive.connected
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              {integrations.googleDrive.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div>
            <h3 className="font-orbitron text-base font-bold text-[#071544] dark:text-white">
              Google Drive Export Vault
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Destination folder: <strong>{integrations.googleDrive.folderName}</strong>. Saves PDF, XLSX, DOCX &amp; CSV reports with encrypted OAuth tokens.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() =>
                triggerExportAction(`Google Drive (${integrations.googleDrive.folderName})`)
              }
              className="btn-sapphire px-4 py-2 text-xs"
            >
              Export to Google Drive
            </button>
            <button
              type="button"
              onClick={() =>
                setIntegrations((prev) => ({
                  ...prev,
                  googleDrive: {
                    ...prev.googleDrive,
                    connected: !prev.googleDrive.connected
                  }
                }))
              }
              className="text-xs font-semibold text-rose-400 hover:underline bg-transparent border-0 cursor-pointer"
            >
              {integrations.googleDrive.connected ? 'Revoke Access' : 'Connect Drive'}
            </button>
          </div>
        </div>

        {/* C. EXCELLENCE BOS Official WhatsApp Integration */}
        <div className="sapphire-analytics-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-orbitron font-bold">
              Official ExBOS Number Linked
            </span>
          </div>
          <div>
            <h3 className="font-orbitron text-base font-bold text-[#071544] dark:text-white">
              EXCELLENCE BOS WhatsApp
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Linked Phone: <strong>{integrations.whatsapp.linkedBusinessPhone}</strong> (No Meta developer app required by customer).
            </p>
          </div>

          <div className="max-h-28 overflow-y-auto space-y-1.5 p-2.5 rounded-xl bg-white/70 dark:bg-[#03091F]/70 border border-[#9EDCFF]/20 text-[11px]">
            {waMessages.map((m, i) => (
              <div
                key={i}
                className={
                  m.from === 'bot'
                    ? 'text-[#071544] dark:text-[#9EDCFF]'
                    : 'text-emerald-600 dark:text-emerald-300 font-semibold text-right'
                }
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleWhatsAppSend} className="flex gap-1.5">
            <input
              type="text"
              value={waInput}
              onChange={(e) => setWaInput(e.target.value)}
              placeholder='Try: "Sold items 120,000" or "Export Drive"'
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs text-[#071544] dark:text-white"
            />
            <button type="submit" className="btn-sapphire px-3 py-2 text-xs">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
      )}
    </div>
  )
}

