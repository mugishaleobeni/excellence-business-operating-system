import React from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { ORIGIN_OPTIONS, PAYMENT_METHODS, PAYMENT_STATUSES } from './animalConstants'
import { formatRWF } from '../../../utils/currencyWords'
import CustomSelect from '../../common/CustomSelect'

export default function PurchaseOriginSection({
  registrationMode,
  origin,
  setOrigin,
  groupQuantity,
  unitPrice,
  setUnitPrice,
  purchasePrice,
  setPurchasePrice,
  purchaseDate,
  setPurchaseDate,
  sellerName,
  setSellerName,
  sellerPhone,
  setSellerPhone,
  sellerLocation,
  setSellerLocation,
  existingSuppliers = [],
  handleSelectSupplier,
  paymentMethod,
  setPaymentMethod,
  paymentStatus,
  handlePaymentStatusChange,
  amountPaid,
  setAmountPaid,
  calculatedRemainingBalance,
  onBack,
  onContinue
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
          Animal Origin / Acquisition Method *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ORIGIN_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setOrigin(opt)}
              className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                origin === opt
                  ? 'bg-[#218DFF] border-white/40 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* WHEN PURCHASED IS SELECTED */}
      {origin === 'Purchased' ? (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-orbitron font-bold text-emerald-400">
              Purchase Financial Details
            </span>
            <span className="text-[11px] text-slate-400">
              Currency: <strong>RWF</strong>
            </span>
          </div>

          {/* Group vs Individual Price Calculation */}
          {registrationMode === 'group' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#03091F]/70 border border-emerald-500/20">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-300">
                  Quantity
                </label>
                <div className="font-orbitron text-base font-bold text-white px-2 py-1">
                  {groupQuantity || 0} animals
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-[#9EDCFF]">
                  Unit Price (RWF per animal) *
                </label>
                <input
                  type="number"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="2500"
                  className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-emerald-400">
                  Total Purchase Cost (Auto-Calculated)
                </label>
                <div className="font-orbitron text-base font-extrabold text-emerald-300 px-2 py-1">
                  {formatRWF((Number(groupQuantity) || 0) * (Number(unitPrice) || 0))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Purchase Price (RWF) *
                </label>
                <input
                  type="number"
                  required
                  value={purchasePrice}
                  onChange={(e) => {
                    setPurchasePrice(e.target.value)
                    if (paymentStatus === 'Paid') {
                      setAmountPaid(e.target.value)
                    }
                  }}
                  placeholder="250000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Seller Details with Existing Supplier Auto-fill */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Seller / Vendor Name *
                </label>
              </div>
              <input
                type="text"
                required
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="e.g. John Habimana, Bugesera Farm"
                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
              />
              {existingSuppliers.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[10px] text-slate-400">From Suppliers:</span>
                  {existingSuppliers.slice(0, 3).map((sup) => (
                    <button
                      key={sup.id || sup.title}
                      type="button"
                      onClick={() => handleSelectSupplier(sup.title || sup.supplierName)}
                      className="text-[10px] text-[#9EDCFF] hover:underline"
                    >
                      {sup.title || sup.supplierName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Seller Phone Number
              </label>
              <input
                type="tel"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="078XXXXXXX"
                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Seller Location
              </label>
              <input
                type="text"
                value={sellerLocation}
                onChange={(e) => setSellerLocation(e.target.value)}
                placeholder="e.g. Bugesera, Eastern Province"
                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Reconciliation Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Payment Method
              </label>
              <CustomSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={PAYMENT_METHODS}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-bold text-white focus:outline-none"
              >
                {PAYMENT_STATUSES.map((ps) => (
                  <option key={ps} value={ps}>{ps}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Amount Paid (RWF)
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="250000"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-amber-300">
                Remaining Balance
              </label>
              <div className="font-orbitron text-xs sm:text-sm font-extrabold text-amber-400 py-2">
                {formatRWF(calculatedRemainingBalance)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* BORN ON FARM OR GIFT / TRANSFER: NO PURCHASE PRICE REQUIRED */
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{origin} · No purchase price or seller invoice required</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This animal was {origin.toLowerCase()}. It will be added to your farm stock and valuation asset ledger without generating any debt or paid expense invoice.
          </p>
        </div>
      )}

      {/* Navigation hints */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <span>Continue to Breeding Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

