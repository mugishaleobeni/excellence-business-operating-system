import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Receipt,
  CreditCard,
  TrendingUp,
  Package,
  AlertTriangle,
  XCircle,
  Users,
  UserCheck,
  UserPlus,
  Award,
  DollarSign,
  Clock,
  Layers,
  Info,
  X,
  ChevronDown,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { formatRWF } from "../../../utils/currencyWords";

/**
 * MetricCard with In-Card Explanation Overlay on Hover/Click
 * Prevents any external clipping or overflow issues by rendering cleanly inside the card boundaries.
 */
function MetricCard({
  title,
  value,
  subtitle,
  meaning,
  icon: Icon,
  colorScheme = "sapphire", // 'sapphire' | 'emerald' | 'amber' | 'rose' | 'purple'
  hideFinancials = false,
  isCurrency = false
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  const colorMap = {
    sapphire: {
      border: "hover:border-[#218DFF]/50",
      badge: "bg-[#218DFF]/15 text-[#9EDCFF] border border-[#218DFF]/30",
      accent: "text-[#9EDCFF]",
      topLine: "via-[#218DFF]/50"
    },
    emerald: {
      border: "hover:border-emerald-500/50",
      badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      accent: "text-emerald-400",
      topLine: "via-emerald-500/50"
    },
    amber: {
      border: "hover:border-amber-500/50",
      badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
      accent: "text-amber-400",
      topLine: "via-amber-500/50"
    },
    rose: {
      border: "hover:border-rose-500/50",
      badge: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
      accent: "text-rose-400",
      topLine: "via-rose-500/50"
    },
    purple: {
      border: "hover:border-purple-500/50",
      badge: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
      accent: "text-purple-300",
      topLine: "via-purple-500/50"
    }
  };

  const c = colorMap[colorScheme] || colorMap.sapphire;
  const displayValue = isCurrency && hideFinancials ? "••••••••" : value;

  return (
    <div
      className={`relative exbos-glass-card p-4 sm:p-5 rounded-2xl border border-white/10 ${c.border} transition-all duration-200 overflow-hidden shadow-lg hover:shadow-2xl flex flex-col justify-between min-h-[128px]`}
    >
      {/* Top micro gradient line */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent ${c.topLine} to-transparent pointer-events-none`}
      />

      {/* Normal Metric Display */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.badge}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
            <span
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300 truncate"
              title={title}
            >
              {title}
            </span>
          </div>

          {/* Interactive Info Trigger (Hover or Click) */}
          <button
            type="button"
            aria-label={`Learn what ${title} means`}
            onMouseEnter={() => setShowExplanation(true)}
            onClick={(e) => {
              e.stopPropagation();
              setShowExplanation(!showExplanation);
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
              showExplanation
                ? "bg-[#218DFF] text-white shadow-md shadow-[#218DFF]/40"
                : "text-slate-400 hover:text-[#9EDCFF] hover:bg-white/10"
            }`}
            title="Hover or click to view what this metric means"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2">
          <div className="font-orbitron font-extrabold text-xl sm:text-2xl text-white tracking-tight truncate tabular-nums">
            {displayValue}
          </div>
          {subtitle && (
            <div className="text-[11px] text-slate-400 font-medium mt-1 truncate leading-normal">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* In-Card Explanation Overlay on Hover/Click */}
      {showExplanation && (
        <div
          className="absolute inset-0 p-4 rounded-2xl bg-[#040C26]/98 border-2 border-[#218DFF]/70 flex flex-col justify-between backdrop-blur-xl shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setShowExplanation(false)}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[11px] font-bold text-[#9EDCFF] flex items-center gap-1.5 uppercase tracking-wider truncate">
              <Info className="w-3.5 h-3.5 text-[#218DFF] shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
              title="Close explanation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="my-auto py-1.5">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              What this metric means:
            </div>
            <p className="text-xs text-white leading-relaxed font-medium">
              {meaning}
            </p>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-white/10 pt-1.5">
            <span className="truncate">
              Value: <strong className="text-white">{displayValue}</strong>
            </span>
            <span className="text-[#218DFF] text-[9px] font-bold shrink-0">
              ExBOS Metric
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ModuleKpiCards
 * Displays architecture-tailored professional KPI cards for:
 * 1. Purchases (3 cards)
 * 2. Sales (4 primary + 2 expandable)
 * 3. Products & Stock (4 cards)
 * 4. Customers (4 primary + 2 expandable)
 *
 * Defaults to 4 balanced, responsive cards with "+ Show More Metrics" toggle to preserve layout harmony.
 */
export function ModuleKpiCards({
  activeModule,
  activeArchId,
  recordsMap = {},
  records = [],
  transactions = [],
  hideFinancials = false
}) {
  const [showAllCards, setShowAllCards] = useState(false);

  // Normalize module key
  const isPurchases = activeModule === "Purchases";
  const isSales = activeModule === "Sales";
  const isStock =
    activeModule === "Products" ||
    activeModule === "Products & Stock" ||
    activeModule === "Farm Inventory" ||
    activeModule === "Inventory" ||
    activeModule === "Ingredients & Stock";
  const isCustomers = activeModule === "Customers";
  const isProduction = activeModule === "Production";

  // Data sets
  const purchasesList = useMemo(() => recordsMap["Purchases"] || [], [recordsMap]);
  const salesList = useMemo(() => recordsMap["Sales"] || [], [recordsMap]);
  const inventoryList = useMemo(() => {
    return (recordsMap["Inventory"]?.length ? recordsMap["Inventory"] : recordsMap["Products"]) || [];
  }, [recordsMap]);
  const customersList = useMemo(() => recordsMap["Customers"] || [], [recordsMap]);
  const productionList = useMemo(() => recordsMap["Production"] || [], [recordsMap]);

  // -------------------------------------------------------------
  // 1. PURCHASES METRICS (3 cards)
  // -------------------------------------------------------------
  const purchaseMetrics = useMemo(() => {
    if (!isPurchases) return null;
    let totalPurchasesValue = 0;
    let purchaseExpensesPaid = 0;
    let pendingPaymentsOwed = 0;

    purchasesList.forEach((p) => {
      const total = Number(p.amountRWF) || 0;
      const paid =
        Number(
          p.paidAmountRWF ??
            (p.paymentStatus === "Paid in Full" || p.paymentStatus === "Paid" ? total : 0)
        ) || 0;
      const remaining =
        Number(p.remainingAmountRWF ?? Math.max(0, total - paid)) || 0;

      totalPurchasesValue += total;
      purchaseExpensesPaid += paid;
      pendingPaymentsOwed += remaining;
    });

    const paidPct =
      totalPurchasesValue > 0
        ? Math.round((purchaseExpensesPaid / totalPurchasesValue) * 100)
        : 0;
    const pendingPct =
      totalPurchasesValue > 0
        ? Math.round((pendingPaymentsOwed / totalPurchasesValue) * 100)
        : 0;

    return [
      {
        id: "total-purchases",
        title: "Total Purchases",
        value: formatRWF(totalPurchasesValue),
        subtitle: `${purchasesList.length} total purchase orders`,
        meaning: "Total monetary value of all goods, materials, and feed ordered from suppliers.",
        icon: Receipt,
        colorScheme: "sapphire",
        isCurrency: true
      },
      {
        id: "purchase-expenses",
        title: "Purchase Expenses",
        value: formatRWF(purchaseExpensesPaid),
        subtitle: `${paidPct}% of total orders paid`,
        meaning: "Actual money paid out to suppliers to date via cash, bank, or mobile money.",
        icon: CreditCard,
        colorScheme: "emerald",
        isCurrency: true
      },
      {
        id: "pending-payments",
        title: "Pending Payments",
        value: formatRWF(pendingPaymentsOwed),
        subtitle:
          pendingPaymentsOwed > 0
            ? `${pendingPct}% awaiting disbursement`
            : "All supplier bills cleared",
        meaning: "Amount still owed to suppliers for unpaid or part-paid purchase invoices.",
        icon: Clock,
        colorScheme: pendingPaymentsOwed > 0 ? "amber" : "sapphire",
        isCurrency: true
      }
    ];
  }, [isPurchases, purchasesList]);

  // -------------------------------------------------------------
  // 2. SALES METRICS (6 cards: 4 primary + 2 expandable)
  // -------------------------------------------------------------
  const salesMetrics = useMemo(() => {
    if (!isSales) return null;
    let totalSalesValue = 0;
    let totalRevenueCollected = 0;
    let totalTransactionsCount = salesList.length;
    let outstandingCustomerDebt = 0;
    let totalUnitsSold = 0;

    salesList.forEach((s) => {
      const amt = Number(s.amountRWF) || 0;
      const isPaid = s.status === "Paid in Full" || s.status === "Paid";
      const isCredit =
        s.status === "Credit" || s.status === "Unpaid" || s.status === "Pending";
      const paidAmt = Number(s.paidAmountRWF ?? (isPaid ? amt : 0)) || 0;
      const debtAmt =
        Number(s.remainingAmountRWF ?? (isCredit ? amt : Math.max(0, amt - paidAmt))) || 0;
      const qty = Number(s.quantity) || 1;

      totalSalesValue += amt;
      totalRevenueCollected += isPaid ? amt : paidAmt;
      outstandingCustomerDebt += debtAmt;
      totalUnitsSold += qty;
    });

    const averageSaleValue =
      totalTransactionsCount > 0
        ? Math.round(totalSalesValue / totalTransactionsCount)
        : 0;
    const collectionRate =
      totalSalesValue > 0
        ? Math.round((totalRevenueCollected / totalSalesValue) * 100)
        : 100;

    return [
      {
        id: "total-sales",
        title: "Total Sales",
        value: formatRWF(totalSalesValue),
        subtitle: "Cumulative gross sales",
        meaning: "Total gross monetary value of all recorded sales transactions.",
        icon: TrendingUp,
        colorScheme: "sapphire",
        isCurrency: true
      },
      {
        id: "revenue-collected",
        title: "Total Revenue Collected",
        value: formatRWF(totalRevenueCollected),
        subtitle: `${collectionRate}% cash collection rate`,
        meaning: "Money received from customers in cash, mobile money, or bank deposits.",
        icon: DollarSign,
        colorScheme: "emerald",
        isCurrency: true
      },
      {
        id: "total-transactions",
        title: "Total Transactions",
        value: totalTransactionsCount,
        subtitle: "Completed sales orders",
        meaning: "Number of completed sales transactions logged into the ledger.",
        icon: CheckCircle2,
        colorScheme: "purple",
        isCurrency: false
      },
      {
        id: "outstanding-payments",
        title: "Outstanding Payments",
        value: formatRWF(outstandingCustomerDebt),
        subtitle:
          outstandingCustomerDebt > 0
            ? "Receivables awaiting collection"
            : "Zero credit overdue",
        meaning: "Money customers still owe on credit purchases and open balances.",
        icon: AlertTriangle,
        colorScheme: outstandingCustomerDebt > 0 ? "rose" : "sapphire",
        isCurrency: true
      },
      {
        id: "products-sold",
        title: "Products Sold",
        value: `${totalUnitsSold} pcs`,
        subtitle: "Physical item volume sold",
        meaning: "Total quantity of physical products and item units sold to customers.",
        icon: Package,
        colorScheme: "sapphire",
        isCurrency: false
      },
      {
        id: "average-sale",
        title: "Average Sale Value",
        value: formatRWF(averageSaleValue),
        subtitle: "Average spend per order",
        meaning: "Average gross monetary value generated per completed sale transaction.",
        icon: Layers,
        colorScheme: "emerald",
        isCurrency: true
      }
    ];
  }, [isSales, salesList]);

  // -------------------------------------------------------------
  // 3. PRODUCTS & STOCK METRICS (4 cards)
  // -------------------------------------------------------------
  const stockMetrics = useMemo(() => {
    if (!isStock) return null;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    inventoryList.forEach((item) => {
      const qty = Number(item.quantity ?? item.currentStock) || 0;
      const price =
        Number(item.sellingPriceRWF ?? item.unitPriceRWF ?? item.unitCostRWF) || 0;
      const lowThreshold = Number(item.lowStockAlert) || 5;

      totalStockValue += qty * price;
      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= lowThreshold) {
        lowStockCount++;
      }
    });

    return [
      {
        id: "total-products",
        title: "Total Products",
        value: inventoryList.length,
        subtitle: "Active catalog SKUs",
        meaning: "Total number of registered products and items in your catalog.",
        icon: Package,
        colorScheme: "sapphire",
        isCurrency: false
      },
      {
        id: "stock-value",
        title: "Total Stock Value",
        value: formatRWF(totalStockValue),
        subtitle: "Warehouse inventory valuation",
        meaning: "Monetary value of available stock on hand calculated at catalog selling price.",
        icon: DollarSign,
        colorScheme: "emerald",
        isCurrency: true
      },
      {
        id: "low-stock",
        title: "Low Stock",
        value: lowStockCount,
        subtitle:
          lowStockCount > 0
            ? "Items below minimum reorder alert"
            : "All stock at healthy levels",
        meaning: "Products running below minimum stock reorder thresholds.",
        icon: AlertTriangle,
        colorScheme: lowStockCount > 0 ? "amber" : "sapphire",
        isCurrency: false
      },
      {
        id: "out-of-stock",
        title: "Out of Stock",
        value: outOfStockCount,
        subtitle:
          outOfStockCount > 0
            ? "Items completely depleted (0 units)"
            : "Zero depleted stock",
        meaning: "Products with zero stock currently available for customer orders.",
        icon: XCircle,
        colorScheme: outOfStockCount > 0 ? "rose" : "sapphire",
        isCurrency: false
      }
    ];
  }, [isStock, inventoryList]);

  // -------------------------------------------------------------
  // 4. CUSTOMERS METRICS (6 cards: 4 primary + 2 expandable)
  // -------------------------------------------------------------
  const customerMetrics = useMemo(() => {
    if (!isCustomers) return null;
    const customerSpendMap = {};
    const customerOrdersCount = {};

    salesList.forEach((s) => {
      const custName = (s.customerName || s.customer || s.party || "").trim();
      if (!custName || custName === "Direct Client" || custName === "Walk-in Client")
        return;
      customerSpendMap[custName] =
        (customerSpendMap[custName] || 0) + (Number(s.amountRWF) || 0);
      customerOrdersCount[custName] = (customerOrdersCount[custName] || 0) + 1;
    });

    let topCustomerName = "None yet";
    let topCustomerValue = 0;
    Object.entries(customerSpendMap).forEach(([name, spend]) => {
      if (spend > topCustomerValue) {
        topCustomerValue = spend;
        topCustomerName = name;
      }
    });

    let activeCustomersCount = 0;
    let returningCustomersCount = 0;
    let totalCustomerDebts = 0;

    customersList.forEach((c) => {
      const cName = (c.title || c.name || "").trim();
      const debt = Number(c.balanceOwedRWF ?? c.amountRWF ?? c.debtRWF) || 0;
      if (debt > 0) totalCustomerDebts += debt;

      const orders = customerOrdersCount[cName] || 0;
      if (orders > 0 || c.status === "Active") {
        activeCustomersCount++;
      }
      if (orders >= 2) {
        returningCustomersCount++;
      }
    });

    if (activeCustomersCount === 0 && Object.keys(customerSpendMap).length > 0) {
      activeCustomersCount = Object.keys(customerSpendMap).length;
    }

    const newCustomersCount =
      customersList.filter(
        (c) => c.isNew || c.status === "New" || c.status === "Active"
      ).length || customersList.length;

    return [
      {
        id: "total-customers",
        title: "Total Customers",
        value: customersList.length,
        subtitle: "Registered client profiles",
        meaning: "Total number of registered customers in your database directory.",
        icon: Users,
        colorScheme: "sapphire",
        isCurrency: false
      },
      {
        id: "active-customers",
        title: "Active Customers",
        value: activeCustomersCount,
        subtitle: "Purchased in this period",
        meaning: "Customers who actively completed purchase transactions in this period.",
        icon: UserCheck,
        colorScheme: "emerald",
        isCurrency: false
      },
      {
        id: "new-customers",
        title: "New Customers",
        value: newCustomersCount,
        subtitle: "Newly registered accounts",
        meaning: "Customers registered during the recent business cycle.",
        icon: UserPlus,
        colorScheme: "purple",
        isCurrency: false
      },
      {
        id: "customer-debts",
        title: "Customer Debts",
        value: formatRWF(totalCustomerDebts),
        subtitle:
          totalCustomerDebts > 0
            ? "Total open credit balance"
            : "No customer debt outstanding",
        meaning: "Total outstanding customer balances and credit owed to your business.",
        icon: AlertTriangle,
        colorScheme: totalCustomerDebts > 0 ? "rose" : "sapphire",
        isCurrency: true
      },
      {
        id: "returning-customers",
        title: "Returning Customers",
        value: returningCustomersCount,
        subtitle: "Clients with 2+ purchases",
        meaning: "Customers who made repeat purchases indicating customer retention.",
        icon: RefreshCw,
        colorScheme: "sapphire",
        isCurrency: false
      },
      {
        id: "top-customer",
        title: "Top Customer",
        value: topCustomerName,
        subtitle:
          topCustomerValue > 0
            ? `${formatRWF(topCustomerValue)} total spend`
            : "Highest spending buyer",
        meaning: "Customer with the highest purchase value ranked by cumulative spend.",
        icon: Award,
        colorScheme: "emerald",
        isCurrency: false
      }
    ];
  }, [isCustomers, customersList, salesList]);

  // -------------------------------------------------------------
  // 5. PRODUCTION METRICS (4 primary + 2 expandable)
  // -------------------------------------------------------------
  const productionMetrics = useMemo(() => {
    if (!isProduction) return [];

    const planned = productionList.filter((o) => o.status === "Planned");
    const inProgress = productionList.filter((o) => o.status === "In Progress");
    const completed = productionList.filter(
      (o) => o.status === "Completed" || (o.status && o.status.includes("Complete"))
    );

    const plannedUnits = planned.reduce((s, o) => s + (Number(o.plannedQuantity ?? o.quantity) || 0), 0);
    const activeUnits = inProgress.reduce((s, o) => s + (Number(o.plannedQuantity ?? o.quantity) || 0), 0);
    const completedUnits = completed.reduce(
      (s, o) => s + (Number(o.actualQuantity ?? o.plannedQuantity ?? o.quantity) || 0),
      0
    );

    const totalProdCost = completed.reduce(
      (s, o) => s + (Number(o.totalProductionCostRWF ?? o.amountRWF) || 0),
      0
    );

    const avgUnitCost = completedUnits > 0 ? Math.round(totalProdCost / completedUnits) : 0;

    return [
      {
        id: "planned-production",
        title: "Planned Batches",
        value: `${planned.length} Orders`,
        subtitle: `${plannedUnits} units scheduled`,
        meaning: "Production orders scheduled but not yet started.",
        icon: Clock,
        colorScheme: "amber",
        isCurrency: false
      },
      {
        id: "in-progress-production",
        title: "Active In Progress",
        value: `${inProgress.length} Batches`,
        subtitle: `${activeUnits} units manufacturing`,
        meaning: "Manufacturing batches currently running on the workshop floor.",
        icon: TrendingUp,
        colorScheme: "sapphire",
        isCurrency: false
      },
      {
        id: "completed-batches",
        title: "Completed Batches",
        value: `${completed.length} Batches`,
        subtitle: `${completedUnits} finished units yielded`,
        meaning: "Successfully completed production runs with goods added to inventory.",
        icon: CheckCircle2,
        colorScheme: "emerald",
        isCurrency: false
      },
      {
        id: "total-prod-cost",
        title: "Total Production Cost",
        value: totalProdCost,
        subtitle: "Materials, labor & overhead",
        meaning: "Cumulative manufacturing cost of all completed production runs.",
        icon: DollarSign,
        colorScheme: "purple",
        isCurrency: true
      },
      {
        id: "units-produced",
        title: "Usable Units Produced",
        value: `${completedUnits} units`,
        subtitle: "Available for commercial sale",
        meaning: "Total verified good units produced across all completed batches.",
        icon: Package,
        colorScheme: "emerald",
        isCurrency: false
      },
      {
        id: "avg-unit-cost",
        title: "Average Cost per Unit",
        value: avgUnitCost,
        subtitle: "Weighted cost per usable unit",
        meaning: "Average total manufacturing expense required to produce one sellable unit.",
        icon: TrendingUp,
        colorScheme: "sapphire",
        isCurrency: true
      }
    ];
  }, [isProduction, productionList]);

  // Determine active metrics array
  const activeMetricsList =
    (isPurchases && purchaseMetrics) ||
    (isSales && salesMetrics) ||
    (isStock && stockMetrics) ||
    (isCustomers && customerMetrics) ||
    (isProduction && productionMetrics) ||
    null;

  if (!activeMetricsList || activeMetricsList.length === 0) {
    return null;
  }

  // Cap at 4 cards unless user clicked "Show More"
  const hasMoreCards = activeMetricsList.length > 4;
  const displayedCards =
    hasMoreCards && !showAllCards
      ? activeMetricsList.slice(0, 4)
      : activeMetricsList;

  // Grid columns class based on card count
  const gridColsClass =
    isPurchases && activeMetricsList.length === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Header bar with optional "+ Show More Metrics" toggle */}
      {hasMoreCards && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {activeModule} Key Metrics
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#218DFF]/15 text-[#9EDCFF] border border-[#218DFF]/30">
              {displayedCards.length} of {activeMetricsList.length} shown
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllCards(!showAllCards)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#218DFF]/40 text-xs font-semibold text-[#9EDCFF] hover:text-white transition-all cursor-pointer shadow-sm group"
          >
            <span>
              {showAllCards
                ? "Show Primary 4 Metrics"
                : `+ Show ${activeMetricsList.length - 4} More (${activeMetricsList
                    .slice(4)
                    .map((c) => c.title)
                    .join(", ")})`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#218DFF] transition-transform duration-200 ${
                showAllCards ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}

      {/* Responsive 4-Column Card Grid */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {displayedCards.map((card) => (
          <MetricCard
            key={card.id}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            meaning={card.meaning}
            icon={card.icon}
            colorScheme={card.colorScheme}
            isCurrency={card.isCurrency}
            hideFinancials={hideFinancials}
          />
        ))}
      </div>
    </div>
  );
}

export default ModuleKpiCards;
