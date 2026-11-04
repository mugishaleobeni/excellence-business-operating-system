import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useExbos } from '../../context/ExbosContext'
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from '../../utils/currencyWords'
import LanguageDropdown from '../common/LanguageDropdown'
import UniversalModuleTable from './UniversalModuleTable'
import AnimalRegistryWorkspace from './animal/AnimalRegistryWorkspace'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  User,
  Building2,
  Wallet,
  Package,
  ShoppingBag,
  Truck,
  Users,
  Factory,
  RotateCcw,
  Sun,
  Moon,
  Globe,
  X,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Camera,
  Box,
  Barcode,
  TrendingUp,
  Percent,
  Check,
  VideoOff,
  Printer,
  Tag,
  ChevronDown,
  Search,
  ArrowUpRight,
  BarChart3,
  MapPin,
  Phone,
  Receipt,
  CreditCard,
  Clock,
  AlertOctagon,
  Boxes,
  PackageCheck,
  Edit2,
  Eye,
  Filter
} from 'lucide-react'

import { renderBarcodeSvg, generateBarcodeSvgMarkup } from "../../utils/barcodeUtils"
import { printBusinessDocument, executePrintHtml } from "../../utils/printDocument"
import SalesTrendsView from "./views/SalesTrendsView"
import UnpaidPurchasesView from "./views/UnpaidPurchasesView"
import PurchaseReturnsView from "./views/PurchaseReturnsView"
import StockLinesView from "./views/StockLinesView"
import ProductModal from "./modals/ProductModal"
import SaleModal from "./modals/SaleModal"
import PurchaseModal from "./modals/PurchaseModal"
import CustomerModal from "./modals/CustomerModal"
import SupplierModal from "./modals/SupplierModal"
import GenericRecordModal from "./modals/GenericRecordModal"
import CategoryModal from "./modals/CategoryModal"
import PayPurchaseModal from "./modals/PayPurchaseModal"
import ModuleKpiCards, { ModuleKpiCards as NamedModuleKpiCards } from "./cards/ModuleKpiCards"
import MakeSellWorkspace from "./make-and-sell/MakeSellWorkspace"
const KpiCards = ModuleKpiCards || NamedModuleKpiCards

