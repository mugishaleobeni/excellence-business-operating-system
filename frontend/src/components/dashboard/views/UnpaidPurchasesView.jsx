import React, { useMemo } from "react";
import { Truck, CheckCircle2, Receipt, Plus, Phone, MapPin, CreditCard } from "lucide-react";
import { formatRWF } from "../../../utils/currencyWords";

export default function UnpaidPurchasesView({
  currentArch,
  purchases,
  hideFinancials,
  formatRWF,
  onRecordPurchase,
  onPayBalance
}) {
  // Filter strictly to purchases that have remaining unpaid balance
  const unpaidList = useMemo(() => {
    return (purchases || []).filter((p) => {
      const remaining = Number(p.remainingAmountRWF)
      if (!isNaN(remaining) && remaining > 0) return true
      const statusLower = String(p.status || '').toLowerCase()
      if (statusLower.includes('paid in full')) return false
      if (
        statusLower.includes('unpaid') ||
        statusLower.includes('credit') ||
        statusLower.includes('part-paid') ||
        statusLower.includes('owed') ||
        statusLower.includes('due') ||
        statusLower.includes('balance')
      ) return true
      return !statusLower.includes('paid')
    }).map((p) => {
      const total = Number(p.amountRWF) || 0
      const paid = Number(p.paidAmountRWF) ?? (p.status?.toLowerCase().includes('paid in full') ? total : 0)
      const remaining = Number(p.remainingAmountRWF) ?? Math.max(0, total - paid)
      return {
        ...p,
        totalAmountRWF: total,
        paidAmountRWF: paid,
        remainingAmountRWF: remaining
      }
    })
  }, [purchases])

  const totalOwedRemaining = unpaidList.reduce((acc, p) => acc + (p.remainingAmountRWF || 0), 0)
  const totalPaidSoFar = unpaidList.reduce((acc, p) => acc + (p.paidAmountRWF || 0), 0)
  const totalInvoicesValue = unpaidList.reduce((acc, p) => acc + (p.totalAmountRWF || 0), 0)

  return (
    <div className="space-y-6">
      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Remaining Debt to Pay */}
        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Remaining Amount to Pay</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
              Accounts Payable
            </span>
          </div>
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-amber-300 pt-2">
            {formatRWF(totalOwedRemaining, hideFinancials)}
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Outstanding Supplier Debt</span>
            <span className="text-amber-400 font-bold">{unpaidList.length} Invoices</span>
          </div>
        </div>

        {/* 2. Amount Already Paid */}
        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paid Portion on Invoices</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
              Disbursed
            </span>
          </div>
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white pt-2">
            {formatRWF(totalPaidSoFar, hideFinancials)}
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Disbursed to suppliers</span>
            <span className="text-emerald-400 font-bold">
              {totalInvoicesValue > 0 ? Math.round((totalPaidSoFar / totalInvoicesValue) * 100) : 0}% Paid
            </span>
          </div>
        </div>

        {/* 3. Total Invoice Value */}
        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Total Invoices Value</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[10px] font-bold text-[#9EDCFF]">
              Gross Bill
            </span>
          </div>
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white pt-2">
            {formatRWF(totalInvoicesValue, hideFinancials)}
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Total credit orders</span>
            <button
              type="button"
              onClick={onRecordPurchase}
              className="text-[#9EDCFF] hover:text-white font-bold cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0"
            >
              <span>+ New Purchase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="exbos-glass-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-orbitron font-bold text-amber-300 uppercase tracking-wider">
                Accounts Payable Ledger
              </span>
              <span className="text-xs text-slate-300">
                {currentArch.number} · {currentArch.name} · Purchases (Unpaid Purchases)
              </span>
            </div>
            <h3 className="font-orbitron text-lg sm:text-xl font-extrabold text-white mt-1">
              Unpaid Purchases &amp; Supplier Balances
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Displaying all purchases with outstanding supplier debt, showing paid amounts and exact remaining balances owed.
            </p>
          </div>
          <button
            type="button"
            onClick={onRecordPurchase}
            className="btn-sapphire-clean px-4 py-2 text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New purchase</span>
          </button>
        </div>

        {unpaidList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-semibold text-white">All Purchases Are Paid in Full!</p>
            <p className="text-slate-400">You have zero outstanding debt to any supplier right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Supplier &amp; Location</th>
                  <th className="py-3 px-3">Purchased Items</th>
                  <th className="py-3 px-3 text-right">Total Invoice</th>
                  <th className="py-3 px-3 text-right">Paid Amount</th>
                  <th className="py-3 px-3 text-right">Remaining to Pay</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {unpaidList.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {p.date || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">
                        {p.supplierName || p.supplier || 'Vendor'}
                      </div>
                      {(p.supplierPhone || p.supplierLocation) && (
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {p.supplierPhone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5 text-[#218DFF]" />
                              <span>{p.supplierPhone}</span>
                            </span>
                          )}
                          {p.supplierLocation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-500" />
                              <span>{p.supplierLocation}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-200">
                        {p.productTitle || p.title}
                      </span>
                      {p.quantity && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {p.quantity} {p.unit || 'units'} @ {formatRWF(p.unitCostRWF || 0)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-orbitron font-bold text-white">
                      {formatRWF(p.totalAmountRWF, hideFinancials)}
                    </td>
                    <td className="py-3 px-3 text-right font-orbitron font-bold text-emerald-400">
                      {formatRWF(p.paidAmountRWF, hideFinancials)}
                    </td>
                    <td className="py-3 px-3 text-right font-orbitron font-extrabold text-amber-300">
                      {formatRWF(p.remainingAmountRWF, hideFinancials)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {p.remainingAmountRWF > 0 ? `Unpaid · ${formatRWF(p.remainingAmountRWF)} Owed` : 'Paid in Full'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onPayBalance(p)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-[11px] font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-all"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Pay Balance</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Purchase Returns View (Select Products to Return, Partial/Full Qty & Refunds)
// -----------------------------------------------------------------------------
