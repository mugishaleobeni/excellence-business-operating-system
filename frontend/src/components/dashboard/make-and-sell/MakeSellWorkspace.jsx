import React from 'react'
import { useExbos } from '../../../context/ExbosContext'
import StockWorkspace from './views/StockWorkspace'
import ProductionWorkspace from './views/ProductionWorkspace'
import SalesWorkspace from './views/SalesWorkspace'
import PurchasesWorkspace from './views/PurchasesWorkspace'
import CustomersWorkspace from './views/CustomersWorkspace'
import SuppliersWorkspace from './views/SuppliersWorkspace'
import ExpensesWorkspace from './views/ExpensesWorkspace'
import ProductionAlertsView from './views/ProductionAlertsView'

const DEFAULT_CATEGORIES = [
  { id: 'cat-bread', name: 'Bread', description: 'Standard loaves, baguettes, and sandwich rolls', status: 'Active' },
  { id: 'cat-cakes', name: 'Cakes', description: 'Celebration cakes, cupcakes, and muffins', status: 'Active' },
  { id: 'cat-pastries', name: 'Pastries', description: 'Croissants, brioches, and danishes', status: 'Active' },
  { id: 'cat-flour', name: 'Flour & Grains', description: 'Wheat flour, rye flour, cornmeal raw inputs', status: 'Active' },
  { id: 'cat-sweet', name: 'Sweeteners', description: 'White sugar, brown sugar, icing sugar', status: 'Active' },
  { id: 'cat-pack', name: 'Packaging', description: 'Bread bags, cake boxes, clips, labels', status: 'Active' }
]

