# EXCELLENCE BOS — Dashboard Navigation & UX Architecture Proposal

**Document Version:** 1.0.0  
**Date:** November 2026  
**Status:** Approved for Implementation  
**Target File:** `docs/dashboard-navigation-proposal.md`

---

## 1. Vision & Core Design Principles

The primary objective of this proposal is to transform ExBOS into an **exceptionally intuitive, responsive, and predictable platform** for African enterprise operators—from small Kigali grocery store owners and salon operators to commercial bakeries and circular livestock farms.

The redesign is governed by eight fundamental navigation principles:

1. **Simplicity:**  
   The primary navigation rail must not overwhelm the user. Every primary module icon must be immediately recognizable. Primary modules are strictly capped at **7 to 9 modules per architecture** so the navigation rail never scrolls vertically on standard laptop screens (1366×768 and 1080p).
2. **Architecture Awareness:**  
   The platform adapts dynamically to the business architecture selected by the user during onboarding (`buy-and-sell`, `make-and-sell`, `services`, `agriculture`, `food-and-hospitality`, `hybrid`). Irrelevant modules are excluded.
3. **Consistency:**  
   Universal business operations—Sales, Purchases, Expenses, Customers, Suppliers, Reports, and Settings—follow the exact same navigation patterns, table designs, action button layouts, and modal behaviors across all architectures.
4. **Contextual Subnavigation:**  
   Panel B (middle sidebar) exclusively presents the subpages belonging to the active primary module. It provides clear numbered pills (`01`, `02`, `03`) with high-contrast active states.
5. **Predictable Workspace:**  
   Clicking any subnavigation item always displays a concrete, meaningful workspace in Panel C. No subpage should ever render an empty generic fallback table with misleading titles.
6. **Frictionless Task Completion:**  
   High-frequency daily tasks (recording a sale, recording an expense, registering a customer, restocking inventory) require at most **two clicks** from anywhere in the application.
7. **Component Reusability:**  
   Preserve and maximize the reuse of existing battle-tested components: `UniversalModuleTable`, `SalesTrendsView`, `UnpaidPurchasesView`, `PurchaseReturnsView`, `WhereIsMyMoneyPanel`, `FarmingEnhancementsPanel`, and `DocumentsAndIntegrationsPanel`.
8. **Clear Navigation & URL State:**  
   Users must always know where they are. Breadcrumbs in Panel C match `EXCELLENCE BOS / Architecture / Module / Subpage`, and URL query parameters synchronize bidirectionally (`?arch=...&module=...&page=...`) to survive browser refreshes.

---

## 2. Streamlined Navigation Architecture by Business Type

### 2.1 Architecture 01: Make & Sell (Manufacturing & Bakeries)

*Eliminated rail clutter by grouping raw materials and recipes under `Production & Inventory`.*

- **Primary Rail Modules (8):**
  1. `Overview` (Icon: `LayoutDashboard`)
  2. `Production` (Icon: `Factory`)
  3. `Products` (Icon: `Package`)
  4. `Sales` (Icon: `ShoppingBag`)
  5. `Purchases` (Icon: `Truck`)
  6. `Customers` (Icon: `Users`)
  7. `Suppliers` (Icon: `Truck`)
  8. `Expenses` (Icon: `TrendingDown`)
  9. `Reports` (Icon: `BarChart3`)
  10. `Settings` (Icon: `Settings`)

