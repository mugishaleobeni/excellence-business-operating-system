import { useMemo } from 'react'

export function useLiveDashboardData({
  activeWorkspace = {},
  activeDemoWorkspace = {},
  archTransactions = [],
  demoMetrics = {}
}) {
  return useMemo(() => {
    const ws = activeWorkspace?.records ? activeWorkspace : activeDemoWorkspace
    const records = ws.records || {}
    const salesList = Array.isArray(records['Sales']) ? records['Sales'] : []
    const purchasesList = Array.isArray(records['Purchases']) ? records['Purchases'] : []
    const expensesList = Array.isArray(records['Expenses']) ? records['Expenses'] : []
    const inventoryList = Array.isArray(records['Inventory'])
      ? records['Inventory']
      : Array.isArray(records['Products'])
      ? records['Products']
      : []
    const customersList = Array.isArray(records['Customers']) ? records['Customers'] : []
    const suppliersList = Array.isArray(records['Suppliers']) ? records['Suppliers'] : []
    const productionList = Array.isArray(records['Production']) ? records['Production'] : []

    const saleIds = new Set(salesList.map((s) => String(s.id)))
    const purchaseIds = new Set(purchasesList.map((p) => String(p.id)))
    const expenseIds = new Set(expensesList.map((e) => String(e.id)))

    const standaloneInTxs = archTransactions.filter((t) => {
      if (t.type !== 'in') return false
      if (t.recordId && saleIds.has(String(t.recordId))) return false
      if (t.sourceModule === 'Sales') return false
      if (
        t.source === 'Live Dashboard' &&
        typeof t.category === 'string' &&
        t.category.startsWith('Sales (')
      ) {
        return false
      }
      return true
    })

    const standaloneOutTxs = archTransactions.filter((t) => {
      if (t.type !== 'out') return false
      if (
        t.recordId &&
        (purchaseIds.has(String(t.recordId)) || expenseIds.has(String(t.recordId)))
      ) {
        return false
      }
      if (t.sourceModule === 'Purchases' || t.sourceModule === 'Expenses') return false
      if (
        t.source === 'Live Dashboard' &&
        typeof t.category === 'string' &&
        (t.category.startsWith('Purchases (') || t.category.startsWith('Expenses ('))
      ) {
        return false
      }
      return true
    })

    const inTx = standaloneInTxs.reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)
    const outTx = standaloneOutTxs.reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)

    // Compute strictly from live database records and standalone transactions (no double-counting)
    const totalSales =
      salesList.reduce((acc, s) => acc + (Number(s.amountRWF || s.totalAmount || s.amount) || 0), 0) + inTx

    const totalPurchases = purchasesList.reduce(
      (acc, p) => acc + (Number(p.amountRWF || p.totalAmount || p.amount) || 0),
      0
    )

    const totalExpenses =
      expensesList.reduce((acc, e) => acc + (Number(e.amountRWF || e.totalAmount || e.amount) || 0), 0) + outTx

    const customerDebts = customersList.reduce(
      (acc, c) => acc + (Number(c.balanceOwedRWF ?? c.amountRWF ?? c.debt) || 0),
      0
    )

    const supplierDebts = suppliersList.reduce(
      (acc, s) => acc + (Number(s.balanceOwedRWF ?? s.amountRWF ?? s.debt) || 0),
      0
    )

    const stockValue = inventoryList.reduce((acc, i) => {
      const q = Number(i.currentStock ?? i.stock ?? i.quantity) || 0
      const c = Number(i.costPerUnitRWF ?? i.unitCost ?? i.purchasePriceRWF ?? i.unitCostRWF ?? i.sellingPriceRWF) || 0
      return acc + q * c
    }, 0)

    const netProfit = totalSales - totalPurchases - totalExpenses
    const spendable = Math.max(0, totalSales - totalExpenses)

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      customerDebts,
      supplierDebts,
      stockValue,
      netProfit,
      spendable,
      customersCount: customersList.length,
      suppliersCount: suppliersList.length,
      salesCount: salesList.length,
      purchasesCount: purchasesList.length,
      inventoryCount: inventoryList.length,
      productionCount: productionList.length
    }
  }, [activeWorkspace, activeDemoWorkspace, archTransactions, demoMetrics])
}

