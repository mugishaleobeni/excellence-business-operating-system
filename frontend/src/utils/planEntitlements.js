export const PLAN_ENTITLEMENTS = {
  free: {
    id: 'Free',
    name: 'Forever Free',
    priceRWF: 0,
    maxBranches: 1,
    maxStaff: 0,
    maxProducts: 100,
    maxMonthlySales: 150,
    allowHybrid: false,
    allowWhatsappAutomation: false,
    allowGoogleDrive: false,
    allowGmailReports: false,
    allowMultiBranchTransfer: false,
    allowBranchFreeze: false,
    allowPublicDocLinks: false,
    allowAdvancedReports: false
  },
  bronze: {
    id: 'Bronze',
    name: 'Bronze Growth',
    priceRWF: 10000,
    maxBranches: 1,
    maxStaff: 2,
    maxProducts: 1000,
    maxMonthlySales: null,
    allowHybrid: false,
    allowWhatsappAutomation: true,
    allowGoogleDrive: false,
    allowGmailReports: true,
    allowMultiBranchTransfer: false,
    allowBranchFreeze: false,
    allowPublicDocLinks: true,
    allowAdvancedReports: true
  },
  silver: {
    id: 'Silver',
    name: 'Silver Enterprise',
    priceRWF: 20000,
    maxBranches: 5,
    maxStaff: 10,
    maxProducts: null,
    maxMonthlySales: null,
    allowHybrid: true,
    allowWhatsappAutomation: true,
    allowGoogleDrive: true,
    allowGmailReports: true,
    allowMultiBranchTransfer: true,
    allowBranchFreeze: true,
    allowPublicDocLinks: true,
    allowAdvancedReports: true
  },
  gold: {
    id: 'Gold',
    name: 'Gold Corporate',
    priceRWF: 35000,
    maxBranches: null,
    maxStaff: null,
    maxProducts: null,
    maxMonthlySales: null,
    allowHybrid: true,
    allowWhatsappAutomation: true,
    allowGoogleDrive: true,
    allowGmailReports: true,
    allowMultiBranchTransfer: true,
    allowBranchFreeze: true,
    allowPublicDocLinks: true,
    allowAdvancedReports: true
  },
  platinum: {
    id: 'Platinum',
    name: 'Platinum Partner',
    priceRWF: 0,
    maxBranches: null,
    maxStaff: null,
    maxProducts: null,
    maxMonthlySales: null,
    allowHybrid: true,
    allowWhatsappAutomation: true,
    allowGoogleDrive: true,
    allowGmailReports: true,
    allowMultiBranchTransfer: true,
    allowBranchFreeze: true,
    allowPublicDocLinks: true,
    allowAdvancedReports: true
  }
}

export function normalizePlanKey(raw) {
  const s = String(raw || 'free').trim().toLowerCase()
  for (const k of ['platinum', 'gold', 'silver', 'bronze', 'free']) {
    if (s.includes(k)) return k
  }
  return 'free'
}

export function getEffectivePlanForUser(user) {
  if (!user) return 'free'
  if (user.isSuperAdmin || String(user.email || '').toLowerCase() === 'mugishaleobeni0@gmail.com') {
    return 'gold'
  }
  return normalizePlanKey(user.effectivePlan || user.plan || user.planTier || 'free')
}

export function getPlanLimitsForUser(user) {
  if (user?.planLimits && typeof user.planLimits === 'object') {
    return user.planLimits
  }
  return PLAN_ENTITLEMENTS[getEffectivePlanForUser(user)] || PLAN_ENTITLEMENTS.free
}

export function canUseFeature(user, featureKey) {
  const limits = getPlanLimitsForUser(user)
  return Boolean(limits?.[featureKey])
}

/**
 * Convert live MongoDB plan_limits (edited by Super Admin) into rich display plan objects
 * consumed by both the Landing Page PricingSection and Dashboard SubscriptionBillingView.
 */
