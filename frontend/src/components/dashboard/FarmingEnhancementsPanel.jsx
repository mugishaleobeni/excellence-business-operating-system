import React, { useState } from 'react'
import { useExbos } from '../../context/ExbosContext'
import { formatRWF, amountToWords } from '../../utils/currencyWords'
import MoneyInput from '../common/MoneyInput'
import {
  ShieldCheck,
  AlertTriangle,
  Wheat,
  Sprout,
  HeartPulse,
  TrendingUp,
  Sliders,
  Bot,
  Send,
  Plus,
  RefreshCw,
  Hammer,
  CheckCircle2,
  ArrowRight,
  Layers
} from 'lucide-react'

export default function FarmingEnhancementsPanel({ activeSubPage = 'Livestock Intelligence' }) {
  const { hideFinancials, language, addTransaction } = useExbos()

  // 1. Six-Month Business Survival State
  const [survivalConfig, setSurvivalConfig] = useState({
    targetMonths: 6,
    availableOperatingCapital: 3900000,
    monthlyFeedCost: 280000,
    monthlySalaries: 180000,
    monthlyVet: 65000,
    monthlyUtilities: 45000,
    monthlyEmergencyBuffer: 50000
  })

  // 2. Smart Budget Classification (One-time Fixed Capital vs Operating vs Safety Budget)
  const [budgetItems] = useState([
    {
      id: 'BG-1',
      category: 'Fixed Capital',
      title: 'Solar Water Pump & Modern Pig Pens (One-Time Asset)',
      amount: 2400000,
      note: 'Counted once as long-term infrastructure—never repeated monthly',
      status: 'Confirmed'
    },
    {
      id: 'BG-2',
      category: 'Livestock Investment',
      title: '6 Landrace Breeding Gilts & 1 Boar',
      amount: 1850000,
      note: 'Capital invested in productive breeding animals',
      status: 'Confirmed'
    },
    {
      id: 'BG-3',
      category: 'Operating Expenses',
      title: 'Monthly Feed, Staff Salaries & Vet Care',
      amount: 620000,
      note: 'Recurring monthly operating cost',
      status: 'Confirmed'
    },
    {
      id: 'BG-4',
      category: 'Safety Budget',
      title: '6-Month Operating Reserve (620,000 × 6)',
      amount: 3720000,
      note: 'Protected survival capital—not double-counted as an additional expense',
      status: 'Protected'
    },
    {
      id: 'BG-5',
      category: 'Emergency Reserve',
      title: 'Biosecurity & Epidemic Contingency Fund',
      amount: 650000,
      note: 'Dedicated buffer for unexpected veterinary or weather shocks',
      status: 'Confirmed'
    },
    {
      id: 'BG-6',
      category: 'Fixed Capital',
      title: 'Biogas Digester Extension Valve',
      amount: 0,
      note: 'Unknown supplier quote—remains marked as Pending until confirmed',
      status: 'Pending Quote'
    }
  ])

  // 3. Intelligent Feed Management (Default example: Tunga Feed 50kg = 35,000 Frw, 4kg/day = 12.5 days)
  const [feeds, setFeeds] = useState([
    {
      id: 'FD-1',
      name: 'Tunga Feed (Grower & Breeder Mix)',
      totalKg: 50,
      totalCostRWF: 35000,
      dailyConsumptionKg: 4,
      stage: 'Growing Gilts (4–6 Months)',
      supplement: 'Sweet potato vines + Azolla (2 kg/day)'
    },
    {
      id: 'FD-2',
      name: 'Aguka Maize Bran & Soya Concentrate',
      totalKg: 180,
      totalCostRWF: 117000,
      dailyConsumptionKg: 12,
      stage: 'Lactating Sows & Fattening Batch',
      supplement: 'Mineral premix + clean borehole water'
    }
  ])

  // 4. Livestock Investment Intelligence
  const [animals, setAnimals] = useState([
    {
      id: 'PIG-101',
      tag: 'LR-SOW-01',
      origin: 'Existing Animals',
      purpose: 'Breeding',
      ageMonths: 9,
      weightKg: 118,
      acquisitionCost: 300000,
      feedAndVetAccumulated: 145000,
      readyToBreed: true,
      pregnancyStatus: 'Pregnant (Est. Birth: 2026-12-18 · 10–12 piglets)'
    },
    {
      id: 'PIG-102',
      tag: 'LR-GILT-04',
      origin: 'Purchased Animals',
      purpose: 'Breeding',
      ageMonths: 5.5,
      weightKg: 68,
      acquisitionCost: 260000,
      feedAndVetAccumulated: 72000,
      readyToBreed: false,
      pregnancyStatus: 'Hold Breeding: Weight 68kg is below 95kg target & age < 7.5 mos'
    },
    {
      id: 'PIG-103',
      tag: 'DU-LITTER-09 (8 Piglets)',
      origin: 'Born Animals',
      purpose: 'Fattening',
      ageMonths: 3,
      weightKg: 34,
      acquisitionCost: 0,
      feedAndVetAccumulated: 190000,
      readyToBreed: false,
      pregnancyStatus: 'Growing cycle on schedule'
    },
    {
      id: 'PIG-104',
      tag: 'TRD-BATCH-12 (4 Finishers)',
      origin: 'Trading Animals',
      purpose: 'Resale',
      ageMonths: 7,
      weightKg: 92,
      acquisitionCost: 680000,
      feedAndVetAccumulated: 140000,
      transportCost: 30000,
      sellingPrice: 1120000,
      readyToBreed: false,
      pregnancyStatus: 'Sold / Trading Profit Tracked Separately'
    }
  ])

  // 7. Smart Cash Flow Simulator Controls
  const [simStress, setSimStress] = useState({
    sixMonthsZeroSales: true,
    feedPriceIncreasePct: 15,
    unexpectedVetRWF: 180000,
    delayedSalesMonths: 2,
    extraLaborRWF: 60000
  })

  // 8. Expansion Intelligence Simulator (e.g. Buying 2 Additional Pigs)
  const [expansionPigs, setExpansionPigs] = useState(2)
  const [costPerExtraPig, setCostPerExtraPig] = useState(250000)
  const [monthlyFeedPerExtraPig, setMonthlyFeedPerExtraPig] = useState(42000)

  // 9. Farm Infrastructure Budgeting
  const [infraItems] = useState([
    { item: 'Galvanized Roofing Sheets (28 Gauge)', qty: '24 sheets', estimated: 360000, actual: 348000, status: 'Purchased' },
    { item: 'Solar 3kW Hybrid Inverter & Lithium Battery', qty: '1 system', estimated: 1450000, actual: 1450000, status: 'Installed Asset' },
    { item: 'Cement & Burnt Bricks for Farrowing Pen', qty: '40 bags', estimated: 520000, actual: 545000, status: 'Completed' },
    { item: 'Automatic Nipple Drinkers & Piping', qty: '18 units', estimated: 0, actual: 0, status: 'Missing Price (Pending)' }
  ])

  // 11. AI Farming Assistant Chat
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Muraho! I am the ExBOS Smart Farming AI Assistant. Tell me about animal purchases, feed stock, breeding plans, or ask: "What happens if I make no sales for six months?"'
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [pendingAiPurchase, setPendingAiPurchase] = useState(null)

  // 12. Customizable Farm Dashboard Widgets
  const [enabledWidgets, setEnabledWidgets] = useState({
    survival: true,
    feedForecast: true,
    smartBudget: true,
    livestock: true,
    breeding: true,
    tradingProfit: true,
    expansion: true,
    circularAguka: true
  })

  // Derived Survival Calculations
  const monthlyOperatingTotal =
    survivalConfig.monthlyFeedCost +
    survivalConfig.monthlySalaries +
    survivalConfig.monthlyVet +
    survivalConfig.monthlyUtilities +
    survivalConfig.monthlyEmergencyBuffer

  const requiredSixMonthCapital = monthlyOperatingTotal * survivalConfig.targetMonths
  const survivalMonthsCovered =
    monthlyOperatingTotal > 0
      ? survivalConfig.availableOperatingCapital / monthlyOperatingTotal
      : 0

  const survivalStatus =
    survivalMonthsCovered >= survivalConfig.targetMonths
      ? { color: 'emerald', label: 'GREEN · Can operate for at least 6 months without revenue' }
      : survivalMonthsCovered >= 3.5
      ? { color: 'amber', label: 'YELLOW · Operating funds are becoming insufficient' }
      : { color: 'rose', label: 'RED · Cannot sustain planned operations for 6 months' }

  // Derived Expansion Intelligence
  const extraPurchaseCost = expansionPigs * costPerExtraPig
  const extraSixMonthFeedAndVet = expansionPigs * (monthlyFeedPerExtraPig + 12000) * survivalConfig.targetMonths
  const capitalAfterExpansion = Math.max(0, survivalConfig.availableOperatingCapital - extraPurchaseCost)
  const monthlyBurnAfterExpansion =
    monthlyOperatingTotal + expansionPigs * (monthlyFeedPerExtraPig + 12000)
  const monthsAfterExpansion =
    monthlyBurnAfterExpansion > 0 ? capitalAfterExpansion / monthlyBurnAfterExpansion : 0

  const handleAiPrompt = (customPrompt) => {
    const text = (customPrompt || chatInput).trim()
    if (!text) return
    const nextMessages = [...chatHistory, { sender: 'farmer', text }]
    const lower = text.toLowerCase()

    if (pendingAiPurchase && (lower.includes('breeding') || lower.includes('fattening') || lower.includes('trading'))) {
      const purpose = lower.includes('trading')
        ? 'Resale'
        : lower.includes('fattening')
        ? 'Fattening'
        : 'Breeding'
      const origin = lower.includes('trading') ? 'Trading Animals' : 'Purchased Animals'
      setAnimals((prev) => [
        {
          id: `PIG-${Date.now().toString().slice(-3)}`,
          tag: `AI-BATCH-${prev.length + 1}`,
          origin,
          purpose,
          ageMonths: 6,
          weightKg: 75,
          acquisitionCost: pendingAiPurchase.amount,
          feedAndVetAccumulated: 0,
          readyToBreed: false,
          pregnancyStatus: `Registered via AI Assistant for ${purpose}`
        },
        ...prev
      ])
      addTransaction({
        title: `AI Confirmed: Purchased ${pendingAiPurchase.count} pigs for ${purpose}`,
        type: 'out',
        category: 'Livestock Investment',
        amountRWF: pendingAiPurchase.amount,
        source: 'Dashboard'
      })
      nextMessages.push({
        sender: 'ai',
        text: `Confirmed! I have registered the ${pendingAiPurchase.count} pigs (${formatRWF(pendingAiPurchase.amount)}) under "${origin}" with purpose "${purpose}" and updated your financial ledger.`
      })
      setPendingAiPurchase(null)
    } else if (lower.includes('bought') && lower.includes('pig')) {
      setPendingAiPurchase({ count: 2, amount: 500000 })
      nextMessages.push({
        sender: 'ai',
        text: 'Are they for breeding, fattening or trading? Reply with "Breeding", "Fattening", or "Trading" and I will classify their investment & update your records.'
      })
    } else if (lower.includes('feed') && lower.includes('last')) {
      const tunga = feeds[0]
      const days = (tunga.totalKg / tunga.dailyConsumptionKg).toFixed(1)
      nextMessages.push({
        sender: 'ai',
        text: `Your ${tunga.name} has ${tunga.totalKg} kg remaining. At ${tunga.dailyConsumptionKg} kg/day, it will last ${days} days (${formatRWF(tunga.totalCostRWF / tunga.totalKg)} per kg). Your second feed stock lasts ${(feeds[1].totalKg / feeds[1].dailyConsumptionKg).toFixed(1)} days.`
      })
    } else if (lower.includes('expand')) {
      nextMessages.push({
        sender: 'ai',
        text: `Purchasing ${expansionPigs} additional pigs (${formatRWF(extraPurchaseCost)}) would reduce your financial survival coverage from ${survivalMonthsCovered.toFixed(1)} months to ${monthsAfterExpansion.toFixed(1)} months. Consider delaying the purchase or adding ${formatRWF(Math.max(0, requiredSixMonthCapital - capitalAfterExpansion + extraSixMonthFeedAndVet))} in operating capital.`
      })
    } else if (lower.includes('no sales') || lower.includes('six months')) {
      nextMessages.push({
        sender: 'ai',
        text: `6-Month Zero-Sales Forecast: Your monthly farm operating burn is ${formatRWF(monthlyOperatingTotal)}. With ${formatRWF(survivalConfig.availableOperatingCapital)} available operating capital, your farm can survive ${survivalMonthsCovered.toFixed(1)} months without making a single sale (${survivalStatus.label}).`
      })
    } else {
      nextMessages.push({
        sender: 'ai',
        text: `Based on your live farm records: Survival coverage is ${survivalMonthsCovered.toFixed(1)} months, Tunga Feed lasts ${(feeds[0].totalKg / feeds[0].dailyConsumptionKg).toFixed(1)} days, and trading batch profit is +270,000 RWF.`
      })
    }

    setChatHistory(nextMessages)
    setChatInput('')
  }

  return (
    <div className="space-y-6">
      {/* Top Farming Intelligence Header & Widget Customizer */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-[#071544] via-[#0A2786] to-[#1045CA] text-white border border-[#9EDCFF]/40 shadow-sapphire-glow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-[#9EDCFF]/40 text-xs font-orbitron text-[#9EDCFF]">
              <Sprout className="w-3.5 h-3.5" />
              <span>ExBOS SMART FARMING · FINANCIAL SUSTAINABILITY &amp; GROWTH</span>
            </span>
            <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold mt-2">
              Animal Management → Feed → Survival → Production → Profit → Growth
            </h2>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#03091F]/80 border border-[#9EDCFF]/40 text-right">
            <div className="text-[10px] font-orbitron uppercase text-[#9EDCFF]">
              6-Month Survival Status
            </div>
            <div className="font-orbitron text-lg font-extrabold text-emerald-400">
              {survivalMonthsCovered.toFixed(1)} Months Covered
            </div>
          </div>
        </div>

        {/* Widget Customizer Toggles (Section 12) */}
        <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-orbitron text-[#9EDCFF] mr-1 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Widgets:</span>
          </span>
          {[
            ['survival', '1. 6-Month Survival'],
            ['smartBudget', '2. Smart Budget'],
            ['feedForecast', '3. Feed Forecast'],
            ['livestock', '4. Livestock & 5. Breeding'],
            ['tradingProfit', '6. Pig Trading & 7. Cash Sim'],
            ['expansion', '8. Expansion & 9. Infrastructure'],
            ['circularAguka', '10. Circular AGUKA Model']
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setEnabledWidgets((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                enabledWidgets[key]
                  ? 'bg-[#218DFF] text-white border-[#9EDCFF]'
                  : 'bg-[#03091F]/50 text-slate-300 border-white/15 opacity-70'
              }`}
            >
              {enabledWidgets[key] ? '✓ ' : '+ '}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 11: AI FARMING ASSISTANT CONVERSATIONAL BAR */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-[#218DFF]/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#218DFF] text-white flex items-center justify-center shadow-sapphire-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm font-bold text-[#071544] dark:text-white">
                ExBOS Farming AI Assistant (Section 11)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#9EDCFF]/80">
                Understands livestock purpose, feed duration, expansion readiness, and 6-month survival.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'I bought two pigs for 500,000 Frw.',
              'How many days will my feed last?',
              'Can I expand my farm?',
              'What happens if I make no sales for six months?'
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAiPrompt(q)}
                className="px-2.5 py-1 rounded-lg bg-[#218DFF]/15 hover:bg-[#218DFF]/25 border border-[#218DFF]/30 text-[11px] font-semibold text-[#1045CA] dark:text-[#9EDCFF] cursor-pointer"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-44 overflow-y-auto space-y-2 p-3 rounded-2xl bg-white/60 dark:bg-[#03091F]/65 border border-blue-200/50 dark:border-[#9EDCFF]/15">
          {chatHistory.map((m, idx) => (
            <div
              key={idx}
              className={`text-xs p-2.5 rounded-xl ${
                m.sender === 'ai'
                  ? 'bg-[#218DFF]/15 text-[#071544] dark:text-[#eaf2ff] border border-[#218DFF]/30'
                  : 'bg-[#071544] text-[#9EDCFF] ml-auto max-w-md font-semibold'
              }`}
            >
              <strong className="font-orbitron text-[10px] uppercase block mb-0.5 text-[#218DFF] dark:text-[#9EDCFF]">
                {m.sender === 'ai' ? 'ExBOS AI' : 'Farmer'}
              </strong>
              {m.text}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAiPrompt()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={
              pendingAiPurchase
                ? 'Reply: "Breeding", "Fattening", or "Trading"...'
                : 'Ask ExBOS AI or record a livestock activity...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm text-[#071544] dark:text-white"
          />
          <button type="submit" className="btn-sapphire px-5 py-2.5 text-xs font-orbitron">
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* SECTION 1 & 3: SIX-MONTH BUSINESS SURVIVAL + INTELLIGENT FEED MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {enabledWidgets.survival && (
          <div className="lg:col-span-6 sapphire-analytics-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron uppercase text-[#218DFF] font-bold">
                1. Six-Month Business Survival Calculator
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-orbitron font-bold ${
                  survivalStatus.color === 'emerald'
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-400/40'
                    : survivalStatus.color === 'amber'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
                }`}
              >
                {survivalMonthsCovered.toFixed(1)} / {survivalConfig.targetMonths} Months
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#218DFF]/10 dark:bg-[#03091F]/70 border border-[#218DFF]/30 text-xs font-semibold">
              {survivalStatus.label}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MoneyInput
                id="farm-cap"
                label="Available Operating Capital"
                value={survivalConfig.availableOperatingCapital}
                onChange={(v) =>
                  setSurvivalConfig({ ...survivalConfig, availableOperatingCapital: Number(v) || 0 })
                }
                language={language}
              />
              <MoneyInput
                id="farm-feed"
                label="Monthly Feed Requirement"
                value={survivalConfig.monthlyFeedCost}
                onChange={(v) =>
                  setSurvivalConfig({ ...survivalConfig, monthlyFeedCost: Number(v) || 0 })
                }
                language={language}
              />
              <MoneyInput
                id="farm-sal"
                label="Monthly Employee Salaries"
                value={survivalConfig.monthlySalaries}
                onChange={(v) =>
                  setSurvivalConfig({ ...survivalConfig, monthlySalaries: Number(v) || 0 })
                }
                language={language}
              />
              <MoneyInput
                id="farm-vet"
                label="Monthly Veterinary & Emergency"
                value={survivalConfig.monthlyVet + survivalConfig.monthlyEmergencyBuffer}
                onChange={(v) =>
                  setSurvivalConfig({
                    ...survivalConfig,
                    monthlyVet: Math.round((Number(v) || 0) * 0.6),
                    monthlyEmergencyBuffer: Math.round((Number(v) || 0) * 0.4)
                  })
                }
                language={language}
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#03091F]/80 border border-blue-200/60 dark:border-[#9EDCFF]/20 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Total Monthly Farm Operating Burn:</span>
                <strong>{formatRWF(monthlyOperatingTotal, hideFinancials)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Required {survivalConfig.targetMonths}-Month Safety Reserve:</span>
                <strong className="text-[#218DFF]">
                  {formatRWF(requiredSixMonthCapital, hideFinancials)}
                </strong>
              </div>
              {survivalConfig.availableOperatingCapital < requiredSixMonthCapital ? (
                <p className="text-rose-500 font-medium pt-1">
                  Shortage of{' '}
                  {formatRWF(
                    requiredSixMonthCapital - survivalConfig.availableOperatingCapital,
                    hideFinancials
                  )}
                  . Recommendation: Build feed &amp; operating reserves before purchasing new animals.
                </p>
              ) : (
                <p className="text-emerald-500 font-medium pt-1">
                  Surplus of{' '}
                  {formatRWF(
                    survivalConfig.availableOperatingCapital - requiredSixMonthCapital,
                    hideFinancials
                  )}{' '}
                  above your 6-month zero-revenue threshold.
                </p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: INTELLIGENT FEED MANAGEMENT */}
        {enabledWidgets.feedForecast && (
          <div className="lg:col-span-6 sapphire-analytics-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron uppercase text-[#218DFF] font-bold">
                3. Intelligent Feed Management &amp; Run-Out Predictor
              </span>
              <Wheat className="w-5 h-5 text-[#218DFF]" />
            </div>

            <div className="space-y-3">
              {feeds.map((fd, idx) => {
                const pricePerKg = fd.totalKg > 0 ? Math.round(fd.totalCostRWF / fd.totalKg) : 0
                const estDays = fd.dailyConsumptionKg > 0 ? fd.totalKg / fd.dailyConsumptionKg : 0
                const isLow = estDays <= 14
                return (
                  <div
                    key={fd.id}
                    className="p-4 rounded-2xl bg-white/80 dark:bg-[#03091F]/75 border border-blue-200/70 dark:border-[#9EDCFF]/25 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-orbitron text-sm text-[#071544] dark:text-white">
                        {fd.name}
                      </strong>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-orbitron font-bold ${
                          isLow
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        Lasts {estDays.toFixed(1)} Days
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-[#218DFF]/10">
                        <span className="block text-[10px] opacity-75">Quantity &amp; Price</span>
                        <strong>
                          {fd.totalKg} kg = {formatRWF(fd.totalCostRWF, hideFinancials)}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#218DFF]/10">
                        <span className="block text-[10px] opacity-75">Price per Kg</span>
                        <strong>{formatRWF(pricePerKg, hideFinancials)} / kg</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#218DFF]/10">
                        <span className="block text-[10px] opacity-75">Daily Intake</span>
                        <strong>{fd.dailyConsumptionKg} kg / day</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <span>Stage: {fd.stage} · Supp: {fd.supplement}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFeeds((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    totalKg: Math.max(0, item.totalKg - item.dailyConsumptionKg)
                                  }
                                : item
                            )
                          )
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/35 text-[#1045CA] dark:text-[#9EDCFF] font-semibold cursor-pointer"
                      >
                        Deduct Today&apos;s {fd.dailyConsumptionKg} kg Ration
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4 & 5: LIVESTOCK INVESTMENT INTELLIGENCE & SMART BREEDING READINESS */}
      {enabledWidgets.livestock && (
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                4. Livestock Investment Intelligence &amp; 5. Smart Breeding Readiness Check
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Distinguishes Existing, Purchased, Born, and Trading animals by purpose (Breeding, Fattening, Resale, Production) and verifies age &amp; weight before approving breeding plans.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {animals.map((an) => (
              <div
                key={an.id}
                className="p-4 rounded-2xl bg-white/80 dark:bg-[#071544]/75 border border-blue-200/70 dark:border-[#9EDCFF]/25 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-orbitron uppercase px-2 py-0.5 rounded bg-[#218DFF]/20 text-[#1045CA] dark:text-[#9EDCFF]">
                      {an.origin} · Purpose: {an.purpose}
                    </span>
                    <h4 className="font-orbitron text-sm font-bold text-[#071544] dark:text-white mt-1">
                      {an.tag}
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-orbitron font-bold ${
                      an.readyToBreed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {an.readyToBreed ? '✓ Breeding Ready' : 'Readiness Check Active'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] opacity-70 block">Age &amp; Weight</span>
                    <strong>
                      {an.ageMonths} mos · {an.weightKg} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-70 block">Acquisition Cost</span>
                    <strong>{formatRWF(an.acquisitionCost, hideFinancials)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-70 block">Total Invested Cost</span>
                    <strong>
                      {formatRWF(
                        an.acquisitionCost + an.feedAndVetAccumulated,
                        hideFinancials
                      )}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#03091F]/10 dark:bg-[#03091F]/60 text-xs text-[#1045CA] dark:text-[#9EDCFF]">
                  {an.pregnancyStatus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6, 7 & 8: PIG TRADING PROFIT, SMART CASH FLOW SIMULATOR & EXPANSION INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {enabledWidgets.tradingProfit && (
          <div className="lg:col-span-6 sapphire-analytics-card p-6 space-y-4">
            <span className="text-xs font-orbitron uppercase text-[#218DFF] font-bold">
              6. Pig Trading Intelligence &amp; 7. Zero-Revenue Simulator
            </span>
            <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
              Trading Profit = Selling Price − Total Associated Costs
            </h3>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#03091F]/70 border border-[#9EDCFF]/25 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Trading Batch (4 Resale Pigs) Selling Price:</span>
                <strong className="text-emerald-500">
                  {formatRWF(1120000, hideFinancials)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Purchase (680k) + Feed (140k) + Transport (30k):</span>
                <strong className="text-rose-400">
                  −{formatRWF(850000, hideFinancials)}
                </strong>
              </div>
              <div className="pt-2 border-t border-[#9EDCFF]/20 flex justify-between text-sm font-orbitron">
                <span>Net Trading Profit (Tracked Separately):</span>
                <strong className="text-[#218DFF]">
                  +{formatRWF(270000, hideFinancials)}
                </strong>
              </div>
            </div>

            {/* Section 7 Cash Flow Stress Test */}
            <div className="p-4 rounded-2xl bg-[#218DFF]/10 dark:bg-[#03091F]/80 border border-[#218DFF]/30 space-y-2">
              <div className="font-orbitron text-xs font-bold text-[#1045CA] dark:text-[#9EDCFF]">
                7. &ldquo;Can my farm continue operating if no money comes in?&rdquo;
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Stress Test: 6 months zero sales + {simStress.feedPriceIncreasePct}% feed price spike +{' '}
                {formatRWF(simStress.unexpectedVetRWF, hideFinancials)} unexpected vet costs:
              </p>
              <div className="font-orbitron text-sm font-bold text-amber-400">
                Stressed Survival Coverage:{' '}
                {(
                  (survivalConfig.availableOperatingCapital - simStress.unexpectedVetRWF) /
                  (monthlyOperatingTotal +
                    (survivalConfig.monthlyFeedCost * simStress.feedPriceIncreasePct) / 100)
                ).toFixed(1)}{' '}
                Months
              </div>
            </div>
          </div>
        )}

        {enabledWidgets.expansion && (
          <div className="lg:col-span-6 sapphire-analytics-card p-6 space-y-4">
            <span className="text-xs font-orbitron uppercase text-[#218DFF] font-bold">
              8. Business Expansion Intelligence
            </span>
            <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
              Evaluate Before Expanding Livestock
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-[#9EDCFF]">
                  Additional Pigs to Purchase
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={expansionPigs}
                  onChange={(e) => setExpansionPigs(Number(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#071544] border border-[#9EDCFF]/30 font-orbitron font-bold text-sm"
                />
              </div>
              <MoneyInput
                id="exp-pig-cost"
                label="Purchase Cost per Animal"
                value={costPerExtraPig}
                onChange={(v) => setCostPerExtraPig(Number(v) || 0)}
                language={language}
              />
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs sm:text-sm leading-relaxed text-[#071544] dark:text-amber-200">
              <strong className="block font-orbitron text-xs uppercase mb-1">
                ExBOS Expansion Recommendation:
              </strong>
              &ldquo;Purchasing {expansionPigs} additional pigs ({formatRWF(extraPurchaseCost, hideFinancials)}) plus their feed &amp; veterinary requirements would reduce your financial survival coverage from{' '}
              <strong>{survivalMonthsCovered.toFixed(1)} months</strong> to{' '}
              <strong>{monthsAfterExpansion.toFixed(1)} months</strong>. Consider delaying the purchase or increasing operating capital.&rdquo;
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2, 9 & 10: SMART BUDGET CLASSIFICATION, INFRASTRUCTURE & CIRCULAR AGUKA FARM MODEL */}
      {enabledWidgets.smartBudget && (
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
            2. Smart Budget Classification &amp; 9. Farm Infrastructure Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {budgetItems.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-white/75 dark:bg-[#071544]/75 border border-blue-200/60 dark:border-[#9EDCFF]/20 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-orbitron uppercase px-2 py-0.5 rounded bg-[#218DFF]/20 text-[#1045CA] dark:text-[#9EDCFF]">
                    {b.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-500">{b.status}</span>
                </div>
                <strong className="block text-xs sm:text-sm text-[#071544] dark:text-white">
                  {b.title}
                </strong>
                <div className="font-orbitron text-base font-extrabold text-[#218DFF]">
                  {b.amount > 0 ? formatRWF(b.amount, hideFinancials) : 'Pending Confirmation'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-300">{b.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {enabledWidgets.circularAguka && (
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-orbitron uppercase text-[#218DFF] font-bold">
                10. Circular Business Growth · AGUKA FARM Model
              </span>
              <h3 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                Crop Purchasing → Feed Production → Pig Farming → Meat Sales → Reinvestment
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-semibold">
              Internal Transfers Excluded from Double-Counting
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { step: '01. Crop Purchasing', rev: 'Internal Input', cost: '420,000 RWF', note: 'Maize & soya sourced from local growers' },
              { step: '02. Feed Production', rev: '680,000 RWF', cost: '490,000 RWF', note: 'Supplies farm + external farmer feed sales' },
              { step: '03. Pig Farming', rev: '1,950,000 RWF', cost: '1,120,000 RWF', note: 'Breeding & fattening batches' },
              { step: '04. Organic Fertilizer', rev: '240,000 RWF', cost: '45,000 RWF', note: 'Manure composted for crop farms' },
              { step: '05. Net Consolidated', rev: '2,870,000 RWF', cost: '1,655,000 RWF', note: 'Net Profit: +1,215,000 RWF reinvested' }
            ].map((node) => (
              <div
                key={node.step}
                className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#071544]/80 border border-[#9EDCFF]/25 space-y-1"
              >
                <div className="font-orbitron text-xs font-bold text-[#218DFF]">{node.step}</div>
                <div className="text-xs font-semibold">Revenue: {node.rev}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-300">Cost: {node.cost}</div>
                <p className="text-[11px] text-slate-500 dark:text-[#9EDCFF]/80 pt-1">{node.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

