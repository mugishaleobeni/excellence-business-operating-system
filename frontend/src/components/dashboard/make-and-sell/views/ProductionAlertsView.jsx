import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Clock,
  Package,
  TrendingDown,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  RotateCcw,
  ShoppingCart,
  ArrowRight,
  Eye,
  Check,
  BellOff,
  Filter
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import ExportDrawer from '../ExportDrawer'
import { useExbos } from '../../../../context/ExbosContext'

export default function ProductionAlertsView({
  batches = [],
  recipes = [],
  rawMaterials = [],
  finishedGoods = [],
  onOpenBatch = null,
  onReorderMaterial = null,
  addToast = null
}) {
  const { user, demoWorkspaces } = useExbos?.() || {}
  const activeBizName = user?.businessName || demoWorkspaces?.['make-and-sell']?.businessName || 'ExBOS Make & Sell Enterprise'

  const [filterType, setFilterType] = useState('All') // 'All' | 'Shortage' | 'Late' | 'Yield' | 'Expiry'
  const [snoozedIds, setSnoozedIds] = useState(new Set())
  const [exportOpen, setExportOpen] = useState(false)

  // Generate dynamic alerts based on live data
  const rawAlerts = useMemo(() => {
    const list = []
    const now = new Date()

    // 1. Check raw materials stock vs minimumStockLevel & shortage blocking batches
    rawMaterials.forEach((mat) => {
      const stock = Number(mat.currentStock || mat.stock || 0)
      const minStock = Number(mat.minimumStockLevel || mat.minStock || 20)
      if (stock <= 0) {
        list.push({
          id: `alert-stockout-${mat.id}`,
          type: 'Shortage',
          severity: 'Critical',
          title: `Stockout: ${mat.name}`,
          description: `Zero stock remaining (${stock} ${mat.unit}). Production batches requiring ${mat.name} cannot be started.`,
          material: mat,
          actionLabel: 'Reorder Material',
          actionType: 'reorder',
          createdAt: 'Just now'
        })
      } else if (stock < minStock) {
        list.push({
          id: `alert-low-${mat.id}`,
          type: 'Shortage',
          severity: 'Warning',
          title: `Low Stock: ${mat.name}`,
          description: `Current stock of ${stock} ${mat.unit} is below the reorder threshold (${minStock} ${mat.unit}).`,
          material: mat,
          actionLabel: 'Reorder Material',
          actionType: 'reorder',
          createdAt: 'Today'
        })
      }

      // Check expiry within 30 days or expired
      if (mat.expiryDate) {
        const expDate = new Date(mat.expiryDate)
        const daysToExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24))
        if (daysToExpiry < 0) {
          list.push({
            id: `alert-matexp-${mat.id}`,
            type: 'Expiry',
            severity: 'Critical',
            title: `Expired Raw Material: ${mat.name}`,
            description: `Lot expired on ${mat.expiryDate} (${Math.abs(daysToExpiry)} days ago). Do not use in production.`,
            material: mat,
            actionLabel: 'Inspect Lot',
            actionType: 'inspect',
            createdAt: 'Urgent'
          })
        } else if (daysToExpiry <= 30) {
          list.push({
            id: `alert-matexpsoon-${mat.id}`,
            type: 'Expiry',
            severity: 'Warning',
            title: `Expiring Soon: ${mat.name}`,
            description: `Lot expires in ${daysToExpiry} days (${mat.expiryDate}). Prioritize in upcoming batches (FEFO).`,
            material: mat,
            actionLabel: 'Plan Batch',
            actionType: 'plan',
            createdAt: 'This Week'
          })
        }
      }
    })

    // 2. Check finished goods expiring within 30 days or expired
    finishedGoods.forEach((prod) => {
      const bestBefore = prod.bestBeforeDate || prod.expiryDate
      if (bestBefore) {
        const expDate = new Date(bestBefore)
        const daysToExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24))
        if (daysToExpiry < 0) {
          list.push({
            id: `alert-prodexp-${prod.id}`,
            type: 'Expiry',
            severity: 'Critical',
            title: `Expired Finished Goods: ${prod.name || prod.title}`,
            description: `Lot expired on ${bestBefore}. Remove from sales shelves immediately to protect quality.`,
            product: prod,
            actionLabel: 'Review Stock',
            actionType: 'inspect',
            createdAt: 'Urgent'
          })
        } else if (daysToExpiry <= 30) {
          list.push({
            id: `alert-prodexpsoon-${prod.id}`,
            type: 'Expiry',
            severity: 'Warning',
            title: `Expiring in ${daysToExpiry} Days: ${prod.name || prod.title}`,
            description: `Best-before date is ${bestBefore}. Push for immediate retail or supermarket delivery.`,
            product: prod,
            actionLabel: 'Sell Now',
            actionType: 'sell',
            createdAt: 'Upcoming'
          })
        }
      }
    })

    // 3. Batches running late or yield below recipe
    batches.forEach((b) => {
      if (b.status === 'In Progress' && b.targetCompletion) {
        const target = new Date(b.targetCompletion)
        if (target < now) {
          list.push({
            id: `alert-batchlate-${b.id}`,
            type: 'Late',
            severity: 'Warning',
            title: `Batch Running Late: ${b.batchCode || b.id}`,
            description: `${b.productName} was scheduled for completion by ${b.targetCompletion.slice(11, 16) || 'earlier today'}.`,
            batch: b,
            actionLabel: 'Open Batch',
            actionType: 'open_batch',
            createdAt: 'Delayed'
          })
        }
      }

      if (b.status === 'Completed' && b.actualYieldPct && b.actualYieldPct < 95) {
        list.push({
          id: `alert-yieldlow-${b.id}`,
          type: 'Yield',
          severity: 'Warning',
          title: `Yield Below Recipe: ${b.batchCode || b.id}`,
          description: `Batch produced ${b.actualYieldPct}% of planned yield (${b.scrapQuantity || 0} units scrap). Review recipe and oven temperature.`,
          batch: b,
          actionLabel: 'Review Batch',
          actionType: 'open_batch',
          createdAt: 'Completed'
        })
      }
    })

    return list
  }, [batches, recipes, rawMaterials, finishedGoods])

  // Filter out snoozed alerts
  const activeAlerts = useMemo(() => {
    return rawAlerts.filter((a) => !snoozedIds.has(a.id))
  }, [rawAlerts, snoozedIds])

  const filteredAlerts = useMemo(() => {
    if (filterType === 'All') return activeAlerts
    return activeAlerts.filter((a) => a.type === filterType)
  }, [activeAlerts, filterType])

  // Top summary strip
  const summary = useMemo(() => {
    const total = activeAlerts.length
    const critical = activeAlerts.filter((a) => a.severity === 'Critical').length
    const shortages = activeAlerts.filter((a) => a.type === 'Shortage').length
    return { total, critical, shortages }
  }, [activeAlerts])

  const handleSnooze = (alertId) => {
    setSnoozedIds((prev) => new Set([...prev, alertId]))
    if (addToast) {
      addToast({
        type: 'info',
        title: 'Alert Snoozed',
        message: 'Alert has been temporarily dismissed.'
      })
    }
  }

  const handleAction = (alert) => {
    if (alert.actionType === 'reorder' && onReorderMaterial) {
      onReorderMaterial(alert.material)
    } else if (alert.actionType === 'open_batch' && onOpenBatch) {
      onOpenBatch(alert.batch)
    } else if (addToast) {
      addToast({
        type: 'info',
        title: alert.title,
        message: 'Action initiated from Production Alerts.'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Help Line + Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Overview · 03 Production Alerts
            </span>
            {summary.critical > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                {summary.critical} Critical
              </span>
            )}
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Production Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Real-time notifications for late batches, ingredient shortages, yield variations, and upcoming expirations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
          >
            Export
          </button>
        </div>
      </div>

      {/* 3-Number Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
            Total Active Alerts
          </span>
          <div className="font-orbitron text-2xl font-bold text-white">{summary.total}</div>
          <span className="text-[11px] text-slate-400">Items requiring manager attention</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-rose-300/80 tracking-wider">
            Critical Severity
          </span>
          <div className="font-orbitron text-2xl font-bold text-rose-400">{summary.critical}</div>
          <span className="text-[11px] text-slate-400">Stockouts or expired lots</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-amber-300/80 tracking-wider">
            Material Shortages
          </span>
          <div className="font-orbitron text-2xl font-bold text-amber-400">{summary.shortages}</div>
          <span className="text-[11px] text-slate-400">Blocking production batches</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Shortage', 'Late', 'Yield', 'Expiry'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterType(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              filterType === tab
                ? 'bg-[#218DFF]/25 border-[#218DFF]/60 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'All' ? 'All Alerts' : tab}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-orbitron font-bold text-white">All Clear</h4>
            <p className="text-xs text-slate-400">
              No production alerts match the selected criteria. Raw material stocks and production schedules are healthy.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'Critical'
            return (
              <div
                key={alert.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCrit
                    ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCrit ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {alert.type === 'Shortage' && <Package className="w-5 h-5" />}
                    {alert.type === 'Late' && <Clock className="w-5 h-5" />}
                    {alert.type === 'Yield' && <TrendingDown className="w-5 h-5" />}
                    {alert.type === 'Expiry' && <AlertOctagon className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {alert.type}
                      </span>
                      <strong className="text-sm font-orbitron font-bold text-white truncate">
                        {alert.title}
                      </strong>
                    </div>
                    <p className="text-xs text-slate-300">{alert.description}</p>
                    <span className="text-[10px] text-slate-500 block">{alert.createdAt}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSnooze(alert.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs cursor-pointer border border-white/10"
                    title="Snooze Alert"
                  >
                    <BellOff className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(alert)}
                    className="btn-sapphire-clean px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>{alert.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9EDCFF]" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Export Drawer */}
      <ExportDrawer
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Production Alerts Report"
        pageTitle="Production Alerts"
        data={filteredAlerts.map((a) => ({
          Type: a.type,
          Severity: a.severity,
          Alert: a.title,
          Description: a.description
        }))}
        columns={[
          { key: 'Type', label: 'Alert Type' },
          { key: 'Severity', label: 'Severity' },
          { key: 'Alert', label: 'Title' },
          { key: 'Description', label: 'Description' }
        ]}
        businessName={activeBizName}
      />
    </div>
  )
}

