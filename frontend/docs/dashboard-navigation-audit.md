# EXCELLENCE BOS — Dashboard Navigation Audit & UX Inspection

**Document Version:** 1.0.0  
**Inspection Date:** November 2026  
**Auditor:** Antigravity (DeepMind Advanced Agentic Engineering)  
**Scope:** Frontend Navigation Architecture, Subnavigation, State Management, Workspace Routing, and Architecture-Specific Workflows  
**Target File:** `docs/dashboard-navigation-audit.md`

---

## 1. Executive Summary

An exhaustive technical inspection of the **EXCELLENCE BOS** (ExBOS) dashboard frontend was conducted across all six registered business architectures (`make-and-sell`, `buy-and-sell`, `services`, `agriculture`, `food-and-hospitality`, `hybrid`).

ExBOS is built around a distinct three-part dashboard architecture:
1. **Primary Navigation Rail (Panel A):** Leftmost vertical bar featuring module icon buttons and utility controls (Theme toggle, Sidebar expand/collapse).
2. **Contextual Subnavigation Sidebar (Panel B):** Middle sidebar displaying active business identity, architecture badge, numbered subpages for the active module, quick shortcuts, and Super Admin link. Can be expanded, minimized to compact dots, or collapsed entirely.
3. **Main Content Workspace (Panel C):** Rightmost workspace rendering sticky header breadcrumbs, global search, alerts, financial KPIs, SVG trajectory curves, interactive data tables, specialized workflow views, and modal dialogs.

While the design aesthetic (Liquid Sapphire glassmorphism) and core workflows (`Sales`, `Purchases`, `Products`, `Customers`, `Suppliers`, `Where Is My Money?`) are richly implemented, the inspection uncovered **critical navigation inconsistencies, broken click-through handlers, disconnected subnavigation routing, and navigation rail bloat** (up to 16 vertical icon modules in Agriculture) that impede usability for non-technical African business operators.

---

## 2. Dashboard Architecture & Communication Flow

### 2.1 The Three-Panel Layout Model

```
+-------------------------------------------------------------------------------------------------------+
|  PANEL A: RAIL (64px)   |  PANEL B: CONTEXTUAL SIDEBAR (280px)  |  PANEL C: MAIN WORKSPACE (Flex-1)   |
|-------------------------+---------------------------------------+-------------------------------------|
|  [Logo Link -> /]       |  [Window Dots: Close/Min/Max]         |  [Breadcrumbs: BOS / Arch / Module] |
|                         |  [Profile Badge: Jean-Claude (B&S)]   |  [Page Title: H1 font-orbitron]     |
|  (Icons: Mod 1..N)      |  [Architecture Badge: 02 · Buy & Sell]|  [Global Search: Ctrl+S Shortcut]   |
|  - Overview             |                                       |  [Alerts Bell + Signout]            |
|  - Products             |  --- Active Module Subnav ---         |  ---------------------------------  |
|  - Sales                |  [01 All Products           (Active)] |  [Dynamic Content Rendering]:       |
|  - Purchases            |  [02 Low Stock                     ]  |  - Overview KPI Cards + SVG Curve   |
|  - Customers            |  [03 Categories                    ]  |  - Where Is My Money Cash Ledger    |
|  - Suppliers            |                                       |  - Sales Trends Chart Curve         |
|  - Expenses             |  --- Shortcuts ---                    |  - Unpaid Purchases / Returns       |
|  - Reports              |  - Where Is My Money?                 |  - Universal Module Table           |
|  - Documents            |  - Document Explorer                  |  - Modal Forms (Product, Sale, etc) |
|  - Integrations         |  - WhatsApp & Integrations            |                                     |
|  - Settings             |                                       |                                     |
|                         |  [Super Admin Portal Link ->]         |                                     |
|  ---------------------  |  [EXCELLENCE BOS Footer]              |                                     |
|  [Theme Sun/Moon]       |                                       |                                     |
|  [Collapse Rail Button] |                                       |                                     |
+-------------------------------------------------------------------------------------------------------+
```

### 2.2 Navigation State Management & Communication

State is managed primarily within `DashboardPage.jsx` and communicated down via props:

