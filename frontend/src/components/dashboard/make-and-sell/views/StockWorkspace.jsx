import React, { useState, useMemo } from 'react'
import {
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Clock,
  ArrowUpDown,
  Calculator,
  Eye,
  Edit2,
  Trash2,
  Printer,
  X,
  ShoppingCart,
  Boxes,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import ExportDrawer from '../ExportDrawer'
import PriceCalculatorPanel from '../PriceCalculatorPanel'
import CustomSelect from '../../../common/CustomSelect'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'
import { printBusinessDocument } from '../../../../utils/printDocument'
import { useExbos } from '../../../../context/ExbosContext'

const PRODUCT_UNIT_OPTIONS = [
  { isHeader: true, label: 'Length & Linear' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'yd', label: 'Yards (yd)' },
  { value: 'ft', label: 'Feet (ft)' },
  { isHeader: true, label: 'Count & Packaging' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'loaf', label: 'Loaf / Loaves' },
  { value: 'pack', label: 'Pack / Packs' },
  { value: 'box', label: 'Box / Boxes' },
  { value: 'pair', label: 'Pair / Pairs' },
  { value: 'set', label: 'Set / Sets' },
  { value: 'roll', label: 'Roll / Rolls' },
  { value: 'sheet', label: 'Sheet / Sheets' },
  { value: 'bundle', label: 'Bundle / Bundles' },
  { value: 'bag', label: 'Bag / Sack' },
  { value: 'bottle', label: 'Bottle / Bottles' },
  { value: 'can', label: 'Can / Cans' },
  { isHeader: true, label: 'Weight & Mass' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'ton', label: 'Tons (t)' },
  { isHeader: true, label: 'Volume & Liquids' },
  { value: 'L', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { isHeader: true, label: 'Surface & Area' },
  { value: 'sqm', label: 'Square Meters (m²)' }
]

const RAW_MATERIAL_UNIT_OPTIONS = [
  { isHeader: true, label: 'Length & Linear (Fabrics, Timber, Piping, Wire)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'yd', label: 'Yards (yd)' },
  { value: 'ft', label: 'Feet (ft)' },
  { isHeader: true, label: 'Weight & Mass (Flour, Sugar, Grain, Metal)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'ton', label: 'Tons (t)' },
  { isHeader: true, label: 'Volume & Liquids (Milk, Oil, Chemical, Flavor)' },
  { value: 'L', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { isHeader: true, label: 'Count, Sheets & Packaging' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'roll', label: 'Rolls (roll)' },
  { value: 'sheet', label: 'Sheets (sheet)' },
  { value: 'bundle', label: 'Bundles (bundle)' },
  { value: 'pack', label: 'Packs (pack)' },
  { value: 'box', label: 'Boxes (box)' },
  { value: 'bag', label: 'Bags / Sacks (bag)' },
  { isHeader: true, label: 'Area & Surface' },
  { value: 'sqm', label: 'Square Meters (m²)' }
]

export default function StockWorkspace({
  activeSubPage = 'Finished Goods',
  rawMaterials = [],
  finishedGoods = [],
  recipes = [],
  categories = ['Bread', 'Cakes', 'Pastries', 'Flour & Grains', 'Sweeteners', 'Packaging'],
  onUpdateCategories = null,
  onUpdateRawMaterials = null,
  onUpdateFinishedGoods = null,
  onOpenReceiveStock = null,
  onOpenPriceCalculator = null,
  isCashier = false,
  hideFinancials = false,
  addToast = null
}) {
  const { user, demoWorkspaces } = useExbos?.() || {}
  const activeBizName = user?.businessName || demoWorkspaces?.['make-and-sell']?.businessName || 'ExBOS Make & Sell Enterprise'

  // Immediate local state fallback synchronized with props
  const [internalCategories, setInternalCategories] = useState(null)

  const activeCategoriesSource = useMemo(() => {
    return internalCategories || categories || []
  }, [internalCategories, categories])

  // Normalize categories to structured objects { id, name, description, status }
  const normalizedCategories = useMemo(() => {
    return activeCategoriesSource.map((cat, idx) => {
      if (typeof cat === 'string') {
        return {
          id: `cat-${idx}-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: cat,
          description: `Operational category for ${cat}`,
          status: 'Active'
        }
      }
      return {
        id: cat.id || `cat-${idx}-${(cat.name || 'item').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: cat.name || cat.title || 'Category',
        description: cat.description || `Operational category for ${cat.name || 'products'}`,
        status: cat.status || 'Active'
      }
    })
  }, [activeCategoriesSource])

  const categoryNames = useMemo(() => {
    return normalizedCategories.map((c) => c.name)
  }, [normalizedCategories])

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [stockTab, setStockTab] = useState('All') // 'All' | 'Expiring Soon' | 'Expired'
  const [categorySearchQuery, setCategorySearchQuery] = useState('')

  // Drawer / Modal states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState('product') // 'product' | 'material' | 'category'
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirmData, setDeleteConfirmData] = useState(null)

  // In-line Price Calculator modal for a finished product
  const [calcProduct, setCalcProduct] = useState(null)

  // Form State: Product (Finished Good)
  const [prodName, setProdName] = useState('')
  const [prodCategory, setProdCategory] = useState(categoryNames[0] || 'Bread')
  const [prodUnit, setProdUnit] = useState('pcs')
  const [prodCostPerUnit, setProdCostPerUnit] = useState('')
  const [prodSellingPrice, setProdSellingPrice] = useState('')
  const [prodShelfLifeDays, setProdShelfLifeDays] = useState(4)
  const [prodBestBeforeDate, setProdBestBeforeDate] = useState(() =>
    new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10)
  )
  const [prodReorderLevel, setProdReorderLevel] = useState(20)
  const [prodOpeningStock, setProdOpeningStock] = useState(0)
  const [prodBatchCode, setProdBatchCode] = useState('B-101')

  // Form State: Material (Raw Material)
  const [matName, setMatName] = useState('')
  const [matCategory, setMatCategory] = useState(categoryNames[3] || 'Flour & Grains')
  const [matUnit, setMatUnit] = useState('kg')
  const [matPurchasePrice, setMatPurchasePrice] = useState('')
  const [matReorderLevel, setMatReorderLevel] = useState(50)
  const [matOpeningQty, setMatOpeningQty] = useState(0)
  const [matHasExpiry, setMatHasExpiry] = useState(true)
  const [matExpiryDate, setMatExpiryDate] = useState('')

  // Form State: Category
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')

  // Helper date calculations
  const now = new Date()

  // --- Filtering Finished Goods ---
  const filteredFinishedGoods = useMemo(() => {
    return finishedGoods.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (item.name || item.title || '').toLowerCase().includes(q) ||
        (item.batchCode || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)

      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory

      if (!matchesSearch || !matchesCat) return false

      if (stockTab === 'Fresh' || stockTab === 'Fresh / Valid') {
        const bb = item.bestBeforeDate || item.expiryDate
        if (!bb) return true
        const diffDays = Math.ceil((new Date(bb) - now) / (1000 * 60 * 60 * 24))
        return diffDays > 30
      }
      if (stockTab === 'Expiring Soon') {
        const bb = item.bestBeforeDate || item.expiryDate
        if (!bb) return false
        const diffDays = Math.ceil((new Date(bb) - now) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 30
      }
      if (stockTab === 'Expired') {
        const bb = item.bestBeforeDate || item.expiryDate
        if (!bb) return false
        const diffDays = Math.ceil((new Date(bb) - now) / (1000 * 60 * 60 * 24))
        return diffDays < 0
      }

      return true
    })
  }, [finishedGoods, searchQuery, selectedCategory, stockTab])

  // --- Filtering Raw Materials ---
  const filteredRawMaterials = useMemo(() => {
    return rawMaterials.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.supplier || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)

      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [rawMaterials, searchQuery, selectedCategory])

  // --- Low Stock Items ---
  const lowStockMaterials = useMemo(() => {
    return rawMaterials.filter((m) => {
      const stock = Number(m.currentStock || m.stock || 0)
      const minStock = Number(m.minimumStockLevel || m.minStock || 20)
      return stock <= minStock
    })
  }, [rawMaterials])

  // Summary Strips
  const finishedSummary = useMemo(() => {
    const totalValue = finishedGoods.reduce((sum, p) => {
      const stock = Number(p.currentStock || p.stock || 0)
      const price = Number(p.sellingPriceRWF || p.sellingPrice || 0)
      return sum + stock * price
    }, 0)
    const totalUnits = finishedGoods.reduce((sum, p) => sum + (Number(p.currentStock || p.stock || 0)), 0)
    const expiring = finishedGoods.filter((p) => {
      const bb = p.bestBeforeDate || p.expiryDate
      if (!bb) return false
      const diff = Math.ceil((new Date(bb) - now) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 30
    }).length
    const expired = finishedGoods.filter((p) => {
      const bb = p.bestBeforeDate || p.expiryDate
      if (!bb) return false
      const diff = Math.ceil((new Date(bb) - now) / (1000 * 60 * 60 * 24))
      return diff < 0
    }).length
    const fresh = finishedGoods.filter((p) => {
      const bb = p.bestBeforeDate || p.expiryDate
      if (!bb) return true
      const diff = Math.ceil((new Date(bb) - now) / (1000 * 60 * 60 * 24))
      return diff > 30
    }).length
    return { totalValue, totalUnits, expiring, expired, fresh }
  }, [finishedGoods])

  const rawSummary = useMemo(() => {
    const totalValue = rawMaterials.reduce((sum, m) => {
      const stock = Number(m.currentStock || m.stock || 0)
      const cost = Number(m.purchasePriceRWF || 0)
      return sum + stock * cost
    }, 0)
    const totalItems = rawMaterials.length
    const lowCount = lowStockMaterials.length
    return { totalValue, totalItems, lowCount }
  }, [rawMaterials, lowStockMaterials])

  // Filtered categories
  const filteredCategoriesList = useMemo(() => {
    if (!categorySearchQuery.trim()) return normalizedCategories
    const q = categorySearchQuery.toLowerCase().trim()
    return normalizedCategories.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    )
  }, [normalizedCategories, categorySearchQuery])

  // Category Actions
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      alert('Please enter a category name.')
      return
    }

    if (editingCategory) {
      const updated = normalizedCategories.map((c) =>
        c.id === editingCategory.id
          ? { ...c, name: trimmed, description: newCategoryDesc.trim() || c.description }
          : c
      )
      setInternalCategories(updated)
      if (onUpdateCategories) {
        onUpdateCategories(updated)
      }
      if (addToast) {
        addToast({
          type: 'success',
          title: 'Category Updated',
          message: `Category "${trimmed}" updated successfully.`
        })
      }
      setEditingCategory(null)
      setNewCategoryName('')
      setNewCategoryDesc('')
      setCategoryModalOpen(false)
      return
    }

    const alreadyExists = normalizedCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadyExists) {
      if (addToast) {
        addToast({
          type: 'warning',
          title: 'Category Already Exists',
          message: `Category "${trimmed}" is already in your category list.`
        })
      }
      return
    }

    const newCatObj = {
      id: `CAT-${Date.now()}`,
      name: trimmed,
      description: newCategoryDesc.trim() || `Operational category for ${trimmed}`,
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10)
    }

    const updated = [...normalizedCategories, newCatObj]
    setInternalCategories(updated)

    if (onUpdateCategories) {
      onUpdateCategories(updated)
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Category Registered',
        message: `Category "${trimmed}" registered successfully and added to stock categories.`
      })
    }

    setNewCategoryName('')
    setNewCategoryDesc('')
    setCategoryModalOpen(false)
  }

  const handleDeleteCategory = (catId, catName) => {
    setDeleteConfirmData({
      title: 'Remove Category',
      itemName: catName,
      description: `Are you sure you want to remove category "${catName}"? Items assigned to this category will become Uncategorized.`,
      confirmText: 'Remove Category',
      onConfirm: () => {
        const updated = normalizedCategories.filter((c) => c.id !== catId && c.name !== catName)
        setInternalCategories(updated)
        if (onUpdateCategories) {
          onUpdateCategories(updated)
        }
        if (addToast) {
          addToast({
            type: 'info',
            title: 'Category Removed',
            message: `Category "${catName}" removed from stock categories.`
          })
        }
      }
    })
  }

  const handleEditCategory = (cat) => {
    setEditingCategory(cat)
    setNewCategoryName(cat.name)
    setNewCategoryDesc(cat.description || '')
    setCategoryModalOpen(true)
  }

  // Open Product Drawer
  const handleOpenNewProduct = () => {
    setEditItem(null)
    setProdName('')
    setProdCategory(categoryNames[0] || 'Bread')
    setProdUnit('pcs')
    setProdCostPerUnit('')
    setProdSellingPrice('')
    setProdShelfLifeDays(4)
    setProdReorderLevel(20)
    setProdOpeningStock(0)
    setProdBatchCode(`B-${Math.floor(100 + Math.random() * 900)}`)
    setShowMoreOptions(false)
    setDrawerType('product')
    setDrawerOpen(true)
  }

  // Open Raw Material Drawer
  const handleOpenNewMaterial = () => {
    setEditItem(null)
    setMatName('')
    setMatCategory(categoryNames[3] || 'Flour & Grains')
    setMatUnit('kg')
    setMatPurchasePrice('')
    setMatReorderLevel(50)
    setMatOpeningQty(0)
    setMatHasExpiry(true)
    setMatExpiryDate(new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10))
    setShowMoreOptions(false)
    setDrawerType('material')
    setDrawerOpen(true)
  }

  // Save Finished Product
  const handleSaveProduct = (keepOpen = false) => {
    if (!prodName.trim()) {
      alert('Please enter a product name.')
      return
    }

    const newProd = {
      id: editItem ? editItem.id : `PROD-${Date.now()}`,
      name: prodName.trim(),
      category: prodCategory,
      unit: prodUnit,
      sellingPriceRWF: Number(prodSellingPrice) || 0,
      costPerUnitRWF: prodCostPerUnit !== '' ? Number(prodCostPerUnit) : (editItem?.costPerUnitRWF || Math.round((Number(prodSellingPrice) || 0) * 0.6)),
      shelfLifeDays: Number(prodShelfLifeDays) || 4,
      minimumStockLevel: Number(prodReorderLevel) || 20,
      currentStock: editItem ? editItem.currentStock : Number(prodOpeningStock) || 0,
      batchCode: prodBatchCode,
      bestBeforeDate: new Date(Date.now() + (Number(prodShelfLifeDays) || 4) * 86400000).toISOString().slice(0, 10)
    }

    if (onUpdateFinishedGoods) {
      if (editItem) {
        onUpdateFinishedGoods(finishedGoods.map((p) => (p.id === editItem.id ? newProd : p)))
      } else {
        onUpdateFinishedGoods([newProd, ...finishedGoods])
      }
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Product Saved',
        message: `Finished good "${newProd.name}" saved successfully.`
      })
    }

    if (keepOpen) {
      handleOpenNewProduct()
    } else {
      setDrawerOpen(false)
    }
  }

  // Save Raw Material
  const handleSaveMaterial = (keepOpen = false) => {
    if (!matName.trim()) {
      alert('Please enter a material name.')
      return
    }

    const newMat = {
      id: editItem ? editItem.id : `MAT-${Date.now()}`,
      name: matName.trim(),
      category: matCategory,
      unit: matUnit,
      purchasePriceRWF: Number(matPurchasePrice) || 0,
      minimumStockLevel: Number(matReorderLevel) || 20,
      currentStock: editItem ? editItem.currentStock : Number(matOpeningQty) || 0,
      hasExpiry: matHasExpiry,
      expiryDate: matHasExpiry ? matExpiryDate : null,
      batchCode: `LOT-${Math.floor(1000 + Math.random() * 9000)}`
    }

    if (onUpdateRawMaterials) {
      if (editItem) {
        onUpdateRawMaterials(rawMaterials.map((m) => (m.id === editItem.id ? newMat : m)))
      } else {
        onUpdateRawMaterials([newMat, ...rawMaterials])
      }
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Material Saved',
        message: `Raw material "${newMat.name}" recorded in stock.`
      })
    }

    if (keepOpen) {
      handleOpenNewMaterial()
    } else {
      setDrawerOpen(false)
    }
  }

  // Delete Item
  const handleDeleteItem = (item, type) => {
    if (!item) return
    const name = item.name || item.title || item.id || 'item'
    setDeleteConfirmData({
      title: type === 'product' ? 'Delete Finished Good' : 'Delete Raw Material',
      itemName: name,
      description: `Are you sure you want to permanently delete "${name}"? This item will be removed from your active stock records.`,
      confirmText: 'Delete Item',
      onConfirm: () => {
        if (type === 'product' && onUpdateFinishedGoods) {
          onUpdateFinishedGoods(finishedGoods.filter((p) => p.id !== item.id))
        } else if (type === 'material' && onUpdateRawMaterials) {
          onUpdateRawMaterials(rawMaterials.filter((m) => m.id !== item.id))
        }
        setDetailItem(null)
        if (addToast) {
          addToast({
            type: 'info',
            title: 'Item Removed',
            message: `"${name}" removed from stock.`
          })
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Help Line + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Stock · {activeSubPage}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSubPage === 'Finished Goods' && 'Finished Goods (Ready to Sell)'}
            {activeSubPage === 'Raw Materials' && 'Raw Materials & Ingredients'}
            {activeSubPage === 'Low Stock' && 'Low Stock & Production Shortages'}
            {activeSubPage === 'Categories' && 'Product & Material Categories'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {activeSubPage === 'Finished Goods' &&
              'Manage ready-to-sell batches with FEFO tracking, unit costs, and live price derivation.'}
            {activeSubPage === 'Raw Materials' &&
              'Track input materials, purchase lots, supplier pricing, and expiry dates for production.'}
            {activeSubPage === 'Low Stock' &&
              'Reorder critical ingredients below threshold before production batches are blocked.'}
            {activeSubPage === 'Categories' &&
              'Group your raw materials and finished products into clean operational categories.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
          >
            Export
          </button>

          {activeSubPage === 'Finished Goods' && (
            <button
              type="button"
              onClick={handleOpenNewProduct}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Product</span>
            </button>
          )}

          {activeSubPage === 'Raw Materials' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenReceiveStock || handleOpenNewMaterial}
                className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <ShoppingCart className="w-4 h-4 text-[#9EDCFF]" />
                <span>Receive Stock</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNewMaterial}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer"
              >
                <span>+ New Material</span>
              </button>
            </div>
          )}

          {activeSubPage === 'Categories' && (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null)
                setNewCategoryName('')
                setNewCategoryDesc('')
                setCategoryModalOpen(true)
              }}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Category</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Number Summary Strip with Expiration Health Monitor */}
      {activeSubPage === 'Finished Goods' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
              Total Stock Value
            </span>
            <div className="font-orbitron text-2xl font-bold text-white">
              {!hideFinancials && !isCashier ? formatRWF(finishedSummary.totalValue) : '•••••• RWF'}
            </div>
            <span className="text-[11px] text-slate-400">At retail selling price</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
              Units Available
            </span>
            <div className="font-orbitron text-2xl font-bold text-white">
              {finishedSummary.totalUnits.toLocaleString()} pcs
            </div>
            <span className="text-[11px] text-slate-400">Ready for store or delivery</span>
          </div>

          <div
            onClick={() => setStockTab('Expiring Soon')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
              stockTab === 'Expiring Soon'
                ? 'bg-amber-500/20 border-amber-500/60 shadow-lg'
                : 'bg-white/5 border-white/10 hover:border-amber-500/40'
            }`}
          >
            <span className="text-[10px] font-orbitron uppercase text-amber-300/90 tracking-wider flex items-center justify-between">
              <span>Expiring Soon (≤30d)</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="font-orbitron text-2xl font-bold text-amber-400">
              {finishedSummary.expiring} lots
            </div>
            <span className="text-[11px] text-slate-400">Prioritized for sale (FEFO)</span>
          </div>

          <div
            onClick={() => setStockTab('Expired')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
              finishedSummary.expired > 0
                ? stockTab === 'Expired'
                  ? 'bg-rose-500/25 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                  : 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <span className="text-[10px] font-orbitron uppercase text-rose-300 tracking-wider flex items-center justify-between">
              <span>Expired Lots</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${finishedSummary.expired > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            </span>
            <div className={`font-orbitron text-2xl font-bold ${finishedSummary.expired > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {finishedSummary.expired} {finishedSummary.expired === 1 ? 'lot' : 'lots'}
            </div>
            <span className="text-[11px] text-slate-400">
              {finishedSummary.expired > 0 ? 'Action required: scrap or remove' : 'Zero expired stock (healthy)'}
            </span>
          </div>
        </div>
      )}

      {activeSubPage === 'Raw Materials' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
              Total Raw Material Value
            </span>
            <div className="font-orbitron text-2xl font-bold text-white">
              {!hideFinancials && !isCashier ? formatRWF(rawSummary.totalValue) : '•••••• RWF'}
            </div>
            <span className="text-[11px] text-slate-400">Valued at latest purchase price</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
              Tracked Ingredients
            </span>
            <div className="font-orbitron text-2xl font-bold text-white">{rawSummary.totalItems}</div>
            <span className="text-[11px] text-slate-400">In production store</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-rose-300/80 tracking-wider">
              Below Reorder Level
            </span>
            <div className="font-orbitron text-2xl font-bold text-rose-400">{rawSummary.lowCount}</div>
            <span className="text-[11px] text-slate-400">Requires purchase requisition</span>
          </div>
        </div>
      )}

      {activeSubPage === 'Categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
              Total Categories
            </span>
            <div className="font-orbitron text-2xl font-bold text-white">
              {normalizedCategories.length} Categories
            </div>
            <span className="text-[11px] text-slate-400">Classification buckets</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-emerald-400 tracking-wider">
              Active Operational
            </span>
            <div className="font-orbitron text-2xl font-bold text-emerald-400">
              {normalizedCategories.filter((c) => c.status === 'Active').length} Active
            </div>
            <span className="text-[11px] text-slate-400">Available in material &amp; product forms</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-orbitron uppercase text-[#218DFF] tracking-wider">
              Assigned Items
            </span>
            <div className="font-orbitron text-2xl font-bold text-[#9EDCFF]">
              {rawMaterials.length + finishedGoods.length} Items
            </div>
            <span className="text-[11px] text-slate-400">Products &amp; raw ingredients tagged</span>
          </div>
        </div>
      )}

      {/* Search, Filter & Tabs Toolbar */}
      {(activeSubPage === 'Finished Goods' || activeSubPage === 'Raw Materials') && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeSubPage.toLowerCase()} by name, lot, or code...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
              />
            </div>
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { value: 'All', label: 'All Categories' },
                ...categoryNames.map((cat) => ({ value: cat, label: cat }))
              ]}
              className="w-44 shrink-0"
              buttonClassName="!py-2 !rounded-xl !bg-[#040C26] !text-xs !border-white/15"
            />
          </div>

          {activeSubPage === 'Finished Goods' && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#040C26] border border-white/10 self-start sm:self-auto overflow-x-auto">
              {[
                { id: 'All', label: 'All Lots' },
                { id: 'Fresh', label: 'Fresh / Valid' },
                { id: 'Expiring Soon', label: 'Expiring Soon' },
                { id: 'Expired', label: 'Expired Lots' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStockTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                    stockTab === tab.id
                      ? tab.id === 'Expired'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : tab.id === 'Expiring Soon'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-[#218DFF] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'Expired' && finishedSummary.expired > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-200 border border-rose-500/40">
                      {finishedSummary.expired}
                    </span>
                  )}
                  {tab.id === 'Expiring Soon' && finishedSummary.expiring > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-200 border border-amber-500/40">
                      {finishedSummary.expiring}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUBPAGE 1: FINISHED GOODS TABLE --- */}
      {activeSubPage === 'Finished Goods' && (
        <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Product &amp; Batch Code</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Available Stock</th>
                  <th className="p-3.5 text-right">Selling Price</th>
                  {!isCashier && !hideFinancials && <th className="p-3.5 text-right">Cost &amp; Profit / Unit</th>}
                  <th className="p-3.5">Best-Before Date</th>
                  <th className="p-3.5 text-center">Price Engine</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredFinishedGoods.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No finished products found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFinishedGoods.map((item) => {
                    const bb = item.bestBeforeDate || item.expiryDate
                    const isExp = bb && new Date(bb) < now
                    const diffDays = bb ? Math.ceil((new Date(bb) - now) / 86400000) : 999
                    const isSoon = diffDays >= 0 && diffDays <= 30

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setDetailItem(item)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                            {item.name || item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Lot: {item.batchCode || 'LOT-MAIN'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-300">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-white">
                          {(item.currentStock || item.stock || 0).toLocaleString()} {item.unit || 'pcs'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatRWF(item.sellingPriceRWF || item.sellingPrice || 0)}
                        </td>
                        {!isCashier && !hideFinancials && (
                          <td className="p-3.5 text-right font-mono">
                            <div className="text-slate-400 text-xs">
                              {formatRWF(item.costPerUnitRWF || item.unitCost || 0)}
                            </div>
                            {(() => {
                              const cost = Number(item.costPerUnitRWF || item.unitCost || 0)
                              const price = Number(item.sellingPriceRWF || item.sellingPrice || 0)
                              const profit = price - cost
                              const margin = price > 0 ? Math.round((profit / price) * 100) : 0
                              return (
                                <div className={`text-[10px] font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {profit >= 0 ? '+' : ''}{formatRWF(profit)} ({margin}%)
                                </div>
                              )
                            })()}
                          </td>
                        )}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                              isExp
                                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm'
                                : isSoon
                                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                                : bb
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-400 bg-white/5'
                            }`}
                          >
                            {isExp ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>Expired ({Math.abs(diffDays)}d ago)</span>
                              </>
                            ) : isSoon ? (
                              <>
                                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Expiring ({diffDays}d left)</span>
                              </>
                            ) : bb ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>Fresh ({diffDays}d left)</span>
                              </>
                            ) : (
                              <span>Shelf-stable</span>
                            )}
                          </span>
                          {bb && <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{bb}</span>}
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          {!isCashier && !hideFinancials && (
                            <button
                              type="button"
                              onClick={() => setCalcProduct(item)}
                              className="px-2.5 py-1 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/30 text-[#9EDCFF] text-[11px] font-bold border border-[#218DFF]/40 flex items-center gap-1 mx-auto cursor-pointer"
                              title="Calculate price from recipe raw materials"
                            >
                              <Calculator className="w-3 h-3" />
                              <span>Calculate Price</span>
                            </button>
                          )}
                        </td>
                        <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditItem(item)
                                setProdName(item.name || item.title)
                                setProdCategory(item.category || categoryNames[0] || 'Bread')
                                setProdUnit(item.unit || 'pcs')
                                setProdCostPerUnit(item.costPerUnitRWF || item.unitCost || '')
                                setProdSellingPrice(item.sellingPriceRWF || item.sellingPrice || '')
                                setProdShelfLifeDays(item.shelfLifeDays || 4)
                                setProdBestBeforeDate(
                                  item.bestBeforeDate ||
                                  item.expiryDate ||
                                  new Date(Date.now() + (item.shelfLifeDays || 4) * 86400000).toISOString().slice(0, 10)
                                )
                                setProdReorderLevel(item.minimumStockLevel || 20)
                                setDrawerType('product')
                                setDrawerOpen(true)
                              }}
                              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item, 'product')}
                              className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBPAGE 2: RAW MATERIALS TABLE --- */}
      {activeSubPage === 'Raw Materials' && (
        <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Raw Material &amp; Lot</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">In Stock</th>
                  <th className="p-3.5 text-right">Reorder Threshold</th>
                  {!isCashier && !hideFinancials && <th className="p-3.5 text-right">Purchase Price</th>}
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredRawMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No raw materials found. Click "Receive Stock" or "+ New Material" to add ingredients.
                    </td>
                  </tr>
                ) : (
                  filteredRawMaterials.map((mat) => {
                    const isLow = Number(mat.currentStock || mat.stock || 0) <= Number(mat.minimumStockLevel || mat.minStock || 20)
                    return (
                      <tr
                        key={mat.id}
                        onClick={() => setDetailItem(mat)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                            {mat.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Lot: {mat.batchCode || mat.id}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-300">
                            {mat.category || 'Inputs'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-white">
                          <span className={isLow ? 'text-rose-400' : 'text-white'}>
                            {(mat.currentStock || mat.stock || 0).toLocaleString()} {mat.unit || 'kg'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-400">
                          {mat.minimumStockLevel || mat.minStock || 20} {mat.unit}
                        </td>
                        {!isCashier && !hideFinancials && (
                          <td className="p-3.5 text-right font-mono font-semibold text-white">
                            {formatRWF(mat.purchasePriceRWF || mat.purchasePrice || 0)}/{mat.unit}
                          </td>
                        )}
                        <td className="p-3.5">
                          <span className="text-slate-300 text-[11px]">{mat.expiryDate || 'Non-perishable'}</span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {mat.supplier || 'Local Supplier'}
                        </td>
                        <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditItem(mat)
                                setMatName(mat.name)
                                setMatCategory(mat.category || categoryNames[3] || 'Flour & Grains')
                                setMatUnit(mat.unit || 'kg')
                                setMatPurchasePrice(mat.purchasePriceRWF || '')
                                setMatReorderLevel(mat.minimumStockLevel || 50)
                                setMatExpiryDate(mat.expiryDate || '')
                                setDrawerType('material')
                                setDrawerOpen(true)
                              }}
                              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                              title="Edit material"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(mat, 'material')}
                              className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                              title="Delete material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBPAGE 3: LOW STOCK VIEW --- */}
      {activeSubPage === 'Low Stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockMaterials.length === 0 ? (
              <div className="col-span-2 p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-orbitron font-bold text-white">All Stock Levels Optimal</h4>
                <p className="text-xs text-slate-400">
                  No raw materials are currently below their reorder thresholds. Production batches can proceed without interruption.
                </p>
              </div>
            ) : (
              lowStockMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Reorder Needed
                    </span>
                    <h4 className="font-orbitron font-bold text-white text-base">{mat.name}</h4>
                    <p className="text-xs text-slate-300">
                      Current stock: <strong className="text-rose-400 font-mono">{mat.currentStock || 0} {mat.unit}</strong> · Threshold: <span className="font-mono">{mat.minimumStockLevel || 20} {mat.unit}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenReceiveStock) {
                        onOpenReceiveStock(mat)
                      } else {
                        handleOpenNewMaterial()
                      }
                    }}
                    className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#9EDCFF]" />
                    <span>Reorder</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- SUBPAGE 4: CATEGORIES --- */}
      {activeSubPage === 'Categories' && (
        <div className="space-y-5">
          {/* Quick Add Bar & Search */}
          <div className="exbos-glass-card p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-orbitron text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#218DFF]" />
                  <span>Product &amp; Material Categories</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Type a category name and click <strong>+ Add Category</strong> or press <strong>Enter</strong> to register and display it immediately.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-white/10">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  placeholder="Enter category name (e.g. Pastries, Dairy, Flavors, Spices, Boxes)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF] shadow-inner"
                />
              </div>

              <button
                type="button"
                onClick={handleAddCategory}
                className="btn-sapphire-clean px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4 text-[#9EDCFF]" />
                <span>+ Add Category</span>
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredCategoriesList.length === 0 ? (
              <div className="col-span-full p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <Tag className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-orbitron font-bold text-white">No Categories Found</h4>
                <p className="text-xs text-slate-400">
                  {categorySearchQuery
                    ? `No categories match "${categorySearchQuery}".`
                    : 'Enter a category name above to create your first category.'}
                </p>
              </div>
            ) : (
              filteredCategoriesList.map((cat) => {
                const assignedCount =
                  rawMaterials.filter((m) => (m.category || '').toLowerCase() === cat.name.toLowerCase()).length +
                  finishedGoods.filter((p) => (p.category || '').toLowerCase() === cat.name.toLowerCase()).length

                return (
                  <div
                    key={cat.id || cat.name}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#218DFF]/40 transition-all space-y-3 group shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#218DFF]/15 border border-[#218DFF]/30 flex items-center justify-center text-[#9EDCFF] shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <strong className="block text-sm font-bold text-white truncate group-hover:text-[#9EDCFF] transition-colors">
                            {cat.name}
                          </strong>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {cat.description || `${assignedCount} items tagged`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                      <span className="text-slate-300 font-mono">
                        {assignedCount} {assignedCount === 1 ? 'item assigned' : 'items assigned'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/40">
                        {cat.status || 'Active'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* --- DRAWER (Right-side drawer over Panel 3, max 8 visible fields) --- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    {drawerType === 'product' ? 'Stock › Finished Goods' : 'Stock › Raw Materials'}
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">
                    {editItem ? 'Edit Item' : drawerType === 'product' ? '+ New Product' : '+ New Material'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form: Product */}
              {drawerType === 'product' && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g. Sandwich Loaf (800g)"
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category</label>
                      <CustomSelect
                        value={prodCategory}
                        onChange={setProdCategory}
                        options={categoryNames.map((c) => ({ value: c, label: c }))}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Unit of Measure</label>
                      <CustomSelect
                        value={prodUnit}
                        onChange={setProdUnit}
                        options={
                          prodUnit && !PRODUCT_UNIT_OPTIONS.some((u) => u.value === prodUnit)
                            ? [...PRODUCT_UNIT_OPTIONS, { value: prodUnit, label: prodUnit }]
                            : PRODUCT_UNIT_OPTIONS
                        }
                      />
                    </div>
                  </div>

                  {/* Cost, Selling Price & Direct Profit Comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Raw Material / Unit Cost (RWF)
                      </label>
                      <input
                        type="number"
                        value={prodCostPerUnit}
                        onChange={(e) => setProdCostPerUnit(e.target.value)}
                        placeholder="e.g. 81400"
                        className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Selling Price (RWF) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={prodSellingPrice}
                        onChange={(e) => setProdSellingPrice(e.target.value)}
                        placeholder="e.g. 145000"
                        className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                  </div>

                  {/* Instant Direct Profit & Margin Calculator Card */}
                  {Number(prodSellingPrice) > 0 && (
                    <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-400/25 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Direct Profit / Unit:</span>
                        <span className={`font-mono font-bold text-sm ${
                          Number(prodSellingPrice) - Number(prodCostPerUnit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {Number(prodSellingPrice) - Number(prodCostPerUnit || 0) >= 0 ? '+' : ''}
                          {formatRWF(Number(prodSellingPrice) - Number(prodCostPerUnit || 0))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[11px]">Gross Margin:</span>
                        <span className="font-mono font-bold text-sm text-sky-300">
                          {Math.round(((Number(prodSellingPrice) - Number(prodCostPerUnit || 0)) / Number(prodSellingPrice)) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Shelf Life (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={prodShelfLifeDays}
                        onChange={(e) => {
                          const d = parseInt(e.target.value, 10) || 1
                          setProdShelfLifeDays(d)
                          setProdBestBeforeDate(new Date(Date.now() + d * 86400000).toISOString().slice(0, 10))
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Best-Before / Expiry Date</label>
                      <input
                        type="date"
                        value={prodBestBeforeDate}
                        onChange={(e) => {
                          setProdBestBeforeDate(e.target.value)
                          if (e.target.value) {
                            const diff = Math.ceil((new Date(e.target.value) - now) / 86400000)
                            if (diff > 0) setProdShelfLifeDays(diff)
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                  </div>

                  {/* Expiration Status Indicator */}
                  {prodBestBeforeDate && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Quality &amp; Expiry Check:</span>
                      {new Date(prodBestBeforeDate) < now ? (
                        <span className="px-2.5 py-1 rounded-full font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>EXPIRED ({Math.abs(Math.ceil((new Date(prodBestBeforeDate) - now) / 86400000))}d ago)</span>
                        </span>
                      ) : Math.ceil((new Date(prodBestBeforeDate) - now) / 86400000) <= 30 ? (
                        <span className="px-2.5 py-1 rounded-full font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Expiring soon ({Math.ceil((new Date(prodBestBeforeDate) - now) / 86400000)}d left)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Fresh ({Math.ceil((new Date(prodBestBeforeDate) - now) / 86400000)}d valid)</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reorder Level Threshold</label>
                    <input
                      type="number"
                      value={prodReorderLevel}
                      onChange={(e) => setProdReorderLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>

                  {/* More Options Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="text-[11px] text-[#9EDCFF] hover:underline font-semibold cursor-pointer"
                    >
                      {showMoreOptions ? '− Hide advanced options' : '+ More options (Opening stock & batch code)'}
                    </button>
                  </div>

                  {showMoreOptions && (
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Opening Stock Quantity</label>
                        <input
                          type="number"
                          value={prodOpeningStock}
                          onChange={(e) => setProdOpeningStock(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#040C26] border border-white/15 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Initial Batch Code</label>
                        <input
                          type="text"
                          value={prodBatchCode}
                          onChange={(e) => setProdBatchCode(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#040C26] border border-white/15 text-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form: Material */}
              {drawerType === 'material' && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Material Name *</label>
                    <input
                      type="text"
                      value={matName}
                      onChange={(e) => setMatName(e.target.value)}
                      placeholder="e.g. Azania Wheat Flour"
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category</label>
                      <CustomSelect
                        value={matCategory}
                        onChange={setMatCategory}
                        options={categoryNames.map((c) => ({ value: c, label: c }))}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Unit of Measure</label>
                      <CustomSelect
                        value={matUnit}
                        onChange={setMatUnit}
                        options={
                          matUnit && !RAW_MATERIAL_UNIT_OPTIONS.some((u) => u.value === matUnit)
                            ? [...RAW_MATERIAL_UNIT_OPTIONS, { value: matUnit, label: matUnit }]
                            : RAW_MATERIAL_UNIT_OPTIONS
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purchase Price per Unit (RWF)</label>
                    <input
                      type="number"
                      value={matPurchasePrice}
                      onChange={(e) => setMatPurchasePrice(e.target.value)}
                      placeholder="e.g. 1200"
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reorder Level Threshold</label>
                    <input
                      type="number"
                      value={matReorderLevel}
                      onChange={(e) => setMatReorderLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>

                  {/* Expiry Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="block text-slate-200 font-semibold">Has Expiration Date</span>
                      <span className="text-[10px] text-slate-400">Track lot expiry for FEFO production</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={matHasExpiry}
                      onChange={(e) => setMatHasExpiry(e.target.checked)}
                      className="w-4 h-4 rounded text-[#218DFF] cursor-pointer"
                    />
                  </div>

                  {matHasExpiry && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Lot Expiry Date</label>
                      <input
                        type="date"
                        value={matExpiryDate}
                        onChange={(e) => setMatExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => (drawerType === 'product' ? handleSaveProduct(false) : handleSaveMaterial(false))}
                className="flex-1 btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => (drawerType === 'product' ? handleSaveProduct(true) : handleSaveMaterial(true))}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer"
              >
                Save &amp; Add Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CATEGORY MODAL (Create / Edit Category) --- */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div
            className="fixed inset-0 bg-black/60 cursor-pointer"
            onClick={() => {
              setCategoryModalOpen(false)
              setEditingCategory(null)
              setNewCategoryName('')
              setNewCategoryDesc('')
            }}
          />
          <div className="relative w-full max-w-md bg-[#071330] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5 z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                  Stock · Categories
                </span>
                <h3 className="font-orbitron text-xl font-bold text-white">
                  {editingCategory ? 'Edit Category' : '+ New Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false)
                  setEditingCategory(null)
                  setNewCategoryName('')
                  setNewCategoryDesc('')
                }}
                className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  placeholder="e.g. Pastries, Dairy, Flavors, Spices, Boxes..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description / Operational Scope
                </label>
                <textarea
                  rows={3}
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Describe items grouped under this category (e.g. Raw ingredients used in bread sponge)..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF] resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false)
                  setEditingCategory(null)
                  setNewCategoryName('')
                  setNewCategoryDesc('')
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer border border-white/15"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
                className="btn-sapphire-clean px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRICE CALCULATOR POPUP MODAL --- */}
      {calcProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PriceCalculatorPanel
              product={calcProduct}
              recipe={recipes.find((r) => r.productId === calcProduct.id) || recipes[0]}
              rawMaterials={rawMaterials}
              onApplyPrice={(newPrice) => {
                if (onUpdateFinishedGoods) {
                  onUpdateFinishedGoods(
                    finishedGoods.map((p) =>
                      p.id === calcProduct.id ? { ...p, sellingPriceRWF: newPrice } : p
                    )
                  )
                }
                setCalcProduct(null)
              }}
              onClose={() => setCalcProduct(null)}
              isCashier={isCashier}
              hideFinancials={hideFinancials}
            />
          </div>
        </div>
      )}

      {/* --- DETAIL PANEL (Row click side panel with Edit, Print, Delete) --- */}
      {detailItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setDetailItem(null)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Record Details
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">
                    {detailItem.name || detailItem.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <strong className="text-white">{detailItem.category || 'General'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Stock:</span>
                    <strong className="text-white font-mono">
                      {(detailItem.currentStock || detailItem.stock || 0).toLocaleString()} {detailItem.unit}
                    </strong>
                  </div>
                  {detailItem.sellingPriceRWF && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Selling Price:</span>
                      <strong className="text-emerald-400 font-mono">
                        {formatRWF(detailItem.sellingPriceRWF)}
                      </strong>
                    </div>
                  )}
                  {detailItem.purchasePriceRWF && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Purchase Price:</span>
                      <strong className="text-white font-mono">
                        {formatRWF(detailItem.purchasePriceRWF)}/{detailItem.unit}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lot / Batch Code:</span>
                    <strong className="text-slate-300 font-mono">
                      {detailItem.batchCode || detailItem.id}
                    </strong>
                  </div>
                  {(detailItem.bestBeforeDate || detailItem.expiryDate) && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expiry / Best-Before:</span>
                      <strong className="text-amber-400">
                        {detailItem.bestBeforeDate || detailItem.expiryDate}
                      </strong>
                    </div>
                  )}

                  {(() => {
                    const bb = detailItem.bestBeforeDate || detailItem.expiryDate
                    if (!bb) return null
                    const diffDays = Math.ceil((new Date(bb) - now) / 86400000)
                    const isExp = diffDays < 0
                    const isSoon = diffDays >= 0 && diffDays <= 30

                    return (
                      <div
                        className={`p-3.5 rounded-xl border flex flex-col gap-1.5 mt-2 ${
                          isExp
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                            : isSoon
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            {isExp ? (
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : isSoon ? (
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            <span>
                              {isExp
                                ? `EXPIRED LOT (${Math.abs(diffDays)} days ago)`
                                : isSoon
                                ? `EXPIRING SOON (${diffDays} days left)`
                                : `FRESH & SELLABLE (${diffDays} days left)`}
                            </span>
                          </span>
                          <span className="font-mono text-[11px] font-bold">{bb}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {isExp
                            ? 'FEFO Quality Rule: Do NOT sell expired finished goods to customers. Mark this lot as scrap or waste.'
                            : isSoon
                            ? 'FEFO Priority: This batch expires soon. Prioritize this lot for immediate orders before newer batches.'
                            : 'This batch is fresh and well within safe operational shelf life.'}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Actions: Edit, Print, Delete */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const it = detailItem
                  setDetailItem(null)
                  if (it.sellingPriceRWF !== undefined) {
                    setEditItem(it)
                    setProdName(it.name || it.title)
                    setProdCategory(it.category || categoryNames[0] || 'Bread')
                    setProdUnit(it.unit || 'pcs')
                    setProdCostPerUnit(it.costPerUnitRWF || it.unitCost || '')
                    setProdSellingPrice(it.sellingPriceRWF || '')
                    setProdShelfLifeDays(it.shelfLifeDays || 4)
                    setProdBestBeforeDate(
                      it.bestBeforeDate ||
                      it.expiryDate ||
                      new Date(Date.now() + (it.shelfLifeDays || 4) * 86400000).toISOString().slice(0, 10)
                    )
                    setProdReorderLevel(it.minimumStockLevel || 20)
                    setDrawerType('product')
                    setDrawerOpen(true)
                  } else {
                    setEditItem(it)
                    setMatName(it.name)
                    setMatCategory(it.category || categoryNames[3] || 'Flour & Grains')
                    setMatUnit(it.unit || 'kg')
                    setMatPurchasePrice(it.purchasePriceRWF || '')
                    setMatReorderLevel(it.minimumStockLevel || 50)
                    setMatExpiryDate(it.expiryDate || '')
                    setDrawerType('material')
                    setDrawerOpen(true)
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const isProd = detailItem.sellingPriceRWF !== undefined
                  const lotNum = detailItem.lotNumber || detailItem.batchNumber || `LOT-${detailItem.id}`
                  const totalVal = isProd
                    ? (Number(detailItem.quantity || detailItem.stock || 0)) * (Number(detailItem.costPerUnitRWF || detailItem.sellingPriceRWF || 0))
                    : (Number(detailItem.quantity || detailItem.stock || 0)) * (Number(detailItem.unitCostRWF || 0))
                  
                  printBusinessDocument({
                    id: lotNum,
                    type: isProd ? 'Finished Goods Lot Certificate' : 'Raw Material Inventory Card',
                    date: detailItem.receivedDate || detailItem.productionDate || new Date().toISOString().slice(0, 10),
                    recipientName: isProd ? 'Internal Inventory & Store Records' : (detailItem.supplier || 'Warehouse Storage'),
                    status: 'Verified',
                    amount: totalVal,
                    paidAmount: totalVal,
                    outstandingAmount: 0,
                    items: [{
                      name: detailItem.name,
                      quantity: detailItem.quantity || detailItem.stock || 1,
                      unit: detailItem.unit || 'units',
                      unitPrice: isProd ? (detailItem.costPerUnitRWF || detailItem.sellingPriceRWF || 0) : (detailItem.unitCostRWF || 0),
                      total: totalVal
                    }],
                    notes: `Category: ${detailItem.category || 'General'} · Location: ${detailItem.storageLocation || 'Main Store'} · Best-Before / Expiry: ${detailItem.bestBeforeDate || detailItem.expiryDate || 'N/A'}`
                  }, {
                    businessName: activeBizName,
                    tagline: 'Make & Sell Inventory & Batch Control',
                    address: 'KG 17 Ave, Gasabo, Kigali, Rwanda',
                    phone: '+250 788 450 120',
                    email: 'bakery@inyange.rw',
                    taxId: 'TIN-109823471'
                  })
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteItem(detailItem, detailItem.sellingPriceRWF !== undefined ? 'product' : 'material')}
                className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT DRAWER --- */}
      <ExportDrawer
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`Stock Export - ${activeSubPage}`}
        pageTitle={`Stock - ${activeSubPage}`}
        data={
          activeSubPage === 'Finished Goods'
            ? filteredFinishedGoods.map((p) => ({
                Product: p.name || p.title,
                BatchCode: p.batchCode || 'LOT-MAIN',
                Category: p.category || 'General',
                Stock: `${p.currentStock || 0} ${p.unit || 'pcs'}`,
                SellingPrice: formatRWF(p.sellingPriceRWF || 0),
                BestBefore: p.bestBeforeDate || 'N/A'
              }))
            : activeSubPage === 'Categories'
            ? filteredCategoriesList.map((c) => {
                const assignedCount =
                  rawMaterials.filter((m) => (m.category || '').toLowerCase() === c.name.toLowerCase()).length +
                  finishedGoods.filter((p) => (p.category || '').toLowerCase() === c.name.toLowerCase()).length
                return {
                  CategoryName: c.name,
                  Description: c.description || 'Operational category',
                  AssignedItems: `${assignedCount} items`,
                  Status: c.status || 'Active'
                }
              })
            : filteredRawMaterials.map((m) => ({
                Material: m.name,
                LotCode: m.batchCode || m.id,
                Category: m.category || 'Inputs',
                Stock: `${m.currentStock || 0} ${m.unit || 'kg'}`,
                PurchasePrice: formatRWF(m.purchasePriceRWF || 0),
                ExpiryDate: m.expiryDate || 'Non-perishable',
                Supplier: m.supplier || 'Vendor'
              }))
        }
        columns={
          activeSubPage === 'Finished Goods'
            ? [
                { key: 'Product', label: 'Finished Good' },
                { key: 'BatchCode', label: 'Batch Code' },
                { key: 'Category', label: 'Category' },
                { key: 'Stock', label: 'Available Stock' },
                { key: 'SellingPrice', label: 'Selling Price' },
                { key: 'BestBefore', label: 'Best-Before Date' }
              ]
            : activeSubPage === 'Categories'
            ? [
                { key: 'CategoryName', label: 'Category Name' },
                { key: 'Description', label: 'Description' },
                { key: 'AssignedItems', label: 'Assigned Items' },
                { key: 'Status', label: 'Status' }
              ]
            : [
                { key: 'Material', label: 'Raw Material' },
                { key: 'LotCode', label: 'Lot Code' },
                { key: 'Category', label: 'Category' },
                { key: 'Stock', label: 'Current Stock' },
                { key: 'PurchasePrice', label: 'Purchase Price' },
                { key: 'ExpiryDate', label: 'Expiry Date' },
                { key: 'Supplier', label: 'Supplier' }
              ]
        }
        businessName={activeBizName}
      />

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmData}
        onClose={() => setDeleteConfirmData(null)}
        title={deleteConfirmData?.title || 'Delete Record'}
        itemName={deleteConfirmData?.itemName}
        description={deleteConfirmData?.description}
        confirmText={deleteConfirmData?.confirmText || 'Delete Record'}
        onConfirm={() => {
          if (deleteConfirmData?.onConfirm) {
            deleteConfirmData.onConfirm()
          }
          setDeleteConfirmData(null)
        }}
      />
    </div>
  )
}