- **Contextual Subnavigation Mapping:**
  - **Overview:**
    - `01 Dashboard` — Executive KPI Cards, Cash Trajectory Curve, Live Executions.
    - `02 Where Is My Money` — Reconciled Cash, MoMo, Bank, and Inventory ledger.
    - `03 Production Alerts` — Batch yield alerts, material reorder warnings, spoilage.
  - **Production:**
    - `01 Batches` — Production run ledger (batch inputs, finished yield, cost/batch).
    - `02 Recipes & Formulas` — Bill of materials, ingredient portions, unit production costs.
    - `03 In Progress` — Active production queue on shop floor.
    - `04 Completed Runs` — Historical batch yield and efficiency analysis.
  - **Products (Finished Goods & Materials):**
    - `01 Finished Goods` — Ready-to-sell products with margin & stock levels.
    - `02 Raw Materials` — Raw ingredient stock (flour, sugar, timber, fabrics).
    - `03 Low Stock Alerts` — Items below reorder threshold.
    - `04 Categories` — Product and material categories.
  - **Sales:**
    - `01 All Sales` — Daily sales ledger with customer and payment method.
    - `02 Sales Trends` — Performance curve (Days/Weeks/Months), profit, units sold.
  - **Purchases:**
    - `01 All Purchases` — Raw material and supply procurement invoices.
    - `02 Unpaid Purchases` — Outstanding supplier payables.
    - `03 Purchase Returns` — Defective material returns to suppliers.
  - **Customers:**
    - `01 Customer Directory` — Wholesale buyers, retailers, client contacts.
    - `02 Outstanding Balances` — Customers with overdue credit balances.
  - **Suppliers:**
    - `01 All Suppliers` — Material vendors, packaging suppliers, millers.
    - `02 Amounts Owed` — Outstanding payables to suppliers.
  - **Expenses:**
    - `01 All Expenses` — Factory rent, worker wages, electricity, equipment repairs.
    - `02 Expense Categories` — Fixed vs variable overhead classification.
  - **Reports:**
    - `01 Production & Yield` — Material input vs finished product output efficiency.
    - `02 Sales & Margins` — Revenue, cost of goods, gross margin per product line.
    - `03 Profit & Loss` — Net profit statement.
    - `04 Cash Movement` — Verified cash flow statement.

---

### 2.2 Architecture 02: Buy & Sell (Retail & Wholesale Trading)

*The flagship commercial trading workflow.*

- **Primary Rail Modules (8):**
  1. `Overview` (Icon: `LayoutDashboard`)
  2. `Products` (Icon: `Package`)
  3. `Sales` (Icon: `ShoppingBag`)
  4. `Purchases` (Icon: `Truck`)
  5. `Customers` (Icon: `Users`)
  6. `Suppliers` (Icon: `Truck`)
  7. `Expenses` (Icon: `TrendingDown`)
  8. `Reports` (Icon: `BarChart3`)
  9. `Settings` (Icon: `Settings`)

- **Contextual Subnavigation Mapping:**
  - **Overview:**
    - `01 Dashboard` — Who Owes You, You Owe, Expenses, Income, Cash Curve.
    - `02 Where Is My Money` — Cash in Till, MoMo Business, Bank BK, Stock on Shelf.
    - `03 Alerts & Dead Stock` — "Money sleeping on shelves" warning system.
  - **Products:**
    - `01 All Products` — Full inventory catalog with barcodes, landed cost, retail price.
    - `02 Low Stock` — Filtered items below safety alert threshold.
    - `03 Categories` — Product category organization and management.
  - **Sales:**
    - `01 All Sales` — Daily sales ledger, unit profits, payment channels.
    - `02 Sales Trends` — Interactive revenue curve, velocity, units sold.
  - **Purchases:**
    - `01 All Purchases` — Supplier purchase orders, restock ledger.
    - `02 Unpaid Purchases` — Supplier invoices pending settlement.
    - `03 Purchase Returns` — Returned damaged goods & credit notes.
  - **Customers:**
    - `01 Customer Directory` — Registered clients, phone, preferred goods.
    - `02 Outstanding Balances` — Filtered ledger of clients with debts.
  - **Suppliers:**
    - `01 All Suppliers` — Registered vendor profiles, locations, phones.
    - `02 Amounts Owed` — Filtered ledger of suppliers with balances owed.
  - **Expenses:**
    - `01 All Expenses` — Rent, transport/moto, loading fees, utilities, taxes.
    - `02 Expense Categories` — Classified operating expense groups.
  - **Reports:**
    - `01 Sales & Margins` — Daily, weekly, and monthly sales summary.
    - `02 Stock Valuation` — Inventory asset value at cost vs retail price.
    - `03 Profit & Loss` — Revenue minus cost of goods minus operating expenses.
    - `04 Cash Movement` — Daily cash, MoMo, and bank reconciliation.
    - `05 Customer Debts` — Aged debtor analysis and collection status.
    - `06 Supplier Debts` — Accounts payable aging schedule.

---

### 2.3 Architecture 03: Service-Based Business (Salons, Repairs, Agencies)

*Eliminated separate 'Payments' and 'Jobs' primary rail modules by nesting under Services and Finance.*