1. **Architecture Selection (`activeArchId`):**
   - Initialized from URL query parameter `?arch=<slug>`, then `user.architectureId`, defaulting to `'buy-and-sell'`.
   - When switching architectures via `handleArchSwitch(newArchId)`:
     ```javascript
     setActiveArchId(newArchId)
     setSearchParams({ arch: newArchId })
     setActiveModule('Overview')
     setActivePage('Dashboard')
     ```
   - **Limitation:** Switching modules or subpages does *not* synchronize with the URL query parameters (e.g. `?module=Sales&page=Sales+Trends`). A browser refresh always resets navigation back to `Overview -> Dashboard`.

2. **Primary Module Selection (`activeModule`):**
   - Governed by `handleModuleClick(mod)`:
     ```javascript
     setActiveModule(mod)
     const firstSub = (navMap[mod] || ['Dashboard'])[0]
     setActivePage(firstSub)
     setMobileSidebarOpen(false)
     ```
   - Dynamically pulls subpages from `currentArch.navigation[activeModule]`.

3. **Subpage Selection (`activePage`):**
   - Updated directly when clicking a subpage pill in Panel B: `setActivePage(p)`.
   - Passed down to `InteractiveModulePanel.jsx` as `activePage`.

4. **Workspace Component Routing in Panel C:**
   Inside `DashboardPage.jsx` (lines 990-1015):
   ```jsx
   {activePage === 'Where Is My Money' || activeModule === 'Finance' ? (
     <WhereIsMyMoneyPanel />
   ) : activeModule === 'Documents' || activeModule === 'Reports' || activeModule === 'Integrations' ? (
     <DocumentsAndIntegrationsPanel mode={activeModule.toLowerCase()} />
   ) : activeArchId === 'agriculture' && (activeModule === 'Production' || activePage === '6-Month Survival & AI') ? (
     <div className="space-y-6">
       <FarmingEnhancementsPanel activeSubPage={activePage} />
       <InteractiveModulePanel ... />
     </div>
   ) : activeModule !== 'Overview' || activePage !== 'Dashboard' ? (
     <InteractiveModulePanel ... />
   ) : (
     /* Overview Dashboard: KPIs, Metric Cards, Financial Trajectory Curve, Executions Table */
   )}
   ```

---

## 3. Comprehensive Inventory of Existing Navigation Modules

Below is the exhaustive audit of every module implemented in the ExBOS codebase across all architectures.

### 3.1 Overview Module
- **Purpose:** Central executive cockpit displaying plain-language financial answers, key balance metrics, real spendable cash, survival runway, and visual performance trajectory.
- **Available Subnavigation (by architecture):**
  - *Buy & Sell:* `['Dashboard', 'Where Is My Money', 'Alerts & Dead Stock']`
  - *Make & Sell:* `['Dashboard', 'Where Is My Money', 'Production Alerts']`
  - *Service-Based:* `['Dashboard', 'Where Is My Money', 'Upcoming Bookings']`
  - *Agriculture:* `['Dashboard', 'Where Is My Money', '6-Month Survival & AI']`
  - *Food & Hospitality:* `['Dashboard', 'Where Is My Money', 'Live Kitchen & Rooms']`
  - *Hybrid:* `['Dashboard', 'Where Is My Money', 'Activity Summary']`
- **Main Workspace Content:**
  - 4 customizable KPI metric cards (*Who Owes You Money*, *You Owe Money*, *Expenses*, *Income* + extensible to *Spendable Cash*, *Survival Runway*, *Net Profit*, *Stock Value*).
  - SVG *Cash Performance Curve* with Days, Weeks, Months switcher, interactive hover tooltip with income, expense, and net margin breakdown.
  - *Manage Cards* modal dialog.
  - *Record Live Workflow Entry* modal dialog.
  - *Executions* transaction history table.
- **Available User Actions:**
  - View financial metrics, toggle hide/show financials, switch timeframes (Days, Weeks, Months), hover curve points, click metric cards to navigate to ledgers, record instant transactions, manage visible overview cards.