export default function InteractiveModulePanel({
  activeArchId,
  currentArch,
  activeModule,
  activePage,
  onSwitchArch,
  onSwitchPage
}) {
  const {
    user,
    theme,
    toggleTheme,
    hideFinancials,
    demoWorkspaces,
    addDemoRecord,
    updateDemoRecord,
    deleteDemoRecord,
    updateDemoWorkspace,
    updateUserProfile,
    resetDemoData,
    transactions,
    addTransaction,
    addToast
  } = useExbos()

  const workspace =
    demoWorkspaces?.[activeArchId] || {}
  const metrics = workspace.metrics || {}
  const recordsMap = workspace.records || {}

  const existingCustomers = useMemo(() => {
    return recordsMap["Customers"] || []
  }, [recordsMap])

  const existingSuppliers = useMemo(() => {
    return recordsMap["Suppliers"] || []
  }, [recordsMap])

  // Determine which record bucket corresponds to active module
  const bucketKey = useMemo(() => {
    if (
      activeModule === 'Products' ||
      activeModule === 'Products & Stock' ||
      activeModule === 'Farm Inventory' ||
      activeModule === 'Ingredients & Stock' ||
      activeModule === 'Materials' ||
      activeModule === 'Ingredients' ||
      activeModule === 'Inventory'
    ) {
      return 'Inventory'
    }
    if (
      activeModule === 'Production' ||
      activeModule === 'Livestock' ||
      activeModule === 'Crops & Fields' ||
      activeModule === 'Recipes' ||
      activeModule === 'Crops' ||
      activeModule === 'Feeding' ||
      activeModule === 'Breeding' ||
      activeModule === 'Health' ||
      activeModule === 'Animals'
    ) {
      return 'Production'
    }
    if (
      activeModule === 'Sales' ||
      activeModule === 'Services' ||
      activeModule === 'Services & Jobs' ||
      activeModule === 'Jobs' ||
      activeModule === 'Jobs & Bookings' ||
      activeModule === 'Restaurant & Bar' ||
      activeModule === 'Rooms & Lodging' ||
      activeModule === 'Orders' ||
      activeModule === 'Restaurant' ||
      activeModule === 'Appointments' ||
      activeModule === 'Rooms' ||
      activeModule === 'Payments'
    ) {
      return 'Sales'
    }
    if (activeModule === 'Purchases') {
      return 'Purchases'
    }
    if (activeModule === 'Suppliers') {
      return 'Suppliers'
    }
    if (activeModule === 'Customers') {
      return 'Customers'
    }
    if (activeModule === 'Expenses' || activeModule === 'Finance') {
      return 'Expenses'
    }
    return activeModule
  }, [activeModule])

  const rawModuleRecords = useMemo(() => {
    return recordsMap[bucketKey] || []
  }, [recordsMap, bucketKey])

  // Combine with live transactions matching current bucket & filter for Low Stock if on that page
  const records = useMemo(() => {
    let list = [...rawModuleRecords]

    // If bucket is Sales or Expenses or Purchases, integrate transactions recorded
    if (transactions && transactions.length > 0) {
      const matchingTxs = transactions.filter((tx) => {
        const txArch = tx.architectureId || 'buy-and-sell'
        if (txArch !== activeArchId) return false
        if (bucketKey === 'Sales' && tx.type === 'in') return true
        if ((bucketKey === 'Purchases' || bucketKey === 'Expenses') && tx.type === 'out') return true
        return false
      }).map((tx) => {
        const titleStr = String(tx.title || '')
        return {
          id: tx.id,
          date: tx.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          title: tx.title || (tx.type === 'out' ? 'Business Expense' : 'Direct Sale'),
          subPage: tx.category || activePage,
          category: tx.account || 'Main Till',
          amountRWF: Number(tx.amountRWF ?? tx.amount ?? 0),
          status: tx.status || 'Posted',
          type: tx.type,
          customer: tx.type === 'in' ? (titleStr.includes('Client') ? titleStr : 'Direct Client') : null,
          supplier: tx.type === 'out' ? (titleStr.includes('Supplier') ? titleStr : 'Vendor') : null
        }
      })

      // Deduplicate by ID
      const seenIds = new Set(list.map((r) => r.id))
      matchingTxs.forEach((mtx) => {
        if (!seenIds.has(mtx.id)) {
          list.unshift(mtx)
          seenIds.add(mtx.id)
        }
      })
    }

    // When on Low Stock subpage, filter strictly to low stock products needing reorder
    if (activePage === 'Low Stock') {
      list = list.filter((item) => {
        const qty = Number(item.quantity) || 0
        const lowAlert = Number(item.lowStockAlert) || (item.approximateThresholds?.low ? Number(item.approximateThresholds.low) : 5)
        const statusLower = String(item.status || '').toLowerCase()
        return (
          qty <= lowAlert ||
          statusLower.includes('low') ||
          statusLower.includes('reorder') ||
          statusLower.includes('alert') ||
          statusLower.includes('warning') ||
          statusLower.includes('critical') ||
          statusLower.includes('dead')
        )
      })
    }

    // When on Customer Outstanding Balances, filter strictly to customers who owe money
    if (activeModule === 'Customers' && (activePage === 'Outstanding Balances' || activePage === 'Customer Balances')) {
      list = list.filter((item) => {
        const owed = Number(item.balanceOwedRWF ?? item.amountRWF) || 0
        return owed > 0 || String(item.status || '').toLowerCase().includes('owed') || String(item.status || '').toLowerCase().includes('overdue')
      })
    }

    // When on Supplier Amounts Owed, filter strictly to suppliers with outstanding payables
    if (activeModule === 'Suppliers' && (activePage === 'Amounts Owed' || activePage === 'Supplier Balances')) {
      list = list.filter((item) => {
        const owed = Number(item.amountRWF ?? item.balanceOwedRWF) || 0
        return owed > 0 || String(item.status || '').toLowerCase().includes('owed')
      })
    }

    return list
  }, [rawModuleRecords, transactions, bucketKey, activePage])

  // Available recorded products / items to sell based on architecture (ODT Section 2 Item Picker Rule)
  const recordedProducts = useMemo(() => {
    const customList = recordsMap['Inventory'] || []

    if (activeArchId === 'make-and-sell') {
      const prodBatches = (recordsMap['Production'] || []).map((b) => ({
        ...b,
        id: b.id,
        title: b.title || b.productName || b.name,
        unit: b.unit || 'unit',
        unitCostRWF: b.unitCostRWF || b.actualCostPerUnitRWF || b.plannedCostPerUnitRWF || 0,
        sellingPriceRWF: b.sellingPriceRWF || b.sellingPrice || 0,
        quantity: b.quantity || b.actualQuantity || b.plannedQuantity || 0,
        category: 'Finished Goods Batch'
      }))
      const finishedGoods = customList.map((i) => ({
        ...i,
        title: i.title || i.name,
        sellingPriceRWF: i.sellingPriceRWF || i.sellingPrice || 0,
        unitCostRWF: i.unitCostRWF || i.costPerUnitRWF || 0,
        quantity: i.quantity ?? i.currentStock ?? i.stock ?? 0,
        category: i.category || 'Finished Goods'
      }))
      const combined = [...finishedGoods, ...prodBatches]
      const seen = new Set()
      return combined.filter((i) => {
        if (!i.id || seen.has(i.id)) return false
        seen.add(i.id)
        return true
      })
    }

    return customList
  }, [recordsMap, activeArchId])

  // Available raw materials to purchase in Make & Sell
  const rawMaterialsForPurchase = useMemo(() => {
    if (activeArchId !== 'make-and-sell') return recordedProducts
    const rawList = recordsMap['RawMaterials'] || []
    return rawList.map((m) => ({
      ...m,
      title: m.name || m.title,
      unitPriceRWF: m.purchasePriceRWF || m.unitCostRWF || 0,
      purchasePriceRWF: m.purchasePriceRWF || m.unitCostRWF || 0,
      unitCostRWF: m.purchasePriceRWF || m.unitCostRWF || 0,
      quantity: m.currentStock ?? m.quantity ?? 0,
      category: m.category || 'Raw Material'
    }))
  }, [recordsMap, activeArchId, recordedProducts])

  // Specialized Sales Form State
  const [saleProductId, setSaleProductId] = useState('')
  const [saleProductDropdownOpen, setSaleProductDropdownOpen] = useState(false)
  const [saleProductSearch, setSaleProductSearch] = useState('')
  const saleProductDropdownRef = useRef(null)
  const [saleQuantity, setSaleQuantity] = useState('1')
  const [saleUnitPrice, setSaleUnitPrice] = useState('')
  const [saleOriginalCatalogPrice, setSaleOriginalCatalogPrice] = useState(0)
  const [saleUpdateCatalogPrice, setSaleUpdateCatalogPrice] = useState(false)
  const [saleCustomerName, setSaleCustomerName] = useState('')
  const [saleCustomerPhone, setSaleCustomerPhone] = useState('')
  const [salePaymentMethod, setSalePaymentMethod] = useState('MTN MoMo Business')
  const [salePaymentStatus, setSalePaymentStatus] = useState('Paid in Full')

  // Click-outside listener for product custom dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (saleProductDropdownRef.current && !saleProductDropdownRef.current.contains(e.target)) {
        setSaleProductDropdownOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSaleProductDropdownOpen(false)
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const filteredSaleProducts = useMemo(() => {
    if (!saleProductSearch.trim()) return recordedProducts
    const term = saleProductSearch.toLowerCase()
    return recordedProducts.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    )
  }, [recordedProducts, saleProductSearch])

  const handleSelectSaleProduct = (productId) => {
    setSaleProductId(productId)
    setSaleProductDropdownOpen(false)
    const prod = recordedProducts.find((p) => p.id === productId)
    if (prod) {
      const price = Number(prod.sellingPriceRWF) || Number(prod.unitCostRWF) || 0
      setSaleUnitPrice(price)
      setSaleOriginalCatalogPrice(price)
      setSaleUpdateCatalogPrice(false)
      if (!saleQuantity || Number(saleQuantity) <= 0) {
        setSaleQuantity('1')
      }
    } else {
      setSaleUnitPrice('')
      setSaleOriginalCatalogPrice(0)
      setSaleUpdateCatalogPrice(false)
    }
  }

  const selectedSaleProduct = recordedProducts.find((p) => p.id === saleProductId)
  const saleUnit = selectedSaleProduct?.unit || 'piece'
  const saleUnitCost = Number(selectedSaleProduct?.purchasePriceRWF ?? selectedSaleProduct?.unitCostRWF) || 0
  const saleQtyNum = Number(saleQuantity) || 0
  const salePriceNum = parseNumericInput(saleUnitPrice) || 0
  const saleTotalAmount = saleQtyNum * salePriceNum
  const saleTotalCost = saleQtyNum * saleUnitCost
  const saleTotalProfit = saleTotalAmount - saleTotalCost
  const saleProfitMarginPct = saleTotalCost > 0 
    ? Math.round((saleTotalProfit / saleTotalCost) * 100) 
    : (saleTotalAmount > 0 ? 100 : 0)
  const saleAvailableStock = Number(selectedSaleProduct?.quantity) || 0
  const isSalePriceChanged = selectedSaleProduct && saleOriginalCatalogPrice > 0 && salePriceNum !== saleOriginalCatalogPrice

  // Specialized Purchases Form State
  const [purchaseProductId, setPurchaseProductId] = useState('')
  const [purchaseItemTitle, setPurchaseItemTitle] = useState('')
  const [purchaseQuantity, setPurchaseQuantity] = useState('1')
  const [purchaseUnit, setPurchaseUnit] = useState('piece')
  const [purchaseUnitCost, setPurchaseUnitCost] = useState('')
  const [purchaseSupplierName, setPurchaseSupplierName] = useState('')
  const [purchaseSupplierPhone, setPurchaseSupplierPhone] = useState('')
  const [purchaseSupplierLocation, setPurchaseSupplierLocation] = useState('')
  const [purchaseExpiryDate, setPurchaseExpiryDate] = useState('')
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('MTN MoMo Business')
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState('Paid in Full')
  const [purchasePaidAmount, setPurchasePaidAmount] = useState('')
  const [purchaseAutoRestock, setPurchaseAutoRestock] = useState(true)
  const [purchaseProductDropdownOpen, setPurchaseProductDropdownOpen] = useState(false)
  const [purchaseProductSearch, setPurchaseProductSearch] = useState('')
  const purchaseProductDropdownRef = useRef(null)

  // Payment Modal State for Unpaid Purchases
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payPurchaseItem, setPayPurchaseItem] = useState(null)
  const [payAmountInput, setPayAmountInput] = useState('')
  const [payMethodInput, setPayMethodInput] = useState('MTN MoMo Business')

  // Click-outside listener for purchase product custom dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (purchaseProductDropdownRef.current && !purchaseProductDropdownRef.current.contains(e.target)) {
        setPurchaseProductDropdownOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setPurchaseProductDropdownOpen(false)
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const filteredPurchaseProducts = useMemo(() => {
    if (!purchaseProductSearch.trim()) return recordedProducts
    const term = purchaseProductSearch.toLowerCase()
    return recordedProducts.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    )
  }, [recordedProducts, purchaseProductSearch])

  const handleSelectPurchaseProduct = (productId) => {
    setPurchaseProductId(productId)
    setPurchaseProductDropdownOpen(false)
    const prod = recordedProducts.find((p) => p.id === productId)
    if (prod) {
      setPurchaseItemTitle(prod.title)
      setPurchaseUnit(prod.unit || 'piece')
      const cost = Number(prod.purchasePriceRWF ?? prod.unitCostRWF) || 0
      setPurchaseUnitCost(cost)
      if (!purchaseQuantity || Number(purchaseQuantity) <= 0) {
        setPurchaseQuantity('1')
      }
    }
  }

  const selectedPurchaseProduct = recordedProducts.find((p) => p.id === purchaseProductId)
  const purchaseQtyNum = Number(purchaseQuantity) || 0
  const purchaseCostNum = parseNumericInput(purchaseUnitCost) || 0
  const purchaseTotalAmount = purchaseQtyNum * purchaseCostNum
  const purchasePaidNum = purchasePaymentStatus === 'Paid in Full'
    ? purchaseTotalAmount
    : purchasePaymentStatus === 'Part-paid'
    ? (parseNumericInput(purchasePaidAmount) || 0)
    : 0
  const purchaseRemainingAmount = Math.max(0, purchaseTotalAmount - purchasePaidNum)

  // New Record Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [detailRow, setDetailRow] = useState(null)
  const [editRow, setEditRow] = useState(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [categoryTag, setCategoryTag] = useState('')
  const [amountRWF, setAmountRWF] = useState('')
  const [unitCostRWF, setUnitCostRWF] = useState('')
  const [sellingPriceRWF, setSellingPriceRWF] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [party, setParty] = useState('')
  const [statusVal, setStatusVal] = useState('Active')
  const [savedNotice, setSavedNotice] = useState('')

  // Specialized Product Form Fields (matching user requirements)
  const [productSku, setProductSku] = useState('')
  const [productCategory, setProductCategory] = useState('General')
  const [productUnit, setProductUnit] = useState('piece')
  const [productPurchasePrice, setProductPurchasePrice] = useState('')
  const [productSellingPrice, setProductSellingPrice] = useState('')
  const [productCurrentStock, setProductCurrentStock] = useState('0')
  const [productLowStockAlert, setProductLowStockAlert] = useState('5')
  const [productIsApproximateQty, setProductIsApproximateQty] = useState(false)
  const [productThresholdLow, setProductThresholdLow] = useState('5')
  const [productThresholdMed, setProductThresholdMed] = useState('20')
  const [productThresholdHigh, setProductThresholdHigh] = useState('50')

  // Categories Management State (Buy & Sell · Products Categories)
  const DEFAULT_CATEGORIES = useMemo(() => {
    if (activeArchId === 'buy-and-sell') {
      return [
        { id: 'cat-1', name: 'General', date: '2026-10-01', status: 'Active' },
        { id: 'cat-2', name: 'Electrical Supplies', date: '2026-10-15', status: 'Active' },
        { id: 'cat-3', name: 'Flooring & Ceramics', date: '2026-10-20', status: 'Active' },
        { id: 'cat-4', name: 'Paints & Finishes', date: '2026-10-25', status: 'Active' },
        { id: 'cat-5', name: 'Lighting & Fixtures', date: '2026-10-28', status: 'Active' },
        { id: 'cat-6', name: 'Masonry & Concrete', date: '2026-11-01', status: 'Active' },
        { id: 'cat-7', name: 'Plumbing & Hardware', date: '2026-11-01', status: 'Active' }
      ]
    }
    return [
      { id: 'cat-1', name: 'General', date: '2026-10-01', status: 'Active' },
      { id: 'cat-2', name: 'Standard Operations', date: '2026-10-10', status: 'Active' },
      { id: 'cat-3', name: 'Primary Goods', date: '2026-10-15', status: 'Active' }
    ]
  }, [activeArchId])

  const [categoriesList, setCategoriesList] = useState(() => {
    try {
      const saved = localStorage.getItem(`exbos_categories_${activeArchId}`)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return DEFAULT_CATEGORIES
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`exbos_categories_${activeArchId}`)
      if (saved) {
        setCategoriesList(JSON.parse(saved))
      } else {
        setCategoriesList(DEFAULT_CATEGORIES)
      }
    } catch {
      setCategoriesList(DEFAULT_CATEGORIES)
    }
  }, [activeArchId, DEFAULT_CATEGORIES])

  const saveCategoriesList = (newList) => {
    setCategoriesList(newList)
    try {
      localStorage.setItem(`exbos_categories_${activeArchId}`, JSON.stringify(newList))
    } catch (err) {
      console.error('Failed to save categories', err)
    }
  }

  // Merge any product category so every category is represented in catalog
  const allCategories = useMemo(() => {
    const list = [...categoriesList]
    const existingNames = new Set(list.map((c) => c.name.toLowerCase()))

    rawModuleRecords.forEach((prod) => {
      if (prod.category && !existingNames.has(prod.category.toLowerCase())) {
        existingNames.add(prod.category.toLowerCase())
        list.push({
          id: `cat-auto-${prod.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: prod.category,
          date: prod.date || '2026-11-01',
          status: 'Active'
        })
      }
    })

    return list
  }, [categoriesList, rawModuleRecords])

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryNameInput, setCategoryNameInput] = useState('')
  const [categoryDescInput, setCategoryDescInput] = useState('')
  const [categoryStatusInput, setCategoryStatusInput] = useState('Active')

  const handleOpenCreateCategory = () => {
    setEditingCategory(null)
    setCategoryNameInput('')
    setCategoryDescInput('')
    setCategoryStatusInput('Active')
    setCategoryModalOpen(true)
  }

  const handleAddCategory = (catData) => {
    const name = typeof catData === "string" ? catData : catData?.name
    if (!name || !name.trim()) return
    const newCat = {
      id: `cat-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      description: typeof catData === "object" ? catData.description : "",
      date: new Date().toISOString().split("T")[0],
      status: (typeof catData === "object" && catData.status) || "Active"
    }
    const updated = [newCat, ...categoriesList]
    saveCategoriesList(updated)
    addToast && addToast({
      type: "success",
      title: "Category Created",
      message: `Created category "${name.trim()}".`
    })
  }

  const handleUpdateCategory = (catId, catData) => {
    const name = typeof catData === "string" ? catData : catData?.name
    const updated = categoriesList.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          name: name ? name.trim() : c.name,
          description: typeof catData === "object" && catData.description !== undefined ? catData.description : c.description,
          status: typeof catData === "object" && catData.status !== undefined ? catData.status : c.status
        }
      }
      return c
    })
    saveCategoriesList(updated)
    addToast && addToast({
      type: "success",
      title: "Category Updated",
      message: "Updated category."
    })
  }

  const handleProcessPurchaseReturn = (returnedItems, totalRefund, refundMethod) => {
    if (totalRefund > 0) {
      addTransaction({
        architectureId: activeArchId,
        title: `Purchase Return Refund (${returnedItems.length} items)`,
        amountRWF: totalRefund,
        amount: totalRefund,
        type: "in",
        account: refundMethod === "Mobile Money" ? "MTN MoMo Business" : refundMethod === "Supplier Credit (Offset Next Bill)" ? "Supplier Credit" : "Cash in Hand (Main Till)",
        channel: refundMethod === "Mobile Money" ? "MTN MoMo Business" : refundMethod === "Supplier Credit (Offset Next Bill)" ? "Supplier Credit" : "Cash",
        category: "Purchase Returns",
        subPage: "Purchase Returns"
      })
    }
    addToast && addToast({
      type: "success",
      title: "Debit Note Issued",
      message: `Processed return of ${formatRWF(totalRefund)} via ${refundMethod}.`
    })
  }

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryNameInput(cat.name || '')
    setCategoryDescInput(cat.description || '')
    setCategoryStatusInput(cat.status || 'Active')
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = (e) => {
    e.preventDefault()
    const trimmed = categoryNameInput.trim()
    if (!trimmed) {
      addToast && addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Category name is required.'
      })
      return
    }

    if (editingCategory) {
      const updated = categoriesList.map((c) =>
        c.id === editingCategory.id || c.name.toLowerCase() === editingCategory.name.toLowerCase()
          ? {
              ...c,
              name: trimmed,
              description: categoryDescInput.trim(),
              status: categoryStatusInput
            }
          : c
      )
      saveCategoriesList(updated)
      addToast && addToast({
        type: 'success',
        title: 'Category Updated',
        message: `Category "${trimmed}" has been updated.`
      })
    } else {
      if (allCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
        addToast && addToast({
          type: 'error',
          title: 'Duplicate Category',
          message: `Category "${trimmed}" already exists.`
        })
        return
      }

      const newCat = {
        id: `cat-${Date.now()}`,
        name: trimmed,
        description: categoryDescInput.trim(),
        date: new Date().toISOString().slice(0, 10),
        status: categoryStatusInput
      }
      saveCategoriesList([newCat, ...categoriesList])
      addToast && addToast({
        type: 'success',
        title: 'Category Created',
        message: `Category "${trimmed}" successfully created.`
      })
    }

    setCategoryModalOpen(false)
    setCategoryNameInput('')
  }

  const handleDeleteCategory = (cat) => {
    if (cat.name === 'General') {
      addToast && addToast({
        type: 'error',
        title: 'Default Category',
        message: 'The "General" default category cannot be deleted.'
      })
      return
    }

    const filtered = categoriesList.filter((c) => c.id !== cat.id && c.name.toLowerCase() !== cat.name.toLowerCase())
    saveCategoriesList(filtered)
    addToast && addToast({
      type: 'info',
      title: 'Category Deleted',
      message: `Category "${cat.name}" has been deleted.`
    })
  }

  const categoryColumns = useMemo(() => [
    { key: 'name', label: 'CATEGORY NAME', sortable: true, width: 'w-[32%]' },
    { key: 'productCount', label: 'ASSIGNED PRODUCTS', align: 'center', sortable: true, width: 'w-[18%]' },
    { key: 'date', label: 'CREATED DATE', sortable: true, width: 'w-[23%]' },
    { key: 'status', label: 'STATUS', type: 'status', width: 'w-[18%]' }
  ], [])

  const categoryRows = useMemo(() => {
    return allCategories.map((cat) => {
      const count = rawModuleRecords.filter(
        (p) => p.category?.toLowerCase() === cat.name?.toLowerCase()
      ).length
      return {
        id: cat.id,
        title: cat.name,
        name: cat.name,
        category: cat.name,
        productCount: `${count} ${count === 1 ? 'product' : 'products'}`,
        date: cat.date || '2026-11-01',
        status: cat.status || 'Active',
        rawCategory: cat
      }
    })
  }, [allCategories, rawModuleRecords])

  // Barcode Scanner Camera State
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Start Camera Stream
  const startCameraScan = async () => {
    setCameraError('')
    setCameraActive(true)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } else {
        setCameraError('Camera API is not supported in this browser environment.')
      }
    } catch (err) {
      console.warn('Camera access:', err)
      setCameraError('Camera access unavailable or permission denied. You can manually enter or generate barcode.')
    }
  }

  // Stop Camera Stream
  const stopCameraScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  // Clean up camera on unmount or modal close
  useEffect(() => {
    if (!modalOpen && cameraActive) {
      stopCameraScan()
    }
  }, [modalOpen, cameraActive])

  // Dedicated Print Barcode / Label Handler - Prints ONLY the Barcode & Digits
  const handlePrintBarcodeLabel = (product) => {
    if (!product) return
    const code = product.barcode || product.sku || 'N/A'
    const svgMarkup = generateBarcodeSvgMarkup(code)

    const html = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 60vh; padding: 20px;">
        <div style="display: inline-block; text-align: center; background: #ffffff; padding: 16px 24px; border: 2px dashed #0f172a; border-radius: 8px; max-width: 380px; width: 100%;">
          <div style="font-size: 12pt; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; color: #0f172a;">
            ${product.name || product.title || 'Product Label'}
          </div>
          <div style="margin: 0 auto; display: flex; justify-content: center;">
            ${svgMarkup}
          </div>
          <div style="font-family: monospace; font-size: 14pt; font-weight: 700; letter-spacing: 0.35em; margin-top: 8px; color: #000000; text-align: center;">
            ${code}
          </div>
          ${product.sellingPriceRWF ? `
            <div style="font-size: 12pt; font-weight: 800; margin-top: 8px; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              PRICE: ${formatRWF(product.sellingPriceRWF)}
            </div>
          ` : ''}
        </div>
      </div>
    `
    executePrintHtml(html, `Barcode Label - ${code}`)
  }

  // Simulate scanning a real barcode with camera simulation
  const handleSimulateScan = (scannedCode) => {
    const code = scannedCode || `RW-${Math.floor(100000000000 + Math.random() * 900000000000)}`
    setProductSku(code)
    stopCameraScan()
    addToast && addToast({
      type: 'info',
      title: 'Barcode Scanned',
      message: `Scanned code: ${code}`
    })
  }

  // Settings / Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || workspace.ownerName || 'Business Owner',
    businessName: user?.businessName || workspace.businessName || `${currentArch.name} Enterprise`,
    email: user?.email || workspace.email || 'owner@exbos.rw',
    phone: user?.phone || workspace.phone || '+250 788 000 000',
    location: user?.location || workspace.location || 'Kigali, Rwanda',
    businessCategory: user?.businessCategory || workspace.category || currentArch.name,
    planTier: user?.planTier || 'Gold',
    spendableRWF: metrics.spendableRWF || 0,
    monthlyRevenueRWF: metrics.monthlyRevenueRWF || 0,
    netProfitRWF: metrics.netProfitRWF || 0,
    stockValueRWF: metrics.stockValueRWF || 0,
    todayProfitRWF: metrics.todayProfitRWF || 0,
    owedToMeRWF: metrics.owedToMeRWF || 0
  })

  useEffect(() => {
    setProfileForm({
      name: user?.name || workspace.ownerName || 'Business Owner',
      businessName: user?.businessName || workspace.businessName || `${currentArch.name} Enterprise`,
      email: user?.email || workspace.email || 'owner@exbos.rw',
      phone: user?.phone || workspace.phone || '+250 788 000 000',
      location: user?.location || workspace.location || 'Kigali, Rwanda',
      businessCategory: user?.businessCategory || workspace.category || currentArch.name,
      planTier: user?.planTier || 'Gold',
      spendableRWF: metrics.spendableRWF || 0,
      monthlyRevenueRWF: metrics.monthlyRevenueRWF || 0,
      netProfitRWF: metrics.netProfitRWF || 0,
      stockValueRWF: metrics.stockValueRWF || 0,
      todayProfitRWF: metrics.todayProfitRWF || 0,
      owedToMeRWF: metrics.owedToMeRWF || 0
    })
  }, [activeArchId, user, workspace.ownerName, workspace.businessName])

  const showFlash = (msg) => {
    setSavedNotice(msg)
    setTimeout(() => setSavedNotice(''), 3500)
  }

  const isCategoriesPage =
    activePage === 'Categories' ||
    activePage === 'Expense Categories' ||
    activePage === 'Service Categories' ||
    activePage === 'Budget Categories (Auto-Sorted)' ||
    activePage === 'Categories & Activity Tags'

  const isProductForm =
    !editRow &&
    (activeModule === 'Products' ||
      activeModule === 'Products & Stock' ||
      activeModule === 'Farm Inventory' ||
      activeModule === 'Ingredients & Stock') &&
    (activePage === 'All Products' ||
      activePage === 'Finished Goods' ||
      activePage === 'Raw Materials' ||
      activePage === 'Farm Inputs' ||
      activePage === 'Kitchen Ingredients' ||
      activePage === 'Harvested Stock' ||
      (activePage.includes('Low Stock') && !purchaseProductId))

  const isSaleForm =
    !editRow &&
    (activeModule === 'Sales' ||
      activePage === 'All Sales' ||
      activePage === 'Farm Sales')

  const isPurchaseForm =
    !editRow &&
    (activeModule === 'Purchases' ||
      activePage === 'All Purchases' ||
      activePage === 'Feed & Input Orders' ||
      (activeModule === 'Products' && (activePage === 'Stock' || purchaseProductId)))

  const isCustomerForm = activeModule === 'Customers'
  const isSupplierForm = activeModule === 'Suppliers'

  // Dynamic Item Picker configurations per architecture (ODT Section 2)
  const saleItemPickerConfig = useMemo(() => {
    switch (activeArchId) {
      case 'make-and-sell':
        return {
          label: 'Select Finished Goods to Sell',
          placeholder: '-- Select finished bakery or manufactured batch --',
          searchPlaceholder: 'Search finished goods, loaves, cakes, or batch...',
          badge: 'Finished Goods'
        }
      case 'services':
        return {
          label: 'Select Service (with Staff & Time)',
          placeholder: '-- Select service from service catalogue --',
          searchPlaceholder: 'Search service catalogue, haircut, brake repair...',
          badge: 'Service'
        }
      case 'agriculture':
        return {
          label: 'Select Animals or Harvested Produce',
          placeholder: '-- Select animal tag or harvested crop batch --',
          searchPlaceholder: 'Search animal tag, breed, or harvest produce...',
          badge: 'Farm Produce'
        }
      case 'food-and-hospitality':
        return {
          label: 'Select Menu Item or Room Night',
          placeholder: '-- Select food/beverage or guest room --',
          searchPlaceholder: 'Search kitchen menu item or room folio...',
          badge: 'Menu / Room'
        }
      case 'hybrid':
        return {
          label: 'Select Product or Service',
          placeholder: '-- Select product (inventory) or technical service --',
          searchPlaceholder: 'Search products and services...',
          badge: 'Hybrid Item'
        }
      case 'buy-and-sell':
      default:
        return {
          label: 'Select Product (Scan or Search Barcode)',
          placeholder: '-- Select recorded product to sell --',
          searchPlaceholder: 'Search product name, category, or barcode...',
          badge: 'Product'
        }
    }
  }, [activeArchId])

  const purchaseItemPickerConfig = useMemo(() => {
    switch (activeArchId) {
      case 'make-and-sell':
        return {
          label: 'Raw Material to Purchase',
          placeholder: '-- Select raw material or enter ingredient/input --',
          searchPlaceholder: 'Search raw materials (flour, butter, yeast)...',
          badge: 'Raw Material'
        }
      case 'services':
        return {
          label: 'Supplies / Consumables to Purchase',
          placeholder: '-- Select supply/part or enter custom item --',
          searchPlaceholder: 'Search supplies, oils, spare parts, tools...',
          badge: 'Consumable / Supply'
        }
      case 'agriculture':
        return {
          label: 'Feed, Farm Inputs, or Animals to Purchase',
          placeholder: '-- Select feed type, fertilizer, seeds or livestock --',
          searchPlaceholder: 'Search animal feed, seeds, vet medicine, fertilizer...',
          badge: 'Farm Input / Feed'
        }
      case 'food-and-hospitality':
        return {
          label: 'Kitchen Ingredients & Supplies to Purchase',
          placeholder: '-- Select kitchen ingredient or room supplies --',
          searchPlaceholder: 'Search ingredients, vegetables, meat, beverages...',
          badge: 'Kitchen Ingredient'
        }
      case 'hybrid':
        return {
          label: 'Products to Purchase / Restock',
          placeholder: '-- Select product to restock or order --',
          searchPlaceholder: 'Search products or equipment...',
          badge: 'Retail Product'
        }
      case 'buy-and-sell':
      default:
        return {
          label: 'Product / Item to Purchase',
          placeholder: '-- Select recorded product or enter custom item --',
          searchPlaceholder: 'Search product or type custom item name...',
          badge: 'Product'
        }
    }
  }, [activeArchId])

  // One-click Reorder action for Low Stock items (ODT Section 4)
  const handleOpenReorder = (item) => {
    setPurchaseProductId(item.id)
    setPurchaseItemTitle(item.title)
    setPurchaseUnit(item.unit || 'piece')
    setPurchaseUnitCost(Number(item.purchasePriceRWF ?? item.unitCostRWF) || '')
    setPurchaseQuantity('10')
    setPurchaseSupplierName(item.supplierName || item.supplier || '')
    setPurchaseSupplierPhone(item.supplierPhone || '')
    setPurchaseSupplierLocation(item.supplierLocation || '')
    setPurchaseExpiryDate('')
    setPurchasePaymentMethod('MTN MoMo Business')
    setPurchasePaymentStatus('Paid in Full')
    setPurchaseAutoRestock(true)
    setEditRow(null)
    setModalOpen(true)
  }

  // Define columns matching user reference image: Date, Category/Tag, Description, Amount, Status
  const columns = useMemo(() => {
    if (isCategoriesPage) {
      return categoryColumns
    }

    if (
      activeModule === 'Products' ||
      activeModule === 'Products & Stock' ||
      activeModule === 'Farm Inventory' ||
      activeModule === 'Ingredients & Stock' ||
      activeModule === 'Materials' ||
      activeModule === 'Ingredients' ||
      activeModule === 'Inventory'
    ) {
      return [
        { key: 'date', label: 'DATE', sortable: true, width: 'w-[11%]' },
        { key: 'category', label: 'CATEGORY / SKU', type: 'category', sortable: true, width: 'w-[16%]' },
        { key: 'title', label: 'PRODUCT / MATERIAL', sortable: true, width: 'w-[27%]' },
        { key: 'quantity', label: 'QUANTITY', align: 'center', sortable: true, width: 'w-[10%]' },
        { key: 'amountRWF', label: 'VALUATION', type: 'amount', align: 'right', sortable: true, width: 'w-[14%]' },
        { key: 'status', label: 'STATUS', type: 'status', width: 'w-[13%]' }
      ]
    }

    if (activeModule === 'Livestock') {
      return [
        { key: 'date', label: 'DATE', sortable: true, width: 'w-[10%]' },
        { key: 'category', label: 'ANIMAL TYPE / BREED', type: 'category', sortable: true, width: 'w-[18%]' },
        { key: 'title', label: 'ANIMAL NAME / TAG', sortable: true, width: 'w-[26%]' },
        { key: 'quantity', label: 'HEAD / QTY', align: 'center', sortable: true, width: 'w-[10%]' },
        { key: 'amountRWF', label: 'EST. VALUE', type: 'amount', align: 'right', sortable: true, width: 'w-[16%]' },
        { key: 'status', label: 'BREEDING & HEALTH STATUS', type: 'status', width: 'w-[20%]' }
      ]
    }

    if (activeModule === 'Crops & Fields') {
      return [
        { key: 'date', label: 'DATE', sortable: true, width: 'w-[10%]' },
        { key: 'category', label: 'CROP TYPE', type: 'category', sortable: true, width: 'w-[18%]' },
        { key: 'title', label: 'FIELD / PLOT NAME', sortable: true, width: 'w-[26%]' },
        { key: 'quantity', label: 'SIZE (HA/ACRE)', align: 'center', sortable: true, width: 'w-[12%]' },
        { key: 'amountRWF', label: 'EST. HARVEST VALUE', type: 'amount', align: 'right', sortable: true, width: 'w-[16%]' },
        { key: 'status', label: 'CROP CYCLE STATUS', type: 'status', width: 'w-[18%]' }
      ]
    }

    if (
      activeModule === 'Production' ||
      activeModule === 'Recipes' ||
      activeModule === 'Animals' ||
      activeModule === 'Crops'
    ) {
      return [
        { key: 'date', label: 'DATE', sortable: true, width: 'w-[11%]' },
        { key: 'category', label: 'BATCH / CYCLE', type: 'category', sortable: true, width: 'w-[16%]' },
        { key: 'title', label: 'OUTPUT / ITEM', sortable: true, width: 'w-[27%]' },
        { key: 'quantity', label: 'UNITS', align: 'center', sortable: true, width: 'w-[10%]' },
        { key: 'amountRWF', label: 'COST / VALUE', type: 'amount', align: 'right', sortable: true, width: 'w-[14%]' },
        { key: 'status', label: 'STATUS', type: 'status', width: 'w-[13%]' }
      ]
    }

    if (activeModule === 'Customers') {
      return [
        { key: 'date', label: 'DATE', sortable: true, width: 'w-[10%]' },
        { key: 'title', label: 'CUSTOMER NAME', sortable: true, width: 'w-[22%]' },
        { key: 'phone', label: 'PHONE / CONTACT', sortable: true, width: 'w-[15%]' },
        { key: 'preferredProducts', label: 'PRODUCTS LIKED', sortable: true, width: 'w-[21%]' },
        { key: 'balanceOwedRWF', label: 'MONEY OWED', type: 'amount', align: 'right', sortable: true, width: 'w-[16%]' },
        { key: 'status', label: 'STATUS / ACCOUNT', type: 'status', width: 'w-[16%]' }
      ]
    }

    if (activeModule === 'Purchases') {
      return [
        { key: 'date', label: 'DATE', sortable: true, width: 'w-[11%]' },
        { key: 'supplier', label: 'SUPPLIER', type: 'category', sortable: true, width: 'w-[20%]' },
        { key: 'title', label: 'PURCHASE ITEM / DETAILS', sortable: true, width: 'w-[26%]' },
        { key: 'quantity', label: 'QTY', align: 'center', sortable: true, width: 'w-[10%]' },
        { key: 'amountRWF', label: 'TOTAL AMOUNT', type: 'amount', align: 'right', sortable: true, width: 'w-[16%]' },
        { key: 'status', label: 'PAYMENT STATUS', type: 'status', width: 'w-[17%]' }
      ]
    }

    if (activeModule === 'Suppliers') {
      return [
        { key: 'date', label: 'DATE', sortable: true, width: 'w-[10%]' },
        { key: 'title', label: 'SUPPLIER NAME', sortable: true, width: 'w-[24%]' },
        { key: 'phone', label: 'PHONE / NUMBER', sortable: true, width: 'w-[14%]' },
        { key: 'location', label: 'LOCATION', sortable: true, width: 'w-[20%]' },
        { key: 'amountRWF', label: 'AMOUNT OWED', type: 'amount', align: 'right', sortable: true, width: 'w-[16%]' },
        { key: 'status', label: 'STATUS', type: 'status', width: 'w-[16%]' }
      ]
    }

    // Default financial table (Sales, Purchases, Expenses, Services, Jobs, Orders)
    return [
      { key: 'date', label: 'DATE', sortable: true, width: 'w-[12%]' },
      { key: 'category', label: 'CATEGORY', type: 'category', sortable: true, width: 'w-[16%]' },
      { key: 'title', label: 'DESCRIPTION', sortable: true, width: 'w-[28%]' },
      { key: 'amountRWF', label: 'AMOUNT', type: 'amount', align: 'right', sortable: true, width: 'w-[18%]' },
      { key: 'status', label: 'STATUS', type: 'status', width: 'w-[17%]' }
    ]
  }, [activeModule])

  const handleSaveEntry = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      addToast && addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Description or item name is required.'
      })
      return
    }

    const amt = Number(amountRWF) || 0
    const uCost = Number(unitCostRWF) || 0
    const sPrice = Number(sellingPriceRWF) || 0
    const qty = Number(quantity) || 1

    if (amt <= 0 && uCost <= 0 && sPrice <= 0) {
      addToast && addToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount or price greater than 0 RWF.'
      })
      return
    }

    addDemoRecord(activeArchId, bucketKey, {
      title: title.trim(),
      subPage: activePage,
      category: categoryTag.trim() || activePage,
      amountRWF: amt || (uCost || sPrice) * qty,
      unitCostRWF: uCost,
      sellingPriceRWF: sPrice,
      quantity: qty,
      balanceOwedRWF: activeModule === 'Customers' ? amt : undefined,
      customer: activeModule === 'Sales' ? (party.trim() || 'Direct Client') : undefined,
      supplier: activeModule === 'Purchases' || activeModule === 'Suppliers' ? (party.trim() || 'Vendor') : undefined,
      status: statusVal || 'Active',
      type: bucketKey === 'Sales' ? 'in' : 'out'
    })

    setTitle('')
    setCategoryTag('')
    setAmountRWF('')
    setUnitCostRWF('')
    setSellingPriceRWF('')
    setQuantity('1')
    setParty('')
    setModalOpen(false)
    addToast && addToast({
      type: 'success',
      title: 'Record Saved',
      message: `Recorded "${title.trim()}" in ${activeModule} (${activePage}).`
    })
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    updateUserProfile({
      name: profileForm.name,
      businessName: profileForm.businessName,
      email: profileForm.email,
      phone: profileForm.phone,
      location: profileForm.location,
      businessCategory: profileForm.businessCategory,
      architectureId: activeArchId,
      planTier: profileForm.planTier
    })
    updateDemoWorkspace(activeArchId, {
      ownerName: profileForm.name,
      businessName: profileForm.businessName,
      email: profileForm.email,
      phone: profileForm.phone,
      location: profileForm.location,
      category: profileForm.businessCategory,
      metrics: {
        ...metrics,
        spendableRWF: Number(profileForm.spendableRWF) || 0,
        monthlyRevenueRWF: Number(profileForm.monthlyRevenueRWF) || 0,
        netProfitRWF: Number(profileForm.netProfitRWF) || 0,
        stockValueRWF: Number(profileForm.stockValueRWF) || 0,
        todayProfitRWF: Number(profileForm.todayProfitRWF) || 0,
        owedToMeRWF: Number(profileForm.owedToMeRWF) || 0
      }
    })
    addToast && addToast({
      type: 'success',
      title: 'Settings Updated',
      message: 'Your profile settings have been saved.'
    })
  }

  // 1. Settings Module View
  if (activeModule === 'Settings') {
    return (
      <div className="space-y-6">
        <div className="exbos-glass-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-orbitron uppercase font-bold text-[#218DFF]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Workspace Settings · {activePage}</span>
              </span>
              <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1">
                {activeArchId === 'agriculture' ? 'Farm Profile & Operating Settings' : 'Customize Profile & Preferences'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeArchId === 'agriculture'
                  ? 'Manage farm name, location, contact phone, and operational baseline.'
                  : `Manage business details, language, dark/light theme, and operational baseline for ${currentArch.name}.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetDemoData()
                addToast && addToast({
                  type: 'info',
                  title: 'Clean Slate Reset',
                  message: 'Workspace reset to clean baseline (0 RWF).'
                })
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-xs font-bold text-rose-300 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Clean Slate</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* System Preferences: Language & Dark/Light Mode */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-orbitron uppercase tracking-wider text-[#218DFF] font-bold block">
                  System Preferences
                </span>
                <span className="text-xs text-slate-300">
                  Manage display language and workspace theme
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LanguageDropdown />
                <button
                  type="button"
                  onClick={toggleTheme}
                  title="Switch Light / Dark Mode"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-[#9EDCFF] flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] transition-all"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-[#9EDCFF]" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#9EDCFF]" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  {activeArchId === 'agriculture' ? 'Farm Owner / Manager Name' : 'Owner Full Name'}
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  {activeArchId === 'agriculture' ? 'Farm Name' : 'Business Name'}
                </label>
                <input
                  type="text"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Assigned Architecture
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs sm:text-sm font-bold text-slate-300">
                  {currentArch.number} · {currentArch.name}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Phone (WhatsApp)
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  {activeArchId === 'agriculture' ? 'Farm Location (District, Sector)' : 'Location'}
                </label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn-sapphire-clean px-6 py-3 text-xs sm:text-sm font-bold"
              >
                <span>{activeArchId === 'agriculture' ? 'Save Farm Profile' : 'Save Profile Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // 2. Make & Sell Architecture: Dedicated Manufacturing (Production) & Lot Stock Workspaces
  if (
    activeArchId === 'make-and-sell' &&
    (activeModule === 'Stock' ||
     activeModule === 'Production' ||
     (activeModule === 'Overview' && activePage === 'Production Alerts'))
  ) {
    return (
      <MakeSellWorkspace
        activeModule={activeModule}
        activePage={activePage}
        onSwitchPage={onSwitchPage}
      />
    )
  }

  // 3. Standard Structured Table View across All Architectures
  return (
    <div className="space-y-6">
      {/* Dynamic Module KPI Overview Cards */}
      <KpiCards
        activeModule={activeModule}
        activeArchId={activeArchId}
        recordsMap={recordsMap}
        records={records}
        transactions={transactions}
        hideFinancials={hideFinancials}
      />

      {activeModule === 'Sales' && activePage === 'Sales Trends' ? (
        <SalesTrendsView
          currentArch={currentArch}
          records={records}
          hideFinancials={hideFinancials}
          formatRWF={formatRWF}
          onRecordSale={() => {
            setEditRow(null)
            setModalOpen(true)
          }}
          onViewSale={(sale) => setDetailRow(sale)}
        />
      ) : activeModule === 'Purchases' && activePage === 'Unpaid Purchases' ? (
        <UnpaidPurchasesView
          currentArch={currentArch}
          purchases={records}
          hideFinancials={hideFinancials}
          formatRWF={formatRWF}
          onRecordPurchase={() => {
            setEditRow(null)
            setModalOpen(true)
          }}
          onPayBalance={(purchase) => {
            setPayPurchaseItem(purchase)
            const rem = Number(purchase.remainingAmountRWF) ?? Math.max(0, (Number(purchase.amountRWF) || 0) - (Number(purchase.paidAmountRWF) || 0))
            setPayAmountInput(rem)
            setPayMethodInput('MTN MoMo Business')
            setPayModalOpen(true)
          }}
        />
      ) : activeModule === 'Purchases' && activePage === 'Purchase Returns' ? (
        <PurchaseReturnsView
          currentArch={currentArch}
          purchases={records}
          formatRWF={formatRWF}
          onProcessReturn={handleProcessPurchaseReturn}
          onRecordPurchase={() => {
            setEditRow(null)
            setModalOpen(true)
          }}
        />
      ) : activeModule === 'Products' && activePage === 'Stock' ? (
        <StockLinesView
          currentArch={currentArch}
          inventory={records}
          hideFinancials={hideFinancials}
          formatRWF={formatRWF}
          onReceiveStock={() => {
            setEditRow(null)
            setPurchaseProductId('')
            setPurchaseItemTitle('')
            setPurchaseQuantity('1')
            setPurchaseUnit('piece')
            setPurchaseUnitCost('')
            setPurchaseExpiryDate('')
            setPurchaseSupplierName('')
            setPurchaseSupplierPhone('')
            setPurchaseSupplierLocation('')
            setPurchasePaymentMethod('MTN MoMo Business')
            setPurchasePaymentStatus('Paid in Full')
            setPurchaseAutoRestock(true)
            setModalOpen(true)
          }}
          onViewStockLine={(item) => setDetailRow(item)}
          onEditStockLine={(item) => {
            setEditRow(item)
            setModalOpen(true)
          }}
          onDeleteStockLine={(item) => {
            deleteDemoRecord(activeArchId, 'Inventory', item.id)
            addToast && addToast({
              type: 'info',
              title: 'Stock Line Removed',
              message: `Deleted "${item.title || item.id}".`
            })
          }}
        />
      ) : activeModule === 'Livestock' ? (
        <AnimalRegistryWorkspace
          activeArchId={activeArchId}
          activePage={activePage}
          workspace={workspace}
          records={records}
          onAddRecord={addDemoRecord}
          onUpdateRecord={updateDemoRecord}
          onDeleteRecord={deleteDemoRecord}
          addToast={addToast}
          hideFinancials={hideFinancials}
        />
      ) : (
        <div className="exbos-glass-card p-5 sm:p-6 space-y-4">
          {/* Quick trigger input to pop up category form when on Categories */}
          {isCategoriesPage && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#218DFF]/40 transition-all mb-1">
              <div
                onClick={handleOpenCreateCategory}
                className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#040C26]/90 border border-white/15 text-slate-300 hover:text-white cursor-pointer hover:border-[#218DFF]/60 transition-all group shadow-inner"
              >
                <Tag className="w-4 h-4 text-[#218DFF] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-slate-300 group-hover:text-white font-medium">
                  Click here to enter category name and create new category...
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateCategory}
                className="btn-sapphire-clean px-4 py-2.5 text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4 text-[#9EDCFF]" />
                <span>+ New Category</span>
              </button>
            </div>
          )}

          <UniversalModuleTable
            title={`${currentArch.name} · ${activeModule} (${activePage})`}
            subtitle={`Organized ledger records, status tracking, and row actions for ${activePage}.`}
            columns={columns}
            data={isCategoriesPage ? categoryRows : records}
            onAddNew={
              isCategoriesPage
                ? handleOpenCreateCategory
                : () => {
                    setEditRow(null)
                    setModalOpen(true)
                  }
            }
            addNewLabel={
              isCategoriesPage
                ? '+ New Category'
                : activeModule === 'Livestock'
                ? '+ New Animal'
                : activeModule === 'Crops & Fields'
                ? '+ New Field'
                : activeModule === 'Farm Inventory' && activePage === 'Farm Inputs'
                ? '+ New Input'
                : activeModule === 'Products' || activeModule === 'Products & Stock' || activeModule === 'Farm Inventory' || activeModule === 'Ingredients & Stock'
                ? '+ New Product'
                : activeModule === 'Sales'
                ? '+ New Sale'
                : activeModule === 'Purchases'
                ? '+ New Purchase'
                : activeModule === 'Customers'
                ? '+ New Customer'
                : activeModule === 'Suppliers'
                ? '+ New Supplier'
                : activeModule === 'Expenses'
                ? '+ New Expense'
                : `+ New ${activePage}`
            }
            onViewRow={isCategoriesPage ? (row) => handleOpenEditCategory(row.rawCategory || row) : (row) => setDetailRow(row)}
            onEditRow={
              isCategoriesPage
                ? (row) => handleOpenEditCategory(row.rawCategory || row)
                : (row) => {
                    setEditRow(row)
                    setTitle(row.title || '')
                    setCategoryTag(row.category || '')
                    setAmountRWF(row.amountRWF || '')
                    setQuantity(row.quantity || '1')
                    setStatusVal(row.status || 'Active')
                    setModalOpen(true)
                  }
            }
            onDeleteRow={isCategoriesPage ? (row) => handleDeleteCategory(row.rawCategory || row) : (row) => {
              deleteDemoRecord(activeArchId, bucketKey, row.id)
              addToast && addToast({
                type: 'info',
                title: 'Record Deleted',
                message: `Deleted "${row.title || row.id}".`
              })
            }}
            onReorderRow={activePage === 'Low Stock' ? (row) => handleOpenReorder(row) : undefined}
            hideFinancials={hideFinancials}
            emptyMessage={
              isCategoriesPage
                ? 'No categories found yet. Click "+ New Category" to add your first category.'
                : activePage === 'Low Stock'
                ? 'No low stock products right now! All your products are healthy and above their reorder thresholds.'
                : `No ${activePage} records yet. Click "${activeModule === 'Products' ? '+ New Product' : `+ New ${activePage}`}" to add your first record.`
            }
          />
        </div>
      )}

      {/* Row Detail Slide-Over / Modal */}
      {detailRow && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setDetailRow(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/15 p-5 pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase">
                  {detailRow.id || 'RECORD'}
                </span>
                <h4 className="font-orbitron text-base font-bold text-white">
                  {detailRow.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="overflow-y-auto p-5 pt-3 space-y-3 text-xs">
              {/* Product Barcode Visual Badge if present */}
              {(detailRow.barcode || detailRow.sku) && (
                <div className="p-3 rounded-2xl bg-white/10 border border-[#9EDCFF]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#9EDCFF] uppercase tracking-wider flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-[#218DFF]" />
                      <span>Product Barcode &amp; SKU</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                      {detailRow.barcode || detailRow.sku}
                    </span>
                  </div>
                  {/* Visual High-Contrast Barcode Vector Graphic */}
                  <div className="p-2.5 rounded-xl bg-white overflow-hidden shadow-md flex items-center justify-center">
                    {renderBarcodeSvg(detailRow.barcode || detailRow.sku, 56)}
                  </div>
                  <div className="text-[11px] text-center font-mono text-slate-300 tracking-[0.25em] font-semibold">
                    {detailRow.barcode || detailRow.sku}
                  </div>
                </div>
              )}

              {/* Prominent Low Stock Alert Banner if quantity <= lowStockAlert or status contains low/reorder/critical */}
              {(Number(detailRow.quantity) <= (Number(detailRow.lowStockAlert) || 5) ||
                String(detailRow.status || '').toLowerCase().includes('low') ||
                String(detailRow.status || '').toLowerCase().includes('reorder') ||
                String(detailRow.status || '').toLowerCase().includes('warning') ||
                String(detailRow.status || '').toLowerCase().includes('critical')) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-200 space-y-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-extrabold text-xs text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <span>Low Stock Alert</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Reorder Needed
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-200">
                    <span>Remaining Stock:</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {detailRow.quantity || 0} {detailRow.unit || 'units'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Low Stock Alert Threshold:</span>
                    <span className="font-bold text-white font-mono">
                      &lt; {detailRow.lowStockAlert || 5} {detailRow.unit || 'units'}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-200/90 pt-1 border-t border-amber-400/20 flex items-center gap-1">
                    <span>💡 Recommendation: Reorder stock soon to avoid lost sales and stockout.</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Date</span>
                <span className="font-mono text-white">{detailRow.date || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Category / Tag</span>
                <span className="font-semibold text-[#9EDCFF]">{detailRow.category || '—'}</span>
              </div>
              {detailRow.unit && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Unit of Measure</span>
                  <span className="font-semibold text-white uppercase">{detailRow.unit}</span>
                </div>
              )}
              {(detailRow.purchasePriceRWF !== undefined || detailRow.unitCostRWF !== undefined) && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Purchase Price (Cost)</span>
                  <span className="font-mono text-slate-200">
                    {formatRWF(detailRow.purchasePriceRWF ?? detailRow.unitCostRWF, hideFinancials)}
                  </span>
                </div>
              )}
              {detailRow.sellingPriceRWF !== undefined && Number(detailRow.sellingPriceRWF) > 0 && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Selling Price</span>
                  <span className="font-mono font-bold text-white">
                    {formatRWF(detailRow.sellingPriceRWF, hideFinancials)}
                  </span>
                </div>
              )}
              {(() => {
                const cost = Number(detailRow.purchasePriceRWF ?? detailRow.unitCostRWF) || 0
                const sell = Number(detailRow.sellingPriceRWF) || 0
                const profit = detailRow.expectedUnitProfitRWF !== undefined
                  ? Number(detailRow.expectedUnitProfitRWF)
                  : (sell > cost ? sell - cost : 0)
                const margin = detailRow.expectedMarginPct !== undefined
                  ? Number(detailRow.expectedMarginPct)
                  : (cost > 0 ? Math.round((profit / cost) * 100) : 0)
                const qty = Number(detailRow.quantity) || 0

                if (profit <= 0) return null

                return (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-white/5 bg-emerald-500/10 px-2 rounded-lg">
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Expected Profit / Unit</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        +{formatRWF(profit, hideFinancials)} ({margin}%)
                      </span>
                    </div>
                    {qty > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-white/5 bg-[#218DFF]/15 px-2.5 py-2 rounded-xl border border-[#218DFF]/30">
                        <span className="text-[#9EDCFF] font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#218DFF]" />
                          <span>Total Expected Stock Profit</span>
                        </span>
                        <span className="font-orbitron font-extrabold text-[#9EDCFF]">
                          +{formatRWF(profit * qty, hideFinancials)}
                        </span>
                      </div>
                    )}
                  </>
                )
              })()}
              {detailRow.quantity !== undefined && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Current Stock Quantity</span>
                  <span className="font-semibold text-white">
                    {detailRow.quantity} {detailRow.unit || ''}
                  </span>
                </div>
              )}
              {detailRow.lowStockAlert !== undefined && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Low Stock Alert Level</span>
                  <span className="font-semibold text-amber-300 font-mono">
                    &lt; {detailRow.lowStockAlert} {detailRow.unit || 'units'}
                  </span>
                </div>
              )}
              {detailRow.approximateThresholds && (
                <div className="py-1.5 border-b border-white/5 text-[11px] space-y-1">
                  <span className="text-slate-400 block font-semibold">Bulk Stock Thresholds:</span>
                  <div className="flex gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30">
                      Low: &lt; {detailRow.approximateThresholds.low}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Med: &lt; {detailRow.approximateThresholds.medium}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      High: &gt; {detailRow.approximateThresholds.high}
                    </span>
                  </div>
                </div>
              )}
              {detailRow.amountRWF !== undefined && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Valuation / Total</span>
                  <span className="font-orbitron font-extrabold text-white">
                    {formatRWF(detailRow.amountRWF, hideFinancials)}
                  </span>
                </div>
              )}
              {detailRow.balanceOwedRWF !== undefined && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-amber-300 font-semibold">Amount Owed / Credit</span>
                  <span className="font-orbitron font-extrabold text-amber-300">
                    {formatRWF(detailRow.balanceOwedRWF, hideFinancials)}
                  </span>
                </div>
              )}
              {detailRow.phone && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Phone / Number</span>
                  <span className="font-mono text-white">{detailRow.phone}</span>
                </div>
              )}
              {detailRow.email && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Email Address</span>
                  <span className="font-mono text-slate-200">{detailRow.email}</span>
                </div>
              )}
              {detailRow.location && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Location / Address</span>
                  <span className="text-white text-right max-w-[200px]">{detailRow.location}</span>
                </div>
              )}
              {detailRow.preferredProducts && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Products Liked</span>
                  <span className="text-white text-right max-w-[200px]">{detailRow.preferredProducts}</span>
                </div>
              )}
              {detailRow.customer && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Customer</span>
                  <span className="font-semibold text-white">{detailRow.customer}</span>
                </div>
              )}
              {detailRow.supplier && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Supplier</span>
                  <span className="font-semibold text-white">{detailRow.supplier}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Status</span>
                <span className="text-xs font-semibold text-[#9EDCFF]">
                  {detailRow.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Modal / Side Panel Footer (Edit, Print, Delete per MD Pattern 1) */}
            <div className="p-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-[#040C26]/90">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rowToEdit = detailRow
                    setDetailRow(null)
                    if (isCategoriesPage) {
                      handleOpenEditCategory(rowToEdit.rawCategory || rowToEdit)
                    } else {
                      setEditRow(rowToEdit)
                      setTitle(rowToEdit.title || '')
                      setCategoryTag(rowToEdit.category || '')
                      setAmountRWF(rowToEdit.amountRWF || '')
                      setQuantity(rowToEdit.quantity || '1')
                      setStatusVal(rowToEdit.status || 'Active')
                      setModalOpen(true)
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#218DFF]" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (detailRow.barcode || detailRow.sku) {
                      handlePrintBarcodeLabel(detailRow)
                    } else {
                      printBusinessDocument({
                        id: detailRow.id || detailRow.code || `DOC-${Date.now().toString().slice(-4)}`,
                        type: detailRow.type || (activeModule === 'sales' ? 'Official Sales Receipt' : (activeModule === 'purchases' ? 'Purchase Voucher' : 'Business Transaction Voucher')),
                        date: detailRow.date || new Date().toISOString().slice(0, 10),
                        recipient: detailRow.customer || detailRow.supplier || detailRow.name || detailRow.title || 'ExBOS Client',
                        recipientPhone: detailRow.phone || '',
                        recipientEmail: detailRow.email || '',
                        recipientAddress: detailRow.location || '',
                        amount: Number(detailRow.amountRWF || detailRow.amount || detailRow.sellingPriceRWF || 0),
                        paidAmount: Number(detailRow.paidRWF || detailRow.paidAmount || (detailRow.status === 'Paid' ? (detailRow.amountRWF || detailRow.amount || 0) : 0)),
                        outstandingAmount: Number(detailRow.balanceOwedRWF || detailRow.balance || 0),
                        status: detailRow.status || 'Verified',
                        items: [
                          {
                            name: detailRow.title || detailRow.name || detailRow.product || 'Standard Line Item',
                            quantity: Number(detailRow.quantity || 1),
                            unit: detailRow.unit || 'pcs',
                            unitPrice: Number(detailRow.amountRWF || detailRow.amount || 0) / Math.max(1, Number(detailRow.quantity || 1)),
                            total: Number(detailRow.amountRWF || detailRow.amount || 0)
                          }
                        ],
                        notes: detailRow.description || detailRow.notes || `Record verified in ExBOS ${activeModule} module.`
                      }, {
                        businessName: user?.businessName || 'ExBOS Enterprise'
                      })
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-[#9EDCFF]" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = detailRow.id
                    const titleToDelete = detailRow.title || detailRow.name || 'Record'
                    if (window.confirm(`Delete "${titleToDelete}"? This action cannot be undone.`)) {
                      setDetailRow(null)
                      deleteDemoRecord(activeArchId, bucketKey, idToDelete)
                      addToast && addToast({
                        type: 'info',
                        title: 'Record Deleted',
                        message: `Deleted "${titleToDelete}".`
                      })
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-xs font-semibold text-rose-300 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={modalOpen && isProductForm}
        onClose={() => { setModalOpen(false); setEditRow(null); }}
        editRow={editRow}
        activeArchId={activeArchId}
        activePage={activePage}
        categoryOptions={allCategories}
        onSaveProduct={(payload, isEdit) => {
          if (isEdit) {
            updateDemoRecord(activeArchId, bucketKey, payload.id, payload)
          } else {
            addDemoRecord(activeArchId, bucketKey, payload)
          }
          setModalOpen(false)
          setEditRow(null)
          addToast && addToast({
            type: "success",
            title: isEdit ? "Product Updated" : "Product Created",
            message: `Product "${payload.title}" saved successfully.`
          })
        }}
      />

      <SaleModal
        isOpen={modalOpen && isSaleForm}
        onClose={() => { setModalOpen(false); setEditRow(null); }}
        recordedProducts={recordedProducts}
        existingCustomers={existingCustomers}
        activeArchId={activeArchId}
        currentArch={currentArch}
        activePage={activePage}
        onSaveSale={(salePayload, selectedProd) => {
          addDemoRecord(activeArchId, "Sales", salePayload)
          if (salePayload.amountRWF > 0 && (salePayload.status === "Paid in Full" || salePayload.status === "Paid")) {
            addTransaction({
              architectureId: activeArchId,
              title: `Sale: ${salePayload.productTitle || salePayload.title || 'Product'} (${salePayload.quantity || 1} ${salePayload.unit || 'units'})`,
              amountRWF: salePayload.amountRWF,
              amount: salePayload.amountRWF,
              type: "in",
              account: salePayload.paymentMethod || 'Cash in Hand (Main Till)',
              channel: salePayload.paymentMethod,
              category: "Sales Revenue",
              subPage: activePage || "Sales"
            })
          }
          if (selectedProd) {
            const curStock = Number(selectedProd.quantity || selectedProd.currentStock) || 0
            const newStock = Math.max(0, curStock - salePayload.quantity)
            const shouldUpdateCatalog = Boolean(salePayload.updateCatalogPrice)
            const newPrice = shouldUpdateCatalog
              ? Number(salePayload.unitPriceRWF)
              : (Number(selectedProd.sellingPriceRWF) || Number(selectedProd.unitPriceRWF) || 0)
            const unitCost = Number(selectedProd.purchasePriceRWF ?? selectedProd.unitCostRWF) || 0
            const expectedProfit = newPrice > unitCost ? newPrice - unitCost : (Number(selectedProd.expectedUnitProfitRWF) || 0)
            const expectedMargin = newPrice > 0 ? Math.round((expectedProfit / newPrice) * 100) : 0

            const prodUpdates = {
              quantity: newStock,
              currentStock: newStock,
              sellingPriceRWF: newPrice,
              unitPriceRWF: newPrice,
              expectedUnitProfitRWF: expectedProfit,
              expectedMarginPct: expectedMargin,
              amountRWF: newStock * newPrice,
              status: newStock <= (Number(selectedProd.lowStockAlert) || 5) ? (newStock <= 0 ? "Out of Stock" : "Low Stock") : "Active"
            }

            updateDemoRecord(activeArchId, "Inventory", selectedProd.id, prodUpdates)
            updateDemoRecord(activeArchId, "Products", selectedProd.id, prodUpdates)
          }
          setModalOpen(false)
          setEditRow(null)
          addToast && addToast({
            type: "success",
            title: "Sale Recorded",
            message: salePayload.updateCatalogPrice
              ? `Recorded sale of "${salePayload.title}" and updated catalog price to ${formatRWF(salePayload.unitPriceRWF)}.`
              : `Recorded sale of "${salePayload.title}" for ${formatRWF(salePayload.amountRWF)}.`
          })
        }}
      />

      <PurchaseModal
        isOpen={modalOpen && isPurchaseForm}
        onClose={() => { setModalOpen(false); setEditRow(null); }}
        recordedProducts={activeArchId === 'make-and-sell' ? rawMaterialsForPurchase : recordedProducts}
        existingSuppliers={existingSuppliers}
        activeArchId={activeArchId}
        currentArch={currentArch}
        activePage={activePage}
        onSavePurchase={(purchasePayload, selectedProd, remaining) => {
          addDemoRecord(activeArchId, "Purchases", purchasePayload)
          if (purchasePayload.paidAmountRWF > 0) {
            addTransaction({
              architectureId: activeArchId,
              title: `Purchase: ${purchasePayload.productTitle || purchasePayload.title || 'Product'} (${purchasePayload.quantity || 1} ${purchasePayload.unit || 'units'})`,
              amountRWF: purchasePayload.paidAmountRWF,
              amount: purchasePayload.paidAmountRWF,
              type: "out",
              account: purchasePayload.paymentMethod || 'Cash in Hand (Main Till)',
              channel: purchasePayload.paymentMethod,
              category: "Inventory Restock",
              subPage: activePage || "Purchases"
            })
          }
          if (selectedProd) {
            const curStock = Number(selectedProd.quantity || selectedProd.currentStock) || 0
            const newStock = curStock + purchasePayload.quantity
            const purchaseUpdates = {
              quantity: newStock,
              currentStock: newStock,
              purchasePriceRWF: purchasePayload.unitPriceRWF,
              unitCostRWF: purchasePayload.unitPriceRWF,
              amountRWF: newStock * (Number(selectedProd.sellingPriceRWF) || purchasePayload.unitPriceRWF),
              status: newStock > 0 ? "Active" : "Low Stock"
            }
            updateDemoRecord(activeArchId, "Inventory", selectedProd.id, purchaseUpdates)
            updateDemoRecord(activeArchId, "Products", selectedProd.id, purchaseUpdates)
            if (activeArchId === 'make-and-sell') {
              updateDemoRecord(activeArchId, "RawMaterials", selectedProd.id, purchaseUpdates)
            }
          }
          setModalOpen(false)
          setEditRow(null)
          addToast && addToast({
            type: remaining > 0 ? "warning" : "success",
            title: "Purchase Recorded",
            message: `Purchase recorded: ${purchasePayload.title}.`
          })
        }}
      />

      <CustomerModal
        isOpen={modalOpen && isCustomerForm}
        onClose={() => { setModalOpen(false); setEditRow(null); }}
        editRow={editRow}
        currentArch={currentArch}
        activePage={activePage}
        onSave={(payload, isEdit) => {
          if (isEdit) {
            updateDemoRecord(activeArchId, "Customers", payload.id, payload)
          } else {
            addDemoRecord(activeArchId, "Customers", payload)
          }
          setModalOpen(false)
          setEditRow(null)
          addToast && addToast({
            type: "success",
            title: isEdit ? "Customer Updated" : "Customer Registered",
            message: `Saved customer "${payload.title}".`
          })
        }}
      />

      <SupplierModal
        isOpen={modalOpen && isSupplierForm}
        onClose={() => { setModalOpen(false); setEditRow(null); }}
        editRow={editRow}
        currentArch={currentArch}
        activePage={activePage}
        onSave={(payload, isEdit) => {
          if (isEdit) {
            updateDemoRecord(activeArchId, "Suppliers", payload.id, payload)
          } else {
            addDemoRecord(activeArchId, "Suppliers", payload)
          }
          setModalOpen(false)
          setEditRow(null)
          addToast && addToast({
            type: "success",
            title: isEdit ? "Supplier Updated" : "Supplier Registered",
            message: `Saved supplier "${payload.title}".`
          })
        }}
      />

      <GenericRecordModal
        isOpen={modalOpen && !isProductForm && !isSaleForm && !isPurchaseForm && !isCustomerForm && !isSupplierForm}
        onClose={() => { setModalOpen(false); setEditRow(null); }}
        editRow={editRow}
        activeArchId={activeArchId}
        currentArch={currentArch}
        activeModule={activeModule}
        activePage={activePage}
        categoryOptions={allCategories}
        onSaveRecord={(payload, isEdit) => {
          if (isEdit) {
            updateDemoRecord(activeArchId, bucketKey, payload.id, payload)
          } else {
            addDemoRecord(activeArchId, bucketKey, payload)
          }
          setModalOpen(false)
          setEditRow(null)
          addToast && addToast({
            type: "success",
            title: isEdit ? "Record Updated" : "Record Created",
            message: `Saved "${payload.title}".`
          })
        }}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        editingCategory={editingCategory}
        onSaveCategory={(catData) => {
          if (editingCategory) {
            handleUpdateCategory(editingCategory.id, catData.name)
          } else {
            handleAddCategory(catData.name)
          }
          setCategoryModalOpen(false)
        }}
      />

      <PayPurchaseModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        purchaseItem={payPurchaseItem}
        onConfirmPayment={({ purchaseItem, amount, method }) => {
          const currentRemaining = Number(purchaseItem.remainingAmountRWF) ?? Math.max(0, (Number(purchaseItem.amountRWF) || 0) - (Number(purchaseItem.paidAmountRWF) || 0))
          const actualPayment = Math.min(amount, currentRemaining)
          const newRemaining = Math.max(0, currentRemaining - actualPayment)
          const newPaid = (Number(purchaseItem.paidAmountRWF) || 0) + actualPayment

          updateDemoRecord(activeArchId, "Purchases", purchaseItem.id, {
            paidAmountRWF: newPaid,
            remainingAmountRWF: newRemaining,
            paymentStatus: newRemaining === 0 ? "Paid in Full" : "Part-paid",
            status: newRemaining === 0 ? "Paid in Full" : `Part-paid · ${formatRWF(newRemaining)} Remaining`
          })

          addTransaction({
            architectureId: activeArchId,
            title: `Supplier Payment: ${purchaseItem.supplierName || purchaseItem.supplier || 'Vendor'}`,
            amountRWF: actualPayment,
            amount: actualPayment,
            type: "out",
            account: method || 'Cash in Hand (Main Till)',
            channel: method,
            category: "Accounts Payable",
            subPage: activePage || "Purchases"
          })

          setPayModalOpen(false)
          setPayPurchaseItem(null)
          addToast && addToast({
            type: "success",
            title: "Payment Disbursed",
            message: `Paid ${formatRWF(actualPayment)} to ${purchaseItem.supplierName || purchaseItem.supplier}.`
          })
        }}
      />
    </div>
  )
}