export default function MakeSellWorkspace({
  activeModule = 'Stock',
  activePage = 'Finished Goods',
  onSwitchPage = null
}) {
  const {
    user,
    hideFinancials,
    workspaces,
    updateWorkspace,
    addTransaction,
    addToast
  } = useExbos()

  const workspace = workspaces?.['make-and-sell'] || {}
  const recordsMap = workspace.records || {}

  // Cashier Role Protection
  const isCashier = user?.role === 'Cashier'

  // Read live buckets directly from ExbosContext (zero un-entered demo fallbacks)
  const rawMaterials = Array.isArray(recordsMap['RawMaterials']) ? recordsMap['RawMaterials'] : []
  const finishedGoods = Array.isArray(recordsMap['Inventory']) ? recordsMap['Inventory'] : []
  const recipes = Array.isArray(recordsMap['Recipes']) ? recordsMap['Recipes'] : []
  const batches = Array.isArray(recordsMap['Production']) ? recordsMap['Production'] : []
  const sales = Array.isArray(recordsMap['Sales']) ? recordsMap['Sales'] : []
  const purchases = Array.isArray(recordsMap['Purchases']) ? recordsMap['Purchases'] : []
  const customers = Array.isArray(recordsMap['Customers']) ? recordsMap['Customers'] : []
  const suppliers = Array.isArray(recordsMap['Suppliers']) ? recordsMap['Suppliers'] : []
  const expenses = Array.isArray(recordsMap['Expenses']) ? recordsMap['Expenses'] : []
  const categories =
    Array.isArray(recordsMap['Categories']) && recordsMap['Categories'].length > 0
      ? recordsMap['Categories']
      : DEFAULT_CATEGORIES

  const updateBucket = (bucketName, nextValueOrFn) => {
    if (!updateWorkspace) return
    const currentList = Array.isArray(recordsMap[bucketName]) ? recordsMap[bucketName] : []
    const resolved =
      typeof nextValueOrFn === 'function' ? nextValueOrFn(currentList) : nextValueOrFn
    updateWorkspace('make-and-sell', {
      records: {
        ...recordsMap,
        [bucketName]: resolved
      }
    })
  }

  const handleUpdateRawMaterials = (next) => updateBucket('RawMaterials', next)
  const handleUpdateFinishedGoods = (next) => updateBucket('Inventory', next)
  const handleUpdateBatches = (next) => updateBucket('Production', next)
  const handleUpdateRecipes = (next) => updateBucket('Recipes', next)
  const handleUpdateSales = (next) => {
    const prevIds = new Set(sales.map((s) => s.id))
    const resolved = typeof next === 'function' ? next(sales) : next
    updateBucket('Sales', resolved)
    if (Array.isArray(resolved) && addTransaction) {
      resolved.forEach((item) => {
        if (!prevIds.has(item.id) && Number(item.amountRWF || item.totalAmountRWF) > 0) {
          addTransaction({
            architectureId: 'make-and-sell',
            title: item.title || item.productName || 'Make & Sell Sale',
            type: 'in',
            category: 'Sales (Make & Sell)',
            amountRWF: Number(item.amountRWF || item.totalAmountRWF),
            account: item.paymentMethod || 'Cash / MoMo Till'
          })
        }
      })
    }
  }
  const handleUpdatePurchases = (next) => {
    const prevIds = new Set(purchases.map((p) => p.id))
    const resolved = typeof next === 'function' ? next(purchases) : next
    updateBucket('Purchases', resolved)
    if (Array.isArray(resolved) && addTransaction) {
      resolved.forEach((item) => {
        if (!prevIds.has(item.id) && Number(item.amountRWF || item.totalCostRWF) > 0) {
          addTransaction({
            architectureId: 'make-and-sell',
            title: item.title || item.materialName || 'Raw Material Purchase',
            type: 'out',
            category: 'Purchases (Make & Sell)',
            amountRWF: Number(item.amountRWF || item.totalCostRWF),
            account: item.paymentMethod || 'Supplier / Cash Account'
          })
        }
      })
    }
  }
  const handleUpdateCustomers = (next) => updateBucket('Customers', next)
  const handleUpdateSuppliers = (next) => updateBucket('Suppliers', next)
  const handleUpdateExpenses = (next) => {
    const prevIds = new Set(expenses.map((e) => e.id))
    const resolved = typeof next === 'function' ? next(expenses) : next
    updateBucket('Expenses', resolved)
    if (Array.isArray(resolved) && addTransaction) {
      resolved.forEach((item) => {
        if (!prevIds.has(item.id) && Number(item.amountRWF) > 0) {
          addTransaction({
            architectureId: 'make-and-sell',
            title: item.title || 'Make & Sell Expense',
            type: 'out',
            category: item.category || 'Expenses (Make & Sell)',
            amountRWF: Number(item.amountRWF),
            account: item.paymentMethod || 'Cash / MoMo'
          })
        }
      })
    }
  }
  const handleUpdateCategories = (next) => updateBucket('Categories', next)

  // Subpage router
  switch (activeModule) {
    case 'Stock':
      return (
        <StockWorkspace
          activeSubPage={activePage}
          rawMaterials={rawMaterials}
          finishedGoods={finishedGoods}
          recipes={recipes}
          categories={categories}
          onUpdateCategories={handleUpdateCategories}
          onUpdateRawMaterials={handleUpdateRawMaterials}
          onUpdateFinishedGoods={handleUpdateFinishedGoods}
          onOpenReceiveStock={() => {
            if (onSwitchPage) {
              onSwitchPage('Purchases', 'All Purchases')
            }
          }}
          isCashier={isCashier}
          hideFinancials={hideFinancials}
          addToast={addToast}
        />
      )

    case 'Production':
      return (
        <ProductionWorkspace
          activeSubPage={activePage}
          batches={batches}
          recipes={recipes}
          rawMaterials={rawMaterials}
          finishedGoods={finishedGoods}
          onUpdateBatches={handleUpdateBatches}
          onUpdateRecipes={handleUpdateRecipes}
          onUpdateRawMaterials={handleUpdateRawMaterials}
          onUpdateFinishedGoods={handleUpdateFinishedGoods}
          onOpenCreatePurchase={() => {
            if (onSwitchPage) {
              onSwitchPage('Purchases', 'All Purchases')
            }
          }}
          isCashier={isCashier}
          hideFinancials={hideFinancials}
          addToast={addToast}
        />
      )

    case 'Sales':
      return (
        <SalesWorkspace
          activeSubPage={activePage}
          sales={sales}
          finishedGoods={finishedGoods}
          customers={customers}
          onUpdateSales={handleUpdateSales}
          onUpdateFinishedGoods={handleUpdateFinishedGoods}
          onUpdateCustomers={handleUpdateCustomers}
          isCashier={isCashier}
          hideFinancials={hideFinancials}
          addToast={addToast}
        />
      )

    case 'Purchases':
      return (
        <PurchasesWorkspace
          activeSubPage={activePage}
          purchases={purchases}
          rawMaterials={rawMaterials}
          suppliers={suppliers}
          onUpdatePurchases={handleUpdatePurchases}
          onUpdateRawMaterials={handleUpdateRawMaterials}
          onUpdateSuppliers={handleUpdateSuppliers}
          isCashier={isCashier}
          hideFinancials={hideFinancials}
          addToast={addToast}
        />
      )

    case 'Customers':
      return (
        <CustomersWorkspace
          activeSubPage={activePage}
          customers={customers}
          sales={sales}
          onUpdateCustomers={handleUpdateCustomers}
          isCashier={isCashier}
          hideFinancials={hideFinancials}
          addToast={addToast}
        />
      )

    case 'Suppliers':
      return (
        <SuppliersWorkspace
          activeSubPage={activePage}
          suppliers={suppliers}
          purchases={purchases}
          onUpdateSuppliers={handleUpdateSuppliers}
          isCashier={isCashier}
          hideFinancials={hideFinancials}
          addToast={addToast}
        />
      )

    case 'Expenses':
      return (
        <ExpensesWorkspace
          activeSubPage={activePage}
          expenses={expenses}
          onUpdateExpenses={handleUpdateExpenses}
          isCashier={isCashier}
          hideFinancials={hideFinancials}
          addToast={addToast}
        />
      )

    case 'Overview':
      if (activePage === 'Production Alerts') {
        return (
          <ProductionAlertsView
            batches={batches}
            recipes={recipes}
            rawMaterials={rawMaterials}
            finishedGoods={finishedGoods}
            onOpenBatch={() => {
              if (onSwitchPage) {
                onSwitchPage('Production', 'In Progress')
              }
            }}
            onReorderMaterial={() => {
              if (onSwitchPage) {
                onSwitchPage('Purchases', 'All Purchases')
              }
            }}
            addToast={addToast}
          />
        )
      }
      return null

    default:
      return null
  }
}
