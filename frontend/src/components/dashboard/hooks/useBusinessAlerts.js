import { useMemo } from 'react'
import { formatRWF } from '../../../utils/currencyWords'

export function useBusinessAlerts({
  activeDemoWorkspace = {},
  archTransactions = [],
  activeArchId = 'buy-and-sell',
  hideFinancials = false,
  dismissedAlertIds = [],
  navMap = {},
  handleModuleClick = () => {},
  setActivePage = () => {},
  setNotifOpen = () => {}
}) {
  return useMemo(() => {
    const list = []
    const records = activeDemoWorkspace.records || {}
    const customers = records['Customers'] || []

    // Has user entered live transactions or created custom customer records?
    const hasLiveActivity =
      archTransactions.length > 0 ||
      customers.some((c) => !String(c.id || '').startsWith('CUS-201'))

    // 1. Overdue Customer Debt alert:
    const overdueCustomer = customers.find((c) => {
      const owes = Number(c.balanceOwedRWF ?? c.amountRWF) || 0
      if (owes <= 0) return false
      // In live mode or in non-buy-and-sell architectures, auto-hide the mock "Construction Client #04"
      if (
        String(c.title || c.name || '').includes('Construction Client #04') &&
        (hasLiveActivity || activeArchId !== 'buy-and-sell')
      ) {
        return false
      }
      return true
    })

    if (overdueCustomer) {
      const owes = Number(overdueCustomer.balanceOwedRWF ?? overdueCustomer.amountRWF) || 0
      list.push({
        id: `debt-${overdueCustomer.id || overdueCustomer.title}`,
        type: 'debt',
        title: 'Overdue Customer Debt',
        message: `${overdueCustomer.title || overdueCustomer.name} is overdue (${formatRWF(owes, hideFinancials)}).`,
        bg: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
        actionLabel: 'View Balance',
        onAction: () => {
          handleModuleClick('Customers')
          setActivePage((navMap['Customers'] || ['Customer Directory'])[0])
          setNotifOpen(false)
        }
      })
    }

    // 2. Cash & MoMo Reconciled:
    if (
      !hasLiveActivity &&
      !dismissedAlertIds.includes('momo-reconciled') &&
      activeArchId === 'buy-and-sell'
    ) {
      list.push({
        id: 'momo-reconciled',
        type: 'reconciled',
        title: 'Cash & MoMo Reconciled',
        message: 'Morning till matches expected balance.',
        bg: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200',
        actionLabel: 'Where Is My Money',
        onAction: () => {
          handleModuleClick('Overview')
          setActivePage('Where Is My Money')
          setNotifOpen(false)
        }
      })
    }

    return list.filter((item) => !dismissedAlertIds.includes(item.id))
  }, [
    activeDemoWorkspace,
    archTransactions,
    activeArchId,
    hideFinancials,
    dismissedAlertIds,
    navMap,
    handleModuleClick,
    setActivePage,
    setNotifOpen
  ])
}

