import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExbos } from '../../context/ExbosContext'
import MoneyInput from '../common/MoneyInput'
import { formatRWF, amountToWords } from '../../utils/currencyWords'
import {
  Calculator,
  ShieldAlert,
  TrendingUp,
  Rocket,
  Coins,
  LifeBuoy,
  Lock,
  CheckCircle2,
  BookmarkCheck,
  Sparkles,
  ArrowRight,
  Info,
  X
} from 'lucide-react'

const INITIAL_INPUTS = {
  'break-even': {
    fixedCosts: 600000,
    sellingPrice: 15000,
    variableCost: 9000
  },
  'survival-budget': {
    rent: 250000,
    salaries: 350000,
    electricity: 45000,
    internet: 35000,
    software: 20000,
    otherFixed: 50000
  },
  'startup-cost': {
    equipment: 1500000,
    premises: 600000,
    inventory: 2000000,
    registration: 60000,
    marketing: 240000,
    otherStartup: 300000
  },
  'pricing-profit': {
    sellingPrice: 25000,
    unitCost: 14000,
    expectedSales: 200,
    operatingExpenses: 850000
  },
  'emergency-fund': {
    monthlyExpenses: 750000,
    reserveMonths: 6,
    existingSavings: 1200000
  }
}

export default function FinancialToolsSection() {
  const {
    user,
    login,
    language,
    financialTools,
    pendingCalculator,
    savePendingCalculatorState,
    savedAnalyses,
    saveFinancialAnalysis
  } = useExbos()

  const navigate = useNavigate()
  const enabledTools = financialTools.filter((t) => t.enabled !== false)
  const [activeToolId, setActiveToolId] = useState('survival-budget')
  const [inputs, setInputs] = useState(INITIAL_INPUTS)
  const [calculatedResult, setCalculatedResult] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  // Restore preserved calculator inputs after authentication
  useEffect(() => {
    if (pendingCalculator && pendingCalculator.toolId) {
      setActiveToolId(pendingCalculator.toolId)
      if (pendingCalculator.inputs) {
        setInputs((prev) => ({
          ...prev,
          [pendingCalculator.toolId]: pendingCalculator.inputs
        }))
      }
      if (user) {
        runCalculation(pendingCalculator.toolId, pendingCalculator.inputs || inputs[pendingCalculator.toolId])
        savePendingCalculatorState(null)
      }
    }
  }, [user, pendingCalculator])

  const updateField = (toolId, field, val) => {
    setInputs((prev) => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        [field]: val
      }
    }))
    setCalculatedResult(null)
  }

  const runCalculation = (toolId, toolData) => {
    const d = toolData || inputs[toolId]
    if (toolId === 'break-even') {
      const fixed = Number(d.fixedCosts) || 0
      const price = Number(d.sellingPrice) || 0
      const variable = Number(d.variableCost) || 0
      const margin = price - variable
      const units = margin > 0 ? Math.ceil(fixed / margin) : 0
      const revenue = units * price
      setCalculatedResult({
        toolId,
        toolName: 'Break-Even Analysis Calculator',
        headline:
          margin <= 0
            ? 'Warning: Selling price must exceed variable unit cost'
            : `Sell ${units.toLocaleString()} units/month to break even`,
        primaryAmount: revenue,
        primaryLabel: 'Break-Even Monthly Revenue',
        metrics: [
          { label: 'Break-Even Sales Quantity', value: `${units.toLocaleString()} units` },
          { label: 'Contribution Margin per Unit', value: formatRWF(margin) },
          { label: 'Contribution Margin Ratio', value: price > 0 ? `${((margin / price) * 100).toFixed(1)}%` : '0%' }
        ],
        insight:
          margin > 0
            ? `Every unit sold contributes ${formatRWF(margin)} toward your ${formatRWF(fixed)} fixed costs. Sales beyond ${units.toLocaleString()} units generate net profit.`
            : 'Your variable cost per unit is equal to or higher than your selling price. Increase price or reduce unit cost.'
      })
    } else if (toolId === 'survival-budget') {
      const totalMonthly =
        (Number(d.rent) || 0) +
        (Number(d.salaries) || 0) +
        (Number(d.electricity) || 0) +
        (Number(d.internet) || 0) +
        (Number(d.software) || 0) +
        (Number(d.otherFixed) || 0)
      const safetyBudget6Months = totalMonthly * 6
      setCalculatedResult({
        toolId,
        toolName: 'Survival Budget Planner (6-Month Safety Reserve)',
        headline: `Safety Budget = ${formatRWF(safetyBudget6Months)}`,
        primaryAmount: safetyBudget6Months,
        primaryLabel: 'Six-Month Fixed-Cost Reserve (Fixed Monthly Cost × 6)',
        metrics: [
          { label: 'Total Monthly Fixed Costs', value: formatRWF(totalMonthly) },
          { label: '3-Month Minimum Buffer', value: formatRWF(totalMonthly * 3) },
          { label: '6-Month Survival Safety Budget', value: formatRWF(safetyBudget6Months) }
        ],
        insight: `Formula: Rent + Salary + Electricity + Internet + Software = ${formatRWF(totalMonthly)}/month × 6 = ${formatRWF(safetyBudget6Months)}. Holding this reserve ensures your business survives 6 full months even if sales are slow.`
      })
    } else if (toolId === 'startup-cost') {
      const totalStartup =
        (Number(d.equipment) || 0) +
        (Number(d.premises) || 0) +
        (Number(d.inventory) || 0) +
        (Number(d.registration) || 0) +
        (Number(d.marketing) || 0) +
        (Number(d.otherStartup) || 0)
      const contingency = Math.round(totalStartup * 0.1)
      setCalculatedResult({
        toolId,
        toolName: 'Startup Cost Calculator',
        headline: `Estimated Capital Required: ${formatRWF(totalStartup + contingency)}`,
        primaryAmount: totalStartup + contingency,
        primaryLabel: 'Total Recommended Startup Capital (incl. 10% buffer)',
        metrics: [
          { label: 'Direct Startup Expenses', value: formatRWF(totalStartup) },
          { label: '10% Unexpected Setup Buffer', value: formatRWF(contingency) },
          { label: 'Initial Inventory Share', value: totalStartup > 0 ? `${(((Number(d.inventory) || 0) / totalStartup) * 100).toFixed(0)}%` : '0%' }
        ],
        insight: `Before opening doors, prepare ${formatRWF(totalStartup)} for core setup plus ${formatRWF(contingency)} for unexpected licensing or installation costs.`
      })
    } else if (toolId === 'pricing-profit') {
      const price = Number(d.sellingPrice) || 0
      const cost = Number(d.unitCost) || 0
      const qty = Number(d.expectedSales) || 0
      const opEx = Number(d.operatingExpenses) || 0
      const revenue = price * qty
      const grossProfit = (price - cost) * qty
      const netProfit = grossProfit - opEx
      const marginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0
      setCalculatedResult({
        toolId,
        toolName: 'Pricing & Profit Calculator',
        headline:
          netProfit >= 0
            ? `Projected Monthly Net Profit: ${formatRWF(netProfit)}`
            : `Projected Monthly Deficit: ${formatRWF(netProfit)}`,
        primaryAmount: Math.max(0, netProfit),
        primaryLabel: 'Projected Monthly Net Profit',
        metrics: [
          { label: 'Estimated Monthly Revenue', value: formatRWF(revenue) },
          { label: 'Gross Profit (Before Overhead)', value: formatRWF(grossProfit) },
          { label: 'Net Profit Margin', value: `${marginPct.toFixed(1)}%` }
        ],
        insight:
          netProfit >= 0
            ? `Your pricing leaves ${formatRWF(price - cost)} gross margin per unit and ${formatRWF(netProfit)} net profit after ${formatRWF(opEx)} operating expenses.`
            : `At ${qty} units, gross profit (${formatRWF(grossProfit)}) does not yet cover operating expenses (${formatRWF(opEx)}).`
      })
    } else if (toolId === 'emergency-fund') {
      const monthly = Number(d.monthlyExpenses) || 0
      const months = Number(d.reserveMonths) || 6
      const saved = Number(d.existingSavings) || 0
      const target = monthly * months
      const gap = Math.max(0, target - saved)
      setCalculatedResult({
        toolId,
        toolName: 'Emergency Fund Planner',
        headline:
          gap === 0
            ? 'Emergency Reserve Target Fully Funded!'
            : `Additional Reserve Needed: ${formatRWF(gap)}`,
        primaryAmount: target,
        primaryLabel: `${months}-Month Emergency Fund Target`,
        metrics: [
          { label: 'Target Emergency Fund', value: formatRWF(target) },
          { label: 'Existing Savings', value: formatRWF(saved) },
          { label: 'Additional Savings Required', value: formatRWF(gap) }
        ],
        insight:
          gap > 0
            ? `Saving ${formatRWF(Math.ceil(gap / 6))} per month will fully build your ${months}-month emergency shield within half a year.`
            : `Your existing savings of ${formatRWF(saved)} already cover ${months} months of unexpected business disruptions.`
      })
    }
  }

  const handleCalculateClick = (e) => {
    e.preventDefault()
    runCalculation(activeToolId, inputs[activeToolId])
  }

  const handleSaveAnalysis = () => {
    if (!calculatedResult) return
    if (!user) {
      savePendingCalculatorState({
        toolId: activeToolId,
        inputs: inputs[activeToolId],
        timestamp: Date.now()
      })
      setAuthModalOpen(true)
      return
    }
    saveFinancialAnalysis({
      toolName: calculatedResult.toolName,
      summary: `${calculatedResult.headline} (${formatRWF(calculatedResult.primaryAmount)})`
    })
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  const getToolIcon = (id) => {
    switch (id) {
      case 'break-even':
        return <TrendingUp className="w-5 h-5" />
      case 'survival-budget':
        return <ShieldAlert className="w-5 h-5" />
      case 'startup-cost':
        return <Rocket className="w-5 h-5" />
      case 'pricing-profit':
        return <Coins className="w-5 h-5" />
      default:
        return <LifeBuoy className="w-5 h-5" />
    }
  }

  const getToolCardData = (toolId) => {
    switch (toolId) {
      case 'break-even': {
        const fixed = Number(inputs['break-even']?.fixedCosts) || 600000
        const price = Number(inputs['break-even']?.sellingPrice) || 15000
        const variable = Number(inputs['break-even']?.variableCost) || 9000
        const margin = price - variable
        const units = margin > 0 ? Math.ceil(fixed / margin) : 0
        const revenue = units * price
        return {
          badge: 'Break-Even Target',
          title: 'BREAK-EVEN SALES TARGET',
          amount: revenue,
          subtitle: `Sell ${units.toLocaleString()} units to cover ${formatRWF(fixed)} fixed costs`,
          problemSolved: 'Solves: Selling at a loss without knowing break-even units'
        }
      }
      case 'survival-budget': {
        const d = inputs['survival-budget'] || {}
        const totalMonthly =
          (Number(d.rent) || 0) +
          (Number(d.salaries) || 0) +
          (Number(d.electricity) || 0) +
          (Number(d.internet) || 0) +
          (Number(d.software) || 0) +
          (Number(d.otherFixed) || 0)
        const safetyBudget = totalMonthly * 6
        return {
          badge: '6-Month Reserve',
          title: '6-MONTH SURVIVAL BUDGET',
          amount: safetyBudget,
          subtitle: `Fixed monthly costs (${formatRWF(totalMonthly)}) × 6 months safety shield`,
          problemSolved: 'Solves: Business running out of cash in slow months'
        }
      }
      case 'startup-cost': {
        const d = inputs['startup-cost'] || {}
        const total =
          (Number(d.equipment) || 0) +
          (Number(d.premises) || 0) +
          (Number(d.inventory) || 0) +
          (Number(d.registration) || 0) +
          (Number(d.marketing) || 0) +
          (Number(d.otherStartup) || 0)
        return {
          badge: 'Initial Capital',
          title: 'STARTUP CAPITAL REQUIRED',
          amount: total,
          subtitle: 'Equipment, premises, opening stock & business licensing',
          problemSolved: 'Solves: Underestimating cash needed before opening'
        }
      }
      case 'pricing-profit': {
        const d = inputs['pricing-profit'] || {}
        const price = Number(d.sellingPrice) || 25000
        const cost = Number(d.unitCost) || 14000
        const sales = Number(d.expectedSales) || 200
        const opex = Number(d.operatingExpenses) || 850000
        const profit = Math.max(0, (price - cost) * sales - opex)
        return {
          badge: 'Monthly Margin',
          title: 'PRICING & PROFIT TARGET',
          amount: profit,
          subtitle: `Estimated monthly net profit after ${formatRWF(opex)} overhead`,
          problemSolved: 'Solves: Pricing goods too low to cover true overhead'
        }
      }
      case 'emergency-fund': {
        const d = inputs['emergency-fund'] || {}
        const monthly = Number(d.monthlyExpenses) || 750000
        const months = Number(d.reserveMonths) || 6
        const target = monthly * months
        return {
          badge: 'Buffer Shield',
          title: 'EMERGENCY RESERVE FUND',
          amount: target,
          subtitle: `${months} months of operations protected against unexpected shocks`,
          problemSolved: 'Solves: Equipment failure or emergency halts business'
        }
      }
      default:
        return {
          badge: 'Financial Tool',
          title: 'FINANCIAL PLANNER',
          amount: 0,
          subtitle: 'Plan costs & cash flow',
          problemSolved: 'Solves: Financial uncertainty'
        }
    }
  }

  const activeTool = enabledTools.find((t) => t.id === activeToolId) || enabledTools[0]
  const currentData = inputs[activeToolId] || {}

  return (
    <section
      id="explore-business-tools"
      className="relative w-full overflow-hidden isolate"
      style={{
        background:
          'linear-gradient(180deg, #071544 0%, #0A2786 38%, #0E3AA6 70%, #0A2786 100%)'
      }}
    >
      {/* Coded background: glow orbs, fine dot grid, light sweep */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(33,141,255,0.45) 0%, transparent 65%)',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(158,220,255,0.28) 0%, transparent 65%)',
            filter: 'blur(50px)'
          }}
        />
        <div
          className="absolute -bottom-48 left-1/4 w-[620px] h-[620px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,69,202,0.55) 0%, transparent 65%)',
            filter: 'blur(50px)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(158,220,255,0.38) 1.2px, transparent 1.6px)',
            backgroundSize: '28px 28px',
            WebkitMaskImage:
              'radial-gradient(ellipse at 50% 45%, #000 20%, transparent 85%)',
            maskImage: 'radial-gradient(ellipse at 50% 45%, #000 20%, transparent 85%)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(158,220,255,0.07) 48%, transparent 66%)'
          }}
        />
      </div>
      <div className="relative py-10 lg:py-12 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-0 py-1.5 bg-transparent text-[#9EDCFF] text-xs font-orbitron uppercase tracking-widest">
          <Calculator className="w-3.5 h-3.5 text-[#9EDCFF]" />
          <span>Explore Business Financial Tools</span>
        </div>
        <h2 className="font-orbitron text-3xl sm:text-4xl font-extrabold text-white">
          Calculate Before You Invest. Know Your Real Cost of Survival.
        </h2>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          Many businesses do not fail due to bad ideas—they fail because the founder does not know the real cost of survival. Use our 5 financial planning tools below:
          <strong className="text-[#9EDCFF] ml-1">
            Fixed Monthly Costs × 6 = Six-Month Safety Budget.
          </strong>
        </p>
      </div>

      {/* 5 Financial Planning Tool Cards - Designed Identical to Reference Image */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-stretch gap-4 sm:gap-5 mb-8"
      >
        {enabledTools.map((tool) => {
          const isSelected = tool.id === activeToolId
          const cardData = getToolCardData(tool.id)
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                setActiveToolId(tool.id)
                setCalculatedResult(null)
              }}
              className={`text-left rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-[#133272] via-[#0D2456] to-[#071536] border-2 border-[#218DFF] ring-4 ring-[#218DFF]/25 shadow-2xl scale-[1.01]'
                  : 'bg-gradient-to-b from-[#0F285D]/90 via-[#0B1E48]/95 to-[#071536] border border-[#218DFF]/30 hover:border-[#218DFF]/70 hover:-translate-y-1 shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-[#163065] border border-[#234C9A]/70 flex items-center justify-center text-[#9EDCFF] shadow-inner shrink-0">
                    {getToolIcon(tool.id)}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#132A58] border border-[#234C9A]/50 text-xs font-medium text-[#9EDCFF] text-right truncate max-w-[65%]">
                    {cardData.badge}
                  </span>
                </div>

                <h3 className="font-orbitron text-xs font-bold text-[#9EDCFF]/90 uppercase tracking-wider mt-5">
                  {cardData.title}
                </h3>
                <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2.5">
                  {formatRWF(cardData.amount)}
                </div>
                <p className="text-xs sm:text-sm text-slate-300/85 mt-2 leading-relaxed font-normal line-clamp-2">
                  {cardData.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-300 font-normal leading-relaxed">
                {cardData.problemSolved}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Calculator Workspace */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
        style={{ gap: '24px' }}
      >
        {/* Left: Interactive Monetary Inputs */}
        <form
          onSubmit={handleCalculateClick}
          className="lg:col-span-7 rounded-3xl p-6 sm:p-8 space-y-6 bg-gradient-to-b from-[#0F285D]/90 via-[#0B1E48]/95 to-[#071536] border border-[#218DFF]/30 text-white shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-orbitron uppercase tracking-wider text-[#218DFF]">
                Interactive Financial Planner
              </span>
              <h3 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1">
                {activeTool.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {activeTool.description}
              </p>
            </div>
          </div>

          {/* Formula Callout Pill */}
          <div className="p-3.5 rounded-2xl bg-[#163065]/70 border border-[#234C9A]/60 text-xs font-medium text-[#9EDCFF] flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#218DFF] shrink-0" />
            <span>{activeTool.formulaNote}</span>
          </div>

          {/* Dynamic Fields per Tool */}
          {activeToolId === 'break-even' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <MoneyInput
                id="be-fixed"
                label="Total Monthly Fixed Costs (Rent, Salaries, etc.)"
                value={currentData.fixedCosts}
                onChange={(v) => updateField('break-even', 'fixedCosts', v)}
                language={language}
                className="sm:col-span-2"
              />
              <MoneyInput
                id="be-price"
                label="Selling Price per Product / Service"
                value={currentData.sellingPrice}
                onChange={(v) => updateField('break-even', 'sellingPrice', v)}
                language={language}
              />
              <MoneyInput
                id="be-var"
                label="Variable Cost per Product / Service"
                value={currentData.variableCost}
                onChange={(v) => updateField('break-even', 'variableCost', v)}
                language={language}
              />
            </div>
          )}

          {activeToolId === 'survival-budget' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <MoneyInput
                id="sb-rent"
                label="Monthly Premises / Shop Rent"
                value={currentData.rent}
                onChange={(v) => updateField('survival-budget', 'rent', v)}
                language={language}
              />
              <MoneyInput
                id="sb-salaries"
                label="Monthly Employee Salaries & Wages"
                value={currentData.salaries}
                onChange={(v) => updateField('survival-budget', 'salaries', v)}
                language={language}
              />
              <MoneyInput
                id="sb-elec"
                label="Monthly Electricity & Water"
                value={currentData.electricity}
                onChange={(v) => updateField('survival-budget', 'electricity', v)}
                language={language}
              />
              <MoneyInput
                id="sb-internet"
                label="Monthly Internet & Communications"
                value={currentData.internet}
                onChange={(v) => updateField('survival-budget', 'internet', v)}
                language={language}
              />
              <MoneyInput
                id="sb-software"
                label="Monthly Software & Subscriptions"
                value={currentData.software}
                onChange={(v) => updateField('survival-budget', 'software', v)}
                language={language}
              />
              <MoneyInput
                id="sb-other"
                label="Other Essential Monthly Fixed Costs"
                value={currentData.otherFixed}
                onChange={(v) => updateField('survival-budget', 'otherFixed', v)}
                language={language}
              />
            </div>
          )}

          {activeToolId === 'startup-cost' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <MoneyInput
                id="sc-equip"
                label="Equipment, Machinery & Tools"
                value={currentData.equipment}
                onChange={(v) => updateField('startup-cost', 'equipment', v)}
                language={language}
              />
              <MoneyInput
                id="sc-prem"
                label="Premises Deposit & Renovation"
                value={currentData.premises}
                onChange={(v) => updateField('startup-cost', 'premises', v)}
                language={language}
              />
              <MoneyInput
                id="sc-inv"
                label="Initial Opening Stock / Raw Materials"
                value={currentData.inventory}
                onChange={(v) => updateField('startup-cost', 'inventory', v)}
                language={language}
              />
              <MoneyInput
                id="sc-reg"
                label="Business Registration & Licensing"
                value={currentData.registration}
                onChange={(v) => updateField('startup-cost', 'registration', v)}
                language={language}
              />
              <MoneyInput
                id="sc-mkt"
                label="Launch Marketing & Branding Budget"
                value={currentData.marketing}
                onChange={(v) => updateField('startup-cost', 'marketing', v)}
                language={language}
              />
              <MoneyInput
                id="sc-other"
                label="Other Initial Setup Expenses"
                value={currentData.otherStartup}
                onChange={(v) => updateField('startup-cost', 'otherStartup', v)}
                language={language}
              />
            </div>
          )}

          {activeToolId === 'pricing-profit' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <MoneyInput
                id="pp-price"
                label="Unit Selling Price"
                value={currentData.sellingPrice}
                onChange={(v) => updateField('pricing-profit', 'sellingPrice', v)}
                language={language}
              />
              <MoneyInput
                id="pp-cost"
                label="Production / Landed Cost per Unit"
                value={currentData.unitCost}
                onChange={(v) => updateField('pricing-profit', 'unitCost', v)}
                language={language}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/80">
                  Expected Monthly Sales Volume (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentData.expectedSales}
                  onChange={(e) => updateField('pricing-profit', 'expectedSales', Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/85 dark:bg-[#071544]/80 border border-blue-200/80 dark:border-[#9EDCFF]/25 text-[#071544] dark:text-white font-semibold text-sm"
                />
              </div>
              <MoneyInput
                id="pp-opex"
                label="Monthly Operating Overhead Expenses"
                value={currentData.operatingExpenses}
                onChange={(v) => updateField('pricing-profit', 'operatingExpenses', v)}
                language={language}
              />
            </div>
          )}

          {activeToolId === 'emergency-fund' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <MoneyInput
                id="ef-monthly"
                label="Monthly Operating Expenses"
                value={currentData.monthlyExpenses}
                onChange={(v) => updateField('emergency-fund', 'monthlyExpenses', v)}
                language={language}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/80">
                  Desired Reserve Coverage Period (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={currentData.reserveMonths}
                  onChange={(e) => updateField('emergency-fund', 'reserveMonths', Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/85 dark:bg-[#071544]/80 border border-blue-200/80 dark:border-[#9EDCFF]/25 text-[#071544] dark:text-white font-semibold text-sm"
                />
              </div>
              <MoneyInput
                id="ef-saved"
                label="Existing Business Emergency Savings"
                value={currentData.existingSavings}
                onChange={(v) => updateField('emergency-fund', 'existingSavings', v)}
                language={language}
                className="sm:col-span-2"
              />
            </div>
          )}

          <div className="pt-4 border-t border-blue-200/60 dark:border-[#9EDCFF]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              {user ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Signed in as <strong>{user.name}</strong> · Instant Calculation Active</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#218DFF] shrink-0" />
                  <span>Enter values freely. Calculating preserves your inputs &amp; verifies account.</span>
                </>
              )}
            </div>

            <button type="submit" className="btn-sapphire px-7 py-3.5 text-sm sm:text-base">
              <Calculator className="w-4 h-4" />
              <span>Calculate &amp; Analyse</span>
            </button>
          </div>
        </form>

        {/* Right: Analysis Output & Saved Analyses */}
        <div className="lg:col-span-5 space-y-5">
          {calculatedResult ? (
            <div className="rounded-3xl p-6 sm:p-8 space-y-6 bg-gradient-to-b from-[#0F285D]/90 via-[#0B1E48]/95 to-[#071536] border border-[#218DFF]/30 text-white shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#132A58] border border-[#234C9A]/50 text-xs font-orbitron text-[#9EDCFF]">
                  Verified Financial Estimate
                </span>
                <button
                  type="button"
                  onClick={handleSaveAnalysis}
                  className="px-3.5 py-1.5 rounded-xl bg-[#218DFF]/20 hover:bg-[#218DFF]/30 border border-[#218DFF]/40 text-xs font-semibold text-[#9EDCFF] flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#218DFF]" />
                  <span>{savedNotice ? 'Saved to Workspace!' : 'Save Analysis'}</span>
                </button>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-[#9EDCFF]/80 font-medium">
                  {calculatedResult.primaryLabel}
                </div>
                <div className="font-orbitron text-3xl sm:text-4xl font-extrabold text-white mt-1">
                  {formatRWF(calculatedResult.primaryAmount)}
                </div>
                <div className="text-xs italic text-[#9EDCFF] mt-1">
                  {amountToWords(calculatedResult.primaryAmount, language)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {calculatedResult.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="p-3.5 rounded-2xl bg-[#071536]/80 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-slate-300">{m.label}</span>
                    <strong className="font-orbitron text-sm text-[#9EDCFF]">
                      {m.value}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#163065]/70 border border-[#234C9A]/50 text-xs sm:text-sm leading-relaxed text-slate-200">
                <strong className="block font-orbitron text-xs uppercase text-[#9EDCFF] mb-1">
                  ExBOS Planning Insight
                </strong>
                {calculatedResult.insight}
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                * Important: Financial results are estimates for business planning and must not be presented as guaranteed profits or business survival outcomes.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl p-6 sm:p-8 space-y-5 bg-gradient-to-b from-[#0F285D]/90 via-[#0B1E48]/95 to-[#071536] border border-[#218DFF]/30 text-white shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#163065] border border-[#234C9A]/70 flex items-center justify-center text-[#9EDCFF]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-orbitron text-xl font-bold text-white">
                Ready to Calculate Your {activeTool.shortName}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Enter your business numbers on the left—notice how EXCELLENCE BOS automatically formats your RWF amounts with commas and writes them out in words ({language === 'rw' ? 'Kinyarwanda' : 'English'}). Click <strong>Calculate &amp; Analyse</strong> to view your full survival and profitability breakdown.
              </p>
              <div className="p-4 rounded-2xl bg-[#071536]/80 border border-white/10 space-y-2">
                <div className="text-xs font-orbitron uppercase text-[#9EDCFF]">
                  Saved Financial Analyses ({savedAnalyses.length})
                </div>
                {savedAnalyses.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="text-xs py-1.5 border-b last:border-0 border-white/10 flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-white">
                      {item.toolName}: <span className="font-normal text-slate-300">{item.summary}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Prompt Modal when unauthenticated visitor clicks Calculate */}
      {authModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/80 backdrop-blur-xl"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-[#071544] border border-[#9EDCFF]/40 text-white p-6 sm:p-8 shadow-sapphire-dark lamp-modal-card space-y-6">
            <div className="absolute top-0 inset-x-10 h-20 lamp-beam pointer-events-none rounded-b-full" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#218DFF]/25 border border-[#9EDCFF]/40 flex items-center justify-center text-[#9EDCFF]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-orbitron uppercase tracking-wider text-[#9EDCFF]">
                    Inputs Preserved Safely
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">
                    Unlock Your Financial Analysis
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              Your entered values for <strong>{activeTool.name}</strong> have been saved. Sign in or create a free EXCELLENCE BOS account to view your calculation and save it to your business workspace.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(false)
                  navigate('/register?returnTo=calculator')
                }}
                className="w-full btn-sapphire py-3.5 text-sm"
              >
                <span>Create Free Account &amp; Continue Calculation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(false)
                  navigate('/login?returnTo=calculator')
                }}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-[#9EDCFF]/35 text-white font-semibold text-sm cursor-pointer transition-all"
              >
                Sign In to Existing Account (Preserves Values)
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  )
}

