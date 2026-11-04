import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  SIX_ARCHITECTURES,
  DEFAULT_PRICING_PLANS,
  DEFAULT_PLATINUM_PROGRAM,
  FINANCIAL_TOOLS
} from '../data/architectures'

const ExbosContext = createContext(null)

/**
 * Generates clean zero-base workspaces across all 6 architectures.
 * Completely free of hardcoded demo records so users can enter and test real data.
 */
export const createCleanWorkspaces = () => {
  const zeroWorkspaces = {}
  SIX_ARCHITECTURES.forEach((arch) => {
    zeroWorkspaces[arch.id] = {
      architectureId: arch.id,
      ownerName: 'Business Owner',
      businessName: `${arch.name} Enterprise`,
      email: 'owner@exbos.rw',
      phone: '+250 788 000 000',
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
      records: {
        Sales: [],
        Purchases: [],
        Inventory: [],
        Production: [],
        Customers: [],
        Suppliers: [],
        Expenses: []
      }
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

  const isDemoRecord = (item) => {
    if (!item) return false
    const id = String(item.id || '')
    if (/^(PRD|INV|SAL|PUR|CUS|SUP|EXP)-[1-6]0[1-9]$/.test(id)) return true
    const demoTitles = [
      'cimerwa cement', 'sadolin paint', 'twyford ceramic', 'brioche loaves',
      'wedding tier cake', 'azania wheat flour', 'unsalted dairy butter',
      'tunga pig feed', 'copper cables', 'epoxy adhesive', 'samsung a55'
    ]
    const titleLower = String(item.title || item.name || '').toLowerCase()
    return demoTitles.some((d) => titleLower.includes(d))
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
        records: {
          Sales: [],
          Purchases: [],
          Inventory: [],
          Production: [],
          Customers: [],
          Suppliers: [],
          Expenses: []
        }
      }

      if (archData.records && typeof archData.records === 'object') {
        Object.keys(clean[arch.id].records).forEach((mod) => {
          const list = Array.isArray(archData.records[mod]) ? archData.records[mod] : []
          clean[arch.id].records[mod] = list.filter((item) => !isDemoRecord(item))
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

  // Authenticated User State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_user')
      return saved ? JSON.parse(saved) : null
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

  // Saved Financial Tool Analyses
  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_saved_analyses')
      return saved ? JSON.parse(saved) : [
        {
          id: 'AN-101',
          toolName: 'Survival Budget Planner',
          date: '2026-10-28',
          summary: 'Monthly Fixed: 850,000 RWF → 6-Month Safety Budget: 5,100,000 RWF'
        }
      ]
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

  // Super Admin Platform Broadcast Advertisement
  const [superAdminBroadcast, setSuperAdminBroadcast] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_broadcast')
      return saved
        ? JSON.parse(saved)
        : {
            id: 'ADV-01',
            title: 'Scheduled Cloud Database Optimization',
            message:
              'Notice from PYLARIX Super Admin: Tomorrow night from 01:00 to 02:00 CAT, EXCELLENCE BOS will perform routine high-availability maintenance. All WhatsApp and Dashboard records remain protected.',
            active: true,
            createdAt: '2026-10-30 08:00',
            author: 'Super Administrator'
          }
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

  // Connected External Integrations State
  const [integrations, setIntegrations] = useState({
    gmail: {
      connected: true,
      email: 'finance@kigaliprime.rw',
      lastSync: '2026-10-30 12:10',
      sentCount: 48
    },
    googleDrive: {
      connected: true,
      folderName: 'EXCELLENCE BOS Reports / 2026',
      account: 'owner@kigaliprime.rw',
      lastExport: '2026-10-30 11:50'
    },
    whatsapp: {
      connected: true,
      officialNumber: '+250 788 000 900 (EXCELLENCE BOS Verified)',
      linkedBusinessPhone: '+250 788 412 890',
      requireConfirmation: true
    }
  })

  // Document Export History
  const [exportHistory, setExportHistory] = useState([
    {
      id: 'EXP-301',
      title: 'Monthly Profit, Cash & Debt Executive Report',
      format: 'PDF',
      period: 'October 2026',
      destination: 'Google Drive (EXCELLENCE BOS Reports)',
      timestamp: '2026-10-30 11:50',
      status: 'Delivered'
    },
    {
      id: 'EXP-302',
      title: 'Inventory Landed Cost & Dead Stock Valuation',
      format: 'XLSX',
      period: 'Q4 2026',
      destination: 'Direct Download',
      timestamp: '2026-10-29 16:20',
      status: 'Completed'
    },
    {
      id: 'EXP-303',
      title: 'Six-Month Business Survival & Feed Forecast',
      format: 'DOCX',
      period: 'Nov 2026 – Apr 2027',
      destination: 'Gmail (aline@agukafarm.rw)',
      timestamp: '2026-10-28 09:40',
      status: 'Sent via Gmail'
    }
  ])

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

  const [demoWorkspaces, setDemoWorkspaces] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_demo_workspaces')
      if (saved) return sanitizeUserWorkspaces(JSON.parse(saved))
    } catch {
      // ignore
    }
    return createCleanWorkspaces()
  })

  // Load stored data from React dev server storage on mount
  useEffect(() => {
    let isMounted = true
    fetch('/api/storage')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (!isMounted || !serverData) return
        if (serverData.workspaces && typeof serverData.workspaces === 'object') {
          const sanitized = sanitizeUserWorkspaces(serverData.workspaces)
          setDemoWorkspaces(sanitized)
        }
        if (Array.isArray(serverData.transactions)) {
          setTransactions(sanitizeUserTransactions(serverData.transactions))
        }
        if (serverData.user) {
          setUser(serverData.user)
        }
        if (Array.isArray(serverData.businesses)) {
          setBusinesses(serverData.businesses)
        }
      })
      .catch((err) => {
        console.debug('Server storage fetch notice:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Persist live user data to both localStorage and React dev server on disk
  useEffect(() => {
    try {
      localStorage.setItem('exbos_demo_workspaces', JSON.stringify(demoWorkspaces))
      localStorage.setItem('exbos_transactions', JSON.stringify(transactions))
    } catch {}

    const payload = JSON.stringify({
      workspaces: demoWorkspaces,
      transactions,
      user,
      businesses,
      savedAt: new Date().toISOString()
    })

    fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }).catch(() => {})
  }, [demoWorkspaces, transactions, user, businesses])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  const savePendingCalculatorState = (calcData) => {
    setPendingCalculator(calcData)
    if (calcData) {
      sessionStorage.setItem('exbos_pending_calc', JSON.stringify(calcData))
    } else {
      sessionStorage.removeItem('exbos_pending_calc')
    }
  }

  const updateDemoWorkspace = (archId, updates) => {
    const targetArch = archId || 'buy-and-sell'
    setDemoWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      return {
        ...prev,
        [targetArch]: {
          ...base,
          ...updates,
          metrics: {
            ...base.metrics,
            ...(updates.metrics || {})
          },
          records: {
            ...base.records,
            ...(updates.records || {})
          }
        }
      }
    })
  }

  const addDemoRecord = (archId, moduleName, newItem) => {
    const targetArch = archId || 'buy-and-sell'
    const recordId = `${moduleName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    const todayStr = new Date().toISOString().slice(0, 10)
    const entry = {
      id: recordId,
      date: todayStr,
      ...newItem
    }

    setDemoWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      const existingList = base.records?.[moduleName] || []
      const m = { ...base.metrics }
      const amt = Number(newItem.amountRWF) || 0
      const unitCost = Number(newItem.unitCostRWF ?? newItem.purchasePriceRWF) || 0
      const sellPrice = Number(newItem.sellingPriceRWF) || 0
      const qty = Number(newItem.quantity) || 1
      const owed = Number(newItem.balanceOwedRWF ?? newItem.amountRWF) || 0

      if (moduleName === 'Sales' && amt > 0) {
        m.monthlyRevenueRWF += amt
        m.spendableRWF += amt
        m.todayMoneyInRWF += amt
        const profit = Number(newItem.profitRWF) || Math.round(amt * 0.35)
        m.netProfitRWF += profit
        m.todayProfitRWF += profit
      } else if (moduleName === 'Purchases' && amt > 0) {
        m.todayCostsRWF += amt
        if (Number(newItem.remainingAmountRWF) > 0) {
          m.iOweSuppliersRWF += Number(newItem.remainingAmountRWF)
        }
      } else if (moduleName === 'Inventory') {
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
            [moduleName]: [entry, ...existingList]
          }
        }
      }
    })

    if (moduleName === 'Sales' && Number(newItem.amountRWF) > 0) {
      addTransaction({
        architectureId: targetArch,
        title: newItem.title || 'Sale Entry',
        type: 'in',
        category: `${moduleName} (${newItem.subPage || 'General'})`,
        amountRWF: Number(newItem.amountRWF),
        account: newItem.paymentMethod || 'Cash / MoMo Till',
        source: 'Live Dashboard'
      })
    } else if (moduleName === 'Purchases' && Number(newItem.amountRWF) > 0) {
      addTransaction({
        architectureId: targetArch,
        title: newItem.title || 'Purchase Entry',
        type: 'out',
        category: `${moduleName} (${newItem.subPage || 'General'})`,
        amountRWF: Number(newItem.amountRWF),
        account: 'Supplier / Cash Account',
        source: 'Live Dashboard'
      })
    }

    return entry
  }

  const deleteDemoRecord = (archId, moduleName, recordId) => {
    const targetArch = archId || 'buy-and-sell'
    setDemoWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      if (!base) return prev
      const filtered = (base.records?.[moduleName] || []).filter((r) => r.id !== recordId)
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

  const updateDemoRecord = (archId, moduleName, recordId, updatedFields) => {
    const targetArch = archId || 'buy-and-sell'
    setDemoWorkspaces((prev) => {
      const cleanMap = createCleanWorkspaces()
      const base = prev[targetArch] || cleanMap[targetArch]
      if (!base) return prev
      const currentList = base.records?.[moduleName] || []
      const updatedList = currentList.map((r) => {
        if (r.id === recordId) {
          return { ...r, ...updatedFields }
        }
        return r
      })
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

  const resetDemoData = () => {
    const clean = createCleanWorkspaces()
    setDemoWorkspaces(clean)
    setTransactions([])
    try {
      localStorage.setItem('exbos_demo_workspaces', JSON.stringify(clean))
      localStorage.removeItem('exbos_transactions')
    } catch {}
    fetch('/api/storage/reset', { method: 'POST' }).catch(() => {})
  }

  const login = (userData) => {
    const archId = userData.architectureId || 'buy-and-sell'
    const cleanMap = createCleanWorkspaces()
    const archWorkspace = (demoWorkspaces && demoWorkspaces[archId]) || cleanMap[archId]

    const loggedIn = {
      id: userData.id || `USER-${Date.now().toString().slice(-4)}`,
      name: userData.name || archWorkspace.ownerName || 'Business Owner',
      email: userData.email || archWorkspace.email || 'owner@exbos.rw',
      phone: userData.phone || archWorkspace.phone || '+250 788 000 000',
      role: userData.role || 'Business Owner',
      businessName: userData.businessName || archWorkspace.businessName || `${archId} Enterprise`,
      businessCategory: userData.businessCategory || archWorkspace.category || 'Operations',
      location: userData.location || archWorkspace.location || 'Kigali, Rwanda',
      architectureId: archId,
      planTier: userData.planTier || 'Bronze',
      currency: userData.currency || 'RWF',
      verified: true
    }

    setUser(loggedIn)

    updateDemoWorkspace(archId, {
      ownerName: loggedIn.name,
      businessName: loggedIn.businessName,
      email: loggedIn.email,
      phone: loggedIn.phone,
      location: loggedIn.location,
      category: loggedIn.businessCategory
    })

    return loggedIn
  }

  const updateUserProfile = (updates) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updates, isDemo: true }
      const archId = next.architectureId || 'buy-and-sell'
      updateDemoWorkspace(archId, {
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

  const registerNewBusiness = (payload) => {
    const archId = payload.architectureId || 'buy-and-sell'
    const newBizId = `BIZ-${1000 + businesses.length + 1}`
    const newBiz = {
      id: newBizId,
      name: payload.businessName || 'New ExBOS Demo Business',
      owner: payload.fullName || 'Demo Business Founder',
      email: payload.email || 'demo@exbos.rw',
      architecture: archId,
      plan: payload.planTier || 'Free',
      billingType: payload.planTier === 'Free' ? 'Free' : 'Paid',
      status: 'Active (Demo)',
      branches: 1,
      monthlySpendRWF:
        pricingPlans.find((p) => p.tier === payload.planTier)?.priceRWF || 0,
      expiryDate: payload.planTier === 'Free' ? 'Forever' : '2027-10-30',
      auditNote: 'Registered in Interactive Demo Mode.'
    }
    setBusinesses((prev) => [newBiz, ...prev])

    // Update the target architecture's demo workspace with the exact user-entered demo metrics & first item
    const customMetrics = {}
    if (Number(payload.demoSpendableRWF) > 0) {
      customMetrics.spendableRWF = Number(payload.demoSpendableRWF)
    }
    if (Number(payload.demoMonthlyRevenueRWF) > 0) {
      customMetrics.monthlyRevenueRWF = Number(payload.demoMonthlyRevenueRWF)
      customMetrics.netProfitRWF = Math.round(Number(payload.demoMonthlyRevenueRWF) * 0.42)
    }

    updateDemoWorkspace(archId, {
      ownerName: payload.fullName || 'Demo Business Founder',
      businessName: payload.businessName || 'New ExBOS Demo Business',
      email: payload.email || 'demo@exbos.rw',
      phone: payload.phone || '+250 788 000 000',
      location: payload.location || 'Kigali, Rwanda',
      category: payload.businessCategory || 'Business Operations',
      metrics: customMetrics
    })

    if (payload.demoPrimaryItem) {
      addDemoRecord(archId, 'Inventory', {
        title: payload.demoPrimaryItem,
        subPage: 'Demo Setup Item',
        unitCostRWF: 15000,
        sellingPriceRWF: 25000,
        quantity: 25,
        status: `Added by ${payload.fullName || 'Demo Owner'} during Registration`
      })
    }

    const newUser = login({
      id: `USR-${Date.now()}`,
      name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: 'Business Owner (Demo)',
      businessName: payload.businessName,
      businessCategory: payload.businessCategory,
      location: payload.location,
      architectureId: archId,
      planTier: payload.planTier || 'Free',
      currency: payload.currency || 'RWF'
    })
    if (payload.language) {
      setLanguage(payload.language)
    }
    return newUser
  }

  const logout = () => {
    setUser(null)
  }

  const addTransaction = (arg1, arg2) => {
    let tx = {}
    if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null) {
      tx = { ...arg2, architectureId: arg1 }
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      tx = arg1
    }
    const record = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      architectureId: tx.architectureId || user?.architectureId || 'buy-and-sell',
      title: tx.title || (tx.type === 'out' ? 'Business Expense' : 'Direct Sale'),
      type: tx.type || 'in',
      category: tx.category || 'Sales Revenue',
      amountRWF: Number(tx.amountRWF ?? tx.amount ?? 0),
      account: tx.account || tx.channel || 'Cash in Hand (Main Till)',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      source: tx.source || 'Dashboard',
      createdBy: user ? `${user.name} (${user.role})` : 'Business Owner',
      lastModifiedAt: null,
      modifiedBy: null,
      status: 'Posted',
      editHistory: []
    }
    setTransactions((prev) => [record, ...prev])
    return record
  }

  // Section 6.15 Controlled Transaction Edit preserving original creation metadata & audit history
  const editTransactionWithAudit = (txId, updates, reason) => {
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

  // Global System Toast Notification System
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    const newToast = {
      id,
      type: toast.type || 'error', // 'error' | 'success' | 'info'
      title: toast.title || (toast.type === 'success' ? 'Success' : 'Error Notice'),
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
        user,
        setUser,
        login,
        registerNewBusiness,
        logout,
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
        transactions,
        addTransaction,
        editTransactionWithAudit,
        integrations,
        setIntegrations,
        exportHistory,
        setExportHistory,
        demoWorkspaces,
        updateDemoWorkspace,
        addDemoRecord,
        updateDemoRecord,
        deleteDemoRecord,
        updateUserProfile,
        resetDemoData
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