- **Primary Rail Modules (8):**
  1. `Overview` (Icon: `LayoutDashboard`)
  2. `Services` (Icon: `Sparkles`)
  3. `Jobs & Bookings` (Icon: `ClipboardList`)
  4. `Customers` (Icon: `Users`)
  5. `Suppliers` (Icon: `Truck`)
  6. `Expenses` (Icon: `TrendingDown`)
  7. `Reports` (Icon: `BarChart3`)
  8. `Settings` (Icon: `Settings`)

- **Contextual Subnavigation Mapping:**
  - **Overview:**
    - `01 Dashboard` — Revenue, staff productivity, active bookings.
    - `02 Where Is My Money` — Cash in drawer, client deposits, milestone balances.
    - `03 Upcoming Bookings` — Today's client appointment schedule.
  - **Services:**
    - `01 Service Catalogue` — Services list with duration, fee, and consumable costs.
    - `02 Consumables & Supplies` — Shampoos, spare parts, and consumable materials used.
    - `03 Service Categories` — Classification of services offered.
  - **Jobs & Bookings:**
    - `01 All Jobs` — Service tickets with assigned technician/staff, client, and fee.
    - `02 Appointments & Calendar` — Scheduled client bookings.
    - `03 In Progress` — Active service jobs currently underway.
    - `04 Completed & Invoiced` — Delivered jobs with paid vs remaining balance.
  - **Customers:**
    - `01 Customer Directory` — Client contact records and service history.
    - `02 Outstanding Balances` — Clients with unpaid job balances/deposits.
  - **Suppliers:**
    - `01 All Suppliers` — Supply vendors (spare parts, beauty products, tools).
    - `02 Amounts Owed` — Outstanding invoices owed to equipment/parts vendors.
  - **Expenses:**
    - `01 All Expenses` — Shop rent, staff commissions, water, electricity.
    - `02 Expense Categories` — Operating cost categories.
  - **Reports:**
    - `01 Service Revenue` — Earnings breakdown by service type and staff member.
    - `02 Staff Commissions` — Staff productivity and earned commission summary.
    - `03 Profit & Loss` — Net profit after consumables and overhead.
    - `04 Cash Movement` — Till and mobile money reconciliation.

---

### 2.4 Architecture 04: Agriculture & Livestock (Farms, Crops, Pig Breeding, Poultry)

*Crucial Optimization: Consolidated 16 bloated modules into 8 intuitive modules. Unified `Animals`, `Feeding`, `Breeding`, and `Health` into a single powerful `Livestock` module directly connected to `FarmingEnhancementsPanel`.*

- **Primary Rail Modules (8):**
  1. `Overview` (Icon: `LayoutDashboard`)
  2. `Livestock` (Icon: `Activity`)
  3. `Crops & Fields` (Icon: `Wheat`)
  4. `Farm Inventory` (Icon: `Package`)
  5. `Sales` (Icon: `ShoppingBag`)
  6. `Purchases` (Icon: `Truck`)
  7. `Expenses` (Icon: `TrendingDown`)
  8. `Reports` (Icon: `BarChart3`)
  9. `Settings` (Icon: `Settings`)

- **Contextual Subnavigation Mapping:**
  - **Overview:**
    - `01 Dashboard` — Real-time farm financial health & survival status.
    - `02 Where Is My Money` — Cash, MoMo, livestock valuation, safety reserves.
    - `03 6-Month Survival & AI` — Interactive 6-month farm survival calculator (Green/Yellow/Red status) and smart budgeting.
  - **Livestock (Directly Rendering `FarmingEnhancementsPanel`):**
    - `01 Animal Register` — Full livestock count by group (gilts, boars, layers, broilers, dairy cows).
    - `02 Feed Management` — Daily feed intake, stock on hand, and Feed Run-Out Date Forecast.
    - `03 Breeding & Births` — Smart breeding readiness evaluator (age/weight) and expected farrowing/calving calendar.
    - `04 Health & Vet Care` — Vaccinations, deworming, veterinary expense ledger.
    - `05 Trading vs Breeding` — Pig expansion sustainability evaluator (protecting 6-month feed reserves before herd growth).
  - **Crops & Fields:**
    - `01 Field Plots` — Crop plots, acreage, planted varieties.
    - `02 Crop Cycles` — Planting dates, expected harvest schedules.
    - `03 Harvest Records` — Yield harvested per plot.
  - **Farm Inventory:**
    - `01 Farm Inputs` — Seed, fertilizers, veterinary drugs, pesticides.
    - `02 Harvested Stock` — Bagged maize, beans, potatoes stored for market sale.
    - `03 Low Stock Alerts` — Inputs running low.
  - **Sales:**
    - `01 Farm Sales` — Sale of market pigs, eggs, milk, vegetables, produce.
    - `02 Sales Trends` — Seasonal revenue curves and price trends.
  - **Purchases:**
    - `01 Feed & Input Orders` — Feed purchases, breeding stock acquisition, farm tools.
    - `02 Unpaid Purchases` — Outstanding balances owed to feed millers/agrovets.
  - **Expenses:**
    - `01 All Expenses` — Farm labor wages, irrigation, transport to market, vet bills.
    - `02 Smart Budget Classification` — Fixed Capital vs Operating Costs vs 6-Month Safety Budget.
  - **Reports:**
    - `01 Farm Profit & Loss` — Agricultural profit after feed, labor, and mortality.
    - `02 Feed Efficiency & Costs` — Feed conversion ratio and cost per kg of growth.
    - `03 Cash Movement` — Farm cash flow and working capital reserves.