- **Rendering Components:** `DashboardPage.jsx`, `WhereIsMyMoneyPanel.jsx`, `FarmingEnhancementsPanel.jsx`.
- **Implementation Status:** **Implemented & Fully Functional**.
- **Existing Limitations:**
  - Metric card bottom links have hardcoded navigation targets that do not match subnavigation items (e.g. `setActivePage('Customer Balances')` instead of `'Outstanding Balances'`).
  - Selecting subpage 3 (`Alerts & Dead Stock`, `Production Alerts`, `Upcoming Bookings`, `Live Kitchen & Rooms`, `Activity Summary`) falls through to `InteractiveModulePanel` which displays empty or generic table records rather than a dedicated alerts view.

---

### 3.2 Products / Stock / Inventory / Materials
- **Purpose:** Inventory catalog, unit cost, selling price, low-stock alerts, barcodes, category grouping, and stock movements.
- **Module Names in Architectures:**
  - `Products` (Buy & Sell, Make & Sell, Hybrid)
  - `Materials` (Make & Sell)
  - `Inventory` (Agriculture)
  - `Ingredients` (Food & Hospitality)
- **Available Subnavigation:**
  - *Buy & Sell (Products):* `['All Products', 'Low Stock', 'Categories']`
  - *Make & Sell (Materials):* `['All Materials', 'Receive Materials', 'Stock Movements', 'Low Stock']`
  - *Make & Sell (Products):* `['All Products', 'Stock Movements', 'Low Stock']`
  - *Agriculture (Inventory):* `['Inputs', 'Harvested Produce', 'Stock Movements']`
  - *Food & Hospitality (Ingredients):* `['Ingredients', 'Receive Stock', 'Movements', 'Low Stock', 'Waste']`
  - *Hybrid (Products):* `['All Products', 'Selective Stock Switch', 'Shared Materials']`
- **Main Workspace Content:**
  - `UniversalModuleTable` showing SKU/Barcode, Product Name, Category, Stock Quantity, Buying Cost, Selling Price, Margin %, Low Stock Alert.
  - For `Categories`: Dedicated category management table with category item counters and action buttons.
- **Available User Actions:**
  - Add new product with auto-generated EAN-13 barcode, SKU, category, purchase cost, selling price, unit margins, and alert threshold.
  - Create, edit, and delete inventory categories with custom modal.
  - Edit product pricing and stock counts.
  - Delete product records.
  - Filter by category, search by name/SKU, sort columns.
- **Rendering Components:** `InteractiveModulePanel.jsx`, `UniversalModuleTable.jsx`.
- **Implementation Status:**
  - *Buy & Sell `Products` (`All Products`, `Low Stock`, `Categories`):* **Fully Implemented**.
  - *Other architectures' subpages (`Stock Movements`, `Receive Materials`, `Inputs`, `Harvested Produce`, `Waste`):* **Incomplete** (they render the generic table without custom filtering or specialized action forms).

---

### 3.3 Sales Module (Orders, Jobs, Bookings, Payments)
- **Purpose:** Daily sales recording, customer invoicing, order tracking, margin calculation, and revenue analytics.
- **Module Names in Architectures:**
  - `Sales` (Buy & Sell, Make & Sell, Agriculture, Hybrid)
  - `Services` & `Jobs` & `Appointments` & `Payments` (Service-Based)
  - `Orders` & `Tables` (Food & Hospitality)
- **Available Subnavigation:**
  - *Buy & Sell / Make & Sell / Agriculture / Hybrid (Sales):* `['All Sales', 'Sales Trends']`
  - *Service-Based (Services):* `['Service Catalogue', 'Categories']`
  - *Service-Based (Jobs):* `['All Jobs', 'New Job', 'Pending', 'In Progress', 'Completed']`
  - *Service-Based (Appointments):* `['Calendar', 'Appointment List']`
  - *Service-Based (Payments):* `['All Payments', 'Outstanding', 'Receipts']`
  - *Food & Hospitality (Orders):* `['All Orders', 'New Order', 'Preparing', 'Ready', 'Completed']`
  - *Food & Hospitality (Tables):* `['Table View', 'Active Table Orders']`
- **Main Workspace Content:**
  - `All Sales`: `UniversalModuleTable` with Date, Sale Item, Unit Cost, Selling Price, Qty, Profit, Customer, Payment Channel, Status, and Actions.
  - `Sales Trends`: Dedicated `SalesTrendsView` component featuring Days, Weeks, Months curve graph, total sales earned, gross profit, and units sold.
  - Specialized `isSaleForm` modal with recorded product dropdown, autofill prices, custom price alert confirmation, automatic stock deduction, profit display, and credit balance linking.
