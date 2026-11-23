import { useMemo } from 'react'
import { calculateFinancialIntelligence } from '../../../utils/financialIntelligenceEngine'

export function useLiveDashboardData({
  activeWorkspace = {},
  activeDemoWorkspace = {},
  archTransactions = [],
  demoMetrics = {},
  activeArchId = 'buy-and-sell'
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

    const resolvedArchId = ws.architectureId || activeArchId || 'buy-and-sell'
    const fin = calculateFinancialIntelligence({
      workspace: ws,
      transactions: archTransactions,
      archId: resolvedArchId
    })

    return {
      // Core Dashboard Metrics (reconciled from actual records & payment statuses)
      totalSales: fin.totalSalesRevenueRWF,
      moneyReceived: fin.actualPaymentsReceivedRWF,
      totalPurchases: fin.totalPurchasesRWF,
      paidPurchasesOutflow: fin.paidPurchasesOutflowRWF,
      totalExpenses: fin.operatingExpensesRWF,
      cogsRWF: fin.costOfGoodsSoldRWF,
      grossProfit: fin.grossProfitRWF,
      netProfit: fin.netProfitRWF,
      customerDebts: fin.outstandingCustomerDebtsRWF,
      supplierDebts: fin.outstandingSupplierDebtsRWF,
      stockValue: fin.stockValueRWF,

      // Liquid Cash & Purchasing Intelligence Metrics
      spendable: fin.availableBusinessCashRWF,
      availableCash: fin.availableBusinessCashRWF,
      cashInHandRWF: fin.cashInHandRWF,
      mobileMoneyBalanceRWF: fin.mobileMoneyBalanceRWF,
      bankBalanceRWF: fin.bankBalanceRWF,
      purchaseCommitments: fin.purchaseCommitmentsRWF,
      openPurchaseOrdersCount: fin.openPurchaseOrdersCount,
      reservedOperationalFunds: fin.reservedOperationalFundsRWF,
      availablePurchasingBudget: fin.availablePurchasingBudgetRWF,

      // Record Counts
      customersCount: customersList.length,
      suppliersCount: suppliersList.length,
      salesCount: salesList.length,
      purchasesCount: purchasesList.length,
      inventoryCount: inventoryList.length,
      productionCount: productionList.length,
      financialIntelligence: fin
    }
  }, [activeWorkspace, activeDemoWorkspace, archTransactions, demoMetrics, activeArchId])
}
