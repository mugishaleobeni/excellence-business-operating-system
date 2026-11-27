import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
import {
  SIX_ARCHITECTURES,
  DEFAULT_PRICING_PLANS,
  DEFAULT_PLATINUM_PROGRAM,
  FINANCIAL_TOOLS
} from '../data/architectures'
import { TRADE_PRESETS } from '../components/dashboard/make-and-sell/data/tradePresets'
import { SERVICE_PRESETS } from '../components/dashboard/services/data/servicePresets'
import { AGRICULTURE_PRESETS } from '../components/dashboard/agriculture/data/agriculturePresets'
import { FOOD_HOSPITALITY_PRESETS } from '../components/dashboard/food-hospitality/data/foodHospitalityPresets'
import { HYBRID_PRESETS } from '../components/dashboard/hybrid/data/hybridPresets'
import { exbosApi, getAuthHeaders, resolveApiBase, resolveStorageUrl, isTokenValid } from '../utils/apiClient'
import {
  idbGet,
  idbSet,
  generateQueueId,
  readFailedOfflineActions,
  writeFailedOfflineActions
} from '../utils/offlineStorage'

const ExbosContext = createContext(null)

export const ALL_RECORD_BUCKETS = [
  'Sales',
  'Purchases',
  'Inventory',
  'Products',
  'Production',
  'Customers',
  'Suppliers',
  'Expenses',
  'Services',
  'Consumables',
  'Staff',
  'Jobs',
  'ServiceJobs',
  'Categories',
  'RawMaterials',
  'Recipes',
  'Animals',
  'Batches',
  'Feeds',
  'FeedingLogs',
  'Gestations',
  'HealthRecords',
  'MenuItems',
  'KitchenOrders',
  'Ingredients',
  'Rooms',
  'GuestFolios',
  'WasteLogs',
  'HybridItems',
  'MixedSales',
  'Documents',
  'SentHistory',
  'TeamMembers'
]

export const createEmptyRecordBuckets = () => {
  const buckets = {}
  ALL_RECORD_BUCKETS.forEach((b) => {
    buckets[b] = []
  })
  return buckets
}

/**
 * Generates clean zero-base workspaces across all 6 architectures.
 * Completely free of hardcoded demo records so users can enter and test real data.
 */
export const createCleanWorkspaces = () => {
  const zeroWorkspaces = {}
  SIX_ARCHITECTURES.forEach((arch) => {
    zeroWorkspaces[arch.id] = {
      architectureId: arch.id,
      ownerName: '',
      businessName: `${arch.name} Enterprise`,
      email: '',
      phone: '',
      location: 'Kigali, Rwanda',
      category: arch.name,
      metrics: {
        spendableRWF: 0,
        monthlyRevenueRWF: 0,
        netProfitRWF: 0,
        stockValueRWF: 0,
        todayProfitRWF: 0,
        todayMoneyInRWF: 0,
        todayCostsRWF: 0,
        owedToMeRWF: 0,
        iOweSuppliersRWF: 0,
        attentionHeadline: 'Ready for entries · All systems live',
        survivalMonths: 0
      },
      records: createEmptyRecordBuckets()
    }
  })
  return zeroWorkspaces
}

/**
 * Sanitizes workspaces to filter out legacy hardcoded demo items (e.g. Cimerwa cement, Twyford tiles)
 * while preserving 100% of the user-entered records across page refreshes.
 */
export function sanitizeUserWorkspaces(data) {
  const clean = createCleanWorkspaces()
  if (!data || typeof data !== 'object') return clean

  const isLegacySeedRecord = (item) => {
    if (!item || typeof item !== 'object') return false
    const id = String(item.id || '')
    const knownSeedIds = [
      'SALE-101', 'PURCH-301', 'PURCH-302', 'CUST-001', 'CUST-002',
      'SUP-001', 'SUP-002', 'EXP-201', 'JOB-201', 'JOB-202', 'JOB-203', 'JOB-204',
      'HYB-001', 'HYB-002', 'HYB-003', 'HYB-004', 'HYB-005', 'HYB-006',
      'PROD-SUIT-01', 'PROD-DRESS-02', 'PROD-SHRT-03', 'RUN-SUIT-01', 'RUN-DRESS-02', 'RUN-SHRT-03',
      'REC-SUIT-01', 'REC-DRESS-02', 'RUN-SUIT-101', 'RUN-DRESS-102',
      'PROD-TBL-01', 'PROD-CHR-02', 'PROD-CAB-03', 'PROD-JUICE-01', 'PROD-JUICE-02',
      'PROD-GATE-01', 'PROD-GRILL-02', 'REC-TBL-01', 'REC-JUICE-01', 'REC-GATE-01'
    ]
    if (knownSeedIds.includes(id)) return true
    if (/^(PRD|INV|SAL|PUR|CUS|SUP|EXP|RUN|REC)-[1-6]0[1-9]$/.test(id)) return true
    const seedTitles = [
      'cimerwa cement', 'sadolin paint', 'twyford ceramic', 'brioche loaves',
      'wedding tier cake', 'azania wheat flour', 'azania premium wheat flour',
      'unsalted dairy butter', 'tunga pig feed', 'copper cables', 'epoxy adhesive',
      'samsung a55', 'supermarket a (kigali heights)', 'sawa city supermarket',
      'bakhresa grain milling', 'kabuye sugar works', 'standard sandwich loaf',
      'workshop rent', 'kitenge fabric', 'sewing thread', 'men tailored suit',
      'ankara evening dress', 'sow mama', 'grilled tilapia', 'screen assembly',
      'italian wool suit', 'kitenge flared midi dress', 'fitted long-sleeve cotton shirt',
      'custom 2-piece', 'mahogany planed hardwood', 'planed hardwood', 'brass zippers',
      'dining table', 'passion fruit juice', 'sliding security gate'
    ]
    const textToScan = `${item.title || ''} ${item.name || ''} ${item.customer || ''} ${item.supplier || ''} ${item.productName || ''} ${item.materialName || ''}`.toLowerCase()
    return seedTitles.some((d) => textToScan.includes(d))
  }

  SIX_ARCHITECTURES.forEach((arch) => {
    const archData = data[arch.id]
    if (archData) {
      clean[arch.id] = {
        ...clean[arch.id],
        ...archData,
        metrics: {
          ...clean[arch.id].metrics,
          ...(archData.metrics || {})
        },
        records: createEmptyRecordBuckets()
      }

      if (archData.records && typeof archData.records === 'object') {
        Object.keys(archData.records).forEach((mod) => {
          const list = Array.isArray(archData.records[mod]) ? archData.records[mod] : []
          clean[arch.id].records[mod] = list.filter((item) => !isLegacySeedRecord(item))
        })
      }
    }
  })

  return clean
}

/**
 * Ensures all transactions are strictly tagged with an architectureId
 * so that financial ledgers, movements, and metrics never bleed across architectures.
 */
export function sanitizeUserTransactions(rawTxList) {
  if (!Array.isArray(rawTxList)) return []
  return rawTxList.map((tx) => {
    let archId = tx.architectureId
    if (!archId) {
      const titleLower = String(tx.title || '').toLowerCase()
      const createdBy = String(tx.createdBy || '').toLowerCase()
      if (titleLower.includes('tunga') || createdBy.includes('mugisha')) {
        archId = 'agriculture'
      } else {
        archId = 'buy-and-sell'
      }
    }
    return {
      ...tx,
      architectureId: archId
    }
  })
}