- **Available User Actions:**
  - Record new sale, pick from live catalog products, enter custom prices, record customer debt on partial/credit sales, inspect profit, view/edit/delete sale entries.
- **Rendering Components:** `InteractiveModulePanel.jsx` (`SalesTrendsView`, `isSaleForm`, `UniversalModuleTable`).
- **Implementation Status:**
  - *`All Sales` & `Sales Trends`:* **Fully Implemented**.
  - *Service-Based `Jobs` / `Appointments`:* **Partially Implemented** (records are listed in table, but Calendar view and Job Status board are missing).
  - *Hospitality `Tables` / `Orders`:* **Partially Implemented** (data table works; visual dining table grid is missing).

---

### 3.4 Purchases Module
- **Purpose:** Supplier procurement, restocking inventory, vendor invoices, payment status tracking, unpaid debt management, and purchase returns.
- **Available Subnavigation:**
  - *Buy & Sell / Make & Sell / Agriculture / Food & Hospitality / Hybrid:* `['All Purchases', 'Unpaid Purchases', 'Purchase Returns']`
- **Main Workspace Content:**
  - `All Purchases`: `UniversalModuleTable` listing Date, Supplier Name, Purchased Item, Quantity, Unit Cost, Total Amount, Payment Method, Status.
  - `Unpaid Purchases`: Dedicated `UnpaidPurchasesView` showing unpaid supplier invoices, total outstanding payables, contact details, and settlement actions.
  - `Purchase Returns`: Dedicated `PurchaseReturnsView` showing purchased batches with checkbox selectors, return quantity inputs, reason notes, and debit note generators.
  - Specialized `isPurchaseForm` modal with product selection from catalog or custom item name, unit cost, quantity, supplier name, phone, address, payment terms, and automatic restock toggle.
- **Available User Actions:**
  - Record new purchase invoice, restock inventory automatically, track supplier credit, settle unpaid invoices partially or in full, process product returns.
- **Rendering Components:** `InteractiveModulePanel.jsx` (`isPurchaseForm`, `UnpaidPurchasesView`, `PurchaseReturnsView`, `UniversalModuleTable`).
- **Implementation Status:** **Fully Implemented & Operational**.

---

### 3.5 Customers Module
- **Purpose:** Customer directory, contact details, purchasing preferences, credit ledger ("Who Owes You Money"), and debt collection reminders.
- **Available Subnavigation:**
  - *All Architectures:* `['Customer', 'Outstanding Balances']` (or `['All Customers', 'Outstanding Balances']`)
- **Main Workspace Content:**
  - `UniversalModuleTable` showing Date, Customer Name + Email, Phone / Contact, Products Liked to Buy, Money Owed (RWF), Status / Account Type, Actions (View, Update, Delete).
  - Pinned header and pinned footer modal `isCustomerForm` collecting Full Name, Phone, Email, Account Type, Initial Debt with English currency words, Liked Products, and Address/Notes.
- **Available User Actions:**
  - Register customer, update customer details, view customer profile modal, delete customer, record initial money owed, search and filter by account category.
- **Rendering Components:** `InteractiveModulePanel.jsx` (`isCustomerForm`, `UniversalModuleTable`).
- **Implementation Status:** **Fully Implemented**.
- **Existing Limitations:**
  - Clicking `Outstanding Balances` subpage does not currently apply a client-side filter for `balanceOwedRWF > 0`, displaying all customers rather than strictly debtors.

---

### 3.6 Suppliers Module
- **Purpose:** Vendor directory, contact details, warehouse locations, supply categories, and supplier payables ledger ("You Owe Money").
- **Available Subnavigation:**
  - *All Architectures:* `['All Suppliers', 'Amounts Owed']`
- **Main Workspace Content:**
  - `UniversalModuleTable` with action button `Register new supplier`, columns: Date, Supplier Name + Email, Phone / Number, Location / Address, Amount Owed (RWF), Status, Actions (View, Update, Delete).
  - Specialized `isSupplierForm` modal collecting Supplier Name, Location, Phone, Email, Supply Category, Amount Owed with currency words, and Payment Terms/Notes.
