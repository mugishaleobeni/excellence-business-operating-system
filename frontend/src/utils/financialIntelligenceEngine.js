/**
 * Centralized Financial Calculation & Intelligent Purchasing Engine for ExBOS (Frontend).
 *
 * Mirrors `backend/app/services/financial_intelligence.py` 1:1 so live purchase assessment
 * in PurchaseModal.jsx, PurchasesWorkspace.jsx, WhereIsMyMoneyPanel.jsx, and
 * useLiveDashboardData.js updates in real time (<2ms) as the user edits quantity,
 * unit cost, supplier, payment method, delivery mode, or side money top-up.
 */

export const INFLOW_SALES_BUCKETS = [
  'Sales',
  'Jobs',
  'ServiceJobs',
  'KitchenOrders',
  'GuestFolios',
  'MixedSales'
]

export const STOCK_CATALOG_BUCKETS = [
  'Inventory',
  'Products',
  'RawMaterials',
  'Consumables',
  'Ingredients',
  'HybridItems',
  'Feeds'
]

export const OPEN_PO_DELIVERY_STATUSES = new Set([
  'ordered',
  'pending delivery',
  'in transit',
  'committed',
  'purchase order',
  'po',
  'partially received'
])

function toNum(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback
  const cleaned = String(val).replace(/,/g, '').trim()
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : fallback
}

export function classifyPaymentChannel(accountOrMethod) {
  const s = String(accountOrMethod || '').trim().toLowerCase()
  if (
    s.includes('credit') ||
    s.includes('unpaid') ||
    s.includes('pay later') ||
    s.includes('debt') ||
    s.includes('account payable')
  ) {
    return 'credit'
  }
  if (s.includes('momo') || s.includes('mtn') || s.includes('airtel') || s.includes('mobile money')) {
    return 'momo'
  }
  if (
    s.includes('bank') ||
    s.includes('bk') ||
    s.includes('equity') ||
    s.includes('bpr') ||
    s.includes('i&m') ||
    s.includes('transfer') ||
    s.includes('cheque') ||
    s.includes('card')
  ) {
    return 'bank'
  }
  return 'cash'
}

export function isCreditStatus(status, paymentStatus = '') {
  const combined = `${status || ''} ${paymentStatus || ''}`.trim().toLowerCase()
  if (combined.includes('part-paid') || combined.includes('partial')) return false
  if (combined.includes('paid in full')) return false
  return (
    combined.includes('unpaid') ||
    combined.includes('credit') ||
    combined.includes('owed') ||
    combined.includes('pending') ||
    combined.includes('overdue')
  )
}

export function isPartialStatus(status, paymentStatus = '') {
  const combined = `${status || ''} ${paymentStatus || ''}`.trim().toLowerCase()
  return combined.includes('part-paid') || combined.includes('partial')
}

export function extractRecordTotal(rec = {}) {
  for (const k of [
    'totalAmountRWF',
    'amountRWF',
    'totalFolioRWF',
    'totalValueRWF',
    'totalAmount',
    'total',
    'amount'
  ]) {
    if (rec[k] !== undefined && rec[k] !== null && rec[k] !== '') {
      const v = toNum(rec[k], -1)
      if (v >= 0) return v
    }
  }
  const qty = toNum(rec.quantity, 0)
  const unitP = toNum(rec.unitPriceRWF ?? rec.sellingPriceRWF ?? rec.purchasePriceRWF, 0)
  if (qty > 0 && unitP > 0) return qty * unitP
  return 0
}

export function extractSalePaidAndRemaining(sale = {}) {
  const total = extractRecordTotal(sale)
  const status = sale.status
  const payStatus = sale.paymentStatus
  const payMethod = sale.paymentMethod || sale.account

  const explicitPaid =
    sale.paidAmountRWF !== undefined && sale.paidAmountRWF !== ''
      ? sale.paidAmountRWF
      : sale.amountPaidRWF !== undefined && sale.amountPaidRWF !== ''
      ? sale.amountPaidRWF
      : sale.paidRWF

  const explicitRem =
    sale.remainingAmountRWF !== undefined && sale.remainingAmountRWF !== ''
      ? sale.remainingAmountRWF
      : sale.balanceOwedRWF !== undefined && sale.balanceOwedRWF !== ''
      ? sale.balanceOwedRWF
      : sale.balanceRWF

  if (explicitPaid !== undefined && explicitPaid !== null && explicitPaid !== '') {
    const paid = Math.min(total, Math.max(0, toNum(explicitPaid, 0)))
    const rem = Math.max(0, toNum(explicitRem, total - paid))
    return { total, paid, remaining: rem }
  }

  if (isCreditStatus(status, payStatus) || classifyPaymentChannel(payMethod) === 'credit') {
    const rem = Math.max(0, toNum(explicitRem, total))
    const paid = Math.max(0, total - rem)
    return { total, paid, remaining: rem }
  }

  if (isPartialStatus(status, payStatus)) {
    const rem = Math.max(0, toNum(explicitRem, total * 0.5))
    const paid = Math.max(0, total - rem)
    return { total, paid, remaining: rem }
  }

  return { total, paid: total, remaining: 0 }
}