---

### 2.5 Architecture 05: Food & Hospitality (Restaurants, Bistros, Guest Houses)

*Grouped kitchen and front-of-house operations cleanly.*

- **Primary Rail Modules (8):**
  1. `Overview` (Icon: `LayoutDashboard`)
  2. `Restaurant & Bar` (Icon: `UtensilsCrossed`)
  3. `Rooms & Lodging` (Icon: `BedDouble`)
  4. `Ingredients & Stock` (Icon: `Coffee`)
  5. `Purchases` (Icon: `Truck`)
  6. `Suppliers` (Icon: `Truck`)
  7. `Expenses` (Icon: `TrendingDown`)
  8. `Reports` (Icon: `BarChart3`)
  9. `Settings` (Icon: `Settings`)

- **Contextual Subnavigation Mapping:**
  - **Overview:**
    - `01 Dashboard` — Daily covers, room occupancy, gross sales, food cost %.
    - `02 Where Is My Money` — Cash drawer, MoMo pay till, food inventory valuation.
    - `03 Live Kitchen & Rooms` — Quick snapshot of open orders and guest check-ins.
  - **Restaurant & Bar:**
    - `01 Menu Items` — Dishes and drinks with selling price and portion cost.
    - `02 Orders & Kitchen Queue` — Live orders, status (Preparing, Ready, Served).
    - `03 Table Service` — Open table tabs and billing.
  - **Rooms & Lodging:**
    - `01 Rooms Register` — Room directory, pricing, housekeeping status.
    - `02 Reservations & Check-In` — Guest bookings, check-in, check-out dates.
    - `03 Guest Folios` — Consolidated room charges + restaurant billings.
  - **Ingredients & Stock:**
    - `01 Kitchen Ingredients` — Meat, dairy, produce, beverages, dry spices.
    - `02 Low Stock & Waste` — Spoilage tracking and reorder alerts.
  - **Purchases:**
    - `01 Market Purchases` — Wholesale food market runs, beverage distributor orders.
    - `02 Unpaid Purchases` — Outstanding supplier tabs.
  - **Suppliers:**
    - `01 Food & Beverage Vendors` — Butchers, vegetable farmers, bakeries, beverage depots.
    - `02 Amounts Owed` — Outstanding balances owed to suppliers.
  - **Expenses:**
    - `01 All Expenses` — Kitchen gas, chef & waiter salaries, rent, licenses.
    - `02 Expense Categories` — Utility, payroll, and maintenance breakdown.
  - **Reports:**
    - `01 Food Cost & Margins` — Portion margin analysis and kitchen efficiency.
    - `02 Room Occupancy & RevPAR` — Hospitality room revenue analytics.
    - `03 Profit & Loss` — Consolidated hospitality P&L statement.

---

### 2.6 Architecture 06: Hybrid Business (Multi-Activity Enterprises)

*Designed for entrepreneurs operating retail + service + light production.*

