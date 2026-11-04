import React, { useState, useMemo } from 'react'
import { useExbos } from '../../context/ExbosContext'
import { formatRWF } from '../../utils/currencyWords'
import { CheckCircle2 } from 'lucide-react'

// Import the 7 modular Report Views
import SalesReportView from './reports/SalesReportView'
import StockReportView from './reports/StockReportView'
import PurchasesReportView from './reports/PurchasesReportView'
import ProfitLossReportView from './reports/ProfitLossReportView'
import CashMovementReportView from './reports/CashMovementReportView'
import CustomerDebtsReportView from './reports/CustomerDebtsReportView'
import SupplierDebtsReportView from './reports/SupplierDebtsReportView'
import ProductionReportView from './reports/ProductionReportView'
import ExportDrawer from './make-and-sell/ExportDrawer'

export default function UniversalReportPanel({
  activePage = 'Sales Report',
  activeArchId = 'buy-and-sell',
  currentArch = null
}) {
  const {
    user,
    hideFinancials,
    transactions = [],
    addTransaction,
    demoWorkspaces = {},
    updateDemoRecord
  } = useExbos()

  const [toastMessage, setToastMessage] = useState('')
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Active workspace records
  const workspace = demoWorkspaces?.[activeArchId] || {}
  const records = workspace.records || {}
  const inventoryList = records['Inventory'] || records['Products'] || records['Ingredients & Stock'] || []
  const salesList = records['Sales'] || []
  const purchasesList = records['Purchases'] || []
  const expensesList = records['Expenses'] || []
  const customersList = records['Customers'] || []
  const suppliersList = records['Suppliers'] || []

  // Filter transactions for this architecture
  const archTransactions = useMemo(() => {
    return (transactions || []).filter(
      (tx) => (tx.architectureId || 'buy-and-sell') === activeArchId
    )
  }, [transactions, activeArchId])

  // Handle Customer Debt Repayment
  const handleRecordCustomerPayment = ({ record, amount, method, notes }) => {
    const custName = record.customerName || record.customer || record.name || 'Customer'
    const currentDebt = Number(record.balanceOwedRWF ?? record.amountRWF ?? record.outstanding ?? 0)
    const newDebt = Math.max(0, currentDebt - amount)

    // 1. Update customer record
    if (record.id && updateDemoRecord) {
      updateDemoRecord(activeArchId, 'Customers', record.id, {
        balanceOwedRWF: newDebt,
        amountRWF: newDebt,
        status: newDebt === 0 ? 'Paid' : 'Partial'
      })
    }

    // 2. Dispatch cash ledger transaction (Operating Inflow)
    if (addTransaction) {
      addTransaction(activeArchId, {
        title: `Customer Debt Collection: ${custName}`,
        type: 'in',
        category: 'Debt Collection',
        amountRWF: amount,
        account: method,
        source: 'Customer Debts Report',
        notes: notes || `Repayment received from ${custName}`
      })
    }

    showToast(`✓ Received ${formatRWF(amount)} from ${custName} via ${method}. Outstanding debt updated to ${formatRWF(newDebt)}.`)
  }

  // Handle Supplier Payment Settlement
  const handleRecordSupplierPayment = ({ record, amount, method, notes }) => {
    const suppName = record.supplierName || record.supplier || record.name || 'Supplier'
    const currentDebt = Number(record.remainingAmountRWF ?? record.amountRWF ?? record.balanceOwedRWF ?? record.outstanding ?? 0)
    const newDebt = Math.max(0, currentDebt - amount)

    // 1. Update supplier or purchase record
    if (record.id && updateDemoRecord) {
      // Check if it's in Purchases or Suppliers
      const isPurchase = purchasesList.some((p) => p.id === record.id)
      const targetModule = isPurchase ? 'Purchases' : 'Suppliers'

      updateDemoRecord(activeArchId, targetModule, record.id, {
        remainingAmountRWF: newDebt,
        amountRWF: newDebt,
        balanceOwedRWF: newDebt,
        paidRWF: (Number(record.paidRWF || 0)) + amount,
        status: newDebt === 0 ? 'Paid' : 'Partial'
      })
    }

    // 2. Dispatch cash ledger transaction (Operating Outflow)
    if (addTransaction) {
      addTransaction(activeArchId, {
        title: `Supplier Debt Payment: ${suppName}`,
        type: 'out',
        category: 'Supplier Settlement',
        amountRWF: amount,
        account: method,
        source: 'Supplier Debts Report',
        notes: notes || `Payment disbursed to ${suppName}`
      })
    }

    showToast(`✓ Disbursed ${formatRWF(amount)} to ${suppName} via ${method}. Remaining debt reduced to ${formatRWF(newDebt)}.`)
  }

  // Normalize active report page to support both standard 7 names and any legacy aliases
  const normalizedPage = useMemo(() => {
    const p = (activePage || '').toLowerCase()
    if (p.includes('production') || p.includes('yield') || p.includes('batch')) {
      return 'Production Report'
    }
    if (p.includes('sales') || p.includes('margin')) {
      return 'Sales Report'
    }
    if (p.includes('stock') || p.includes('valuation') || p.includes('inventory')) {
      return 'Stock Report'
    }
    if (p.includes('purchase') || p.includes('order')) {
      return 'Purchases Report'
    }
    if (p.includes('profit') || p.includes('loss') || p.includes('p&l')) {
      return 'Profit & Loss'
    }
    if (p.includes('cash') || p.includes('movement') || p.includes('flow')) {
      return 'Cash Movement'
    }
    if (p.includes('customer') || p.includes('receivable')) {
      return 'Customer Debts'
    }
    if (p.includes('supplier') || p.includes('payable')) {
      return 'Supplier Debts'
    }
    // Default to Sales Report
    return 'Sales Report'
  }, [activePage])

  const businessName = user?.businessName || workspace.name || 'ExBOS Business'

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Architecture badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Reports &amp; Audited Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#218DFF]/15 text-[#9EDCFF] border border-[#218DFF]/30">
              {currentArch?.name || 'Architecture'}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {normalizedPage}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Verified financial breakdown, audit statements, and real-time operational performance.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setExportDrawerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/15 flex items-center gap-2 cursor-pointer shadow-sm"
          >
            Export
          </button>
        </div>
      </div>

      {/* Dynamic View Routing */}
      {normalizedPage === 'Sales Report' && (
        <SalesReportView
          salesList={salesList}
          transactions={archTransactions}
          activeArchId={activeArchId}
          currentArch={currentArch}
          businessName={businessName}
          hideFinancials={hideFinancials}
        />
      )}

      {normalizedPage === 'Stock Report' && (
        <StockReportView
          inventoryList={inventoryList}
          salesList={salesList}
          purchasesList={purchasesList}
          activeArchId={activeArchId}
          currentArch={currentArch}
          businessName={businessName}
          hideFinancials={hideFinancials}
        />
      )}

      {normalizedPage === 'Purchases Report' && (
        <PurchasesReportView
          purchasesList={purchasesList}
          activeArchId={activeArchId}
          currentArch={currentArch}
          businessName={businessName}
          hideFinancials={hideFinancials}
          onRecordSupplierPayment={handleRecordSupplierPayment}
        />
      )}

      {normalizedPage === 'Profit & Loss' && (
        <ProfitLossReportView
          salesList={salesList}
          purchasesList={purchasesList}
          expensesList={expensesList}
          transactions={archTransactions}
          inventoryList={inventoryList}
          activeArchId={activeArchId}
          currentArch={currentArch}
          businessName={businessName}
          hideFinancials={hideFinancials}
        />
      )}

      {normalizedPage === 'Cash Movement' && (
        <CashMovementReportView
          transactions={archTransactions}
          activeArchId={activeArchId}
          currentArch={currentArch}
          businessName={businessName}
          hideFinancials={hideFinancials}
        />
      )}

      {normalizedPage === 'Customer Debts' && (
        <CustomerDebtsReportView
          customersList={customersList}
          salesList={salesList}
          activeArchId={activeArchId}
          currentArch={currentArch}
          businessName={businessName}
          hideFinancials={hideFinancials}
          onRecordCustomerPayment={handleRecordCustomerPayment}
        />
      )}

      {normalizedPage === 'Supplier Debts' && (
        <SupplierDebtsReportView
          suppliersList={suppliersList}
          purchasesList={purchasesList}
          activeArchId={activeArchId}
          currentArch={currentArch}
          businessName={businessName}
          hideFinancials={hideFinancials}
          onRecordSupplierPayment={handleRecordSupplierPayment}
        />
      )}

      {normalizedPage === 'Production Report' && (
        <ProductionReportView
          orders={records['Production'] || []}
          businessName={businessName}
          hideFinancials={hideFinancials}
        />
      )}

      {/* Universal Report Export Drawer (Section 7) */}
      <ExportDrawer
        isOpen={exportDrawerOpen}
        onClose={() => setExportDrawerOpen(false)}
        title={`${normalizedPage} Audit Export`}
        pageTitle={normalizedPage}
        data={salesList.slice(0, 50).map((s) => ({
          ID: s.id,
          Title: s.productName || s.title || 'Record',
          Amount: formatRWF(s.totalAmountRWF || s.amountRWF || 0),
          Date: s.date || 'Today'
        }))}
        columns={[
          { key: 'ID', label: 'Reference' },
          { key: 'Title', label: 'Item / Account' },
          { key: 'Amount', label: 'Amount' },
          { key: 'Date', label: 'Date' }
        ]}
        businessName={businessName}
      />
    </div>
  )
}
