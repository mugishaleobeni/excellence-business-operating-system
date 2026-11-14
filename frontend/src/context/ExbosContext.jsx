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
import { exbosApi, getAuthHeaders, resolveStorageUrl, isTokenValid } from '../utils/apiClient'

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
  const [branches, setBranches] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_branches')
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
      localStorage.setItem('exbos_branches', JSON.stringify(branches))
    } catch {}
  }, [branches])

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
      if (res?.ok && Array.isArray(res?.data?.branches)) {
        setBranches(res.data.branches)
        if (!res.data.branches.some((b) => b.id === activeBranchId)) {
          setActiveBranchId('main')
        }
      }
    }).catch(() => {})
  }, [user?.email])

  const activeBranch = useMemo(() => {
    return (
      branches.find((b) => b.id === activeBranchId) || {
        id: 'main',
        name: user?.businessName ? `${user.businessName} (Main HQ)` : 'Main HQ',
        architectureId: user?.architectureId || 'buy-and-sell',
        isMain: true
      }
    )
  }, [branches, activeBranchId, user])

  const switchBranch = (branchId) => {
    setActiveBranchId(branchId || 'main')
  }

  const createBranch = async ({ name, location, architectureId }) => {
    const trimmed = String(name || '').trim()
    if (!trimmed) return { ok: false, error: 'Branch name is required.' }
    const targetArch = architectureId || user?.architectureId || 'buy-and-sell'
    try {
      const res = await exbosApi.createBranch({
        name: trimmed,
        location: location || user?.location || 'Rwanda',
        architectureId: targetArch
      })
      if (res?.ok && res?.data?.branch) {
        const created = res.data.branch
        setBranches((prev) => {
          const list = prev.length > 0 ? prev : [activeBranch]
          return [...list.filter((b) => b.id !== created.id), created]
        })
        return { ok: true, branch: created }
      }
    } catch {}
    const localBranch = {
      id: `br-${Date.now().toString().slice(-6)}`,
      name: trimmed,
      location: location || 'Rwanda',
      architectureId: targetArch,
      isMain: false,
      createdAt: new Date().toISOString()
    }
    setBranches((prev) => [...prev, localBranch])
    return { ok: true, branch: localBranch }
  }

  const deleteBranch = async (branchId) => {
    if (!branchId || branchId === 'main') return
    setBranches((prev) => prev.filter((b) => b.id !== branchId))
    if (activeBranchId === branchId) setActiveBranchId('main')
    try {
      await exbosApi.deleteBranch(branchId)
    } catch {}
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

  // Business Transactions with Edit Audit Trail (Starts clean; records update live on entry)
  const [transactions, setTransactions] = useState(() => {
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
    localStorage.setItem('exbos_transactions', JSON.stringify(transactions))
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

  const isHydratedRef = useRef(false)

  const [workspaces, setWorkspaces] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_workspaces_v2')
      if (saved) return sanitizeUserWorkspaces(JSON.parse(saved))
    } catch {
      // ignore
    }
    return createCleanWorkspaces()
  })

  // Load stored data from Flask + MongoDB Atlas backend on mount and when user changes
  useEffect(() => {
    let isMounted = true
    isHydratedRef.current = false
    const scopeParam = user?.email ? `?scopeKey=${encodeURIComponent(user.email.toLowerCase())}` : ''
    fetch(resolveStorageUrl(scopeParam), {
      headers: getAuthHeaders()
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (!isMounted) return
        if (serverData) {
          if (serverData.workspaces && typeof serverData.workspaces === 'object') {
            const sanitized = sanitizeUserWorkspaces(serverData.workspaces)
            setWorkspaces(sanitized)
          }
          if (Array.isArray(serverData.transactions)) {
            setTransactions(sanitizeUserTransactions(serverData.transactions))
          }
          if (Array.isArray(serverData.businesses)) {
            setBusinesses(
              serverData.businesses.filter(
                (b) =>
                  !/^BIZ-10[0-9]{2}$/.test(String(b?.id || '')) &&
                  !String(b?.status || '').toLowerCase().includes('demo')
              )
            )
          }
          if (Array.isArray(serverData.savedAnalyses)) {
            setSavedAnalyses(serverData.savedAnalyses)
          }
          if (Array.isArray(serverData.exportHistory)) {
            setExportHistory(serverData.exportHistory)
          }
          if (serverData.integrations && typeof serverData.integrations === 'object') {
            setIntegrations(serverData.integrations)
          }
          if (serverData.superAdminBroadcast !== undefined) {
            setSuperAdminBroadcast(serverData.superAdminBroadcast)
          }
        }
      })
      .catch((err) => {
        console.debug('Server storage fetch notice:', err)
      })
      .finally(() => {
        if (isMounted) {
          isHydratedRef.current = true
        }
      })
    return () => {
      isMounted = false
    }
  }, [user?.email])

  // Persist live user data to both localStorage and Flask + MongoDB Atlas backend (only after hydration)
  useEffect(() => {
    try {
      localStorage.setItem('exbos_workspaces_v2', JSON.stringify(workspaces))
      localStorage.setItem('exbos_transactions', JSON.stringify(transactions))
    } catch {}

    if (!isHydratedRef.current) return

    const scopeParam = user?.email ? `?scopeKey=${encodeURIComponent(user.email.toLowerCase())}` : ''
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
  const [syncStatus, setSyncStatus] = useState('synced') // 'synced' | 'syncing' | 'offline' | 'pending' | 'db_error'
  const [offlineQueueCount, setOfflineQueueCount] = useState(() => {
    try {
      const q = localStorage.getItem('exbos_offline_queue')
      return q ? JSON.parse(q).length : 0
    } catch {
      return 0
    }
  })

  const getOfflineQueue = () => {
    try {
      const q = localStorage.getItem('exbos_offline_queue')
      return q ? JSON.parse(q) : []
    } catch {
      return []
    }
  }

  const saveOfflineQueue = (q) => {
    try {
      localStorage.setItem('exbos_offline_queue', JSON.stringify(q))
    } catch {}
    setOfflineQueueCount(Array.isArray(q) ? q.length : 0)
  }

  const enqueueOfflineAction = (action) => {
    const queue = getOfflineQueue()
    queue.push(action)
    saveOfflineQueue(queue)
    setSyncStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'pending')
  }

  const flushOfflineQueue = async () => {
    const queue = getOfflineQueue()
    if (!queue || queue.length === 0) {
      setSyncStatus((prev) => (prev === 'offline' || prev === 'db_error' ? prev : 'synced'))
      return
    }

    setSyncStatus('syncing')
    const remaining = []
    let processedCount = 0

    for (const item of queue) {
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
        if (res?.ok) {
          processedCount++
        } else if (
          res?.status === 0 ||
          res?.status >= 500 ||
          (typeof navigator !== 'undefined' && !navigator.onLine)
        ) {
          remaining.push(item)
        }
      } catch {
        remaining.push(item)
      }
    }

    saveOfflineQueue(remaining)
    if (remaining.length === 0) {
      setDbConnected(true)
      setSyncStatus('synced')
      if (processedCount > 0) {
        addToast({
          type: 'success',
          title: 'Database Synchronized',
          message: `${processedCount} offline update${processedCount === 1 ? ' was' : 's were'} synchronized with MongoDB.`
        })
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
      }
      return true
    } catch {
      setIsOnline(false)
      setSyncStatus('offline')
      return false
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      addToast({
        type: 'info',
        title: 'Network Restored',
        message: 'Internet connection re-established. Synchronizing pending updates...'
      })
      checkConnectionHealth()
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

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    checkConnectionHealth()

    const heartbeat = setInterval(() => {
      const hasPending = getOfflineQueue().length > 0
      if (!navigator.onLine || hasPending || !dbConnected) {
        checkConnectionHealth()
      }
    }, 20000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
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
    const targetArch = archId || user?.architectureId || 'buy-and-sell'
    isHydratedRef.current = true
    const recordId =
      newItem?.id || `${moduleName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    const todayStr = new Date().toISOString().slice(0, 10)
    const entry = {
      id: recordId,
      date: todayStr,
      branchId: newItem?.branchId || activeBranchId || 'main',
      ...newItem
    }

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

      return {
        ...prev,
        [targetArch]: {
          ...base,
          metrics: m,
          records: {
            ...base.records,
            [moduleName]: [entry, ...existingList.filter((r) => r.id !== entry.id)]
          }
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
    const targetArch = archId || user?.architectureId || 'buy-and-sell'
    isHydratedRef.current = true
    const recIdStr = String(recordId)

    // Simultaneously purge from transactions in case the record is linked to cashflow ledger
    const linkedTxIds = transactions
      .filter((tx) => String(tx.id) === recIdStr || String(tx.recordId || '') === recIdStr)
      .map((tx) => String(tx.id))

    setTransactions((prev) =>
      prev.filter((tx) => String(tx.id) !== recIdStr && String(tx.recordId || '') !== recIdStr)
    )

    const persistDelete = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction({
          type: 'delete',
          archId: targetArch,
          moduleName,
          recordId: recIdStr
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

      if (!res?.ok && (res?.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
        enqueueOfflineAction({
          type: 'delete',
          archId: targetArch,
          moduleName,
          recordId: recIdStr
        })
      }
    }
    persistDelete()

    setWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      if (!base) return prev
      const filtered = (base.records?.[moduleName] || []).filter((r) => String(r.id) !== recIdStr)
      return {
        ...prev,
        [targetArch]: {
          ...base,
          records: {
            ...base.records,
            [moduleName]: filtered
          }
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
        return
      }
      try {
        await exbosApi.deleteTransaction(txIdStr)
      } catch (err) {
        console.warn('Transaction delete backend note:', err.message)
      }
    }
    persistTxDelete()
  }

  const updateRecord = (archId, moduleName, recordId, updatedFields) => {
    const targetArch = archId || user?.architectureId || 'buy-and-sell'
    isHydratedRef.current = true

    const persistUpdate = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction({
          type: 'update',
          archId: targetArch,
          moduleName,
          recordId,
          updatedFields
        })
        return
      }
      const res = await exbosApi.updateModuleRecord(targetArch, moduleName, recordId, updatedFields)
      if (!res?.ok && (res?.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
        enqueueOfflineAction({
          type: 'update',
          archId: targetArch,
          moduleName,
          recordId,
          updatedFields
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
      fetch('/api/v1/workspaces/make-and-sell/preset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        },
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
      architectureId: credentials.architectureId || undefined
    })

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
      if (backendUser?.architectureId) {
        localStorage.setItem('exbos_active_arch', backendUser.architectureId)
      }
    } catch {}

    if (backendWorkspaces && typeof backendWorkspaces === 'object') {
      isHydratedRef.current = true
      setWorkspaces(sanitizeUserWorkspaces(backendWorkspaces))
    }

    setUser(backendUser)
    return backendUser
  }

  const updateUserProfile = async (updates) => {
    const res = await exbosApi.updateProfile(updates)
    const updatedUser = res.ok && res.data?.data?.user ? res.data.data.user : null
    setUser((prev) => {
      const next = updatedUser || { ...(prev || {}), ...updates }
      const archId = next.architectureId || 'buy-and-sell'
      updateWorkspace(archId, {
        ownerName: next.name,
        businessName: next.businessName,
        email: next.email,
        phone: next.phone,
        location: next.location,
        category: next.businessCategory
      })
      return next
    })
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
    }

    setUser(createdUser)
    if (payload.language) {
      setLanguage(payload.language)
    }
    return createdUser
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem('exbos_access_token')
      localStorage.removeItem('exbos_user')
      localStorage.removeItem('exbos_workspaces_v2')
      localStorage.removeItem('exbos_active_arch')
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
        if (!res?.ok && (res?.status === 0 || res?.status >= 500 || (typeof navigator !== 'undefined' && !navigator.onLine))) {
          if (res?.status >= 500) setDbConnected(false)
          enqueueOfflineAction({ type: 'add_tx', payload: txPayload })
        }
      }).catch(() => {
        enqueueOfflineAction({ type: 'add_tx', payload: txPayload })
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
      localStorage.setItem('exbos_saved_analyses', JSON.stringify(updated))
      return updated
    })
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
        removeToast,
        isOnline,
        dbConnected,
        syncStatus,
        offlineQueueCount,
        flushOfflineQueue,
        checkConnectionHealth,
        user,
        setUser,
        login,
        registerNewBusiness,
        logout,
        branches,
        activeBranchId,
        activeBranch,
        switchBranch,
        createBranch,
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