export function extractPurchaseFinancials(purch = {}) {
  const rawTotal = extractRecordTotal(purch)
  const taxRWF = toNum(purch.taxAmountRWF, 0)
  const extraRWF = toNum(purch.additionalChargesRWF ?? purch.shippingCostRWF, 0)
  const total =
    purch.subtotalRWF !== undefined && purch.subtotalRWF !== null
      ? toNum(purch.subtotalRWF, 0) + taxRWF + extraRWF
      : rawTotal

  const status = purch.status
  const payStatus = purch.paymentStatus
  const payMethod = purch.paymentMethod || purch.account
  const channel = classifyPaymentChannel(payMethod)

  const explicitPaid =
    purch.paidAmountRWF !== undefined && purch.paidAmountRWF !== ''
      ? purch.paidAmountRWF
      : purch.amountPaidRWF !== undefined && purch.amountPaidRWF !== ''
      ? purch.amountPaidRWF
      : purch.paidRWF

  const explicitRem =
    purch.remainingAmountRWF !== undefined && purch.remainingAmountRWF !== ''
      ? purch.remainingAmountRWF
      : purch.balanceRWF !== undefined && purch.balanceRWF !== ''
      ? purch.balanceRWF
      : purch.balanceOwedRWF

  let paid = total
  let remaining = 0

  if (explicitPaid !== undefined && explicitPaid !== null && explicitPaid !== '') {
    paid = Math.min(total, Math.max(0, toNum(explicitPaid, 0)))
    remaining = Math.max(0, toNum(explicitRem, total - paid))
  } else if (isCreditStatus(status, payStatus) || channel === 'credit') {
    paid = 0
    remaining = total
  } else if (isPartialStatus(status, payStatus)) {
    remaining = Math.max(0, toNum(explicitRem, total * 0.5))
    paid = Math.max(0, total - remaining)
  }

  const orderedQty = toNum(purch.orderedQuantity ?? purch.quantity, 0)
  let deliveryRaw = String(purch.deliveryStatus || '').trim()
  if (!deliveryRaw) {
    deliveryRaw = purch.autoRestock === false ? 'Ordered' : 'Received'
  }
  const delivLower = deliveryRaw.toLowerCase()

  let receivedQty = orderedQty
  if (purch.receivedQuantity !== undefined && purch.receivedQuantity !== null && purch.receivedQuantity !== '') {
    receivedQty = Math.max(0, toNum(purch.receivedQuantity, 0))
  } else if (
    delivLower === 'ordered' ||
    delivLower === 'pending delivery' ||
    delivLower === 'in transit' ||
    delivLower === 'committed' ||
    delivLower === 'purchase order' ||
    delivLower === 'po'
  ) {
    receivedQty = 0
  }

  const pendingQty = Math.max(0, orderedQty - receivedQty)
  const isOpenPo = OPEN_PO_DELIVERY_STATUSES.has(delivLower) && pendingQty > 0

  return {
    total,
    paid,
    remaining,
    deliveryStatus: deliveryRaw,
    isOpenPo,
    orderedQty,
    receivedQty,
    pendingQty,
    channel: channel === 'credit' ? 'cash' : channel,
    isReturn: Boolean(purch.isReturn)
  }
}

/**
 * Calculate the complete reconciled financial position for a workspace.
 */