- **Available User Actions:**
  - Register new supplier, update supplier profile, view profile details, delete vendor, search by name/location, record opening payables balance.
- **Rendering Components:** `InteractiveModulePanel.jsx` (`isSupplierForm`, `UniversalModuleTable`).
- **Implementation Status:** **Fully Implemented**.
- **Existing Limitations:**
  - Clicking `Amounts Owed` subpage does not currently filter strictly for suppliers where `amountRWF > 0`.

---

### 3.7 Expenses Module (Finance)
- **Purpose:** Operating expenses, rent, utilities, transport, salaries, maintenance, and expense categories.
- **Available Subnavigation:**
  - *All Architectures:* `['All Expenses', 'Add Expense', 'Categories']`
- **Main Workspace Content:**
  - `UniversalModuleTable` showing Date, Category, Expense Title, Amount (RWF), Status, Actions.
  - Expense recording modal collecting Category, Title, Amount, Payment Channel.
- **Available User Actions:**
  - Record operating expense, deduct from spendable cash, filter by expense category, delete expense records.
- **Rendering Components:** `InteractiveModulePanel.jsx`, `UniversalModuleTable.jsx`.
- **Implementation Status:** **Implemented**.
- **Existing Limitations:**
  - Clicking `Add Expense` in subnavigation opens a table with zero records titled "Add Expense" instead of automatically opening the expense modal.

---

### 3.8 Reports Module
- **Purpose:** Executive financial reports, P&L statements, tax summaries, debt ledgers, inventory valuation, and PDF/Excel export.
- **Available Subnavigation (by architecture):**
  - *Buy & Sell:* `['Sales', 'Stock', 'Purchases', 'Profit & Loss', 'Cash Movement', 'Customer Debts', 'Supplier Debts']`
  - *Make & Sell:* `['Production', 'Material Usage', 'Waste', 'Finished Stock', 'Sales', 'Profit & Loss', 'Cash Movement', 'Debts']`
  - *Service-Based:* `['Service Sales', 'Jobs', 'Payments', 'Outstanding Balances', 'Expenses', 'Profit & Loss']`
  - *Agriculture:* `['Animal Register', 'Feeding', 'Breeding', 'Health Costs', 'Crop Production', 'Farm Sales', 'Cash Movement', 'Debts']`
  - *Food & Hospitality:* `['Food Sales', 'Menu Performance', 'Ingredient Usage', 'Waste', 'Payments', 'Expenses', 'Profit & Loss', 'Reservations', 'Occupancy']`
  - *Hybrid:* `['Combined Reports', 'Reports by Activity', 'Shared Expenses', 'Cash Movement', 'Debts']`
- **Main Workspace Content:**
  - Rendered exclusively by `<DocumentsAndIntegrationsPanel mode="reports" />`.
- **Available User Actions:**
  - Select format (PDF, Excel, Word, CSV), choose period, generate and download report, trigger email dispatch.
- **Implementation Status:** **Incomplete / Disconnected from Subnavigation**.
- **Existing Limitations:**
  - `DocumentsAndIntegrationsPanel` does not receive `activePage` as a prop. Selecting any of the 6 to 9 subpages does not update the workspace or show the corresponding report tables or calculations.

---

### 3.9 Specialized / Architecture-Specific Modules

#### A. Production & Recipes (Make & Sell, Hybrid)
- **Subnavigation:**
  - *Recipes:* `['All Recipes', 'Finished Product Definitions']`
  - *Production:* `['Batches', 'New Batch', 'In Progress', 'Completed']`
- **Implementation Status:** **Partially Implemented** (data records exist, but batch calculation engine and recipe formula builder are rendered via generic tables).

#### B. Agriculture & Livestock Modules (Animals, Feeding, Breeding, Health, Crops)
- **Subnavigation:**
  - *Animals:* `['All Animals', 'Groups', 'Animal Types']`
  - *Feeding:* `['Feed Stock', 'Feeding Records', 'Feeding Plans', 'Low Feed']`
  - *Breeding:* `['Breeding Records', 'Expected Births', 'Birth Records']`
  - *Health:* `['Health Records', 'Treatments', 'Vaccinations', 'Upcoming Tasks']`
  - *Crops:* `['Plots', 'Crop Cycles', 'Field Activities', 'Harvests']`
