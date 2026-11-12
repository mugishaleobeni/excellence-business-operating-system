import React, { useState, useEffect } from 'react'
import { useExbos } from '../../../../context/ExbosContext'
import ProductionOverview from './ProductionOverview'
import ProductionOrders from './ProductionOrders'
import RecipeManager from './RecipeManager'
import ProductionCalculator from './ProductionCalculator'
import ProductionCosts from './ProductionCosts'
import DeleteConfirmModal from '../../common/DeleteConfirmModal'
import {
  DEFAULT_RAW_MATERIALS,
  DEFAULT_FINISHED_PRODUCTS,
  DEFAULT_RECIPES,
  DEFAULT_PRODUCTION_ORDERS
} from '../data/makeSellDefaults'

export default function ProductionManager({
  activePage = 'Production Overview',
  onSubpageChange = null,
  activeArchId = 'make-and-sell'
}) {
  const {
    demoWorkspaces,
    addDemoRecord,
    updateDemoRecord,
    deleteDemoRecord,
    addTransaction,
    hideFinancials
  } = useExbos()

  // Load from workspace or defaults
  const ws = demoWorkspaces?.[activeArchId] || {}
  const wsRecords = ws.records || {}

  // 1. Production Orders State
  const [orders, setOrders] = useState(() => {
    const existing = wsRecords['Production'] || []
    if (existing.length > 0) {
      return existing.map((r, idx) => ({
        id: r.id || `PO-${idx + 100}`,
        productId: r.productId || 'FP-BREAD-01',
        productName: r.productName || r.title || 'Finished Good',
        recipeId: r.recipeId || 'REC-BREAD-100',
        plannedQuantity: Number(r.plannedQuantity ?? r.quantity ?? 100),
        actualQuantity: Number(r.actualQuantity ?? (r.status?.includes('Complete') ? r.quantity : 0)),
        status: r.status?.includes('Complete') ? 'Completed' : r.status?.includes('Progress') ? 'In Progress' : 'Planned',
        plannedDate: r.date || '2026-10-30',
        completionDate: r.completionDate || (r.status?.includes('Complete') ? r.date : null),
        responsibleEmployee: r.responsibleEmployee || 'Jean-Pierre Mugisha',
        totalProductionCostRWF: Number(r.totalProductionCostRWF || r.amountRWF || 0),
        unitCostRWF: Number(r.unitCostRWF || 980),
        wasteQuantity: Number(r.wasteQuantity || 0),
        notes: r.notes || ''
      }))
    }
    return DEFAULT_PRODUCTION_ORDERS
  })

  // 2. Recipes State
  const [recipes, setRecipes] = useState(DEFAULT_RECIPES)

  // 3. Products & Raw Materials State
  const [products, setProducts] = useState(DEFAULT_FINISHED_PRODUCTS)
  const [rawMaterials, setRawMaterials] = useState(() => {
    const inv = wsRecords['Inventory'] || []
    const rawInv = inv.filter((i) => i.subPage === 'Raw Materials' || (i.sellingPriceRWF === 0 && !i.subPage?.includes('Finished')))
    if (rawInv.length > 0) {
      return rawInv.map((item) => ({
        id: item.id,
        name: item.title || item.name,
        category: item.category || 'Grains & Flours',
        unit: item.unit || 'kg',
        packageSize: item.packageSize || 50,
        purchasePriceRWF: Number(item.unitCostRWF || item.purchasePriceRWF || 880),
        currentStock: Number(item.quantity ?? item.currentStock ?? 100),
        minimumStockLevel: Number(item.minimumStockLevel ?? item.lowStockAlert ?? 20),
        supplier: item.supplier || 'Primary Supplier',
        description: item.description || ''
      }))
    }
    return DEFAULT_RAW_MATERIALS
  })

  // Toast feedback state
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const showToast = (toastObj) => {
    setToast(toastObj)
    setTimeout(() => setToast(null), 4000)
  }

  // Handle Starting a Production Order
  const handleStartOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'In Progress' } : o))
    )
    showToast({
      type: 'info',
      title: 'Production Order Started',
      message: `Batch ${orderId} moved to In Progress stage.`
    })
  }

  // Handle Complete Order (Part 13 & Test I)
  // Confirms good units, deducts raw materials, adds finished products, records waste
  const handleCompleteOrder = (completionPayload) => {
    const {
      orderId,
      productId,
      productName,
      recipeId,
      actualQuantity,
      wasteQuantity,
      totalProductionCostRWF,
      unitCostRWF,
      completionDate
    } = completionPayload

    // 1. Update order status in local state
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Completed',
            actualQuantity,
            wasteQuantity,
            totalProductionCostRWF,
            unitCostRWF,
            completionDate
          }
        }
        return o
      })
    )

    // 2. Add finished goods to products stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            currentStock: (p.currentStock || 0) + actualQuantity,
            unitProductionCostRWF: unitCostRWF
          }
        }
        return p
      })
    )

    // 3. Deduct consumed raw materials from inventory based on recipe
    const recipe = recipes.find((r) => r.id === recipeId)
    if (recipe && recipe.ingredients) {
      const baseYield = Math.max(1, recipe.yield || 1)
      const scale = actualQuantity / baseYield

      setRawMaterials((prev) =>
        prev.map((mat) => {
          const ing = recipe.ingredients.find(
            (i) => i.materialId === mat.id || i.name === mat.name
          )
          if (ing) {
            const consumed = (Number(ing.quantity) || 0) * scale
            const newStock = Math.max(0, Number((mat.currentStock - consumed).toFixed(2)))
            return {
              ...mat,
              currentStock: newStock
            }
          }
          return mat
        })
      )
    }

    // 4. Record to context demo record
    addDemoRecord(activeArchId, 'Production', {
      id: orderId,
      title: `Batch ${orderId} · ${actualQuantity} pcs ${productName}`,
      subPage: 'Completed Batches',
      quantity: actualQuantity,
      unitCostRWF,
      totalProductionCostRWF,
      wasteQuantity,
      status: 'Completed',
      date: completionDate
    })

    // Also add to finished goods stock record
    addDemoRecord(activeArchId, 'Inventory', {
      id: `INV-${Date.now().toString().slice(-4)}`,
      title: `${productName} (Manufactured Batch)`,
      subPage: 'Finished Products',
      quantity: actualQuantity,
      unitCostRWF,
      sellingPriceRWF: products.find((p) => p.id === productId)?.sellingPriceRWF || 0,
      status: 'In Stock · Finished Goods',
      date: completionDate
    })
  }

  // Handle Create Order
  const handleCreateOrder = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev])
    addDemoRecord(activeArchId, 'Production', {
      id: newOrder.id,
      title: `Batch ${newOrder.id} · ${newOrder.plannedQuantity} pcs ${newOrder.productName}`,
      subPage: 'Production Orders',
      quantity: newOrder.plannedQuantity,
      unitCostRWF: newOrder.unitCostRWF,
      status: 'Planned',
      date: newOrder.plannedDate
    })
  }

  // Handle Delete Order
  const handleDeleteOrder = (orderId) => {
    setDeleteConfirm({
      title: 'Delete Production Order',
      itemName: `Order ${orderId}`,
      description: `Are you sure you want to delete order ${orderId}? This action cannot be undone.`,
      confirmText: 'Delete Order',
      onConfirm: () => {
        setOrders((prev) => prev.filter((o) => String(o.id) !== String(orderId)))
        deleteDemoRecord(activeArchId, 'Production', orderId)
        showToast({
          type: 'info',
          title: 'Order Deleted',
          message: `Order ${orderId} has been removed.`
        })
      }
    })
  }

  // Handle Save Recipe
  const handleSaveRecipe = (newRecipe) => {
    setRecipes((prev) => {
      const idx = prev.findIndex((r) => r.id === newRecipe.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = newRecipe
        return updated
      }
      return [newRecipe, ...prev]
    })
  }

  // Handle Delete Recipe
  const handleDeleteRecipe = (recipeId) => {
    const rec = recipes.find((r) => String(r.id) === String(recipeId))
    const recName = rec?.name || rec?.productName || recipeId
    setDeleteConfirm({
      title: 'Delete Recipe Formula',
      itemName: recName,
      description: `Are you sure you want to delete this recipe formula? This will remove the bill of materials from your registry.`,
      confirmText: 'Delete Recipe',
      onConfirm: () => {
        setRecipes((prev) => prev.filter((r) => String(r.id) !== String(recipeId)))
        deleteDemoRecord(activeArchId, 'Production', recipeId)
        showToast({
          type: 'info',
          title: 'Recipe Deleted',
          message: 'Recipe formula removed from BOM registry.'
        })
      }
    })
  }

  // Handle Create Purchase Draft from Calculator (Part 8 & 15)
  const handleCreatePurchaseDraft = (recommendations = []) => {
    recommendations.forEach((rec) => {
      addDemoRecord(activeArchId, 'Purchases', {
        id: `PUR-ORD-${Math.floor(100 + Math.random() * 900)}`,
        title: `Draft Order: ${rec.suggestedQuantity} ${rec.unit} × ${rec.name}`,
        subPage: 'Purchase Orders',
        quantity: rec.suggestedQuantity,
        unit: rec.unit,
        unitPriceRWF: rec.unitPrice,
        amountRWF: rec.estimatedTotal,
        supplier: rec.supplier || 'Primary Supplier',
        status: 'Purchase Order Draft',
        date: new Date().toISOString().slice(0, 10)
      })
    })

    showToast({
      type: 'success',
      title: 'Purchase Drafts Created',
      message: `Created ${recommendations.length} purchase drafts in Purchases module.`
    })
  }

  // Subnavigation Switcher
  const renderCurrentView = () => {
    switch (activePage) {
      case 'Production Orders':
      case 'Batches':
        return (
          <ProductionOrders
            orders={orders}
            recipes={recipes}
            products={products}
            rawMaterials={rawMaterials}
            onStartOrder={handleStartOrder}
            onCompleteOrder={handleCompleteOrder}
            onCreateOrder={handleCreateOrder}
            onDeleteOrder={handleDeleteOrder}
            hideFinancials={hideFinancials}
            addToast={showToast}
          />
        )

      case 'Recipes & Materials':
      case 'Recipes & Formulas':
        return (
          <RecipeManager
            recipes={recipes}
            rawMaterials={rawMaterials}
            products={products}
            onSaveRecipe={handleSaveRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            hideFinancials={hideFinancials}
            addToast={showToast}
          />
        )

      case 'Production Calculator':
        return (
          <ProductionCalculator
            products={products}
            recipes={recipes}
            rawMaterials={rawMaterials}
            onStartProduction={(plan) => {
              handleCreateOrder({
                ...plan,
                id: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                plannedDate: new Date().toISOString().slice(0, 10),
                status: 'In Progress'
              })
              if (onSubpageChange) onSubpageChange('Production Orders')
            }}
            onCreatePurchaseDraft={handleCreatePurchaseDraft}
            onSaveDraft={(draft) => {
              handleCreateOrder({
                ...draft,
                id: `DRAFT-${Math.floor(100 + Math.random() * 900)}`,
                plannedDate: new Date().toISOString().slice(0, 10),
                status: 'Planned'
              })
            }}
            hideFinancials={hideFinancials}
            addToast={showToast}
          />
        )

      case 'Production History':
      case 'Completed Batches':
        return (
          <ProductionOrders
            orders={orders.filter((o) => o.status === 'Completed')}
            recipes={recipes}
            products={products}
            rawMaterials={rawMaterials}
            hideFinancials={hideFinancials}
            addToast={showToast}
          />
        )

      case 'Production Costs':
        return (
          <ProductionCosts
            orders={orders}
            recipes={recipes}
            products={products}
            hideFinancials={hideFinancials}
          />
        )

      case 'Production Overview':
      case 'In Progress':
      default:
        return (
          <ProductionOverview
            orders={orders}
            recipes={recipes}
            rawMaterials={rawMaterials}
            onNavigateTo={onSubpageChange}
            hideFinancials={hideFinancials}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-white'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-white'
              : 'bg-[#071644]/95 border-[#218DFF]/50 text-white'
          }`}
        >
          <div className="space-y-0.5">
            <strong className="block text-xs font-bold">{toast.title}</strong>
            <span className="text-[11px] text-slate-300">{toast.message}</span>
          </div>
        </div>
      )}

      {renderCurrentView()}

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={deleteConfirm?.title || 'Delete Record'}
        itemName={deleteConfirm?.itemName}
        description={deleteConfirm?.description}
        confirmText={deleteConfirm?.confirmText || 'Delete'}
        onConfirm={() => {
          if (deleteConfirm?.onConfirm) {
            deleteConfirm.onConfirm()
          }
          setDeleteConfirm(null)
        }}
      />
    </div>
  )
}