export function calculateFinancialIntelligence({
  workspace = {},
  transactions = [],
  archId = 'buy-and-sell'
} = {}) {
  const ws = workspace || {}
  const records = ws.records || {}
  const txList = Array.isArray(transactions)
    ? transactions.filter((t) => t && (t.architectureId || 'buy-and-sell') === archId)
    : []

  // Catalog lookup for COGS & stock value
  const catalogItems = []
  const seenProdKeys = new Set()
  const productCostById = {}
  const productCostByTitle = {}

  for (const bucket of STOCK_CATALOG_BUCKETS) {
    const list = Array.isArray(records[bucket]) ? records[bucket] : []
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const pid = String(item.id || '').trim()
      const ptitle = String(item.title || item.name || item.feedName || '').trim().toLowerCase()
      const unitCost = toNum(
        item.purchasePriceRWF ??
          item.unitCostRWF ??
          item.costPerUnitRWF ??
          item.unitCost ??
          0,
        0
      )
      if (pid && unitCost > 0) productCostById[pid] = unitCost
      if (ptitle && unitCost > 0) productCostByTitle[ptitle] = unitCost
      const dedupKey = pid || ptitle
      if (dedupKey && !seenProdKeys.has(dedupKey)) {
        seenProdKeys.add(dedupKey)
        catalogItems.push(item)
      }
    }
  }

  // 1. Sales Revenue, Actual Payments Received, Customer Receivables & COGS
  const salesRecords = []
  const saleIds = new Set()
  for (const sBucket of INFLOW_SALES_BUCKETS) {
    const list = Array.isArray(records[sBucket]) ? records[sBucket] : []
    for (const s of list) {
      if (s && typeof s === 'object') {
        salesRecords.push(s)
        if (s.id) saleIds.add(String(s.id))
      }
    }
  }

  let totalSalesRevenue = 0
  let actualPaymentsReceived = 0
  let salesUnpaidReceivables = 0
  let cogsRWF = 0

  const channelFlows = {
    cash: { in: 0, out: 0 },
    momo: { in: 0, out: 0 },
    bank: { in: 0, out: 0 }
  }

  for (const sale of salesRecords) {
    const { total, paid, remaining } = extractSalePaidAndRemaining(sale)
    totalSalesRevenue += total
    actualPaymentsReceived += paid
    salesUnpaidReceivables += remaining

    const ch = classifyPaymentChannel(sale.paymentMethod || sale.account)
    const effCh = ch === 'credit' ? 'momo' : ch
    channelFlows[effCh].in += paid

    const explicitCogs = toNum(sale.costOfGoodsRWF ?? sale.cogsRWF, -1)
    if (explicitCogs >= 0) {
      cogsRWF += explicitCogs
    } else if (sale.profitRWF !== undefined && sale.profitRWF !== null) {
      cogsRWF += Math.max(0, total - toNum(sale.profitRWF, 0))
    } else {
      const sPid = String(sale.productId || '').trim()
      const sTitle = String(sale.productTitle || sale.title || '').trim().toLowerCase()
      const sQty = toNum(sale.quantity, 1)
      const unitC = productCostById[sPid] || productCostByTitle[sTitle] || toNum(sale.unitCostRWF, 0)
      if (unitC > 0 && sQty > 0) {
        cogsRWF += Math.min(total, sQty * unitC)
      }
    }
  }

  // 2. Purchases, Paid Purchases Outflow, Supplier Payables & Open PO Commitments
  const purchasesList = Array.isArray(records.Purchases) ? records.Purchases : []
  const purchaseIds = new Set(purchasesList.filter((p) => p?.id).map((p) => String(p.id)))

  let totalPurchasesValue = 0
  let paidPurchasesOutflow = 0
  let unpaidReceivedPurchases = 0
  let purchaseCommitments = 0
  let openPoCount = 0

  for (const purch of purchasesList) {
    if (!purch || typeof purch !== 'object') continue
    const pf = extractPurchaseFinancials(purch)
    if (pf.isReturn) continue
    totalPurchasesValue += pf.total
    paidPurchasesOutflow += pf.paid
    channelFlows[pf.channel].out += pf.paid

    if (pf.isOpenPo) {
      purchaseCommitments += pf.remaining
      openPoCount += 1
    } else {
      unpaidReceivedPurchases += pf.remaining
    }
  }

  // 3. Operating Expenses
  const expensesList = Array.isArray(records.Expenses) ? records.Expenses : []
  const expenseIds = new Set(expensesList.filter((e) => e?.id).map((e) => String(e.id)))

  let operatingExpenses = 0
  let paidExpensesOutflow = 0
  let unpaidScheduledExpenses = 0

  for (const exp of expensesList) {
    if (!exp || typeof exp !== 'object') continue
    const eTotal = extractRecordTotal(exp)
    operatingExpenses += eTotal
    if (isCreditStatus(exp.status, exp.paymentStatus)) {
      unpaidScheduledExpenses += eTotal
    } else {
      paidExpensesOutflow += eTotal
      const ch = classifyPaymentChannel(exp.paymentMethod || exp.account)
      const effCh = ch === 'credit' ? 'cash' : ch
      channelFlows[effCh].out += eTotal
    }
  }

  // 4. Standalone Transactions (Capital / Side-Money Top-ups, Customer Collections, Standalone Movements)
  let capitalInjectionsRWF = 0

  for (const tx of txList) {
    const txId = String(tx.id || '')
    let recId = String(tx.recordId || '')
    if (txId.startsWith('TX-') && !recId) {
      recId = txId.slice(3)
    }

    const txType = String(tx.type || '').trim().toLowerCase()
    const isIn = txType === 'in' || txType === 'inflow'
    const isOut = txType === 'out' || txType === 'outflow'
    const amt = toNum(tx.amountRWF ?? tx.amount, 0)
    if (amt <= 0) continue

    if (recId && (saleIds.has(recId) || purchaseIds.has(recId) || expenseIds.has(recId))) {
      if (!tx.isCapitalInjection && !tx.isCustomerCollection) {
        continue
      }
    }

    const srcMod = String(tx.sourceModule || '')
    const catStr = String(tx.category || '')
    const catLower = catStr.toLowerCase()
    const titleLower = String(tx.title || '').toLowerCase()

    if (!tx.isCapitalInjection && !tx.isCustomerCollection && !tx.isSettlement) {
      if (srcMod === 'Sales' || srcMod === 'Purchases' || srcMod === 'Expenses') continue
      if (
        tx.source === 'Live Dashboard' &&
        (catStr.startsWith('Sales (') || catStr.startsWith('Purchases (') || catStr.startsWith('Expenses ('))
      ) {
        continue
      }
    }

    const ch = classifyPaymentChannel(tx.account || tx.paymentMethod || tx.channel)
    const effCh = ch === 'credit' ? 'cash' : ch

    if (isIn) {
      channelFlows[effCh].in += amt
      if (
        tx.isCapitalInjection ||
        catLower.includes('capital') ||
        catLower.includes('side money') ||
        catLower.includes('top-up') ||
        catLower.includes('opening') ||
        titleLower.includes('side money') ||
        titleLower.includes('owner capital')
      ) {
        capitalInjectionsRWF += amt
      } else if (
        tx.isCustomerCollection ||
        catLower.includes('receivable') ||
        catLower.includes('debt collection')
      ) {
        actualPaymentsReceived += amt
        salesUnpaidReceivables = Math.max(0, salesUnpaidReceivables - amt)
      } else {
        totalSalesRevenue += amt
        actualPaymentsReceived += amt
      }
    } else if (isOut) {
      if (tx.isSettlement && recId && purchaseIds.has(recId)) {
        continue
      }
      channelFlows[effCh].out += amt
      if (catLower.includes('payable') || titleLower.includes('supplier payment')) {
        if (!recId || !purchaseIds.has(recId)) {
          paidPurchasesOutflow += amt
          unpaidReceivedPurchases = Math.max(0, unpaidReceivedPurchases - amt)
        }
      } else {
        operatingExpenses += amt
        paidExpensesOutflow += amt
      }
    }
  }

  // 5. Customer & Supplier Ledger Reconciliation
  const customersList = Array.isArray(records.Customers) ? records.Customers : []
  const customerLedgerDebt = customersList.reduce(
    (acc, c) => acc + toNum(c?.balanceOwedRWF ?? c?.amountRWF ?? c?.debt, 0),
    0
  )
  const outstandingCustomerDebts = Math.max(salesUnpaidReceivables, customerLedgerDebt)

  const suppliersList = Array.isArray(records.Suppliers) ? records.Suppliers : []
  const supplierLedgerDebt = suppliersList.reduce(
    (acc, s) => acc + toNum(s?.balanceOwedRWF ?? s?.amountRWF ?? s?.debt, 0),
    0
  )
  const outstandingSupplierDebts = Math.max(unpaidReceivedPurchases, supplierLedgerDebt)

  // 6. Stock Value on Shelf
  const stockValueRWF = catalogItems.reduce((acc, item) => {
    const q = toNum(item.currentStock ?? item.stock ?? item.quantityKg ?? item.quantity, 0)
    const c = toNum(
      item.costPerUnitRWF ??
        item.unitCost ??
        item.purchasePriceRWF ??
        item.unitCostRWF ??
        item.sellingPriceRWF,
      0
    )
    return q > 0 && c > 0 ? acc + q * c : acc
  }, 0)

  // 7. Reconcile Liquid Balances by Channel
  const openingCash = toNum(ws.openingCashRWF ?? ws.metrics?.openingCashRWF, 0)
  const openingMomo = toNum(ws.openingMomoRWF ?? ws.metrics?.openingMomoRWF, 0)
  const openingBank = toNum(ws.openingBankRWF ?? ws.metrics?.openingBankRWF, 0)

  const rawCash = openingCash + channelFlows.cash.in - channelFlows.cash.out
  const rawMomo = openingMomo + channelFlows.momo.in - channelFlows.momo.out
  const rawBank = openingBank + channelFlows.bank.in - channelFlows.bank.out

  const reconciledTotalLiquid = Math.max(
    0,
    openingCash +
      openingMomo +
      openingBank +
      actualPaymentsReceived +
      capitalInjectionsRWF -
      paidPurchasesOutflow -
      paidExpensesOutflow
  )

  const positiveChannelsSum = Math.max(0, rawCash) + Math.max(0, rawMomo) + Math.max(0, rawBank)
  let cashInHand = 0
  let mobileMoneyBalance = 0
  let bankBalance = 0

  if (positiveChannelsSum > 0 && reconciledTotalLiquid > 0) {
    const scale = reconciledTotalLiquid / positiveChannelsSum
    cashInHand = Math.round(Math.max(0, rawCash) * scale)
    mobileMoneyBalance = Math.round(Math.max(0, rawMomo) * scale)
    bankBalance = Math.max(0, Math.round(reconciledTotalLiquid) - cashInHand - mobileMoneyBalance)
  } else {
    cashInHand = Math.max(0, Math.round(rawCash))
    mobileMoneyBalance = Math.max(0, Math.round(rawMomo))
    bankBalance = Math.max(0, Math.round(rawBank))
  }

  const availableBusinessCash = cashInHand + mobileMoneyBalance + bankBalance

  // 8. Gross Profit & Net Profit
  const grossProfit = totalSalesRevenue - cogsRWF
  const netProfit = grossProfit - operatingExpenses

  // 9. Reserved Operational Funds & Available Purchasing Budget
  const explicitReserve = ws.reservedOperationalFundsRWF ?? ws.metrics?.reservedOperationalFundsRWF
  const reservedOperationalFunds =
    explicitReserve !== undefined && explicitReserve !== null && toNum(explicitReserve, -1) >= 0
      ? toNum(explicitReserve, 0)
      : Math.round(operatingExpenses * 0.15) + unpaidScheduledExpenses

  const otherCashReservations = toNum(ws.otherCashReservationsRWF ?? ws.metrics?.otherCashReservationsRWF, 0)

  const availablePurchasingBudget = Math.max(
    0,
    availableBusinessCash - reservedOperationalFunds - purchaseCommitments - otherCashReservations
  )

  return {
    architectureId: archId,
    totalSalesRevenueRWF: Math.round(totalSalesRevenue),
    actualPaymentsReceivedRWF: Math.round(actualPaymentsReceived),
    outstandingCustomerDebtsRWF: Math.round(outstandingCustomerDebts),
    operatingExpensesRWF: Math.round(operatingExpenses),
    costOfGoodsSoldRWF: Math.round(cogsRWF),
    grossProfitRWF: Math.round(grossProfit),
    netProfitRWF: Math.round(netProfit),
    cashInHandRWF: Math.round(cashInHand),
    mobileMoneyBalanceRWF: Math.round(mobileMoneyBalance),
    bankBalanceRWF: Math.round(bankBalance),
    availableBusinessCashRWF: Math.round(availableBusinessCash),
    capitalInjectionsRWF: Math.round(capitalInjectionsRWF),
    outstandingSupplierDebtsRWF: Math.round(outstandingSupplierDebts),
    purchaseCommitmentsRWF: Math.round(purchaseCommitments),
    openPurchaseOrdersCount: openPoCount,
    reservedOperationalFundsRWF: Math.round(reservedOperationalFunds),
    otherCashReservationsRWF: Math.round(otherCashReservations),
    availablePurchasingBudgetRWF: Math.round(availablePurchasingBudget),
    totalPurchasesRWF: Math.round(totalPurchasesValue),
    paidPurchasesOutflowRWF: Math.round(paidPurchasesOutflow),
    stockValueRWF: Math.round(stockValueRWF)
  }
}

