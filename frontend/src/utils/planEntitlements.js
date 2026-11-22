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