export function ExbosProvider({ children }) {
  // One-time browser storage purge to remove any stale demo or cached records from prior sessions
  try {
    if (localStorage.getItem('exbos_clean_prod_v6') !== 'true') {
      const staleKeys = [
        'exbos_demo_workspaces',
        'exbos_workspaces_v2',
        'exbos_transactions',
        'exbos_businesses',
        'exbos_saved_analyses',
        'exbos_broadcast',
        'exbos_business_documents',
        'exbos_sent_history',
        'exbos_active_arch'
      ]
      staleKeys.forEach((k) => localStorage.removeItem(k))
      localStorage.setItem('exbos_clean_prod_v6', 'true')
    }
  } catch {
    /* ignore storage errors */
  }

  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState(() => localStorage.getItem('exbos_lang') || 'en')
  const [hideFinancials, setHideFinancials] = useState(() => {
    try {
      return localStorage.getItem('exbos_hide_financials') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('exbos_hide_financials', hideFinancials ? '1' : '0')
    } catch {
      /* ignore storage errors */
    }
  }, [hideFinancials])

  // Authenticated User State (Requires real backend token; purges legacy demo sessions or expired JWT)
  const [user, setUser] = useState(() => {
    try {
      localStorage.removeItem('exbos_demo_workspaces')
      const token = localStorage.getItem('exbos_access_token')
      const saved = localStorage.getItem('exbos_user')
      if (!token || !saved) return null
      if (!isTokenValid(token)) {
        localStorage.removeItem('exbos_user')
        localStorage.removeItem('exbos_access_token')
        return null
      }
      const parsed = JSON.parse(saved)
      if (parsed?.isDemo || String(parsed?.role || '').includes('Demo')) {
        localStorage.removeItem('exbos_user')
        localStorage.removeItem('exbos_access_token')
        return null
      }
      return parsed
    } catch {
      return null
    }
  })

  // Pending Calculator State for Auth Gate Preservation
  const [pendingCalculator, setPendingCalculator] = useState(() => {
    try {
      const saved = sessionStorage.getItem('exbos_pending_calc')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Preselected Architecture for Registration Flow
  const [preselectedArchitecture, setPreselectedArchitecture] = useState('buy-and-sell')

  // Multi-Branch State (Default Main HQ + sub-branches created in Settings)
  const getScopedBranchesKey = (u) => {
    const scope = String(u?.ownerScopeKey || u?.email || '').trim().toLowerCase()
    return scope ? `exbos_branches_${scope}` : 'exbos_branches'
  }
  const [branches, setBranches] = useState(() => {
    try {
      const saved =
        localStorage.getItem(getScopedBranchesKey(user)) ||
        localStorage.getItem('exbos_branches')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [activeBranchId, setActiveBranchId] = useState(() => {
    try {
      return localStorage.getItem('exbos_active_branch') || 'main'
    } catch {
      return 'main'
    }
  })

  useEffect(() => {
    try {
      const key = getScopedBranchesKey(user)
      if (user?.email && Array.isArray(branches) && branches.length > 0) {
        localStorage.setItem(key, JSON.stringify(branches))
      }
      localStorage.removeItem('exbos_branches')
    } catch {}
  }, [branches, user?.email, user?.ownerScopeKey])

  useEffect(() => {
    try {
      localStorage.setItem('exbos_active_branch', activeBranchId)
    } catch {}
  }, [activeBranchId])

  useEffect(() => {
    if (!user?.email) {
      setBranches([])
      setActiveBranchId('main')
      return
    }
    exbosApi.getBranches().then((res) => {
      const branchList = res?.data?.data?.branches || res?.data?.branches
      if (res?.ok && Array.isArray(branchList)) {
        setBranches(branchList)
        if (user?.assignedBranchId && branchList.some((b) => b.id === user.assignedBranchId)) {
          setActiveBranchId(user.assignedBranchId)
        } else if (!branchList.some((b) => b.id === activeBranchId)) {
          setActiveBranchId('main')
        }
      }
    }).catch(() => {})
  }, [user?.email, user?.assignedBranchId])

  const isBranchManager = useMemo(() => {
    const roleStr = String(user?.role || '').trim().toLowerCase()
    const assigned = String(user?.assignedBranchId || '').trim()
    const ownerScope = String(user?.ownerScopeKey || '').trim().toLowerCase()
    const selfEmail = String(user?.email || '').trim().toLowerCase()
    return (
      roleStr === 'branch manager' ||
      roleStr === 'branch_manager' ||
      (Boolean(assigned) && assigned !== 'main') ||
      (Boolean(ownerScope) && Boolean(selfEmail) && ownerScope !== selfEmail)
    )
  }, [user?.role, user?.assignedBranchId, user?.ownerScopeKey, user?.email])

  const activeBranch = useMemo(() => {
    return (
      branches.find((b) => b.id === activeBranchId) || {
        id: 'main',
        name: user?.businessName ? `${user.businessName} (Main HQ)` : 'Main HQ',
        architectureId: user?.architectureId || 'buy-and-sell',
        isMain: true,
        status: 'Active',
        requirePinForMainSwitch: true,
        permissions: {
          canDeleteRecords: true,
          canEditPrices: true,
          canViewProfitReports: true,
          canAddInventory: true,
          canRecordExpenses: true,
          maxExpenseLimitRWF: 0
        }
      }
    )
  }, [branches, activeBranchId, user])

  const activeBranchPermissions = useMemo(() => {
    const isMain = Boolean(activeBranch?.isMain || activeBranch?.id === 'main')
    const defaults = isMain
      ? {
          canDeleteRecords: true,
          canEditPrices: true,
          canViewProfitReports: true,
          canAddInventory: true,
          canRecordExpenses: true,
          maxExpenseLimitRWF: 0
        }
      : {
          canDeleteRecords: false,
          canEditPrices: false,
          canViewProfitReports: false,
          canAddInventory: true,
          canRecordExpenses: true,
          maxExpenseLimitRWF: 0
        }
    return {
      ...defaults,
      ...(activeBranch?.permissions || {})
    }
  }, [activeBranch])

  const [pendingBranchSwitchId, setPendingBranchSwitchId] = useState(null)

  const cancelPendingBranchSwitch = () => {
    setPendingBranchSwitchId(null)
  }

  const switchBranch = (branchId, options = {}) => {
    const targetId = branchId || 'main'
    if (targetId === activeBranchId) return true

    // 1. Sub-branch managers can never switch into Main HQ or another branch
    if (isBranchManager && user?.assignedBranchId && targetId !== user.assignedBranchId) {
      addToast({
        type: 'error',
        title: 'Main HQ Access Restricted',
        message: 'Your account is locked to your assigned branch. Switching to Main HQ is not permitted.'
      })
      return false
    }

    // 2. When operating inside a sub-branch, switching back to Main HQ requires Owner Password / PIN
    if (
      !options?.verified &&
      activeBranchId !== 'main' &&
      targetId === 'main' &&
      activeBranch?.requirePinForMainSwitch !== false
    ) {
      setPendingBranchSwitchId('main')
      return false
    }

    setPendingBranchSwitchId(null)
    setActiveBranchId(targetId)
    return true
  }

  const confirmOwnerBranchSwitch = async (secret) => {
    const trimmed = String(secret || '').trim()
    if (!trimmed) {
      return { ok: false, error: 'Please enter the Owner password or security PIN.' }
    }
    try {
      const res = await exbosApi.verifyOwnerBranchSwitch({
        secret: trimmed,
        fromBranchId: activeBranchId
      })
      if (res?.ok && (res?.data?.data?.verified || res?.data?.verified)) {
        const targetId = pendingBranchSwitchId || 'main'
        setPendingBranchSwitchId(null)
        setActiveBranchId(targetId)
        addToast({
          type: 'success',
          title: 'Main HQ Unlocked',
          message: 'Owner identity verified. Switched to Main HQ.'
        })
        return { ok: true }
      }
      return {
        ok: false,
        error: res?.error || res?.data?.error || 'Invalid Owner password or security PIN.'
      }
    } catch (err) {
      return {
        ok: false,
        error: err?.message || 'Could not verify Owner credentials.'
      }
    }
  }

  const transferBranchStock = async (branchId, payload) => {
    if (!branchId || branchId === 'main') {
      return { ok: false, error: 'Select a sub-branch to receive stock from Main HQ.' }
    }
    try {
      const res = await exbosApi.transferBranchStock(branchId, payload)
      const data = res?.data?.data || res?.data
      if (res?.ok && data) {
        const archId = payload?.architectureId || user?.architectureId || 'buy-and-sell'
        if (data.workspace && data.workspace.records) {
          setWorkspaces((prev) => ({
            ...prev,
            [archId]: {
              ...(prev[archId] || {}),
              ...data.workspace,
              records: data.workspace.records
            }
          }))
        }
        return { ok: true, ...data, message: res?.data?.message || 'Stock transferred.' }
      }
      return { ok: false, error: res?.error || res?.data?.error || 'Stock transfer failed.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Stock transfer failed.' }
    }
  }

  const createBranch = async ({ name, location, architectureId, permissions, requirePinForMainSwitch, ownerPin }) => {
    if (isBranchManager) {
      return { ok: false, error: 'Only the Business Owner at Main HQ can create new branches.' }
    }
    const trimmed = String(name || '').trim()
    if (!trimmed) return { ok: false, error: 'Branch name is required.' }
    const targetArch = architectureId || user?.architectureId || 'buy-and-sell'
    try {
      const res = await exbosApi.createBranch({
        name: trimmed,
        location: location || user?.location || 'Rwanda',
        architectureId: targetArch,
        permissions,
        requirePinForMainSwitch: requirePinForMainSwitch ?? true,
        ownerPin
      })
      const created = res?.data?.data?.branch || res?.data?.branch || res?.branch
      if (res?.ok && created) {
        setBranches((prev) => {
          const list = prev.length > 0 ? prev : [activeBranch]
          return [...list.filter((b) => b.id !== created.id), created]
        })
        return { ok: true, branch: created }
      }
      if (typeof navigator === 'undefined' || navigator.onLine) {
        return { ok: false, error: res?.error || res?.data?.error || 'Failed to create branch on server.' }
      }
    } catch (err) {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        return { ok: false, error: err?.message || 'Failed to create branch on server.' }
      }
    }
    const localBranch = {
      id: `br-${Date.now().toString().slice(-6)}`,
      name: trimmed,
      location: location || 'Rwanda',
      architectureId: targetArch,
      isMain: false,
      status: 'Active',
      requirePinForMainSwitch: true,
      permissions: {
        canDeleteRecords: false,
        canEditPrices: false,
        canViewProfitReports: false,
        canAddInventory: true,
        canRecordExpenses: true,
        maxExpenseLimitRWF: 0,
        ...(permissions || {})
      },
      createdAt: new Date().toISOString()
    }
    setBranches((prev) => [...prev, localBranch])
    return { ok: true, branch: localBranch }
  }

  const updateBranch = async (branchId, updates) => {
    if (!branchId) return { ok: false, error: 'Branch ID is required.' }
    try {
      const res = await exbosApi.updateBranch(branchId, updates)
      const updated = res?.data?.data?.branch || res?.data?.branch
      if (res?.ok && updated) {
        setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...updated } : b)))
        return { ok: true, branch: updated }
      }
      return { ok: false, error: res?.error || res?.data?.error || 'Failed to update branch.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to update branch.' }
    }
  }

  const [ownerNotifications, setOwnerNotifications] = useState([])

  const refreshOwnerNotifications = async () => {
    if (!user?.email || isBranchManager) {
      setOwnerNotifications([])
      return
    }
    try {
      const res = await exbosApi.getBranchNotifications()
      const items = res?.data?.data?.notifications || res?.data?.notifications
      if (res?.ok && Array.isArray(items)) {
        setOwnerNotifications(items)
      }
    } catch {
      // ignore offline
    }
  }

  const markOwnerNotificationRead = async (notifId) => {
    if (!notifId) return
    if (notifId === 'all') {
      setOwnerNotifications([])
    } else {
      setOwnerNotifications((prev) => prev.filter((n) => n.id !== notifId))
    }
    try {
      await exbosApi.markBranchNotificationRead(notifId)
    } catch {
      // ignore offline
    }
  }

  useEffect(() => {
    if (!user?.email || isBranchManager) {
      setOwnerNotifications([])
      return
    }
    refreshOwnerNotifications()
    const interval = setInterval(() => {
      refreshOwnerNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [user?.email, isBranchManager])

  const createBranchManagerInvite = async (branchId, payload = {}) => {
    if (!branchId) return { ok: false, error: 'Branch ID is required.' }
    try {
      const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://exbos.pages.dev'
      const res = await exbosApi.createBranchManagerInvite(branchId, { ...payload, frontendOrigin })
      const resultData = res?.data?.data || res?.data
      if (res?.ok && resultData) {
        if (resultData.branch) {
          setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...resultData.branch } : b)))
        }
        return { ok: true, ...resultData }
      }
      return { ok: false, error: res?.error || res?.data?.error || 'Failed to generate manager setup link.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to generate manager setup link.' }
    }
  }

  const assignBranchManager = async (branchId, payload) => {
    if (!branchId) return { ok: false, error: 'Branch ID is required.' }
    try {
      const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://exbos.pages.dev'
      const res = await exbosApi.assignBranchManager(branchId, { ...payload, frontendOrigin })
      const resultData = res?.data?.data || res?.data
      if (res?.ok && resultData) {
        if (resultData.branch) {
          setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...resultData.branch } : b)))
        }
        return { ok: true, ...resultData }
      }
      return { ok: false, error: res?.error || res?.data?.error || 'Failed to assign branch manager.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to assign branch manager.' }
    }
  }

  const updateBranchManager = async (branchId, payload) => {
    if (!branchId) return { ok: false, error: 'Branch ID is required.' }
    try {
      const res = await exbosApi.updateBranchManager(branchId, payload)
      const resultData = res?.data?.data || res?.data
      if (res?.ok && resultData) {
        if (resultData.branch) {
          setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...resultData.branch } : b)))
        }
        return { ok: true, ...resultData, message: res?.data?.message }
      }
      return { ok: false, error: res?.error || res?.data?.error || 'Failed to update branch manager.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to update branch manager.' }
    }
  }

  const setBranchManagerStatus = async (branchId, status, reason = '') => {
    if (!branchId) return { ok: false, error: 'Branch ID is required.' }
    try {
      const res = await exbosApi.setBranchManagerStatus(branchId, status, reason)
      const resultData = res?.data?.data || res?.data
      if (res?.ok && resultData) {
        if (resultData.branch) {
          setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...resultData.branch } : b)))
        }
        return { ok: true, ...resultData, message: res?.data?.message }
      }
      return { ok: false, error: res?.error || res?.data?.error || 'Failed to update branch manager status.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to update branch manager status.' }
    }
  }

  const deleteBranchManager = async (branchId) => {
    if (!branchId) return { ok: false, error: 'Branch ID is required.' }
    try {
      const res = await exbosApi.deleteBranchManager(branchId)
      const resultData = res?.data?.data || res?.data
      if (res?.ok) {
        if (resultData?.branch) {
          setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...resultData.branch } : b)))
        } else {
          setBranches((prev) =>
            prev.map((b) => {
              if (b.id !== branchId) return b
              const copy = { ...b }
              delete copy.manager
              return copy
            })
          )
        }
        return { ok: true, ...(resultData || {}), message: res?.data?.message }
      }
      return { ok: false, error: res?.error || res?.data?.error || 'Failed to remove branch manager.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to remove branch manager.' }
    }
  }

  const deleteBranch = async (branchId) => {
    if (!branchId || branchId === 'main') return { ok: false, error: 'Main HQ cannot be deleted.' }
    try {
      const res = await exbosApi.deleteBranch(branchId)
      if (res?.ok || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setBranches((prev) => prev.filter((b) => b.id !== branchId))
        if (activeBranchId === branchId) setActiveBranchId('main')
        return { ok: true }
      }
      return { ok: false, error: res?.data?.error || 'Failed to delete branch.' }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to delete branch.' }
    }
  }

  // Saved Financial Tool Analyses (Starts clean; populated from backend / user entries)
  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_saved_analyses')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Super Admin Controlled Pricing Plans
  const [pricingPlans, setPricingPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_pricing_plans')
      return saved ? JSON.parse(saved) : DEFAULT_PRICING_PLANS
    } catch {
      return DEFAULT_PRICING_PLANS
    }
  })

  // Super Admin Controlled Platinum Program
  const [platinumProgram, setPlatinumProgram] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_platinum')
      return saved ? JSON.parse(saved) : DEFAULT_PLATINUM_PROGRAM
    } catch {
      return DEFAULT_PLATINUM_PROGRAM
    }
  })

  // Super Admin Controlled Architecture Media
  const [architectures, setArchitectures] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_architectures')
      if (!saved) return SIX_ARCHITECTURES
      const parsed = JSON.parse(saved)
      return SIX_ARCHITECTURES.map((defaultArch) => {
        const match = Array.isArray(parsed)
          ? parsed.find((item) => item.id === defaultArch.id)
          : null
        if (!match) return defaultArch
        return {
          ...defaultArch,
          ...match,
          navigation: defaultArch.navigation,
          videoUrl: /^https?:/.test(match.videoUrl || '') ? match.videoUrl : defaultArch.videoUrl,
          image: defaultArch.image || match.image,
          thumb: defaultArch.thumb || match.thumb
        }
      })
    } catch {
      return SIX_ARCHITECTURES
    }
  })

  // Super Admin Controlled Financial Tools
  const [financialTools, setFinancialTools] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_financial_tools')
      return saved ? JSON.parse(saved) : FINANCIAL_TOOLS
    } catch {
      return FINANCIAL_TOOLS
    }
  })

  // Live Registered Businesses (Starts clean for user tests, persists live)
  const [businesses, setBusinesses] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_businesses')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Super Admin Platform Broadcast Advertisement (Starts clean; set via Super Admin)
  const [superAdminBroadcast, setSuperAdminBroadcast] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_broadcast')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Business Transactions with Edit Audit Trail (Starts clean; records load from backend when online)
  const [transactions, setTransactions] = useState(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine) return []
    try {
      const saved = localStorage.getItem('exbos_transactions')
      return saved ? sanitizeUserTransactions(JSON.parse(saved)) : []
    } catch {
      return []
    }
  })

  // Connected External Integrations State (Starts clean; updated via backend / user settings)
  const [integrations, setIntegrations] = useState({
    gmail: {
      connected: false,
      email: '',
      lastSync: null,
      sentCount: 0
    },
    googleDrive: {
      connected: false,
      folderName: 'EXCELLENCE BOS Reports',
      account: '',
      lastExport: null
    },
    whatsapp: {
      connected: false,
      officialNumber: '',
      linkedBusinessPhone: '',
      requireConfirmation: true
    }
  })

  // Document Export History (Starts clean; populated as user exports reports)
  const [exportHistory, setExportHistory] = useState([])

  // Sync theme with document root: Default to white (light) mode; allow dark mode only for logged-in users
  useEffect(() => {
    const root = document.documentElement
    const effectiveTheme = user ? theme : 'light'
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('exbos_theme', effectiveTheme)
  }, [theme, user])

  useEffect(() => {
    localStorage.setItem('exbos_lang', language)
  }, [language])

  useEffect(() => {
    if (user) {
      localStorage.setItem('exbos_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('exbos_user')
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('exbos_pricing_plans', JSON.stringify(pricingPlans))
  }, [pricingPlans])

  useEffect(() => {
    localStorage.setItem('exbos_platinum', JSON.stringify(platinumProgram))
  }, [platinumProgram])

  useEffect(() => {
    localStorage.setItem('exbos_architectures', JSON.stringify(architectures))
  }, [architectures])

  useEffect(() => {
    localStorage.setItem('exbos_businesses', JSON.stringify(businesses))
  }, [businesses])

  useEffect(() => {
    if (superAdminBroadcast) {
      localStorage.setItem('exbos_broadcast', JSON.stringify(superAdminBroadcast))
    }
  }, [superAdminBroadcast])

  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        localStorage.setItem('exbos_transactions', JSON.stringify(transactions))
      } else {
        localStorage.removeItem('exbos_transactions')
      }
    } catch {}
  }, [transactions])

  // Active Trade / Craft for Make & Sell Architecture
  const [makeSellTrade, setMakeSellTrade] = useState(() => {
    try {
      return localStorage.getItem('exbos_make_sell_trade') || 'tailoring'
    } catch {
      return 'tailoring'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('exbos_make_sell_trade', makeSellTrade)
    } catch {}
  }, [makeSellTrade])

  // Active Trade / Preset for Service-Based Architecture
  const [serviceTrade, setServiceTrade] = useState(() => {
    try {
      return localStorage.getItem('exbos_services_trade') || 'salon'
    } catch {
      return 'salon'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('exbos_services_trade', serviceTrade)
    } catch {}
  }, [serviceTrade])

  // Active Trade / Preset for Agriculture & Livestock Architecture
  const [agricultureTrade, setAgricultureTrade] = useState(() => {
    try {
      return localStorage.getItem('exbos_agriculture_trade') || 'pigs'
    } catch {
      return 'pigs'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('exbos_agriculture_trade', agricultureTrade)
    } catch {}
  }, [agricultureTrade])

  // Active Trade / Preset for Food & Hospitality Architecture
  const [foodTrade, setFoodTrade] = useState(() => {
    try {
      return localStorage.getItem('exbos_food_trade') || 'combined'
    } catch {
      return 'combined'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('exbos_food_trade', foodTrade)
    } catch {}
  }, [foodTrade])

  // Active Trade / Preset for Hybrid Business Architecture
  const [hybridTrade, setHybridTrade] = useState(() => {
    try {
      return localStorage.getItem('exbos_hybrid_trade') || 'techRepair'
    } catch {
      return 'techRepair'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('exbos_hybrid_trade', hybridTrade)
    } catch {}
  }, [hybridTrade])

  // Active Activities in Hybrid Business
  const [hybridActivities, setHybridActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_hybrid_activities')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { retail: true, service: true, food: false, production: false }
  })

  useEffect(() => {
    try {
      localStorage.setItem('exbos_hybrid_activities', JSON.stringify(hybridActivities))
    } catch {}
  }, [hybridActivities])

  const toggleHybridActivity = (key) => {
    setHybridActivities((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const [isInitialCloudLoading, setIsInitialCloudLoading] = useState(false)
  const isHydratedRef = useRef(false)
  const isFetchingCloudRef = useRef(false)
  const isFlushingRef = useRef(false)
  const lastPostedHashRef = useRef('')
  const lastMutationTsRef = useRef(0)
  const recentlyDeletedIdsRef = useRef(new Set())
  const activeScopeRef = useRef('')
  activeScopeRef.current = String(user?.ownerScopeKey || user?.email || '').trim().toLowerCase()

  const getScopedCacheKey = (scope) =>
    scope ? `exbos_offline_cache_${scope}` : ''

  const readScopedOfflineCache = (scope) => {
    const key = getScopedCacheKey(scope)
    if (!key) return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {}
    return null
  }

  const writeScopedOfflineCache = (scope, wsData, txData) => {
    const key = getScopedCacheKey(scope)
    if (!key) return
    const payload = {
      workspaces: wsData,
      transactions: txData,
      cachedAt: new Date().toISOString()
    }
    // Primary large-capacity store: IndexedDB (hundreds of MB, non-blocking)
    idbSet(key, payload).catch(() => {})
    // Fast synchronous boot mirror: localStorage (gracefully handles 5MB quota)
    try {
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      // IndexedDB already holds the full snapshot if localStorage exceeds 5MB quota
    }
  }

  const mergeServerWorkspacesWithLocal = (serverWsMap, localWsMap) => {
    const cleanBase = createCleanWorkspaces()
    const mergedOut = { ...cleanBase, ...(localWsMap || {}) }
    const deletedIds = recentlyDeletedIdsRef.current

    Object.keys(serverWsMap || {}).forEach((archKey) => {
      const sWs = serverWsMap[archKey]
      if (!sWs || typeof sWs !== 'object') return
      const lWs = mergedOut[archKey] || cleanBase[archKey] || {}
      const sRecs = sWs.records || {}
      const lRecs = lWs.records || {}
      const allBuckets = new Set([...Object.keys(lRecs), ...Object.keys(sRecs), 'Inventory', 'Products'])
      const nextRecords = {}

      allBuckets.forEach((bName) => {
        const serverArr = Array.isArray(sRecs[bName]) ? sRecs[bName] : []
        const extraProductArr =
          bName === 'Inventory'
            ? [
                ...(Array.isArray(sRecs['Products']) ? sRecs['Products'] : []),
                ...(Array.isArray(sRecs['FinishedGoods']) ? sRecs['FinishedGoods'] : []),
                ...(Array.isArray(sRecs['Stock']) ? sRecs['Stock'] : [])
              ]
            : []
        const seen = new Set()
        const combined = []
        // Server (MongoDB Atlas) is the single source of truth so updates & deletes from WhatsApp
        // or other devices reflect immediately without requiring a page refresh.
        for (const item of [...serverArr, ...extraProductArr]) {
          if (!item || typeof item !== 'object') continue
          const idStr = String(item.id || '')
          if (!idStr || seen.has(idStr) || deletedIds.has(idStr)) continue
          seen.add(idStr)
          combined.push(item)
        }
        nextRecords[bName] = combined
      })

      mergedOut[archKey] = {
        ...lWs,
        ...sWs,
        metrics: { ...(lWs.metrics || {}), ...(sWs.metrics || {}) },
        records: nextRecords
      }
    })
    return mergedOut
  }

  const [workspaces, setWorkspaces] = useState(() => {
    const initialScope = String(user?.ownerScopeKey || user?.email || '').trim().toLowerCase()
    const cached = readScopedOfflineCache(initialScope)
    if (cached?.workspaces) {
      return sanitizeUserWorkspaces(cached.workspaces)
    }
    try {
      const saved = localStorage.getItem('exbos_workspaces_v2')
      if (saved) return sanitizeUserWorkspaces(JSON.parse(saved))
    } catch {
      // ignore
    }
    return createCleanWorkspaces()
  })

  // Load stored data from Flask + MongoDB Atlas backend on mount, focus, visibilitychange, and live interval (Phone PWA <-> PC PWA sync)
  useEffect(() => {
    let isMounted = true
    const effectiveScope = (user?.ownerScopeKey || user?.email || '').toLowerCase()
    const scopeParam = effectiveScope ? `?scopeKey=${encodeURIComponent(effectiveScope)}` : ''

    // Hydrate tenant-scoped offline cache immediately so offline reloads & slow networks
    // never wipe the user's dashboard or lose unsynced offline CRUD changes.
    const cachedSnapshot = readScopedOfflineCache(effectiveScope)
    const pendingOfflineForScope = getOfflineQueue(effectiveScope).length > 0
    if (cachedSnapshot && (pendingOfflineForScope || (typeof navigator !== 'undefined' && !navigator.onLine))) {
      isHydratedRef.current = true
      if (cachedSnapshot.workspaces) {
        setWorkspaces(sanitizeUserWorkspaces(cachedSnapshot.workspaces))
      }
      if (Array.isArray(cachedSnapshot.transactions)) {
        setTransactions(sanitizeUserTransactions(cachedSnapshot.transactions))
      }
    } else if (cachedSnapshot?.workspaces) {
      // Warm start from tenant-scoped cache while online cloud fetch runs in background
      isHydratedRef.current = true
      setWorkspaces(sanitizeUserWorkspaces(cachedSnapshot.workspaces))
      if (Array.isArray(cachedSnapshot.transactions)) {
        setTransactions(sanitizeUserTransactions(cachedSnapshot.transactions))
      }
    } else {
      // Brand-new or switched user scope with no localStorage cache:
      // attempt async IndexedDB hydration (handles >5MB accounts cleanly)
      isHydratedRef.current = false
      setWorkspaces(createCleanWorkspaces())
      setTransactions([])
      setSavedAnalyses([])
      setExportHistory([])
      if (effectiveScope) {
        idbGet(getScopedCacheKey(effectiveScope)).then((idbSnap) => {
          if (!isMounted || !idbSnap) return
          const stillNeedsOffline =
            !isHydratedRef.current ||
            getOfflineQueue(effectiveScope).length > 0 ||
            (typeof navigator !== 'undefined' && !navigator.onLine)
          if (stillNeedsOffline && idbSnap.workspaces) {
            isHydratedRef.current = true
            setWorkspaces(sanitizeUserWorkspaces(idbSnap.workspaces))
            if (Array.isArray(idbSnap.transactions)) {
              setTransactions(sanitizeUserTransactions(idbSnap.transactions))
            }
          }
        })
      }
    }
    const scopedQ = getOfflineQueue(effectiveScope)
    setOfflineQueueCount(scopedQ.length)
    setPendingOfflineActions(scopedQ)
    setFailedOfflineActions(readFailedOfflineActions(effectiveScope))

    const fetchAndSyncCloud = (isInitial = false) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (isInitial && isMounted) setIsInitialCloudLoading(false)
        return
      }
      // Do not fetch tenant workspaces or transactions when no authenticated user scope is active
      if (!effectiveScope) {
        isHydratedRef.current = false
        if (isInitial && isMounted) setIsInitialCloudLoading(false)
        return
      }
      // Critical Offline-Sync Guard: if offline CRUD actions are still queued or flushing,
      // flush them to MongoDB FIRST and skip overwriting local optimistic state until done!
      if (getOfflineQueue(effectiveScope).length > 0 || isFlushingRef.current) {
        if (isInitial && isMounted) setIsInitialCloudLoading(false)
        if (!isFlushingRef.current) {
          flushOfflineQueue(effectiveScope)
        }
        return
      }
      if (isInitial && isMounted && !cachedSnapshot) setIsInitialCloudLoading(true)
      // Avoid racing right in the middle of a local mutation (within 2.5s)
      if (!isInitial && Date.now() - lastMutationTsRef.current < 2500) return

      const sep = scopeParam ? '&' : '?'
      fetch(`${resolveStorageUrl(scopeParam)}${sep}_t=${Date.now()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      })
        .then(async (res) => {
          if (res.status === 403) {
            const errJson = await res.json().catch(() => ({}))
            const code = errJson?.details?.code || errJson?.code || ''
            if (code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_DELETED') {
              window.dispatchEvent(
                new CustomEvent('exbos:account-suspended', {
                  detail: {
                    code,
                    reason: errJson?.details?.reason || errJson?.error || 'Your account has been suspended.'
                  }
                })
              )
            }
            return null
          }
          return res.ok ? res.json() : null
        })
        .then((serverData) => {
          if (!isMounted || !serverData) return
          isFetchingCloudRef.current = true
          if (serverData.workspaces && typeof serverData.workspaces === 'object') {
            const sanitized = sanitizeUserWorkspaces(serverData.workspaces)
            setWorkspaces((prev) => {
              // Always normalize & merge Products/FinishedGoods/Stock into Inventory even on initial load
              const nextWs = mergeServerWorkspacesWithLocal(sanitized, isInitial ? createCleanWorkspaces() : prev)
              if (JSON.stringify(prev) === JSON.stringify(nextWs)) return prev
              return nextWs
            })
          }
          if (Array.isArray(serverData.transactions)) {
            const serverTxs = sanitizeUserTransactions(
              serverData.transactions.filter(
                (t) => !t?.scopeKey || String(t.scopeKey).toLowerCase() === effectiveScope
              )
            )
            setTransactions((prev) => {
              const seen = new Set()
              const out = []
              for (const tx of serverTxs) {
                if (!tx || !tx.id) continue
                if (tx.scopeKey && String(tx.scopeKey).toLowerCase() !== effectiveScope) continue
                const tid = String(tx.id)
                if (seen.has(tid) || recentlyDeletedIdsRef.current.has(tid)) continue
                seen.add(tid)
                out.push(tx)
              }
              if (JSON.stringify(prev) === JSON.stringify(out)) return prev
              return out
            })
          }
          if (Array.isArray(serverData.businesses)) {
            const nextBiz = serverData.businesses.filter(
              (b) =>
                !/^BIZ-10[0-9]{2}$/.test(String(b?.id || '')) &&
                !String(b?.status || '').toLowerCase().includes('demo')
            )
            setBusinesses((prev) => (JSON.stringify(prev) === JSON.stringify(nextBiz) ? prev : nextBiz))
          }
          if (Array.isArray(serverData.savedAnalyses)) {
            setSavedAnalyses((prev) =>
              JSON.stringify(prev) === JSON.stringify(serverData.savedAnalyses)
                ? prev
                : serverData.savedAnalyses
            )
          }
          if (Array.isArray(serverData.exportHistory)) {
            setExportHistory((prev) =>
              JSON.stringify(prev) === JSON.stringify(serverData.exportHistory)
                ? prev
                : serverData.exportHistory
            )
          }
          if (serverData.integrations && typeof serverData.integrations === 'object') {
            setIntegrations((prev) =>
              JSON.stringify(prev) === JSON.stringify(serverData.integrations)
                ? prev
                : serverData.integrations
            )
          }
          if (serverData.superAdminBroadcast !== undefined) {
            setSuperAdminBroadcast((prev) =>
              JSON.stringify(prev) === JSON.stringify(serverData.superAdminBroadcast)
                ? prev
                : serverData.superAdminBroadcast
            )
          }
        })
        .catch((err) => {
          console.debug('Server storage fetch notice:', err)
        })
        .finally(() => {
          if (isMounted) {
            isHydratedRef.current = true
            if (isInitial) setIsInitialCloudLoading(false)
            setTimeout(() => {
              isFetchingCloudRef.current = false
            }, 150)
          }
        })
    }

    fetchAndSyncCloud(true)

    const onFocusOrVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchAndSyncCloud(false)
      }
    }
    const onAccountSuspended = (ev) => {
      const reason = ev?.detail?.reason || 'Your account has been suspended by ExBOS Super Admin.'
      const isDeleted = ev?.detail?.code === 'ACCOUNT_DELETED'
      isHydratedRef.current = false
      setUser(null)
      setWorkspaces(createCleanWorkspaces())
      setTransactions([])
      try {
        localStorage.removeItem('exbos_access_token')
        localStorage.removeItem('exbos_user')
        localStorage.removeItem('exbos_workspaces_v2')
        localStorage.removeItem('exbos_transactions')
      } catch {}
      addToast({
        type: 'error',
        title: isDeleted ? 'Account Removed' : 'Account Suspended',
        message: reason
      })
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = `/login?suspended=1`
      }
    }
    const onOfflineSynced = () => {
      fetchAndSyncCloud(false)
    }
    window.addEventListener('exbos:account-suspended', onAccountSuspended)
    window.addEventListener('exbos:offline-synced', onOfflineSynced)
    window.addEventListener('focus', onFocusOrVisible)
    document.addEventListener('visibilitychange', onFocusOrVisible)
    const syncTimer = setInterval(() => fetchAndSyncCloud(false), 7000)

    return () => {
      isMounted = false
      window.removeEventListener('exbos:account-suspended', onAccountSuspended)
      window.removeEventListener('exbos:offline-synced', onOfflineSynced)
      window.removeEventListener('focus', onFocusOrVisible)
      document.removeEventListener('visibilitychange', onFocusOrVisible)
      clearInterval(syncTimer)
    }
  }, [user?.email, user?.ownerScopeKey])

  // Continuously maintain tenant-scoped offline cache (both online & offline) once hydrated,
  // and sync state to Flask + MongoDB Atlas only when online.
  useEffect(() => {
    const effectiveScope = (user?.ownerScopeKey || user?.email || '').toLowerCase()
    if (effectiveScope && isHydratedRef.current) {
      writeScopedOfflineCache(effectiveScope, workspaces, transactions)
    }
    // Remove legacy unscoped keys so different accounts never bleed across sessions
    try {
      localStorage.removeItem('exbos_workspaces_v2')
      localStorage.removeItem('exbos_transactions')
    } catch {}

    if (!isHydratedRef.current || isFetchingCloudRef.current) return
    if (!effectiveScope) return
    // Never fire background POST /storage requests while offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    const stateFingerprint = JSON.stringify({
      workspaces,
      transactions,
      user,
      savedAnalyses,
      integrations,
      exportHistory,
      superAdminBroadcast
    })
    if (stateFingerprint === lastPostedHashRef.current) return
    lastPostedHashRef.current = stateFingerprint

    const scopeParam = `?scopeKey=${encodeURIComponent(effectiveScope)}`
    const payload = JSON.stringify({
      workspaces,
      transactions,
      user,
      businesses,
      savedAnalyses,
      integrations,
      exportHistory,
      superAdminBroadcast,
      savedAt: new Date().toISOString()
    })

    fetch(resolveStorageUrl(scopeParam), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: payload
    }).catch(() => {})
  }, [workspaces, transactions, user, businesses, savedAnalyses, integrations, exportHistory, superAdminBroadcast])

  // Global System Toast Notification System
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    const newToast = {
      id,
      type: toast.type || 'error', // 'error' | 'success' | 'info' | 'warning'
      title: toast.title || (toast.type === 'success' ? 'Success' : toast.type === 'warning' ? 'Notice' : 'Error Notice'),
      message: toast.message || String(toast)
    }
    setToasts((prev) => [...prev, newToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
    return id
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Network Connectivity & Offline Queue Resilience System
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [dbConnected, setDbConnected] = useState(true)
  const [syncStatus, setSyncStatus] = useState('synced') // 'synced' | 'syncing' | 'offline' | 'pending' | 'auth_required' | 'db_error'
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [pendingOfflineActions, setPendingOfflineActions] = useState(() => {
    try {
      const savedUser = localStorage.getItem('exbos_user')
      const parsedUser = savedUser ? JSON.parse(savedUser) : null
      const initScope = String(parsedUser?.ownerScopeKey || parsedUser?.email || '').trim().toLowerCase()
      const scopedKey = initScope ? `exbos_offline_queue_${initScope}` : 'exbos_offline_queue'
      const raw = localStorage.getItem(scopedKey) || localStorage.getItem('exbos_offline_queue')
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [offlineQueueCount, setOfflineQueueCount] = useState(() => pendingOfflineActions.length)
  const [failedOfflineActions, setFailedOfflineActions] = useState(() => {
    try {
      const savedUser = localStorage.getItem('exbos_user')
      const parsedUser = savedUser ? JSON.parse(savedUser) : null
      const initScope = String(parsedUser?.ownerScopeKey || parsedUser?.email || '').trim().toLowerCase()
      return readFailedOfflineActions(initScope)
    } catch {
      return []
    }
  })

  const getOfflineQueueKey = (scopeOverride) => {
    const scope = String(scopeOverride ?? activeScopeRef.current ?? '').trim().toLowerCase()
    return scope ? `exbos_offline_queue_${scope}` : 'exbos_offline_queue'
  }

  const getOfflineQueue = (scopeOverride) => {
    try {
      const key = getOfflineQueueKey(scopeOverride)
      const q = localStorage.getItem(key)
      if (q) {
        const parsed = JSON.parse(q)
        return Array.isArray(parsed) ? parsed : []
      }
      // One-time migration from legacy unscoped queue if present
      if (key !== 'exbos_offline_queue') {
        const legacy = localStorage.getItem('exbos_offline_queue')
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy)
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            localStorage.setItem(key, JSON.stringify(parsedLegacy))
            localStorage.removeItem('exbos_offline_queue')
            return parsedLegacy
          }
        }
      }
      return []
    } catch {
      return []
    }
  }

  const saveOfflineQueue = (q, scopeOverride) => {
    const safeList = Array.isArray(q) ? q : []
    const key = getOfflineQueueKey(scopeOverride)
    idbSet(key, safeList).catch(() => {})
    try {
      localStorage.setItem(key, JSON.stringify(safeList))
    } catch {
      addToast({
        type: 'warning',
        title: 'Local Storage Nearly Full',
        message: 'Your offline queue was backed up to IndexedDB. Please connect to sync soon.'
      })
    }
    setPendingOfflineActions(safeList)
    setOfflineQueueCount(safeList.length)
  }

  const enqueueOfflineAction = (action) => {
    const scope = activeScopeRef.current
    const queue = getOfflineQueue(scope)
    queue.push({
      ...action,
      queueId: action.queueId || generateQueueId(),
      scopeKey: scope,
      queuedAt: action.queuedAt || Date.now()
    })
    saveOfflineQueue(queue, scope)
    setSyncStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'pending')
  }

  const retryFailedOfflineAction = (queueId) => {
    const scope = activeScopeRef.current
    const currentFailed = readFailedOfflineActions(scope)
    const target = currentFailed.find((item) => item.queueId === queueId)
    if (!target) return
    const nextFailed = currentFailed.filter((item) => item.queueId !== queueId)
    writeFailedOfflineActions(scope, nextFailed)
    setFailedOfflineActions(nextFailed)
    const { failedAt, failureReason, failureStatus, ...cleanAction } = target
    enqueueOfflineAction({ ...cleanAction, queueId: generateQueueId() })
    if (typeof navigator === 'undefined' || navigator.onLine) {
      setTimeout(() => flushOfflineQueue(scope), 150)
    }
  }

  const dismissFailedOfflineAction = (queueId) => {
    const scope = activeScopeRef.current
    const nextFailed = readFailedOfflineActions(scope).filter((item) => item.queueId !== queueId)
    writeFailedOfflineActions(scope, nextFailed)
    setFailedOfflineActions(nextFailed)
  }

  const flushOfflineQueue = async (scopeOverride) => {
    // Concurrency lock prevents duplicate MongoDB inserts when online event,
    // heartbeat timer, and manual sync click overlap.
    if (isFlushingRef.current) return
    const scope = String(scopeOverride ?? activeScopeRef.current ?? '').trim().toLowerCase()
    const rawQueue = getOfflineQueue(scope)
    if (!rawQueue || rawQueue.length === 0) {
      setSyncStatus((prev) => (prev === 'offline' || prev === 'db_error' ? prev : 'synced'))
      return
    }

    // Ensure every legacy queued item has a stable queueId for safe merge reconciliation
    const queue = rawQueue.map((item, idx) =>
      item.queueId ? item : { ...item, queueId: `legacy_${idx}_${item.queuedAt || Date.now()}` }
    )

    isFlushingRef.current = true
    setSyncStatus('syncing')
    const processedQueueIds = new Set()
    const failedRecordIds = new Set()
    const newlyFailed = []
    let processedCount = 0
    let authRequired = false

    try {
      for (const item of queue) {
        // Safety guard: never replay another user's queued mutation into the active account
        if (item.scopeKey && scope && item.scopeKey !== scope) {
          continue
        }

        const itemRecordId = String(item.recordId || item.entry?.id || item.txId || item.payload?.id || '')
        // Preserve strict FIFO dependency order per record: if an earlier action on this record failed,
        // hold subsequent updates/deletes for the same record in the queue.
        if (itemRecordId && failedRecordIds.has(itemRecordId)) {
          continue
        }

        try {
          let res
          if (item.type === 'add') {
            res = await exbosApi.addModuleRecord(item.archId, item.moduleName, item.entry)
          } else if (item.type === 'add_tx') {
            res = await exbosApi.createTransaction(item.payload)
          } else if (item.type === 'update') {
            res = await exbosApi.updateModuleRecord(item.archId, item.moduleName, item.recordId, item.updatedFields)
          } else if (item.type === 'delete') {
            res = await exbosApi.deleteModuleRecord(item.archId, item.moduleName, item.recordId)
          } else if (item.type === 'delete_tx') {
            res = await exbosApi.deleteTransaction(item.txId)
          } else if (item.type === 'workspace') {
            res = await exbosApi.patchWorkspace(item.archId, item.payload)
          }

          // Treat 404 on delete/delete_tx as already deleted on server (idempotent success)
          const isIdempotentDelete =
            (item.type === 'delete' || item.type === 'delete_tx') && res?.status === 404

          if (res?.ok || isIdempotentDelete) {
            processedCount++
            processedQueueIds.add(item.queueId)
          } else if (res?.status === 401) {
            // Critical data-safety guard: JWT expired while offline.
            // Stop flushing immediately and KEEP all remaining items safely in the queue!
            authRequired = true
            break
          } else if (
            res?.status === 0 ||
            res?.status >= 500 ||
            (typeof navigator !== 'undefined' && !navigator.onLine)
          ) {
            if (itemRecordId) failedRecordIds.add(itemRecordId)
          } else {
            // 400 / 402 / 403 / 422 — never silently drop; move to Failed Sync list with reason
            processedQueueIds.add(item.queueId)
            newlyFailed.push({
              ...item,
              failedAt: Date.now(),
              failureStatus: res?.status || 400,
              failureReason:
                res?.data?.error ||
                res?.data?.message ||
                res?.error ||
                `Rejected by server (HTTP ${res?.status || 400})`
            })
          }
        } catch {
          if (itemRecordId) failedRecordIds.add(itemRecordId)
        }
      }
    } finally {
      isFlushingRef.current = false
    }

    if (newlyFailed.length > 0) {
      const mergedFailed = [...readFailedOfflineActions(scope), ...newlyFailed]
      writeFailedOfflineActions(scope, mergedFailed)
      setFailedOfflineActions(mergedFailed)
      addToast({
        type: 'warning',
        title: 'Some Offline Changes Need Attention',
        message: `${newlyFailed.length} change${newlyFailed.length === 1 ? '' : 's'} could not sync automatically. Open Sync Status to review or retry.`
      })
    }

    // Re-read latest queue and remove ONLY items confirmed processed or moved to failed list
    const latestQueue = getOfflineQueue(scope).map((item, idx) =>
      item.queueId ? item : { ...item, queueId: `legacy_${idx}_${item.queuedAt || Date.now()}` }
    )
    const finalQueue = latestQueue.filter((item) => !processedQueueIds.has(item.queueId))
    saveOfflineQueue(finalQueue, scope)

    if (authRequired) {
      setSyncStatus('auth_required')
      addToast({
        type: 'warning',
        title: 'Sign In Required to Finish Sync',
        message: `Your session expired while offline. ${finalQueue.length} local change${finalQueue.length === 1 ? ' is' : 's are'} safely saved and will sync as soon as you sign in.`
      })
      return
    }

    if (finalQueue.length === 0) {
      setDbConnected(true)
      setSyncStatus('synced')
      setLastSyncedAt(new Date().toISOString())
      if (processedCount > 0) {
        addToast({
          type: 'success',
          title: 'Database Synchronized',
          message: `${processedCount} offline update${processedCount === 1 ? ' was' : 's were'} synchronized with MongoDB.`
        })
        // Reconcile server-computed stock/KPI totals cleanly after flush completes
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('exbos:offline-synced'))
        }
      }
    } else {
      setSyncStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'pending')
    }
  }

  const checkConnectionHealth = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false)
      setSyncStatus('offline')
      return false
    }
    try {
      const res = await exbosApi.health()
      if (res?.status === 0) {
        setIsOnline(false)
        setSyncStatus('offline')
        return false
      }
      setIsOnline(true)
      if (res?.status === 503 || !res?.ok) {
        setDbConnected(false)
        setSyncStatus(getOfflineQueue().length > 0 ? 'pending' : 'db_error')
        return false
      }
      setDbConnected(true)
      if (getOfflineQueue().length > 0) {
        await flushOfflineQueue()
      } else {
        setSyncStatus('synced')
        setLastSyncedAt(new Date().toISOString())
      }
      return true
    } catch {
      setIsOnline(false)
      setSyncStatus('offline')
      return false
    }
  }

  useEffect(() => {
    let settleTimer = null

    const handleOnline = () => {
      setIsOnline(true)
      const pendingCnt = getOfflineQueue().length
      addToast({
        type: 'info',
        title: 'Network Restored',
        message:
          pendingCnt > 0
            ? `Internet reconnected. Automatically syncing ${pendingCnt} offline update${pendingCnt === 1 ? '' : 's'} to MongoDB...`
            : 'Internet connection re-established. Synchronizing with ExBOS Cloud...'
      })
      checkConnectionHealth()
      // Settle retry after 2.5s in case mobile Wi-Fi/4G DNS takes a moment to warm up
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        if (navigator.onLine && getOfflineQueue().length > 0 && !isFlushingRef.current) {
          checkConnectionHealth()
        }
      }, 2500)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
      addToast({
        type: 'warning',
        title: 'Working Offline',
        message: 'No internet connection detected. Changes are saved locally and will auto-sync when online.'
      })
    }

    const handleResumeSync = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine && getOfflineQueue().length > 0 && !isFlushingRef.current) {
        checkConnectionHealth()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleResumeSync()
      }
    }

    const handleStorageSync = (e) => {
      const qKey = getOfflineQueueKey()
      if (e.key === qKey) {
        const latest = getOfflineQueue()
        setPendingOfflineActions(latest)
        setOfflineQueueCount(latest.length)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('focus', handleResumeSync)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('storage', handleStorageSync)

    checkConnectionHealth()

    const heartbeat = setInterval(() => {
      const hasPending = getOfflineQueue().length > 0
      if (!navigator.onLine || hasPending || !dbConnected) {
        checkConnectionHealth()
      }
    }, 15000)

    return () => {
      if (settleTimer) clearTimeout(settleTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', handleResumeSync)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('storage', handleStorageSync)
      clearInterval(heartbeat)
    }
  }, [])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  const savePendingCalculatorState = (calcData) => {
    setPendingCalculator(calcData)
    if (calcData) {
      sessionStorage.setItem('exbos_pending_calc', JSON.stringify(calcData))
    } else {
      sessionStorage.removeItem('exbos_pending_calc')
    }
  }

  const updateWorkspace = (archId, updates) => {
    const targetArch = archId || user?.architectureId || 'buy-and-sell'
    isHydratedRef.current = true
    setWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      const mergedRecords = {
        ...base.records,
        ...(updates.records || {})
      }
      const nextWorkspace = {
        ...base,
        ...updates,
        metrics: {
          ...base.metrics,
          ...(updates.metrics || {})
        },
        records: mergedRecords
      }
      // Immediately persist workspace update to MongoDB backend or queue if offline
      const persistWorkspace = async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          enqueueOfflineAction({
            type: 'workspace',
            archId: targetArch,
            payload: {
              ...updates,
              metrics: nextWorkspace.metrics,
              records: updates.records ? mergedRecords : undefined
            }
          })
          return
        }
        const res = await exbosApi.patchWorkspace(targetArch, {
          ...updates,
          metrics: nextWorkspace.metrics,
          records: updates.records ? mergedRecords : undefined
        })
        if (!res?.ok && (res?.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
          enqueueOfflineAction({
            type: 'workspace',
            archId: targetArch,
            payload: {
              ...updates,
              metrics: nextWorkspace.metrics,
              records: updates.records ? mergedRecords : undefined
            }
          })
        }
      }
      persistWorkspace()
      return {
        ...prev,
        [targetArch]: nextWorkspace
      }
    })
  }

  const addRecord = (archId, moduleName, newItem) => {
    if (activeBranchId !== 'main' && activeBranch?.status === 'Frozen') {
      addToast({
        type: 'error',
        title: 'Branch Frozen (Read-Only)',
        message: `${activeBranch?.name || 'This branch'} is currently frozen by Main HQ. New entries are paused.`
      })
      return null
    }
    if (activeBranchId !== 'main' && moduleName === 'Expenses') {
      if (activeBranchPermissions?.canRecordExpenses === false) {
        addToast({
          type: 'error',
          title: 'Expense Recording Restricted',
          message: 'Main HQ has disabled expense recording for this branch.'
        })
        return null
      }
      const maxExp = Number(activeBranchPermissions?.maxExpenseLimitRWF) || 0
      const itemAmt = Number(newItem?.amountRWF ?? newItem?.totalAmountRWF ?? 0)
      if (maxExp > 0 && itemAmt > maxExp) {
        addToast({
          type: 'error',
          title: 'Expense Exceeds Branch Limit',
          message: `This expense (${itemAmt.toLocaleString()} RWF) exceeds the branch limit of ${maxExp.toLocaleString()} RWF set by Main HQ.`
        })
        return null
      }
    }
    const targetArch = archId || user?.architectureId || 'buy-and-sell'
    const normalizedModule =
      moduleName === 'Products' || moduleName === 'FinishedGoods' || moduleName === 'Stock'
        ? 'Inventory'
        : moduleName
    isHydratedRef.current = true
    lastMutationTsRef.current = Date.now()
    const recordId =
      newItem?.id || `${normalizedModule.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    const todayStr = new Date().toISOString().slice(0, 10)
    const isProductBucket = normalizedModule === 'Inventory'
    const prodQty = Number(newItem?.quantity ?? newItem?.currentStock ?? newItem?.stock ?? 0)
    const prodCost = Number(newItem?.costPerUnitRWF ?? newItem?.unitCostRWF ?? newItem?.purchasePriceRWF ?? 0)
    const prodPrice = Number(newItem?.sellingPriceRWF ?? newItem?.sellingPrice ?? newItem?.priceRWF ?? 0)
    const entry = {
      id: recordId,
      date: todayStr,
      branchId: newItem?.branchId || activeBranchId || 'main',
      ...newItem,
      ...(isProductBucket
        ? {
            name: newItem?.name || newItem?.title || 'Product',
            title: newItem?.title || newItem?.name || 'Product',
            quantity: prodQty,
            currentStock: prodQty,
            stock: prodQty,
            costPerUnitRWF: prodCost,
            unitCostRWF: prodCost,
            purchasePriceRWF: prodCost,
            sellingPriceRWF: prodPrice
          }
        : {})
    }
    moduleName = normalizedModule

    setWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      const existingList = base.records?.[moduleName] || []
      const m = { ...base.metrics }
      const amt = Number(
        newItem.amountRWF ??
          newItem.totalAmountRWF ??
          newItem.totalFolioRWF ??
          newItem.sellingPriceRWF ??
          newItem.purchasePriceRWF ??
          newItem.priceRWF ??
          newItem.costRWF ??
          0
      )
      const unitCost = Number(newItem.unitCostRWF ?? newItem.purchasePriceRWF ?? newItem.costRWF) || 0
      const sellPrice = Number(newItem.sellingPriceRWF ?? newItem.priceRWF) || 0
      const qty = Number(newItem.quantity ?? newItem.stock) || 1
      const owed = Number(newItem.balanceOwedRWF ?? newItem.remainingAmountRWF ?? 0)

      if (['Sales', 'Jobs', 'ServiceJobs', 'KitchenOrders', 'GuestFolios', 'MixedSales'].includes(moduleName) && amt > 0) {
        m.monthlyRevenueRWF += amt
        m.spendableRWF += amt
        m.todayMoneyInRWF += amt
        const profit = Number(newItem.profitRWF) || Math.round(amt * 0.35)
        m.netProfitRWF += profit
        m.todayProfitRWF += profit
      } else if (['Purchases', 'Expenses', 'Feeds', 'FeedingLogs', 'HealthRecords'].includes(moduleName) && amt > 0) {
        m.todayCostsRWF += amt
        m.spendableRWF = Math.max(0, m.spendableRWF - amt)
        if (owed > 0) {
          m.iOweSuppliersRWF += owed
        }
      } else if (['Inventory', 'Products', 'RawMaterials', 'Consumables', 'Ingredients', 'HybridItems'].includes(moduleName)) {
        const addedVal = (unitCost || sellPrice) * (qty || 1)
        m.stockValueRWF += addedVal
      } else if (moduleName === 'Production') {
        const batchProfit = Math.max(0, (sellPrice - unitCost) * (qty || 1))
        m.netProfitRWF += batchProfit
        m.stockValueRWF += unitCost * (qty || 1)
      } else if (moduleName === 'Customers' && owed > 0) {
        m.owedToMeRWF += owed
      } else if (moduleName === 'Suppliers' && owed > 0) {
        m.iOweSuppliersRWF += owed
      }

      const nextRecords = {
        ...base.records,
        [moduleName]: [entry, ...existingList.filter((r) => r.id !== entry.id)]
      }
      // Mirror newly added product into BOTH Inventory and Products buckets in memory
      // so offline/online Products table, Sales picker, and Purchases picker stay 100% in sync.
      if (isProductBucket) {
        const existingProducts = Array.isArray(base.records?.Products) ? base.records.Products : []
        nextRecords.Products = [entry, ...existingProducts.filter((r) => r.id !== entry.id)]
      }

      return {
        ...prev,
        [targetArch]: {
          ...base,
          metrics: m,
          records: nextRecords
        }
      }
    })

    if (moduleName === 'Sales' && Number(newItem.amountRWF) > 0) {
      const statusLower = String(newItem.status || '').toLowerCase()
      const paidAmt =
        newItem.paidAmountRWF !== undefined
          ? Number(newItem.paidAmountRWF) || 0
          : statusLower.includes('unpaid') || statusLower.includes('credit')
          ? 0
          : statusLower.includes('part')
          ? Math.round(Number(newItem.amountRWF) / 2)
          : Number(newItem.amountRWF) || 0
      if (paidAmt > 0) {
        addTransaction({
          architectureId: targetArch,
          recordId: entry.id,
          sourceModule: 'Sales',
          title: newItem.title || 'Sale Entry',
          type: 'in',
          category: `${moduleName} (${newItem.subPage || 'General'})`,
          amountRWF: paidAmt,
          account: newItem.paymentMethod || 'Cash / MoMo Till',
          source: 'Live Dashboard'
        })
      }
    } else if (moduleName === 'Purchases' && Number(newItem.amountRWF) > 0) {
      const statusLower = String(newItem.status || '').toLowerCase()
      const paidAmt =
        newItem.paidAmountRWF !== undefined
          ? Number(newItem.paidAmountRWF) || 0
          : statusLower.includes('unpaid') || statusLower.includes('credit')
          ? 0
          : Number(newItem.amountRWF) || 0
      if (paidAmt > 0) {
        addTransaction({
          architectureId: targetArch,
          recordId: entry.id,
          sourceModule: 'Purchases',
          title: newItem.title || 'Purchase Entry',
          type: 'out',
          category: `${moduleName} (${newItem.subPage || 'General'})`,
          amountRWF: paidAmt,
          account: newItem.paymentMethod || 'Supplier / Cash Account',
          source: 'Live Dashboard'
        })
      }
    }

    // Persist to MongoDB with offline queue fallback
    const persistRecord = async (attempt = 1) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction({
          type: 'add',
          archId: targetArch,
          moduleName,
          entry
        })
        addToast({
          type: 'warning',
          title: 'Saved Locally (Offline)',
          message: `"${entry.title || entry.name || entry.id}" saved to device. Will sync to the cloud database once online.`
        })
        return
      }

      const res = await exbosApi.addModuleRecord(targetArch, moduleName, entry)
      if (res?.ok) {
        setDbConnected(true)
        return
      }

      if (res?.status >= 500) {
        setDbConnected(false)
      }

      if (!res?.ok && (res?.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
        setIsOnline(false)
        enqueueOfflineAction({
          type: 'add',
          archId: targetArch,
          moduleName,
          entry
        })
        addToast({
          type: 'warning',
          title: 'Saved Locally',
          message: `"${entry.title || entry.name || entry.id}" saved locally. Network issue detected; changes will sync once reconnected.`
        })
        return
      }

      if (!res?.ok && res?.status >= 400 && res?.status < 500) {
        addToast({
          type: 'error',
          title: 'Could Not Save Record',
          message: res?.error || `Server rejected "${entry.title || entry.name || moduleName}" (HTTP ${res.status}).`
        })
        return
      }

      if (attempt < 2) {
        setTimeout(() => persistRecord(attempt + 1), 1500)
        return
      }

      console.warn('Record queued for retry due to server error:', moduleName, entry.id, res?.error)
      enqueueOfflineAction({
        type: 'add',
        archId: targetArch,
        moduleName,
        entry
      })
      addToast({
        type: 'warning',
        title: res?.status === 503 ? 'Database Unavailable — Saved Locally' : 'Saved Locally',
        message:
          res?.status === 503
            ? `"${entry.title || entry.name || entry.id}" could not reach MongoDB right now. Saved locally and will auto-sync when database reconnects.`
            : `"${entry.title || entry.name || entry.id}" saved locally. Will retry syncing to the database automatically.`
      })
    }
    persistRecord()

    return entry
  }

  const deleteRecord = (archId, moduleName, recordId) => {
    if (activeBranchId !== 'main' && activeBranch?.status === 'Frozen') {
      addToast({
        type: 'error',
        title: 'Branch Frozen (Read-Only)',
        message: `${activeBranch?.name || 'This branch'} is currently frozen by Main HQ. Deletions are blocked.`
      })
      return
    }
    const isProductCatalogBucket = ['Products', 'Inventory', 'Menu Items', 'Crops & Inputs', 'Services', 'Catalog'].includes(moduleName)
    if (activeBranchId !== 'main' && !isProductCatalogBucket && activeBranchPermissions?.canDeleteRecords === false) {
      addToast({
        type: 'error',
        title: 'Deletion Restricted by Main HQ',
        message: 'Record deletion is disabled for this branch. Only the Business Owner at Main HQ can authorize deletions.'
      })
      return
    }
    const targetArch = archId || user?.architectureId || 'buy-and-sell'
    isHydratedRef.current = true
    lastMutationTsRef.current = Date.now()
    const recIdStr = String(recordId)
    recentlyDeletedIdsRef.current.add(recIdStr)

    // Simultaneously purge from transactions in case the record is linked to cashflow ledger
    const linkedTxIds = transactions
      .filter((tx) => String(tx.id) === recIdStr || String(tx.recordId || '') === recIdStr)
      .map((tx) => String(tx.id))

    setTransactions((prev) =>
      prev.filter((tx) => String(tx.id) !== recIdStr && String(tx.recordId || '') !== recIdStr)
    )

    const persistDelete = async () => {
      const queueLinkedDeletes = () => {
        enqueueOfflineAction({
          type: 'delete',
          archId: targetArch,
          moduleName,
          recordId: recIdStr
        })
        enqueueOfflineAction({ type: 'delete_tx', txId: recIdStr })
        linkedTxIds.forEach((txId) => {
          if (txId !== recIdStr) {
            enqueueOfflineAction({ type: 'delete_tx', txId })
          }
        })
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        queueLinkedDeletes()
        addToast({
          type: 'warning',
          title: 'Deleted Locally (Offline)',
          message: 'Removed on this device. Deletion will sync to MongoDB once online.'
        })
        return
      }
      const res = await exbosApi.deleteModuleRecord(targetArch, moduleName, recIdStr)
      // Also attempt backend transaction purge if it exists in ledger collection
      exbosApi.deleteTransaction(recIdStr).catch(() => {})
      linkedTxIds.forEach((txId) => {
        if (txId !== recIdStr) {
          exbosApi.deleteTransaction(txId).catch(() => {})
        }
      })

      if (!res?.ok && res?.status >= 400 && res?.status < 500 && res?.status !== 404) {
        addToast({
          type: 'error',
          title: 'Delete Blocked',
          message: res?.error || 'You do not have permission to delete this record.'
        })
        return
      }

      if (!res?.ok && (res?.status === 0 || res?.status >= 500 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
        queueLinkedDeletes()
        addToast({
          type: 'warning',
          title: 'Deleted Locally (Queued)',
          message: 'Network or database unavailable. Deletion queued and will auto-sync.'
        })
      }
    }
    persistDelete()

    setWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      if (!base) return prev
      const existingList = base.records?.[moduleName] || []
      const deletedItem = existingList.find((r) => String(r.id) === recIdStr)
      const filtered = existingList.filter((r) => String(r.id) !== recIdStr)
      const nextRecords = {
        ...base.records,
        [moduleName]: filtered
      }
      const nextMetrics = { ...(base.metrics || {}) }

      if (deletedItem) {
        const delQty = Number(deletedItem.quantity) || 0
        const delAmt = Number(deletedItem.amountRWF ?? deletedItem.totalAmountRWF ?? 0)
        const targetProdId = String(deletedItem.productId || '').trim()
        const targetProdTitle = String(deletedItem.productTitle || '').trim().toLowerCase()

        if (moduleName === 'Sales') {
          if (delQty > 0 && (targetProdId || targetProdTitle)) {
            ;['Inventory', 'Products'].forEach((stockBucket) => {
              const sList = nextRecords[stockBucket]
              if (Array.isArray(sList)) {
                nextRecords[stockBucket] = sList.map((prod) => {
                  const pId = String(prod.id || '').trim()
                  const pTitle = String(prod.title || prod.name || '').trim().toLowerCase()
                  if (
                    (targetProdId && pId === targetProdId) ||
                    (!targetProdId && targetProdTitle && pTitle === targetProdTitle)
                  ) {
                    const curStock = Number(prod.quantity ?? prod.currentStock) || 0
                    const newStock = curStock + delQty
                    const lowAlert = Number(prod.lowStockAlert) || 5
                    const sellP = Number(prod.sellingPriceRWF ?? prod.unitPriceRWF) || 0
                    return {
                      ...prod,
                      quantity: newStock,
                      currentStock: newStock,
                      amountRWF: sellP > 0 ? newStock * sellP : prod.amountRWF,
                      status: newStock <= 0 ? 'Out of Stock' : newStock <= lowAlert ? 'Low Stock' : 'Active'
                    }
                  }
                  return prod
                })
              }
            })
          }
          if (delAmt > 0) {
            nextMetrics.monthlyRevenueRWF = Math.max(0, (Number(nextMetrics.monthlyRevenueRWF) || 0) - delAmt)
            nextMetrics.spendableRWF = Math.max(0, (Number(nextMetrics.spendableRWF) || 0) - delAmt)
            nextMetrics.todayMoneyInRWF = Math.max(0, (Number(nextMetrics.todayMoneyInRWF) || 0) - delAmt)
            const profitRev = Number(deletedItem.profitRWF) || Math.round(delAmt * 0.35)
            nextMetrics.netProfitRWF = (Number(nextMetrics.netProfitRWF) || 0) - profitRev
            nextMetrics.todayProfitRWF = (Number(nextMetrics.todayProfitRWF) || 0) - profitRev
          }
        } else if (moduleName === 'Purchases') {
          if (delQty > 0 && (targetProdId || targetProdTitle)) {
            ;['Inventory', 'Products', 'RawMaterials'].forEach((stockBucket) => {
              const sList = nextRecords[stockBucket]
              if (Array.isArray(sList)) {
                nextRecords[stockBucket] = sList.map((prod) => {
                  const pId = String(prod.id || '').trim()
                  const pTitle = String(prod.title || prod.name || '').trim().toLowerCase()
                  if (
                    (targetProdId && pId === targetProdId) ||
                    (!targetProdId && targetProdTitle && pTitle === targetProdTitle)
                  ) {
                    const curStock = Number(prod.quantity ?? prod.currentStock) || 0
                    const newStock = Math.max(0, curStock - delQty)
                    const lowAlert = Number(prod.lowStockAlert) || 5
                    const sellP = Number(prod.sellingPriceRWF ?? prod.purchasePriceRWF ?? prod.unitCostRWF) || 0
                    return {
                      ...prod,
                      quantity: newStock,
                      currentStock: newStock,
                      amountRWF: sellP > 0 ? newStock * sellP : prod.amountRWF,
                      status: newStock <= 0 ? 'Out of Stock' : newStock <= lowAlert ? 'Low Stock' : 'Active'
                    }
                  }
                  return prod
                })
              }
            })
          }
          if (delAmt > 0) {
            nextMetrics.todayCostsRWF = Math.max(0, (Number(nextMetrics.todayCostsRWF) || 0) - delAmt)
            nextMetrics.spendableRWF = (Number(nextMetrics.spendableRWF) || 0) + delAmt
          }
        } else if (['MixedSales', 'KitchenOrders', 'GuestFolios', 'Jobs', 'ServiceJobs'].includes(moduleName)) {
          if (moduleName === 'MixedSales') {
            const lineItems = Array.isArray(deletedItem.items) ? deletedItem.items : []
            const hybList = nextRecords.HybridItems
            if (Array.isArray(hybList) && lineItems.length > 0) {
              nextRecords.HybridItems = hybList.map((item) => {
                if (!item.trackStock) return item
                const hId = String(item.id || '').trim()
                const hTitle = String(item.title || item.name || '').trim().toLowerCase()
                const matchedLi = lineItems.find((li) => {
                  const liId = String(li.itemId || li.productId || li.id || '').trim()
                  const liTitle = String(li.title || li.name || '').trim().toLowerCase()
                  return (liId && hId === liId) || (!liId && liTitle && hTitle === liTitle)
                })
                if (!matchedLi) return item
                const curS = Number(item.currentStock ?? item.quantity) || 0
                const restored = curS + (Number(matchedLi.quantity) || 0)
                return { ...item, currentStock: restored, quantity: restored }
              })
            }
          }
          if (delAmt > 0) {
            const delStatus = String(deletedItem.status || '').toLowerCase()
            const isCredit = ['credit', 'unpaid', 'pending', 'owed'].some((k) => delStatus.includes(k))
            if (isCredit) {
              nextMetrics.owedToMeRWF = Math.max(0, (Number(nextMetrics.owedToMeRWF) || 0) - delAmt)
            } else {
              nextMetrics.spendableRWF = Math.max(0, (Number(nextMetrics.spendableRWF) || 0) - delAmt)
              nextMetrics.todayMoneyInRWF = Math.max(0, (Number(nextMetrics.todayMoneyInRWF) || 0) - delAmt)
            }
            nextMetrics.monthlyRevenueRWF = Math.max(0, (Number(nextMetrics.monthlyRevenueRWF) || 0) - delAmt)
            const profitRev = Number(deletedItem.profitRWF) || Math.round(delAmt * 0.32)
            nextMetrics.netProfitRWF = (Number(nextMetrics.netProfitRWF) || 0) - profitRev
            nextMetrics.todayProfitRWF = (Number(nextMetrics.todayProfitRWF) || 0) - profitRev
          }
        } else if (['Expenses', 'Feeds', 'FeedingLogs', 'HealthRecords'].includes(moduleName)) {
          if (moduleName === 'FeedingLogs') {
            const feedId = String(deletedItem.feedId || '').trim()
            const feedName = String(deletedItem.feedName || deletedItem.title || '').trim().toLowerCase()
            const usedKg = Number(deletedItem.quantityUsed ?? deletedItem.quantity) || 0
            if (Array.isArray(nextRecords.Feeds) && usedKg > 0 && (feedId || feedName)) {
              nextRecords.Feeds = nextRecords.Feeds.map((fd) => {
                const fId = String(fd.id || '').trim()
                const fName = String(fd.name || fd.feedName || fd.title || '').trim().toLowerCase()
                if ((feedId && fId === feedId) || (!feedId && feedName && fName === feedName)) {
                  const curKg = Number(fd.quantityKg ?? fd.quantity) || 0
                  const nextKg = curKg + usedKg
                  return { ...fd, quantityKg: nextKg, quantity: nextKg }
                }
                return fd
              })
            }
          }
          if (delAmt > 0) {
            nextMetrics.todayCostsRWF = Math.max(0, (Number(nextMetrics.todayCostsRWF) || 0) - delAmt)
            nextMetrics.spendableRWF = (Number(nextMetrics.spendableRWF) || 0) + delAmt
            nextMetrics.netProfitRWF = (Number(nextMetrics.netProfitRWF) || 0) + delAmt
            nextMetrics.todayProfitRWF = (Number(nextMetrics.todayProfitRWF) || 0) + delAmt
          }
        }
      }

      return {
        ...prev,
        [targetArch]: {
          ...base,
          metrics: nextMetrics,
          records: nextRecords
        }
      }
    })
  }

  const deleteTransaction = (txId) => {
    isHydratedRef.current = true
    const txIdStr = String(txId)

    // 1. Purge from in-memory transactions
    setTransactions((prev) => prev.filter((tx) => String(tx.id) !== txIdStr))

    // 2. Purge from any workspace bucket that might contain it
    setWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const targetArch = user?.architectureId || 'buy-and-sell'
      const base = prev[targetArch] || cleanMap[targetArch]
      if (!base) return prev
      const updatedBuckets = {}
      Object.keys(base.records || {}).forEach((bucket) => {
        updatedBuckets[bucket] = (base.records[bucket] || []).filter((r) => String(r.id) !== txIdStr)
      })
      return {
        ...prev,
        [targetArch]: {
          ...base,
          records: updatedBuckets
        }
      }
    })

    // 3. Persist to backend
    const persistTxDelete = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction({
          type: 'delete_tx',
          txId: txIdStr
        })
        addToast({
          type: 'warning',
          title: 'Deleted Locally (Offline)',
          message: 'Transaction removed locally and queued to sync when online.'
        })
        return
      }
      try {
        const res = await exbosApi.deleteTransaction(txIdStr)
        if (!res?.ok && (res?.status === 0 || res?.status >= 500 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
          enqueueOfflineAction({ type: 'delete_tx', txId: txIdStr })
        }
      } catch (err) {
        enqueueOfflineAction({ type: 'delete_tx', txId: txIdStr })
        console.warn('Transaction delete queued for retry:', err.message)
      }
    }
    persistTxDelete()
  }

  const updateRecord = (archId, moduleName, recordId, updatedFields) => {
    const targetArch = archId || user?.architectureId || 'buy-and-sell'
    isHydratedRef.current = true
    lastMutationTsRef.current = Date.now()

    const persistUpdate = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction({
          type: 'update',
          archId: targetArch,
          moduleName,
          recordId,
          updatedFields
        })
        addToast({
          type: 'warning',
          title: 'Updated Locally (Offline)',
          message: 'Changes saved on this device and will auto-sync to MongoDB once online.'
        })
        return
      }
      const res = await exbosApi.updateModuleRecord(targetArch, moduleName, recordId, updatedFields)
      if (!res?.ok && res?.status >= 400 && res?.status < 500) {
        addToast({
          type: 'error',
          title: 'Update Rejected',
          message: res?.error || 'Could not update this record.'
        })
        return
      }
      if (!res?.ok && (res?.status === 0 || res?.status >= 500 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
        enqueueOfflineAction({
          type: 'update',
          archId: targetArch,
          moduleName,
          recordId,
          updatedFields
        })
        addToast({
          type: 'warning',
          title: 'Updated Locally (Queued)',
          message: 'Connection issue detected. Changes saved locally and queued to auto-sync.'
        })
      }
    }
    persistUpdate()
    setWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      if (!base) return prev
      const currentList = base.records?.[moduleName] || []
      const exists = currentList.some((r) => r.id === recordId)
      const hasIdentity = Boolean(
        updatedFields?.title ||
          updatedFields?.name ||
          updatedFields?.productName ||
          updatedFields?.serviceName
      )
      if (!exists && !hasIdentity) return prev
      const updatedList = exists
        ? currentList.map((r) => (r.id === recordId ? { ...r, ...updatedFields } : r))
        : [{ id: recordId, ...updatedFields }, ...currentList]
      return {
        ...prev,
        [targetArch]: {
          ...base,
          records: {
            ...base.records,
            [moduleName]: updatedList
          }
        }
      }
    })
  }

  const resetWorkspaceData = () => {
    const clean = createCleanWorkspaces()
    setWorkspaces(clean)
    setTransactions([])
    try {
      localStorage.setItem('exbos_workspaces_v2', JSON.stringify(clean))
      localStorage.removeItem('exbos_transactions')
    } catch {}
    const scopeParam = user?.email ? `/reset?scopeKey=${encodeURIComponent(user.email.toLowerCase())}` : '/reset'
    fetch(resolveStorageUrl(scopeParam), { method: 'POST', headers: getAuthHeaders() }).catch(() => {})
  }

  const applyMakeSellTrade = (tradeKey) => {
    const preset = TRADE_PRESETS[tradeKey]
    if (!preset || preset.isSupportContact) return
    setMakeSellTrade(tradeKey)
    try {
      localStorage.setItem('exbos_make_sell_trade', tradeKey)
    } catch {}

    // Persist to MongoDB backend in user profile and workspace preset
    try {
      if (user?.email) {
        exbosApi.updateProfile({ activeTradePresetId: tradeKey, architectureId: 'make-and-sell' }).catch(() => {})
      }
      fetch(`${resolveApiBase()}/workspaces/make-and-sell/preset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ presetId: tradeKey, businessName: preset.businessName, attentionHeadline: preset.attentionHeadline })
      }).catch(() => {})
    } catch {}

    setWorkspaces((prev) => {
      const base = prev['make-and-sell'] || {}
      const existingCategories = Array.isArray(base.records?.Categories) && base.records.Categories.length > 0
        ? base.records.Categories
        : (preset.categories || []).map((catName, idx) => ({
            id: `cat-${idx + 1}`,
            name: catName,
            status: 'Active'
          }))

      return {
        ...prev,
        'make-and-sell': {
          ...base,
          businessName: preset.businessName || base.businessName,
          category: preset.category || base.category,
          tradeId: tradeKey,
          metrics: {
            ...(base.metrics || {}),
            attentionHeadline: preset.attentionHeadline || 'Ready for entries · All systems live'
          },
          records: {
            ...(base.records || {}),
            RawMaterials: Array.isArray(base.records?.RawMaterials) ? base.records.RawMaterials : [],
            Inventory: Array.isArray(base.records?.Inventory) ? base.records.Inventory : [],
            Production: Array.isArray(base.records?.Production) ? base.records.Production : [],
            Recipes: Array.isArray(base.records?.Recipes) ? base.records.Recipes : [],
            Categories: existingCategories
          }
        }
      }
    })
  }

  const applyServiceTrade = (tradeKey) => {
    const preset = SERVICE_PRESETS[tradeKey]
    if (!preset || preset.isSupportContact) return
    setServiceTrade(tradeKey)
    try {
      localStorage.setItem('exbos_services_trade', tradeKey)
    } catch {}

    setWorkspaces((prev) => {
      const base = prev['services'] || {}
      const existingCategories = Array.isArray(base.records?.Categories) && base.records.Categories.length > 0
        ? base.records.Categories
        : (preset.categories || []).map((catName, idx) => ({
            id: `cat-${idx + 1}`,
            name: catName,
            status: 'Active'
          }))

      return {
        ...prev,
        services: {
          ...base,
          businessName: preset.businessName || base.businessName,
          category: preset.category || base.category,
          tradeId: tradeKey,
          metrics: {
            ...(base.metrics || {}),
            attentionHeadline: preset.attentionHeadline || 'Ready for bookings · All systems live'
          },
          records: {
            ...(base.records || {}),
            Services: Array.isArray(base.records?.Services) ? base.records.Services : [],
            Consumables: Array.isArray(base.records?.Consumables) ? base.records.Consumables : [],
            Staff: Array.isArray(base.records?.Staff) ? base.records.Staff : [],
            Jobs: Array.isArray(base.records?.Jobs) ? base.records.Jobs : [],
            Categories: existingCategories
          }
        }
      }
    })
  }

  const applyAgricultureTrade = (tradeKey) => {
    const preset = AGRICULTURE_PRESETS[tradeKey]
    if (!preset || preset.isSupportContact) return
    setAgricultureTrade(tradeKey)
    try {
      localStorage.setItem('exbos_agriculture_trade', tradeKey)
    } catch {}

    setWorkspaces((prev) => {
      const base = prev['agriculture'] || {}
      return {
        ...prev,
        agriculture: {
          ...base,
          businessName: preset.businessName || base.businessName,
          category: preset.category || base.category,
          tradeId: tradeKey,
          metrics: {
            ...(base.metrics || {}),
            attentionHeadline: preset.attentionHeadline || 'Ready for farm records · All systems live'
          },
          records: {
            ...(base.records || {}),
            Animals: Array.isArray(base.records?.Animals) ? base.records.Animals : [],
            Batches: Array.isArray(base.records?.Batches) ? base.records.Batches : [],
            Feeds: Array.isArray(base.records?.Feeds) ? base.records.Feeds : [],
            Gestations: Array.isArray(base.records?.Gestations) ? base.records.Gestations : [],
            HealthRecords: Array.isArray(base.records?.HealthRecords) ? base.records.HealthRecords : [],
            Production: Array.isArray(base.records?.Production) ? base.records.Production : []
          }
        }
      }
    })
  }

  // Switch Food & Hospitality Specialization / Preset
  const applyFoodTrade = (tradeKey) => {
    const preset = FOOD_HOSPITALITY_PRESETS[tradeKey]
    if (!preset || preset.isSupportContact) return
    setFoodTrade(tradeKey)
    try {
      localStorage.setItem('exbos_food_trade', tradeKey)
    } catch {}

    setWorkspaces((prev) => {
      const base = prev['food-and-hospitality'] || {}
      return {
        ...prev,
        'food-and-hospitality': {
          ...base,
          businessName: preset.businessName || base.businessName,
          category: preset.category || base.category,
          tradeId: tradeKey,
          metrics: {
            ...(base.metrics || {}),
            attentionHeadline: preset.attentionHeadline || 'Ready for hospitality records · All systems live'
          },
          records: {
            ...(base.records || {}),
            MenuItems: Array.isArray(base.records?.MenuItems) ? base.records.MenuItems : [],
            KitchenOrders: Array.isArray(base.records?.KitchenOrders) ? base.records.KitchenOrders : [],
            Ingredients: Array.isArray(base.records?.Ingredients) ? base.records.Ingredients : [],
            Rooms: Array.isArray(base.records?.Rooms) ? base.records.Rooms : [],
            GuestFolios: Array.isArray(base.records?.GuestFolios) ? base.records.GuestFolios : [],
            WasteLogs: Array.isArray(base.records?.WasteLogs) ? base.records.WasteLogs : []
          }
        }
      }
    })
  }

  // Switch Hybrid Business Specialization / Preset
  const applyHybridTrade = (tradeKey) => {
    const preset = HYBRID_PRESETS[tradeKey]
    if (!preset || preset.isSupportContact) return
    setHybridTrade(tradeKey)
    try {
      localStorage.setItem('exbos_hybrid_trade', tradeKey)
    } catch {}

    if (preset.activeActivities) {
      setHybridActivities(preset.activeActivities)
      try {
        localStorage.setItem('exbos_hybrid_activities', JSON.stringify(preset.activeActivities))
      } catch {}
    }

    setWorkspaces((prev) => {
      const base = prev['hybrid'] || {}
      return {
        ...prev,
        hybrid: {
          ...base,
          businessName: preset.businessName || base.businessName,
          category: preset.category || base.category,
          tradeId: tradeKey,
          metrics: {
            ...(base.metrics || {}),
            attentionHeadline: preset.attentionHeadline || 'Ready for hybrid operations · All systems live'
          },
          records: {
            ...(base.records || {}),
            HybridItems: Array.isArray(base.records?.HybridItems) ? base.records.HybridItems : [],
            MixedSales: Array.isArray(base.records?.MixedSales) ? base.records.MixedSales : []
          }
        }
      }
    })
  }

  const login = async (credentials) => {
    const res = await exbosApi.login({
      email: (credentials.email || '').trim().toLowerCase(),
      password: credentials.password || '',
      architectureId: credentials.architectureId || undefined,
      otpCode: credentials.otpCode || undefined
    })

    if (res.ok && res.data?.data?.requiresTwoFactor) {
      return {
        requiresTwoFactor: true,
        email: res.data.data.email,
        emailSent: res.data.data.emailSent,
        expiresInMinutes: res.data.data.expiresInMinutes || 15,
        message: res.data.message || 'Verification code sent to your email.'
      }
    }

    if (!res.ok || !res.data?.data?.user) {
      throw new Error(res.error || 'Invalid email or password.')
    }

    const { access_token, user: backendUser, workspaces: backendWorkspaces } = res.data.data
    try {
      if (access_token) {
        localStorage.setItem('exbos_access_token', access_token)
      }
      if (backendUser) {
        localStorage.setItem('exbos_user', JSON.stringify(backendUser))
      }
      const loginArch = backendUser?.architectureId || 'buy-and-sell'
      localStorage.setItem('exbos_active_arch', loginArch)
      localStorage.removeItem(`exbos_active_module_${loginArch}`)
      localStorage.removeItem(`exbos_active_page_${loginArch}`)
    } catch {}

    if (backendWorkspaces && typeof backendWorkspaces === 'object') {
      isHydratedRef.current = true
      setWorkspaces(sanitizeUserWorkspaces(backendWorkspaces))
    } else {
      setWorkspaces(createCleanWorkspaces())
    }
    setTransactions([])

    setUser(backendUser)
    // Automatically flush any pending offline changes for this account right after sign-in
    const loginScope = String(backendUser?.ownerScopeKey || backendUser?.email || '').trim().toLowerCase()
    if (loginScope && getOfflineQueue(loginScope).length > 0) {
      setTimeout(() => {
        flushOfflineQueue(loginScope)
      }, 300)
    }
    return backendUser
  }

  const updateUserProfile = async (updates) => {
    const res = await exbosApi.updateProfile(updates)
    const updatedUser = res.ok && res.data?.data?.user ? res.data.data.user : null
    const next = updatedUser || { ...(user || {}), ...updates }
    setUser(next)

    const wsFields = ['name', 'businessName', 'email', 'phone', 'location', 'businessCategory']
    if (updates && wsFields.some((k) => Object.prototype.hasOwnProperty.call(updates, k))) {
      const archId = next.architectureId || 'buy-and-sell'
      updateWorkspace(archId, {
        ownerName: next.name,
        businessName: next.businessName,
        email: next.email,
        phone: next.phone,
        location: next.location,
        category: next.businessCategory
      })
    }
    return res
  }

  const registerNewBusiness = async (payload) => {
    const archId = payload.architectureId || 'buy-and-sell'
    const res = await exbosApi.register({
      fullName: (payload.fullName || '').trim(),
      email: (payload.email || '').trim().toLowerCase(),
      phone: payload.phone || '+250 788 000 000',
      password: payload.password,
      architectureId: archId,
      enabledActivities: Array.isArray(payload.enabledActivities) && payload.enabledActivities.length > 0
        ? payload.enabledActivities
        : [archId],
      businessName: (payload.businessName || '').trim(),
      businessCategory: payload.businessCategory || 'Operations',
      country: payload.country || 'Rwanda',
      location: payload.location || 'Kigali, Rwanda',
      currency: payload.currency || 'RWF',
      language: payload.language || 'en',
      planTier: payload.planTier || 'Growth Plan',
      startingSpendableRWF: Number(payload.startingSpendableRWF ?? payload.demoSpendableRWF) || 0,
      startingMonthlyRevenueRWF: Number(payload.startingMonthlyRevenueRWF ?? payload.demoMonthlyRevenueRWF) || 0,
      primaryItem: payload.primaryItem || payload.demoPrimaryItem || null
    })

    if (!res.ok || !res.data?.data?.user) {
      throw new Error(res.error || 'Registration failed. Please check your details.')
    }

    const {
      access_token,
      user: createdUser,
      business: createdBiz,
      workspaces: createdWorkspaces
    } = res.data.data

    try {
      if (access_token) {
        localStorage.setItem('exbos_access_token', access_token)
      }
      if (createdUser) {
        localStorage.setItem('exbos_user', JSON.stringify(createdUser))
      }
      const assignedArch = createdUser?.architectureId || archId
      if (assignedArch) {
        localStorage.setItem('exbos_active_arch', assignedArch)
        localStorage.removeItem(`exbos_active_module_${assignedArch}`)
        localStorage.removeItem(`exbos_active_page_${assignedArch}`)
      }
    } catch {}

    if (createdBiz) {
      setBusinesses((prev) => [createdBiz, ...prev.filter((b) => b.id !== createdBiz.id)])
    }
    if (createdWorkspaces && typeof createdWorkspaces === 'object') {
      isHydratedRef.current = true
      setWorkspaces(sanitizeUserWorkspaces(createdWorkspaces))
    } else {
      setWorkspaces(createCleanWorkspaces())
    }
    setTransactions([])
    setSavedAnalyses([])
    setExportHistory([])

    setUser(createdUser)
    if (payload.language) {
      setLanguage(payload.language)
    }
    return createdUser
  }

  const logout = ({ force = false } = {}) => {
    const pendingNow = getOfflineQueue().length
    if (!force && pendingNow > 0 && typeof window !== 'undefined') {
      const proceed = window.confirm(
        `You have ${pendingNow} unsynced offline change${pendingNow === 1 ? '' : 's'} waiting to upload to MongoDB.\n\nThey will remain saved on this device and sync when you sign back in. Sign out anyway?`
      )
      if (!proceed) return
    }
    isHydratedRef.current = false
    setUser(null)
    setWorkspaces(createCleanWorkspaces())
    setTransactions([])
    setSavedAnalyses([])
    setExportHistory([])
    setBranches([])
    setActiveBranchId('main')
    try {
      localStorage.removeItem('exbos_access_token')
      localStorage.removeItem('exbos_user')
      localStorage.removeItem('exbos_workspaces_v2')
      localStorage.removeItem('exbos_transactions')
      localStorage.removeItem('exbos_saved_analyses')
      localStorage.removeItem('exbos_active_arch')
      localStorage.removeItem('exbos_active_branch')
      SIX_ARCHITECTURES.forEach((a) => {
        localStorage.removeItem(`exbos_active_module_${a.id}`)
        localStorage.removeItem(`exbos_active_page_${a.id}`)
      })
    } catch {}
  }

  const addTransaction = (arg1, arg2) => {
    let tx = {}
    if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null) {
      tx = { ...arg2, architectureId: arg1 }
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      tx = arg1
    }
    isHydratedRef.current = true
    const record = {
      id: tx.id || `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      architectureId: tx.architectureId || user?.architectureId || 'buy-and-sell',
      branchId: tx.branchId || activeBranchId || 'main',
      recordId: tx.recordId || null,
      sourceModule: tx.sourceModule || null,
      title: tx.title || (tx.type === 'out' ? 'Business Expense' : 'Direct Sale'),
      type: tx.type || 'in',
      category: tx.category || 'Sales Revenue',
      amountRWF: Number(tx.amountRWF ?? tx.amount ?? 0),
      account: tx.account || tx.channel || 'Cash in Hand (Main Till)',
      paymentMethod: tx.paymentMethod || tx.account || tx.channel || 'Cash in Hand (Main Till)',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      source: tx.source || 'Dashboard',
      createdBy: user ? `${user.name} (${user.role})` : 'Business Owner',
      lastModifiedAt: null,
      modifiedBy: null,
      status: 'Posted',
      editHistory: []
    }
    setTransactions((prev) => [record, ...prev.filter((item) => item.id !== record.id)])
    const txPayload = {
      ...record,
      type: record.type === 'out' || record.type === 'OUTFLOW' ? 'OUTFLOW' : 'INFLOW'
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineAction({ type: 'add_tx', payload: txPayload })
    } else {
      exbosApi.createTransaction(txPayload).then((res) => {
        if (!res?.ok && (res?.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
          enqueueOfflineAction({ type: 'add_tx', payload: txPayload })
        } else if (!res?.ok) {
          if (res?.status >= 500) setDbConnected(false)
          addToast({
            type: 'error',
            title: 'Backend Save Failed',
            message: res?.data?.error || 'Could not save transaction to MongoDB.'
          })
        }
      }).catch(() => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          enqueueOfflineAction({ type: 'add_tx', payload: txPayload })
        }
      })
    }
    return record
  }

  // Section 6.15 Controlled Transaction Edit preserving original creation metadata & audit history
  const editTransactionWithAudit = (txId, updates, reason) => {
    const editorName = user ? `${user.name} (${user.role})` : 'Authorized Administrator'
    exbosApi.editTransaction(txId, {
      amountRWF: updates.amountRWF !== undefined ? Number(updates.amountRWF) : undefined,
      title: updates.title,
      status: updates.status || 'Corrected',
      reason: reason || 'Authorized adjustment',
      editor: editorName
    })
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== txId) return tx
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
        const editor = user ? `${user.name} (${user.role})` : 'Authorized Administrator'
        const historyEntry = {
          timestamp,
          editor,
          previousAmountRWF: tx.amountRWF,
          newAmountRWF: updates.amountRWF !== undefined ? Number(updates.amountRWF) : tx.amountRWF,
          previousTitle: tx.title,
          newTitle: updates.title || tx.title,
          reason: reason || 'Authorized adjustment'
        }
        return {
          ...tx,
          title: updates.title || tx.title,
          amountRWF: updates.amountRWF !== undefined ? Number(updates.amountRWF) : tx.amountRWF,
          account: updates.account || tx.account,
          status: updates.status || 'Corrected',
          lastModifiedAt: timestamp,
          modifiedBy: editor,
          editHistory: [...(tx.editHistory || []), historyEntry]
        }
      })
    )
  }

  const saveFinancialAnalysis = (analysis) => {
    const item = {
      id: `AN-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      ...analysis
    }
    setSavedAnalyses((prev) => {
      const updated = [item, ...prev]
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          localStorage.setItem('exbos_saved_analyses', JSON.stringify(updated))
        } else {
          localStorage.removeItem('exbos_saved_analyses')
        }
      } catch {}
      return updated
    })
    if (typeof navigator === 'undefined' || navigator.onLine) {
      exbosApi.saveAnalysis(item).catch(() => {})
    }
  }

  const scopedTransactions = useMemo(() => {
    const target = activeBranchId || 'main'
    return transactions.filter((tx) => (tx.branchId || 'main') === target)
  }, [transactions, activeBranchId])

  const scopedWorkspaces = useMemo(() => {
    const target = activeBranchId || 'main'
    const out = {}
    Object.keys(workspaces || {}).forEach((archKey) => {
      const ws = workspaces[archKey]
      if (!ws) return
      const filteredRecords = {}
      Object.keys(ws.records || {}).forEach((bucket) => {
        const arr = ws.records[bucket]
        filteredRecords[bucket] = Array.isArray(arr)
          ? arr.filter((r) => (r.branchId || 'main') === target)
          : arr
      })
      out[archKey] = {
        ...ws,
        records: filteredRecords
      }
    })
    return out
  }, [workspaces, activeBranchId])

  return (
    <ExbosContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        hideFinancials,
        setHideFinancials,
        toasts,
        addToast,
        isInitialCloudLoading,
        removeToast,
        isOnline,
        dbConnected,
        syncStatus,
        offlineQueueCount,
        pendingOfflineActions,
        failedOfflineActions,
        lastSyncedAt,
        flushOfflineQueue,
        retryFailedOfflineAction,
        dismissFailedOfflineAction,
        checkConnectionHealth,
        user,
        setUser,
        login,
        registerNewBusiness,
        logout,
        branches,
        activeBranchId,
        activeBranch,
        isBranchManager,
        activeBranchPermissions,
        pendingBranchSwitchId,
        cancelPendingBranchSwitch,
        confirmOwnerBranchSwitch,
        transferBranchStock,
        switchBranch,
        createBranch,
        updateBranch,
        assignBranchManager,
        updateBranchManager,
        setBranchManagerStatus,
        deleteBranchManager,
        createBranchManagerInvite,
        ownerNotifications,
        refreshOwnerNotifications,
        markOwnerNotificationRead,
        deleteBranch,
        pendingCalculator,
        savePendingCalculatorState,
        preselectedArchitecture,
        setPreselectedArchitecture,
        savedAnalyses,
        saveFinancialAnalysis,
        pricingPlans,
        setPricingPlans,
        platinumProgram,
        setPlatinumProgram,
        architectures,
        setArchitectures,
        financialTools,
        setFinancialTools,
        businesses,
        setBusinesses,
        superAdminBroadcast,
        setSuperAdminBroadcast,
        transactions: scopedTransactions,
        allTransactions: transactions,
        addTransaction,
        editTransactionWithAudit,
        deleteTransaction,
        integrations,
        setIntegrations,
        exportHistory,
        setExportHistory,
        workspaces: scopedWorkspaces,
        allWorkspaces: workspaces,
        updateWorkspace,
        addRecord,
        updateRecord,
        deleteRecord,
        resetWorkspaceData,
        demoWorkspaces: scopedWorkspaces,
        updateDemoWorkspace: updateWorkspace,
        addDemoRecord: addRecord,
        updateDemoRecord: updateRecord,
        deleteDemoRecord: deleteRecord,
        resetDemoData: resetWorkspaceData,
        updateUserProfile,
        makeSellTrade,
        setMakeSellTrade,
        applyMakeSellTrade,
        serviceTrade,
        setServiceTrade,
        applyServiceTrade,
        agricultureTrade,
        setAgricultureTrade,
        applyAgricultureTrade,
        foodTrade,
        setFoodTrade,
        applyFoodTrade,
        hybridTrade,
        setHybridTrade,
        applyHybridTrade,
        hybridActivities,
        setHybridActivities,
        toggleHybridActivity
      }}
    >
      {children}
    </ExbosContext.Provider>
  )
}

export function useExbos() {
  const ctx = useContext(ExbosContext)
  if (!ctx) throw new Error('useExbos must be used within ExbosProvider')
  return ctx
}