- **Implementation Status:** **Implemented in Standalone Panel, but Disconnected from Navigation Rail**.
- **Critical Finding:** `FarmingEnhancementsPanel.jsx` contains comprehensive, high-quality implementations for Feed Run-Out Prediction, 6-Month Survival Calculator, Smart Budgeting, Breeding Readiness, and Pig Trading Evaluator. However, it is only wired to `Overview -> 6-Month Survival & AI`. Selecting `Animals`, `Feeding`, `Breeding`, or `Health` on the left rail shows generic empty tables instead of rendering the rich calculators inside `FarmingEnhancementsPanel`!

#### C. Hospitality Modules (Menu, Tables, Rooms)
- **Subnavigation:**
  - *Menu:* `['Menu Items', 'Categories', 'Recipes']`
  - *Tables:* `['Table View', 'Active Table Orders']`
  - *Rooms:* `['Rooms', 'Availability', 'Reservations', 'Check-ins', 'Check-outs']`
- **Implementation Status:** **Incomplete** (uses generic table fallback).

---

### 3.10 Utility & Global Modules (All Architectures)

#### A. Documents
- **Subnavigation:** `['Document Explorer', 'Document Preview', 'Print & Export']`
- **Component:** `DocumentsAndIntegrationsPanel mode="documents"`.
- **Status:** **Operational** for preview and exports.

#### B. Integrations
- **Subnavigation:** `['Gmail', 'Google Drive', 'EXCELLENCE BOS WhatsApp']`
- **Component:** `DocumentsAndIntegrationsPanel mode="integrations"`.
- **Status:** **Operational** with interactive WhatsApp bot simulator and cloud sync toggles.

#### C. Settings
- **Subnavigation:**
  - *Buy & Sell / Make & Sell:* `['Business Profile', 'Team & Permissions', 'Subscription']`
  - *Service-Based:* `['Business Profile', 'Staff & Commissions', 'Subscription']`
  - *Agriculture:* `['Farm Profile', 'Survival Period Config', 'Subscription']`
  - *Food & Hospitality:* `['Hospitality Modules', 'Staff & Shifts', 'Subscription']`
  - *Hybrid:* `['Enabled Workflows', 'Widget Customizer', 'Subscription']`
- **Component:** `InteractiveModulePanel.jsx` (Settings view).
- **Status:** **Operational** for Profile, Language, Theme, and Workspace Reset.

---

## 4. Inspection of Each Business Architecture

| Architecture | Primary Modules (Count) | Key Subnav Focus | Implemented Features | Missing / Incomplete Features |
|---|---|---|---|---|
| **01 · Make & Sell** | 14 modules | Materials, Recipes, Production, Products, Sales, Purchases, Expenses, Reports | Inventory, Sales, Purchases, Customers, Suppliers, Settings | Batch formula calculator, recipe ingredient deduction, batch progress board |
| **02 · Buy & Sell** | 11 modules | Products, Sales, Purchases, Customers, Suppliers, Expenses, Reports | All Products, Low Stock, Categories, All Sales, Sales Trends, Purchases, Unpaid Purchases, Returns, Customers, Suppliers | Expiry tracking view, landed cost transport calculator view |
| **03 · Service-Based** | 11 modules | Services, Jobs, Appointments, Customers, Payments, Expenses, Reports | Customer Profiles, Payments, Service Catalog table, Expenses | Interactive appointment calendar view, Kanban board for Job status |
| **04 · Agriculture & Livestock** | 16 modules (Bloated) | Animals, Feeding, Breeding, Health, Crops, Inventory, Sales, Purchases, Expenses, Reports | 6-Month Survival, Feed forecast, Smart Budget, Breeding verify in Overview subpage | Left rail modules (`Animals`, `Feeding`, `Breeding`, `Health`) show generic tables instead of connecting to `FarmingEnhancementsPanel` |
| **05 · Food & Hospitality** | 14 modules | Menu, Orders, Tables, Ingredients, Rooms, Purchases, Customers, Expenses, Reports | Sales, Purchases, Ingredient Inventory, Customer ledger | Visual table dining layout, room reservation calendar |
| **06 · Hybrid Business** | 14 modules | Products, Services, Production, Farming, Sales, Purchases, Expenses, Reports | Selective stock tracking toggle, multi-activity data entry, unified ledger | Activity-by-activity profit comparison matrix |

