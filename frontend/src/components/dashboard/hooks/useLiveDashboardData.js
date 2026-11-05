import { useMemo } from 'react'

export function useLiveDashboardData({
  activeDemoWorkspace = {},
  archTransactions = [],
  demoMetrics = {}
}) {
  return useMemo(() => {
    const records = activeDemoWorkspace.records || {}
    const salesList = records['Sales'] || []
    const purchasesList = records['Purchases'] || []
    const expensesList = records['Expenses'] || []
    const inventoryList = records['Inventory'] || []
    const customersList = records['Customers'] || []
    const suppliersList = records['Suppliers'] || []
    const productionList = records['Production'] || []

    const inTx = archTransactions
      .filter((t) => t.type === 'in')
      .reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)
    const outTx = archTransactions
      .filter((t) => t.type === 'out')
      .reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)

    const rawSales =
      salesList.reduce((acc, s) => acc + (Number(s.amountRWF) || 0), 0) + inTx
    const totalSales =
      rawSales > 0 ? rawSales : demoMetrics.monthlyRevenueRWF ?? 0

    const rawPurchases = purchasesList.reduce(
      (acc, p) => acc + (Number(p.amountRWF) || 0),
      0
    )
    const totalPurchases =
      rawPurchases > 0 ? rawPurchases : demoMetrics.monthlyPurchasesRWF ?? 0

    const rawExpenses =
      expensesList.reduce((acc, e) => acc + (Number(e.amountRWF) || 0), 0) + outTx
    const totalExpenses =
      rawExpenses > 0
        ? rawExpenses
        : demoMetrics.todayCostsRWF
        ? demoMetrics.todayCostsRWF * 22
        : 0

    const rawCustDebts = customersList.reduce(
      (acc, c) => acc + (Number(c.balanceOwedRWF ?? c.amountRWF) || 0),
      0
    )
    const customerDebts =
      rawCustDebts > 0 ? rawCustDebts : demoMetrics.owedToMeRWF ?? 0

    const rawSuppDebts = suppliersList.reduce(
      (acc, s) => acc + (Number(s.amountRWF ?? s.balanceOwedRWF) || 0),
      0
    )
    const supplierDebts =
      rawSuppDebts > 0 ? rawSuppDebts : demoMetrics.iOweSuppliersRWF ?? 0

    const rawStock = inventoryList.reduce((acc, i) => {
      const q = Number(i.quantity) || 0
      const c = Number(i.purchasePriceRWF ?? i.unitCostRWF) || 0
      return acc + q * c
    }, 0)
    const stockValue = rawStock > 0 ? rawStock : demoMetrics.stockValueRWF ?? 0

    const netProfit =
      totalSales - totalPurchases - totalExpenses || (demoMetrics.netProfitRWF ?? 0)
    const spendable =
      (demoMetrics.spendableRWF ?? 0) || Math.max(0, totalSales - totalExpenses)

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
  }, [activeDemoWorkspace, archTransactions, demoMetrics])
}

