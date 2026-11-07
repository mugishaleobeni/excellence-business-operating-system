import React, { useMemo } from 'react'
import { useExbos } from '../../../context/ExbosContext'
import { SERVICE_PRESETS } from './data/servicePresets'
import ServiceKpiCards from './components/ServiceKpiCards'
import ServiceCatalogueWorkspace from './views/ServiceCatalogueWorkspace'
import JobsAndBookingsWorkspace from './views/JobsAndBookingsWorkspace'
import StaffCommissionsWorkspace from './views/StaffCommissionsWorkspace'

export default function ServicesWorkspace({
  activeModule = 'Services',
  activePage = 'Service Catalogue',
  onSwitchPage = () => {}
}) {
  const {
    workspaces,
    updateWorkspace,
    addTransaction,
    addToast,
    serviceTrade = 'salon',
    applyServiceTrade
  } = useExbos()

  const currentPreset = SERVICE_PRESETS[serviceTrade] || SERVICE_PRESETS.salon
  const workspace = workspaces?.['services'] || {}
  const records = workspace.records || {}

  // Load live user records only (zero un-entered preset fallbacks)
  const services = useMemo(() => {
    const list = records['Services']
    return Array.isArray(list) ? list : []
  }, [records])

  const consumables = useMemo(() => {
    const list = records['Consumables']
    return Array.isArray(list) ? list : []
  }, [records])

  const jobs = useMemo(() => {
    const list = records['Jobs']
    return Array.isArray(list) ? list : []
  }, [records])

  const staff = useMemo(() => {
    const list = records['Staff']
    return Array.isArray(list) ? list : []
  }, [records])

  const categories = useMemo(() => {
    const list = records['Categories']
    if (Array.isArray(list) && list.length > 0) return list
    return currentPreset.categories || ['General Service']
  }, [records, currentPreset])

  // --- SERVICE ACTIONS ---
  const handleAddService = (newSrv) => {
    const nextList = [newSrv, ...services]
    updateWorkspace('services', {
      records: { ...records, Services: nextList }
    })
    addToast({ title: 'Service Added', message: `Added "${newSrv.name}" to catalogue.`, type: 'success' })
  }

  const handleUpdateService = (id, updates) => {
    const nextList = services.map((s) => (s.id === id ? { ...s, ...updates } : s))
    updateWorkspace('services', {
      records: { ...records, Services: nextList }
    })
    addToast({ title: 'Service Updated', message: `Updated service details.`, type: 'success' })
  }

  const handleDeleteService = (id) => {
    const nextList = services.filter((s) => s.id !== id)
    updateWorkspace('services', {
      records: { ...records, Services: nextList }
    })
    addToast({ title: 'Service Deleted', message: `Removed service from catalogue.`, type: 'info' })
  }

  // --- CONSUMABLES ACTIONS ---
  const handleAddConsumable = (newCon) => {
    const nextList = [newCon, ...consumables]
    updateWorkspace('services', {
      records: { ...records, Consumables: nextList }
    })
    addToast({ title: 'Supply Added', message: `Recorded ${newCon.name} in supplies stock.`, type: 'success' })
  }

  const handleUpdateConsumable = (id, updates) => {
    const nextList = consumables.map((c) => (c.id === id ? { ...c, ...updates } : c))
    updateWorkspace('services', {
      records: { ...records, Consumables: nextList }
    })
    addToast({ title: 'Supply Updated', message: `Updated supply stock levels.`, type: 'success' })
  }

  const handleDeleteConsumable = (id) => {
    const nextList = consumables.filter((c) => c.id !== id)
    updateWorkspace('services', {
      records: { ...records, Consumables: nextList }
    })
    addToast({ title: 'Supply Removed', message: `Removed supply item.`, type: 'info' })
  }

  const handleAddCategory = (catName) => {
    if (categories.includes(catName)) return
    const nextList = [...categories, catName]
    updateWorkspace('services', {
      records: { ...records, Categories: nextList }
    })
    addToast({ title: 'Category Created', message: `Added category "${catName}".`, type: 'success' })
  }

  // --- JOBS ACTIONS ---
  const handleAddJob = (newJob) => {
    const nextList = [newJob, ...jobs]
    updateWorkspace('services', {
      records: { ...records, Jobs: nextList }
    })
    const initialPaid = Number(newJob.depositPaidRWF || 0)
    if (initialPaid > 0 && addTransaction) {
      addTransaction({
        architectureId: 'services',
        title: `Booking Deposit: ${newJob.serviceName || newJob.ticketNumber} (${newJob.customerName})`,
        type: 'in',
        category: 'Service Bookings',
        amountRWF: initialPaid,
        account: newJob.paymentMethod || 'Cash / MoMo'
      })
    }
    addToast({ title: 'Booking Created', message: `Scheduled booking for ${newJob.customerName}.`, type: 'success' })
  }

  const handleUpdateJob = (id, updates) => {
    const prevJob = jobs.find((j) => j.id === id)
    const nextList = jobs.map((j) => (j.id === id ? { ...j, ...updates } : j))
    updateWorkspace('services', {
      records: { ...records, Jobs: nextList }
    })
    if (prevJob && updates.status === 'Completed' && prevJob.status !== 'Completed' && addTransaction) {
      const remainingPaid = Math.max(0, Number(updates.totalPriceRWF ?? prevJob.totalPriceRWF ?? 0) - Number(prevJob.depositPaidRWF || 0))
      if (remainingPaid > 0) {
        addTransaction({
          architectureId: 'services',
          title: `Completed Service: ${prevJob.serviceName || prevJob.ticketNumber} (${prevJob.customerName})`,
          type: 'in',
          category: 'Completed Services',
          amountRWF: remainingPaid,
          account: updates.paymentMethod || prevJob.paymentMethod || 'Cash / MoMo'
        })
      }
    }
    addToast({ title: 'Job Updated', message: `Updated ${updates.ticketNumber || 'job'}.`, type: 'success' })
  }

  const handleDeleteJob = (id) => {
    const nextList = jobs.filter((j) => j.id !== id)
    updateWorkspace('services', {
      records: { ...records, Jobs: nextList }
    })
    addToast({ title: 'Job Removed', message: `Deleted job card.`, type: 'info' })
  }

  // Deduct linked consumables on job completion
  const handleDeductConsumables = (itemsToDeduct = []) => {
    let updatedConsumables = [...consumables]
    itemsToDeduct.forEach((item) => {
      const idx = updatedConsumables.findIndex((c) => c.name === item.name)
      if (idx !== -1) {
        const current = Number(updatedConsumables[idx].currentStock) || 0
        const qtyUsed = Number(item.qty) || 1
        updatedConsumables[idx] = {
          ...updatedConsumables[idx],
          currentStock: Math.max(0, current - qtyUsed)
        }
      }
    })
    updateWorkspace('services', {
      records: { ...records, Consumables: updatedConsumables }
    })
  }

  // --- STAFF ACTIONS ---
  const handleAddStaff = (newMember) => {
    const nextList = [...staff, newMember]
    updateWorkspace('services', {
      records: { ...records, Staff: nextList }
    })
    addToast({ title: 'Staff Member Added', message: `Added ${newMember.name} to roster.`, type: 'success' })
  }

  const handleUpdateStaff = (id, updates) => {
    const nextList = staff.map((s) => (s.id === id ? { ...s, ...updates } : s))
    updateWorkspace('services', {
      records: { ...records, Staff: nextList }
    })
    addToast({ title: 'Staff Updated', message: `Updated staff profile.`, type: 'success' })
  }

  const handleDeleteStaff = (id) => {
    const nextList = staff.filter((s) => s.id !== id)
    updateWorkspace('services', {
      records: { ...records, Staff: nextList }
    })
    addToast({ title: 'Staff Removed', message: `Removed staff member.`, type: 'info' })
  }

  const handleSettlePayout = (member, amountRWF) => {
    // Record payout expense
    const payoutExpense = {
      id: `EXP-PAY-${Date.now().toString().slice(-4)}`,
      title: `Daily Commission Payout: ${member.name}`,
      category: 'Salaries & Commissions',
      amountRWF: amountRWF,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash / MoMo',
      paidTo: member.name
    }
    const currentExpenses = Array.isArray(records['Expenses']) ? records['Expenses'] : []
    updateWorkspace('services', {
      records: { ...records, Expenses: [payoutExpense, ...currentExpenses] }
    })
    if (addTransaction && Number(amountRWF) > 0) {
      addTransaction({
        architectureId: 'services',
        title: payoutExpense.title,
        type: 'out',
        category: 'Salaries & Commissions',
        amountRWF: Number(amountRWF),
        account: 'Cash / MoMo'
      })
    }
    addToast({
      title: 'Daily Payout Settled',
      message: `Paid ${amountRWF.toLocaleString()} RWF to ${member.name}. Recorded in expenses.`,
      type: 'success'
    })
  }

  const isStaffView = activePage === 'Staff & Commissions'
  const isJobsView = activeModule === 'Jobs & Bookings' || (activeModule === 'Overview' && activePage === 'Upcoming Bookings')

  return (
    <div className="space-y-6">
      {/* Dynamic KPI Cards */}
      <ServiceKpiCards
        services={services}
        consumables={consumables}
        jobs={jobs}
        staff={staff}
        onNavigateTab={(mod, page) => onSwitchPage(mod, page)}
      />

      {/* Main Routed View */}
      {isStaffView ? (
        <StaffCommissionsWorkspace
          staff={staff}
          jobs={jobs}
          onAddStaff={handleAddStaff}
          onUpdateStaff={handleUpdateStaff}
          onDeleteStaff={handleDeleteStaff}
          onSettlePayout={handleSettlePayout}
          staffLabel={currentPreset.staffLabel}
        />
      ) : isJobsView ? (
        <JobsAndBookingsWorkspace
          jobs={jobs}
          services={services}
          staff={staff}
          consumables={consumables}
          onAddJob={handleAddJob}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onDeductConsumables={handleDeductConsumables}
          activeSubPage={activePage}
          setActiveSubPage={(page) => onSwitchPage('Jobs & Bookings', page)}
          clientAssetLabel={currentPreset.clientAssetLabel}
        />
      ) : (
        <ServiceCatalogueWorkspace
          services={services}
          consumables={consumables}
          categories={categories}
          onAddService={handleAddService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
          onAddConsumable={handleAddConsumable}
          onUpdateConsumable={handleUpdateConsumable}
          onDeleteConsumable={handleDeleteConsumable}
          onAddCategory={handleAddCategory}
          activeSubPage={activePage}
          setActiveSubPage={(page) => onSwitchPage('Services', page)}
        />
      )}
    </div>
  )
}