---

## 5. Identified Navigation & User Experience Problems

### Problem 1: Primary Navigation Rail Overflow (Critical - Agriculture & Make & Sell)
- **Location:** Left-side rail (`Panel A`) in `agriculture` (16 modules) and `make-and-sell` (14 modules).
- **Impact:** High. On laptops (768px - 900px height), the vertical rail overflows. Critical modules like `Settings`, `Integrations`, and `Documents` are pushed off the screen, requiring awkward scrolling within a 64px rail.
- **Cause:** Unconsolidated modules. For example, in Agriculture, `Animals`, `Feeding`, `Breeding`, and `Health` are 4 separate primary rail icons when they all belong under a unified `Livestock` module.

### Problem 2: Broken Overview Metric Card Click-Throughs (High Impact)
- **Location:** `DashboardPage.jsx` lines 1085, 1120, 1159, 1195.
- **Impact:** High. Clicking "Collect" on *Who Owes You Money* calls `setActivePage('Customer Balances')`, which does not exist in subnav (`'Outstanding Balances'`). The sidebar shows no active pill, and the workspace loads an empty table.
- **Fix:** Update all card button handlers to target existing subpages (`Customers -> Outstanding Balances`, `Purchases -> Unpaid Purchases`, `Expenses -> All Expenses`, `Reports -> Sales`).

### Problem 3: Reports Subnavigation Disconnected from Main Workspace (High Impact)
- **Location:** `DashboardPage.jsx` line 994 and `DocumentsAndIntegrationsPanel.jsx`.
- **Impact:** High. When a user selects `Reports` and clicks between `Sales`, `Stock`, `Purchases`, `Profit & Loss`, etc., the workspace never updates because `activePage` is not passed to or handled by `DocumentsAndIntegrationsPanel`.
- **Fix:** Pass `activePage` and `activeArchId` to `DocumentsAndIntegrationsPanel`, render the corresponding live report data table, and preselect the matching report export template.

### Problem 4: Farming & Livestock Modules Disconnected from Rich Tools (High Impact)
- **Location:** `DashboardPage.jsx` lines 995-1006.
- **Impact:** High. The rich farming calculators (Feed duration forecast, Breeding readiness check, Smart budget classification, 6-Month survival calculator) are only rendered on `Overview -> 6-Month Survival & AI`. Clicking `Animals`, `Feeding`, `Breeding`, or `Health` on the left rail shows generic blank tables!
- **Fix:** Render the corresponding section of `FarmingEnhancementsPanel` when the user navigates to `Animals`, `Feeding`, `Breeding`, or `Health`.

### Problem 5: Missing URL State Preservation (Medium Impact)
- **Location:** `DashboardPage.jsx` `handleModuleClick` and `setActivePage`.
- **Impact:** Medium. Reloading the page or sharing a link resets to `Overview -> Dashboard`.
- **Fix:** Synchronize `module` and `page` search params (e.g. `?arch=buy-and-sell&module=Sales&page=Sales+Trends`).

### Problem 6: Inconsistent Subnavigation Action Items (Medium Impact)
- **Location:** Contextual sidebar subpages like `New Batch`, `New Job`, `Add Expense`.
- **Impact:** Medium. Clicking `New Batch` or `Add Expense` shows an empty table with "No New Batch records yet" rather than opening the creation modal.
- **Fix:** Distinguish views from actions, or automatically trigger the creation modal when an action-named subpage is selected.

---

## 6. Conclusion & Next Steps

ExBOS possesses powerful domain logic, authentic Rwandan currency formatting, and responsive neo-glassmorphism components. By resolving the rail bloat, synchronizing click-through links, and connecting the rich specialized components to their designated subnavigation pages, ExBOS can achieve a unified, predictable, and exceptionally intuitive user experience.

Proceed to:
- `docs/dashboard-navigation-proposal.md` (Improved structure proposal)
- `docs/dashboard-user-workflows.md` (End-to-end user journeys)
- Incremental frontend implementation of identified fixes.