/**
 * Live Intelligent Purchase Assessment & Recommendation Engine.
 */
export function assessPurchaseDecision({
  draftPurchase = {},
  workspace = {},
  transactions = [],
  archId = 'buy-and-sell',
  catalogProducts = []
} = {}) {
  const ws = workspace || {}
  const records = ws.records || {}
  const fin = calculateFinancialIntelligence({ workspace: ws, transactions, archId })

  const prodId = String(draftPurchase.productId || draftPurchase.materialId || '').trim()
  const prodTitle = String(
    draftPurchase.productTitle || draftPurchase.materialName || draftPurchase.title || ''
  ).trim()
  const prodTitleLower = prodTitle.toLowerCase()

  const qty = Math.max(0, toNum(draftPurchase.quantity, 0))
  const unitPrice = Math.max(0, toNum(draftPurchase.unitPriceRWF ?? draftPurchase.purchasePriceRWF, 0))
  const taxRWF = Math.max(0, toNum(draftPurchase.taxAmountRWF, 0))
  const extraChargesRWF = Math.max(0, toNum(draftPurchase.additionalChargesRWF, 0))
  const sideMoneyAddedRWF = Math.max(0, toNum(draftPurchase.sideMoneyAddedRWF, 0))

  const subtotalRWF = Math.round(qty * unitPrice)
  const totalPurchaseCostRWF = Math.round(subtotalRWF + taxRWF + extraChargesRWF)

  const paymentStatus = String(draftPurchase.paymentStatus || 'Paid in Full').trim()
  const paymentMethod = String(draftPurchase.paymentMethod || 'MTN MoMo Business').trim()
  const deliveryStatus = String(draftPurchase.deliveryStatus || 'Received').trim()
  const supplierName = String(draftPurchase.supplierName || draftPurchase.supplier || '').trim()

  const channel = classifyPaymentChannel(paymentMethod)
  let immediateCashOutlayRWF = totalPurchaseCostRWF

  if (isCreditStatus(paymentStatus, paymentStatus) || channel === 'credit') {
    immediateCashOutlayRWF = 0
  } else if (isPartialStatus(paymentStatus, paymentStatus)) {
    immediateCashOutlayRWF = Math.min(
      totalPurchaseCostRWF,
      Math.max(0, toNum(draftPurchase.paidAmountRWF ?? draftPurchase.amountPaidRWF, 0))
    )
  }

  const supplierCreditCreatedRWF = Math.max(0, totalPurchaseCostRWF - immediateCashOutlayRWF)

  // 1. Identify Product in Catalog
  let matchedProduct = null
  const combinedCatalog = [...(Array.isArray(catalogProducts) ? catalogProducts : [])]
  for (const bucket of STOCK_CATALOG_BUCKETS) {
    if (Array.isArray(records[bucket])) {
      combinedCatalog.push(...records[bucket])
    }
  }

  for (const item of combinedCatalog) {
    if (!item || typeof item !== 'object') continue
    const iid = String(item.id || '').trim()
    const ititle = String(item.title || item.name || item.feedName || '').trim().toLowerCase()
    if ((prodId && iid === prodId) || (prodTitleLower && ititle === prodTitleLower)) {
      matchedProduct = item
      break
    }
  }

  const productExists = Boolean(matchedProduct)
  const currentStock = matchedProduct
    ? toNum(
        matchedProduct.currentStock ??
          matchedProduct.stock ??
          matchedProduct.quantityKg ??
          matchedProduct.quantity,
        0
      )
    : 0
  const reorderLevel = matchedProduct
    ? toNum(matchedProduct.lowStockAlert ?? matchedProduct.minStock ?? matchedProduct.reorderLevel, 5)
    : 5
  const lastCatalogPrice = matchedProduct
    ? toNum(
        matchedProduct.purchasePriceRWF ??
          matchedProduct.unitCostRWF ??
          matchedProduct.costPerUnitRWF,
        0
      )
    : 0
  const unitLabel = matchedProduct?.unit || draftPurchase.unit || 'units'

  // 2. Check Open Purchase Orders / In-Transit Stock & Historical Supplier Prices
  const editingId = String(draftPurchase.id || '').trim()
  let onOrderQty = 0
  const openPosForProduct = []
  const historicalPrices = []

  const purchasesList = Array.isArray(records.Purchases) ? records.Purchases : []
  for (const p of purchasesList) {
    if (!p || typeof p !== 'object') continue
    if (editingId && String(p.id || '') === editingId) continue
    const pPid = String(p.productId || p.materialId || '').trim()
    const pTitle = String(p.productTitle || p.materialName || p.title || '').trim().toLowerCase()
    const matchesItem =
      (prodId && pPid === prodId) ||
      (prodTitleLower && (pTitle === prodTitleLower || pTitle.includes(prodTitleLower)))
    if (!matchesItem) continue

    const pf = extractPurchaseFinancials(p)
    if (pf.isOpenPo && pf.pendingQty > 0) {
      onOrderQty += pf.pendingQty
      openPosForProduct.push({
        id: p.id,
        pendingQty: pf.pendingQty,
        supplier: p.supplierName || p.supplier || 'Supplier',
        deliveryStatus: pf.deliveryStatus
      })
    }

    let pUnitCost = toNum(p.unitPriceRWF, 0)
    if (pUnitCost <= 0 && pf.orderedQty > 0 && pf.total > 0) {
      pUnitCost = Math.round(pf.total / pf.orderedQty)
    }
    const pSup = String(p.supplierName || p.supplier || '').trim()
    if (pUnitCost > 0) {
      historicalPrices.push({
        supplier: pSup || 'Previous Supplier',
        unitPriceRWF: pUnitCost
      })
    }
  }

  let cheaperSupplier = null
  let bestPrice = unitPrice > 0 ? unitPrice : lastCatalogPrice || Infinity
  for (const hp of historicalPrices) {
    if (hp.unitPriceRWF > 0 && hp.unitPriceRWF < bestPrice) {
      if (!supplierName || hp.supplier.toLowerCase() !== supplierName.toLowerCase()) {
        bestPrice = hp.unitPriceRWF
        cheaperSupplier = hp
      }
    }
  }

  // 3. Historical Sales Demand & Days of Stock Coverage
  let totalUnitsSold = 0
  for (const sBucket of INFLOW_SALES_BUCKETS) {
    const sList = Array.isArray(records[sBucket]) ? records[sBucket] : []
    for (const s of sList) {
      if (!s || typeof s !== 'object') continue
      const sPid = String(s.productId || '').trim()
      const sTitle = String(s.productTitle || s.title || '').trim().toLowerCase()
      if (
        (prodId && sPid === prodId) ||
        (prodTitleLower && (sTitle === prodTitleLower || sTitle.includes(prodTitleLower)))
      ) {
        totalUnitsSold += Math.max(1, toNum(s.quantity, 1))
      }
    }
  }

  const avgDailySales = totalUnitsSold > 0 ? Number((totalUnitsSold / 30).toFixed(2)) : 0
  const daysOfStockCoverage =
    avgDailySales > 0 ? Math.round(currentStock / avgDailySales) : currentStock <= 0 ? 0 : null
  const projectedDaysCoverage =
    avgDailySales > 0 ? Math.round((currentStock + onOrderQty + qty) / avgDailySales) : null

  const recommendedReorderQty = Math.max(
    reorderLevel * 2,
    avgDailySales > 0 ? Math.ceil(avgDailySales * 14) : reorderLevel * 2
  )

  // 4. Affordability & Shortfall Calculation
  const baseBudgetRWF = fin.availablePurchasingBudgetRWF
  const effectiveBudgetRWF = baseBudgetRWF + sideMoneyAddedRWF

  const totalCostShortfallRWF = Math.max(0, totalPurchaseCostRWF - effectiveBudgetRWF)
  const immediateCashShortfallRWF = Math.max(0, immediateCashOutlayRWF - effectiveBudgetRWF)

  let selectedChannelBalanceRWF = fin.cashInHandRWF + sideMoneyAddedRWF
  let selectedChannelLabel = 'Cash in Hand'
  if (channel === 'momo') {
    selectedChannelBalanceRWF = fin.mobileMoneyBalanceRWF + sideMoneyAddedRWF
    selectedChannelLabel = 'Mobile Money'
  } else if (channel === 'bank') {
    selectedChannelBalanceRWF = fin.bankBalanceRWF + sideMoneyAddedRWF
    selectedChannelLabel = 'Bank Account'
  } else if (channel === 'credit') {
    selectedChannelBalanceRWF = effectiveBudgetRWF
    selectedChannelLabel = 'Supplier Credit'
  }

  const remainingBudgetAfterPurchaseRWF = Math.max(0, effectiveBudgetRWF - immediateCashOutlayRWF)
  const isAffordable = immediateCashShortfallRWF <= 0
  const affordableUnits = unitPrice > 0 ? Math.floor(effectiveBudgetRWF / unitPrice) : 0

  // 5. Build Intelligent Recommendations
  const recommendations = []

  if (productExists || prodTitle) {
    if (currentStock <= 0) {
      if (onOrderQty > 0) {
        recommendations.push({
          type: 'warning',
          code: 'ZERO_STOCK_WITH_OPEN_PO',
          message: `You have 0 ${unitLabel} remaining on shelf, but you already have ${onOrderQty} ${unitLabel} on an outstanding purchase order.`
        })
      } else {
        recommendations.push({
          type: 'urgent',
          code: 'ZERO_STOCK_REPLENISH',
          message: `You have 0 ${unitLabel} remaining. Replenishment is recommended (suggested reorder: ${recommendedReorderQty} ${unitLabel}).`
        })
      }
    } else if (currentStock <= reorderLevel) {
      recommendations.push({
        type: 'warning',
        code: 'BELOW_REORDER_LEVEL',
        message: `Current stock (${currentStock} ${unitLabel}) is at or below your reorder level (${reorderLevel} ${unitLabel}).`
      })
    }

    if (daysOfStockCoverage !== null && currentStock > 0) {
      recommendations.push({
        type: 'info',
        code: 'DAYS_OF_COVERAGE',
        message:
          `Your current stock can cover approximately ${daysOfStockCoverage} days of expected sales` +
          (projectedDaysCoverage ? ` (~${projectedDaysCoverage} days after this purchase).` : '.')
      })
    }

    if (onOrderQty > 0) {
      const duplicateCovered = currentStock + onOrderQty >= recommendedReorderQty
      recommendations.push({
        type: duplicateCovered ? 'warning' : 'info',
        code: 'EXISTING_OPEN_PO',
        message:
          `You already have ${onOrderQty} ${unitLabel} on an outstanding purchase order.` +
          (duplicateCovered
            ? ' Existing orders already cover your minimum stock target — avoid duplicate purchasing.'
            : '')
      })
    }
  }

  if (cheaperSupplier && unitPrice > cheaperSupplier.unitPriceRWF) {
    const diffPerUnit = Math.round(unitPrice - cheaperSupplier.unitPriceRWF)
    const totalSavings = Math.round(diffPerUnit * qty)
    recommendations.push({
      type: 'tip',
      code: 'LOWER_SUPPLIER_PRICE',
      message: `${cheaperSupplier.supplier} offers a lower historical purchase price (${cheaperSupplier.unitPriceRWF.toLocaleString()} RWF vs ${unitPrice.toLocaleString()} RWF — save ${totalSavings.toLocaleString()} RWF).`
    })
  }

  if (immediateCashShortfallRWF > 0) {
    recommendations.push({
      type: 'danger',
      code: 'BUDGET_SHORTFALL',
      message: `This purchase exceeds your available purchasing budget by ${Math.round(immediateCashShortfallRWF).toLocaleString()} RWF.`
    })
    if (
      fin.availableBusinessCashRWF >= immediateCashOutlayRWF &&
      fin.reservedOperationalFundsRWF > 0
    ) {
      recommendations.push({
        type: 'warning',
        code: 'RESERVED_FUNDS_NOTICE',
        message: `Your business has ${fin.availableBusinessCashRWF.toLocaleString()} RWF total cash, but ${fin.reservedOperationalFundsRWF.toLocaleString()} RWF is reserved for operational expenses and ${fin.purchaseCommitmentsRWF.toLocaleString()} RWF for existing purchase commitments.`
      })
    }
  } else if (totalCostShortfallRWF > 0 && supplierCreditCreatedRWF > 0) {
    recommendations.push({
      type: 'info',
      code: 'COVERED_BY_SUPPLIER_CREDIT',
      message: `Full cost exceeds cash budget by ${Math.round(totalCostShortfallRWF).toLocaleString()} RWF, but immediate cash outlay (${Math.round(immediateCashOutlayRWF).toLocaleString()} RWF) fits within your budget using ${Math.round(supplierCreditCreatedRWF).toLocaleString()} RWF supplier credit.`
    })
  } else if (totalPurchaseCostRWF > 0) {
    recommendations.push({
      type: 'success',
      code: 'AFFORDABLE_PURCHASE',
      message: `Affordable within your purchasing budget. Remaining purchasing budget after confirmation: ${Math.round(remainingBudgetAfterPurchaseRWF).toLocaleString()} RWF.`
    })
  }

  if (sideMoneyAddedRWF > 0) {
    recommendations.push({
      type: 'success',
      code: 'SIDE_MONEY_APPLIED',
      message: `Includes +${Math.round(sideMoneyAddedRWF).toLocaleString()} RWF external / owner side funds added to cover this purchase.`
    })
  }

  // Actionable 1-click alternatives when shortfall > 0
  const alternatives = []
  if (immediateCashShortfallRWF > 0) {
    alternatives.push({
      action: 'ADD_SIDE_MONEY',
      label: `I have other side money I can add (+${Math.round(immediateCashShortfallRWF).toLocaleString()} RWF)`,
      suggestedSideMoneyRWF: Math.round(immediateCashShortfallRWF)
    })
    if (affordableUnits > 0) {
      alternatives.push({
        action: 'REDUCE_QUANTITY',
        label: `Reduce quantity to ${affordableUnits} ${unitLabel} (${Math.round(affordableUnits * unitPrice).toLocaleString()} RWF)`,
        suggestedQuantity: affordableUnits
      })
    }
    if (effectiveBudgetRWF > 0) {
      alternatives.push({
        action: 'PARTIAL_CREDIT',
        label: `Pay ${Math.round(effectiveBudgetRWF).toLocaleString()} RWF now & put ${Math.round(totalPurchaseCostRWF - effectiveBudgetRWF).toLocaleString()} RWF on Supplier Credit`,
        suggestedPaidAmountRWF: Math.round(effectiveBudgetRWF)
      })
    }
    alternatives.push({
      action: 'SAVE_AS_PO',
      label: 'Save as Open Purchase Order (pay on delivery)',
      deliveryStatus: 'Ordered',
      paymentStatus: 'Unpaid (Supplier Credit / Debt)'
    })
  }

  return {
    product: {
      exists: productExists,
      productId: matchedProduct?.id || prodId,
      title: matchedProduct?.title || matchedProduct?.name || prodTitle,
      currentStock,
      reorderLevel,
      recommendedReorderQty,
      lastPurchasePriceRWF: lastCatalogPrice,
      onOrderQuantity: onOrderQty,
      openPurchaseOrders: openPosForProduct,
      avgDailySalesUnits: avgDailySales,
      daysOfStockCoverage,
      projectedDaysOfCoverage: projectedDaysCoverage,
      unit: unitLabel
    },
    pricing: {
      quantity: qty,
      unitPriceRWF: Math.round(unitPrice),
      subtotalRWF,
      taxAmountRWF: Math.round(taxRWF),
      additionalChargesRWF: Math.round(extraChargesRWF),
      totalPurchaseCostRWF,
      immediateCashOutlayRWF: Math.round(immediateCashOutlayRWF),
      supplierCreditCreatedRWF: Math.round(supplierCreditCreatedRWF),
      cheaperSupplierAlternative: cheaperSupplier
    },
    affordability: {
      isAffordable,
      availableBusinessCashRWF: fin.availableBusinessCashRWF,
      reservedOperationalFundsRWF: fin.reservedOperationalFundsRWF,
      existingPurchaseCommitmentsRWF: fin.purchaseCommitmentsRWF,
      baseAvailablePurchasingBudgetRWF: Math.round(baseBudgetRWF),
      sideMoneyAddedRWF: Math.round(sideMoneyAddedRWF),
      effectivePurchasingBudgetRWF: Math.round(effectiveBudgetRWF),
      purchaseShortfallRWF: Math.round(immediateCashShortfallRWF),
      totalCostShortfallRWF: Math.round(totalCostShortfallRWF),
      remainingPurchasingBudgetRWF: Math.round(remainingBudgetAfterPurchaseRWF),
      affordableUnits,
      selectedChannel: selectedChannelLabel,
      selectedChannelBalanceRWF: Math.round(selectedChannelBalanceRWF),
      deliveryStatus
    },
    financialPosition: fin,
    recommendations,
    alternatives
  }
}
