import React, { useState, useEffect, useMemo } from 'react'
import { useExbos } from '../../../context/ExbosContext'
import StockWorkspace from './views/StockWorkspace'
import ProductionWorkspace from './views/ProductionWorkspace'
import SalesWorkspace from './views/SalesWorkspace'
import PurchasesWorkspace from './views/PurchasesWorkspace'
import CustomersWorkspace from './views/CustomersWorkspace'
import SuppliersWorkspace from './views/SuppliersWorkspace'
import ExpensesWorkspace from './views/ExpensesWorkspace'
import ProductionAlertsView from './views/ProductionAlertsView'
import {
  DEFAULT_RAW_MATERIALS,
  DEFAULT_FINISHED_PRODUCTS,
  DEFAULT_RECIPES,
  DEFAULT_PRODUCTION_ORDERS
} from './data/makeSellDefaults'

export default function MakeSellWorkspace({
  activeModule = 'Stock',
  activePage = 'Finished Goods',
  onSwitchPage = null
}) {
  const {
    user,
    hideFinancials,
    demoWorkspaces,
    addDemoRecord,
    updateDemoRecord,
    deleteDemoRecord,
    updateDemoWorkspace,
    addToast
  } = useExbos()

  const workspace = demoWorkspaces?.['make-and-sell'] || {}
  const recordsMap = workspace.records || {}

  // Cashier Role Protection
  const isCashier = user?.role === 'Cashier'

  // --- RAW MATERIALS (Stock › 02 Raw Materials) ---
  const [rawMaterials, setRawMaterials] = useState(() => {
    const saved = recordsMap['RawMaterials']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'MAT-FLOUR',
        name: 'Azania Premium Wheat Flour',
        category: 'Flour & Grains',
        unit: 'kg',
        currentStock: 50,
        minimumStockLevel: 25,
        purchasePriceRWF: 1200,
        supplier: 'Bakhresa Grain Milling Ltd',
        batchCode: 'LOT-401',
        hasExpiry: true,
        expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
      },
      {
        id: 'MAT-SUGAR',
        name: 'White Granulated Sugar',
        category: 'Sweeteners',
        unit: 'kg',
        currentStock: 10,
        minimumStockLevel: 5,
        purchasePriceRWF: 1800,
        supplier: 'Kabuye Sugar Works Ltd',
        batchCode: 'LOT-402',
        hasExpiry: true,
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)
      },
      ...DEFAULT_RAW_MATERIALS.slice(2)
    ]
  })

  // --- FINISHED GOODS (Stock › 01 Finished Goods) ---
  const [finishedGoods, setFinishedGoods] = useState(() => {
    const saved = recordsMap['Inventory']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'PROD-BREAD',
        name: 'Standard Sandwich Loaf (800g)',
        title: 'Standard Sandwich Loaf (800g)',
        category: 'Bread',
        unit: 'loaves',
        currentStock: 145,
        stock: 145,
        minimumStockLevel: 30,
        sellingPriceRWF: 300,
        sellingPrice: 300,
        costPerUnitRWF: 184.62,
        shelfLifeDays: 4,
        batchCode: 'B-001',
        bestBeforeDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10)
      },
      {
        id: 'PROD-BRIOCHE',
        name: 'Artisan Brioche Burger Buns (Pack of 4)',
        title: 'Artisan Brioche Burger Buns (Pack of 4)',
        category: 'Bread',
        unit: 'packs',
        currentStock: 40,
        stock: 40,
        minimumStockLevel: 15,
        sellingPriceRWF: 2500,
        sellingPrice: 2500,
        costPerUnitRWF: 1520,
        shelfLifeDays: 3,
        batchCode: 'B-002',
        bestBeforeDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
      },
      ...DEFAULT_FINISHED_PRODUCTS.slice(2)
    ]
  })

  // --- RECIPES ---
  const [recipes, setRecipes] = useState(() => {
    return [
      {
        id: 'REC-BREAD-200',
        name: 'Standard Loaf (Batch of 200)',
        productId: 'PROD-BREAD',
        productName: 'Standard Sandwich Loaf (800g)',
        yieldQuantity: 200,
        unit: 'loaves',
        wastageAllowancePct: 2.5,
        targetMarginPct: 40,
        costPerUnitRWF: 180,
        ingredients: [
          { materialId: 'MAT-FLOUR', materialName: 'Azania Premium Wheat Flour', quantity: 20, unit: 'kg', unitCost: 1200 },
          { materialId: 'MAT-SUGAR', materialName: 'White Granulated Sugar', quantity: 3, unit: 'kg', unitCost: 1800 }
        ],
        otherCosts: [
          { id: 'cost-1', name: 'Gas & Bakery Labour', amount: 6600 }
        ]
      },
      ...DEFAULT_RECIPES
    ]
  })

  // --- PRODUCTION BATCHES ---
  const [batches, setBatches] = useState(() => {
    const saved = recordsMap['Production']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'BATCH-408',
        batchCode: 'B-408',
        recipeId: 'REC-BREAD-200',
        productId: 'PROD-BREAD',
        productName: 'Standard Sandwich Loaf (800g)',
        plannedQuantity: 200,
        actualQuantity: 195,
        wasteQuantity: 5,
        unit: 'loaves',
        status: 'Completed',
        plannedDate: new Date().toISOString().slice(0, 10),
        completionDate: new Date().toISOString().slice(0, 10),
        responsibleEmployee: 'Jean-Pierre Mugisha',
        plannedCostPerUnitRWF: 180,
        actualCostPerUnitRWF: 184.62,
        isOverPlan: false
      },
      {
        id: 'BATCH-409',
        batchCode: 'B-409',
        recipeId: 'REC-BREAD-200',
        productId: 'PROD-BREAD',
        productName: 'Standard Sandwich Loaf (800g)',
        plannedQuantity: 200,
        unit: 'loaves',
        status: 'In Progress',
        plannedDate: new Date().toISOString().slice(0, 10),
        startTime: new Date().toISOString(),
        targetCompletion: new Date(Date.now() + 2 * 3600000).toISOString(),
        responsibleEmployee: 'Jean-Pierre Mugisha',
        plannedUnitCostRWF: 180,
        ingredientsUsed: [
          { materialId: 'MAT-FLOUR', name: 'Azania Premium Wheat Flour', quantity: 20, unit: 'kg' },
          { materialId: 'MAT-SUGAR', name: 'White Granulated Sugar', quantity: 3, unit: 'kg' }
        ]
      }
    ]
  })

  // --- SALES (Finished Goods Only) ---
  const [sales, setSales] = useState(() => {
    const saved = recordsMap['Sales']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'SALE-101',
        date: new Date().toISOString().slice(0, 10),
        customer: 'Supermarket A (Kigali Heights)',
        productId: 'PROD-BREAD',
        productName: 'Standard Sandwich Loaf (800g)',
        batchCode: 'B-001',
        quantity: 50,
        unit: 'loaves',
        unitPriceRWF: 300,
        totalAmountRWF: 15000,
        amountPaidRWF: 10000,
        balanceRWF: 5000,
        paymentMethod: 'Cash',
        status: 'Partial'
      }
    ]
  })

  // --- PURCHASES (Raw Materials Only) ---
  const [purchases, setPurchases] = useState(() => {
    const saved = recordsMap['Purchases']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'PURCH-301',
        date: new Date().toISOString().slice(0, 10),
        supplier: 'Bakhresa Grain Milling Ltd',
        materialId: 'MAT-FLOUR',
        materialName: 'Azania Premium Wheat Flour',
        lotCode: 'LOT-401',
        quantity: 50,
        unit: 'kg',
        unitPriceRWF: 1200,
        totalAmountRWF: 60000,
        amountPaidRWF: 40000,
        balanceRWF: 20000,
        paymentMethod: 'MTN MoMo Business',
        status: 'Partial'
      },
      {
        id: 'PURCH-302',
        date: new Date().toISOString().slice(0, 10),
        supplier: 'Kabuye Sugar Works Ltd',
        materialId: 'MAT-SUGAR',
        materialName: 'White Granulated Sugar',
        lotCode: 'LOT-402',
        quantity: 10,
        unit: 'kg',
        unitPriceRWF: 1800,
        totalAmountRWF: 18000,
        amountPaidRWF: 0,
        balanceRWF: 18000,
        paymentMethod: 'Supplier Credit',
        status: 'Unpaid'
      }
    ]
  })

  // --- CUSTOMERS ---
  const [customers, setCustomers] = useState(() => {
    const saved = recordsMap['Customers']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'CUST-001',
        name: 'Supermarket A (Kigali Heights)',
        phone: '+250 788 123 456',
        address: 'Kigali Heights Ground Floor',
        balanceRWF: 5000,
        totalBoughtRWF: 15000,
        creditLimitRWF: 200000
      },
      {
        id: 'CUST-002',
        name: 'Sawa City Supermarket (Nyarutarama)',
        phone: '+250 788 987 654',
        address: 'KG 9 Ave, Nyarutarama',
        balanceRWF: 0,
        totalBoughtRWF: 48000,
        creditLimitRWF: 300000
      }
    ]
  })

  // --- SUPPLIERS ---
  const [suppliers, setSuppliers] = useState(() => {
    const saved = recordsMap['Suppliers']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'SUP-001',
        name: 'Bakhresa Grain Milling Ltd',
        phone: '+250 788 412 881',
        materialsSupplied: 'Azania Premium Wheat Flour (50kg sacks)',
        balanceOwedRWF: 20000,
        totalPurchasedRWF: 60000
      },
      {
        id: 'SUP-002',
        name: 'Kabuye Sugar Works Ltd',
        phone: '+250 788 300 120',
        materialsSupplied: 'White Granulated Sugar (25kg bags)',
        balanceOwedRWF: 18000,
        totalPurchasedRWF: 18000
      }
    ]
  })

  // --- EXPENSES ---
  const [expenses, setExpenses] = useState(() => {
    const saved = recordsMap['Expenses']
    if (saved && saved.length > 0) return saved
    return [
      {
        id: 'EXP-201',
        date: new Date().toISOString().slice(0, 10),
        category: 'Workshop Rent',
        amountRWF: 15000,
        paidFrom: 'Main Cash Till',
        paidTo: 'Workshop Landlord',
        description: 'Daily operational rent apportionment',
        repeatMonthly: true
      }
    ]
  })

  // --- CATEGORIES (Stock › 04 Categories) ---
  const [categories, setCategories] = useState(() => {
    const saved = recordsMap['Categories']
    if (saved && Array.isArray(saved) && saved.length > 0) return saved
    return [
      { id: 'cat-bread', name: 'Bread', description: 'Standard loaves, baguettes, and sandwich rolls', status: 'Active' },
      { id: 'cat-cakes', name: 'Cakes', description: 'Celebration cakes, cupcakes, and muffins', status: 'Active' },
      { id: 'cat-pastries', name: 'Pastries', description: 'Croissants, brioches, and danishes', status: 'Active' },
      { id: 'cat-flour', name: 'Flour & Grains', description: 'Wheat flour, rye flour, cornmeal raw inputs', status: 'Active' },
      { id: 'cat-sweet', name: 'Sweeteners', description: 'White sugar, brown sugar, icing sugar', status: 'Active' },
      { id: 'cat-pack', name: 'Packaging', description: 'Bread bags, cake boxes, clips, labels', status: 'Active' }
    ]
  })

  // Sync back to ExbosContext workspace records whenever updated
  useEffect(() => {
    if (updateDemoWorkspace) {
      updateDemoWorkspace('make-and-sell', {
        records: {
          ...recordsMap,
          Inventory: finishedGoods,
          RawMaterials: rawMaterials,
          Production: batches,
          Sales: sales,
          Purchases: purchases,
          Customers: customers,
          Suppliers: suppliers,
          Expenses: expenses,
          Categories: categories
        }
      })
    }
  }, [finishedGoods, rawMaterials, batches, sales, purchases, customers, suppliers, expenses, categories])

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
          onUpdateCategories={setCategories}
          onUpdateRawMaterials={setRawMaterials}
          onUpdateFinishedGoods={setFinishedGoods}
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
          onUpdateBatches={setBatches}
          onUpdateRawMaterials={setRawMaterials}
          onUpdateFinishedGoods={setFinishedGoods}
          onOpenCreatePurchase={(shortage) => {
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
          onUpdateSales={setSales}
          onUpdateFinishedGoods={setFinishedGoods}
          onUpdateCustomers={setCustomers}
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
          onUpdatePurchases={setPurchases}
          onUpdateRawMaterials={setRawMaterials}
          onUpdateSuppliers={setSuppliers}
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
          onUpdateCustomers={setCustomers}
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
          onUpdateSuppliers={setSuppliers}
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
          onUpdateExpenses={setExpenses}
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
            onOpenBatch={(b) => {
              if (onSwitchPage) {
                onSwitchPage('Production', 'In Progress')
              }
            }}
            onReorderMaterial={(m) => {
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

