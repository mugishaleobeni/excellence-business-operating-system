import React, { useState } from 'react'
import {
  Palette,
  Save,
  RotateCcw,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  CreditCard,
  PenTool
} from 'lucide-react'
import { DEFAULT_DOCUMENT_TEMPLATE } from './documentUtils'

export default function DocumentTemplatesView({
  template = DEFAULT_DOCUMENT_TEMPLATE,
  onSaveTemplate,
  onResetTemplate
}) {
  const [formData, setFormData] = useState({ ...DEFAULT_DOCUMENT_TEMPLATE, ...template })
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSaveTemplate) {
      onSaveTemplate(formData)
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3500)
  }

  const handleReset = () => {
    setFormData(DEFAULT_DOCUMENT_TEMPLATE)
    if (onResetTemplate) {
      onResetTemplate()
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3500)
  }

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>✓ Document appearance template saved. Future invoices, receipts, and quotes will reflect these settings.</span>
        </div>
      )}

      {/* Header Info */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-orbitron text-sm font-bold text-white uppercase flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#218DFF]" />
            Document Appearance &amp; Brand Settings
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Customize header branding, tax identification, payment instructions, and official authorized signature
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Business Identity & Contact */}
          <div className="exbos-glass-card p-5 space-y-4">
            <h4 className="font-orbitron text-xs font-bold text-[#9EDCFF] uppercase tracking-wider flex items-center gap-2">
              <Building className="w-3.5 h-3.5" />
              Business Identity &amp; Tax Information
            </h4>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Business Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Tagline / Header Note
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    style={{ backgroundColor: '#071644', color: '#ffffff' }}
                    className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    style={{ backgroundColor: '#071644', color: '#ffffff' }}
                    className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Physical Address / Hub
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    style={{ backgroundColor: '#071644', color: '#ffffff' }}
                    className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Tax ID / TIN Number
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    style={{ backgroundColor: '#071644', color: '#ffffff' }}
                    className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Payment Instructions & Signatory */}
          <div className="exbos-glass-card p-5 space-y-4">
            <h4 className="font-orbitron text-xs font-bold text-[#9EDCFF] uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" />
              Payment Channels &amp; Authorized Signatory
            </h4>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Payment Instructions (Bank, MoMo, Airtel)
                </label>
                <textarea
                  rows={3}
                  value={formData.paymentInstructions}
                  onChange={(e) => handleChange('paymentInstructions', e.target.value)}
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full p-2.5 rounded-xl exbos-modal-input text-white font-mono text-[11px] leading-relaxed focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Authorized Signatory Name
                  </label>
                  <input
                    type="text"
                    value={formData.signatoryName}
                    onChange={(e) => handleChange('signatoryName', e.target.value)}
                    style={{ backgroundColor: '#071644', color: '#ffffff' }}
                    className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Signatory Role / Designation
                  </label>
                  <input
                    type="text"
                    value={formData.signatoryTitle}
                    onChange={(e) => handleChange('signatoryTitle', e.target.value)}
                    style={{ backgroundColor: '#071644', color: '#ffffff' }}
                    className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Document Footer Terms &amp; Conditions
                </label>
                <textarea
                  rows={2}
                  value={formData.footerNote}
                  onChange={(e) => handleChange('footerNote', e.target.value)}
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full p-2.5 rounded-xl exbos-modal-input text-white text-[11px] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-end">
          <button
            type="submit"
            className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Save className="w-4 h-4 text-[#9EDCFF]" />
            <span>Save Template Settings</span>
          </button>
        </div>
      </form>
    </div>
  )
}