- **Primary Rail Modules (8):**
  1. `Overview` (Icon: `LayoutDashboard`)
  2. `Products & Stock` (Icon: `Package`)
  3. `Services & Jobs` (Icon: `Sparkles`)
  4. `Sales` (Icon: `ShoppingBag`)
  5. `Purchases` (Icon: `Truck`)
  6. `Customers` (Icon: `Users`)
  7. `Expenses` (Icon: `TrendingDown`)
  8. `Reports` (Icon: `BarChart3`)
  9. `Settings` (Icon: `Settings`)

- **Contextual Subnavigation Mapping:**
  - **Overview:**
    - `01 Dashboard` — Consolidated revenue across all business activities.
    - `02 Where Is My Money` — Unified Cash, MoMo, and Bank ledger.
    - `03 Activity Summary` — Profit breakdown by retail vs service vs production.
  - **Products & Stock:**
    - `01 All Products` — Retail items with stock counts.
    - `02 Selective Stock Switch` — Configure which items track physical stock vs non-inventory items.
    - `03 Low Stock Alerts` — Reorder warnings.
  - **Services & Jobs:**
    - `01 Service Catalogue` — Repair and service rates.
    - `02 Job Schedule` — Active customer service orders and milestones.
  - **Sales:**
    - `01 All Sales` — Unified sales ledger covering product sales and service receipts.
    - `02 Sales Trends` — Multi-activity revenue trajectory curve.
  - **Purchases:**
    - `01 All Purchases` — Procurement for retail goods and service spare parts.
    - `02 Unpaid Purchases` — Outstanding vendor balances.
  - **Customers:**
    - `01 Customer Directory` — Shared customer database across all activities.
    - `02 Outstanding Balances` — Credit sales and unpaid service invoices.
  - **Expenses:**
    - `01 All Expenses` — Shared overhead (rent, electricity, staff).
    - `02 Categories & Activities` — Allocate expenses to specific business branches.
  - **Reports:**
    - `01 Combined Reports` — Consolidated executive business performance.
    - `02 Profit by Activity` — Direct comparison: Retail profit vs Service profit.
    - `03 Profit & Loss` — Total net enterprise margin.

---

## 3. Navigation Click-Through & Workspace Routing Matrix

To eliminate broken links and ensure predictable rendering, the following routing rules are implemented in `DashboardPage.jsx`:

| Trigger Location | Target Module | Target Subpage | Workspace Component Rendered |
|---|---|---|---|
| Card: *Who Owes You Money* | `Customers` | `Outstanding Balances` | `UniversalModuleTable` (filtered for `balanceOwedRWF > 0`) |
| Card: *You Owe Money* | `Purchases` | `Unpaid Purchases` | `<UnpaidPurchasesView />` |
| Card: *Expenses* | `Expenses` | `All Expenses` | `UniversalModuleTable` (`Expenses` records bucket) |
| Card: *Income* | `Sales` | `All Sales` | `UniversalModuleTable` (`Sales` records bucket) |
| Card: *Spendable Cash* | `Overview` | `Where Is My Money` | `<WhereIsMyMoneyPanel />` |
| Card: *Survival Runway* | `Overview` | `6-Month Survival & AI` | `<FarmingEnhancementsPanel />` (or Survival Calculator) |
| Card: *Stock Value* | `Products` | `All Products` | `UniversalModuleTable` (`Inventory` catalog) |
| Rail: `Livestock` | `Livestock` | Any Livestock subpage | `<FarmingEnhancementsPanel activeSubPage={activePage} />` |
| Rail: `Reports` | `Reports` | Selected report subpage | `<DocumentsAndIntegrationsPanel activePage={activePage} />` with live data table |

---

## 4. Implementation Plan & Safeguards

1. **Safety First:** Keep all existing component code functional; do not break API boundaries or database structure.
2. **Step 1:** Update `architectures.js` navigation configurations to implement the streamlined 8-9 module primary rail.
3. **Step 2:** Fix metric card click-through handlers in `DashboardPage.jsx` to navigate to real, matching subpages.
4. **Step 3:** Wire `FarmingEnhancementsPanel` to the `Livestock` and `Overview -> 6-Month Survival` modules.
5. **Step 4:** Pass `activePage` and `activeArchId` to `DocumentsAndIntegrationsPanel` so Reports subpages render corresponding data tables and preselect matching exports.
6. **Step 5:** Add client-side filtering for `Customers -> Outstanding Balances` (`balanceOwedRWF > 0`) and `Suppliers -> Amounts Owed` (`amountRWF > 0`).
7. **Step 6:** Verify production build with zero errors.