export function buildDisplayPlansFromLimits(liveLimitsMap, fallbackPlans = []) {
  const source = liveLimitsMap && typeof liveLimitsMap === 'object' ? liveLimitsMap : PLAN_ENTITLEMENTS
  const tiers = [
    { key: 'free', id: 'free', tier: 'Free', badge: 'Starter', billingPeriod: 'Forever', recommended: false },
    { key: 'bronze', id: 'bronze', tier: 'Bronze', badge: 'Popular', billingPeriod: 'month', recommended: false },
    { key: 'silver', id: 'silver', tier: 'Silver', badge: 'Most Popular', billingPeriod: 'month', recommended: true },
    { key: 'gold', id: 'gold', tier: 'Gold', badge: 'Full Power', billingPeriod: 'month', recommended: false }
  ]

  return tiers.map((meta) => {
    const cfg = source[meta.key] || PLAN_ENTITLEMENTS[meta.key]
    const fb =
      (fallbackPlans || []).find(
        (p) =>
          String(p.id || '').toLowerCase() === meta.key ||
          String(p.tier || '').toLowerCase() === meta.key
      ) || {}

    const branchesLabel =
      cfg.maxBranches === null || cfg.maxBranches === undefined
        ? 'Unlimited'
        : `${cfg.maxBranches}`
    const productsLabel =
      cfg.maxProducts === null || cfg.maxProducts === undefined
        ? 'Unlimited'
        : `${Number(cfg.maxProducts).toLocaleString()}`
    const usersLabel =
      cfg.maxStaff === null || cfg.maxStaff === undefined
        ? 'Unlimited'
        : Number(cfg.maxStaff) === 0
        ? '1 Owner'
        : `1 + ${cfg.maxStaff}`
    const salesLabel =
      cfg.maxMonthlySales === null || cfg.maxMonthlySales === undefined
        ? 'Unlimited Monthly Sales & Transactions'
        : `Up to ${Number(cfg.maxMonthlySales).toLocaleString()} Sales / Month`

    const features = [
      {
        name:
          cfg.maxBranches === null || cfg.maxBranches === undefined
            ? 'Unlimited Branches & HQ Comparison'
            : Number(cfg.maxBranches) === 1
            ? '1 Branch Location (Main HQ)'
            : `Up to ${cfg.maxBranches} Branches`,
        included: true
      },
      {
        name:
          cfg.maxStaff === null || cfg.maxStaff === undefined
            ? 'Unlimited Staff Logins & Permissions'
            : Number(cfg.maxStaff) === 0
            ? 'Owner Login Only'
            : `Up to ${cfg.maxStaff} Staff Logins & Roles`,
        included: true
      },
      {
        name:
          cfg.maxProducts === null || cfg.maxProducts === undefined
            ? 'Unlimited Products / Catalog Items'
            : `Up to ${Number(cfg.maxProducts).toLocaleString()} Catalog Items`,
        included: true
      },
      { name: salesLabel, included: true },
      { name: 'Full 8-Bucket Where Is My Money', included: Boolean(cfg.allowFullMoneyBuckets) },
      { name: 'WhatsApp Receipts & Automation', included: Boolean(cfg.allowWhatsappAutomation) },
      { name: 'Public Invoice & Receipt Links (/d/:id)', included: Boolean(cfg.allowPublicDocLinks) },
      { name: 'Gmail Financial Reports', included: Boolean(cfg.allowGmailReports) },
      { name: 'Google Drive Export Vault', included: Boolean(cfg.allowGoogleDrive) },
      { name: 'Hybrid Multi-Activity Architecture', included: Boolean(cfg.allowHybrid) },
      { name: 'Inter-Branch Stock Transfers', included: Boolean(cfg.allowMultiBranchTransfer) },
      { name: 'Branch Freeze & Owner Lock', included: Boolean(cfg.allowBranchFreeze) },
      { name: 'Full P&L & Branch Analytics', included: Boolean(cfg.allowAdvancedReports) },
      { name: '2-Step Email Verification & Audit Log', included: Boolean(cfg.allowTwoFactorSecurity) },
      { name: `Support: ${cfg.supportSla || 'Standard Support'}`, included: true }
    ]

    return {
      ...fb,
      id: meta.id,
      tier: meta.tier,
      name: cfg.name || fb.name || meta.tier,
      priceRWF: Number(cfg.priceRWF ?? fb.priceRWF ?? 0),
      billingPeriod: Number(cfg.priceRWF ?? 0) === 0 ? 'Forever' : meta.billingPeriod,
      badge: fb.badge || meta.badge,
      recommended: meta.recommended,
      description: cfg.targetBusiness || fb.description || '',
      limits: {
        users: usersLabel,
        products: productsLabel,
        branches: branchesLabel
      },
      features
    }
  })
}


