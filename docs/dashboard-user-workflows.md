# EXCELLENCE BOS — User Navigation Scenarios & Workflow Journeys

**Document Version:** 1.0.0  
**Date:** November 2026  
**Scope:** Realistic End-to-End User Journeys across all 6 Business Architectures  
**Target File:** `docs/dashboard-user-workflows.md`

---

## 1. Overview

This document illustrates how African entrepreneurs and business operators navigate EXCELLENCE BOS to perform real, daily commercial tasks. Each scenario details the exact button clicks, middle sidebar selections, workspace dialogs, calculations, data persistence, and ledger updates.

---

## 2. Core User Scenarios

---

### Scenario 1: Recording a Daily Sale

#### Context
A retail merchant in Kigali running a hardware boutique (`Buy & Sell`) sells 6 boxes of Twyford Ceramic Floor Tiles to a walk-in client. The client pays 50,000 RWF via MTN MoMo and leaves 41,200 RWF on store credit.

#### Step-by-Step User Journey:
1. **Primary Navigation (Panel A):**
   - The user clicks the **`Sales`** icon (`ShoppingBag`) on the left rail.
2. **Contextual Sidebar (Panel B):**
   - Panel B displays **`Sales Modules`** with two numbered options:
     - `01 All Sales` (Selected by default)
     - `02 Sales Trends`
3. **Workspace (Panel C):**
   - The user sees the **`All Sales`** table listing recent customer sales, total daily revenue, and payment channels.
   - At the top right of the table action bar, the user clicks the sapphire blue **`New sales`** button.
4. **Interactive Modal Form (`isSaleForm`):**
   - A modal titled **`Record New Sale`** opens centered on the screen with a pinned header and pinned footer.
   - **Product Selection:** The user clicks the product dropdown. A search-enabled dropdown opens with registered inventory products. The user types `"Twyford"` and selects `"Twyford Ceramic Floor Tiles (Box) — 48 in stock"`.
   - **Autofill:** The system automatically loads the unit selling price (`15,200 RWF`) and unit cost (`11,000 RWF`).
   - **Quantity:** The user enters `6` boxes.
   - **Real-Time Calculation:**
     - Total Sale: `91,200 RWF` (Ninety-one thousand, two hundred Rwandan francs).
     - Expected Gross Profit: `+25,200 RWF` (`4,200 RWF` profit per box × 6).
   - **Customer Information:**
     - Customer Name: `"Emmanuel Bizimana"`
     - Phone: `"+250 788 554 990"`
   - **Payment Details:**
     - Payment Method: `"MTN MoMo Business"`
     - Payment Status: The user selects `"Partial Payment / Store Credit"`.
     - System prompt confirms: *"This customer will automatically be added to your Customer Debt Ledger (Who Owes You Money)."*
5. **Completion & Ledger Updates:**
   - The user clicks **`Record Sale & Print Receipt`**.
   - A success toast appears: *"Sale of 6 BOX recorded successfully!"*
   - **Automated Ripple Effects in Workspace:**
     - In **All Sales**: The new transaction appears at the top of the table.
     - In **Products / Inventory**: Twyford Tiles stock automatically deducts from `48` to `42` boxes.
     - In **Customers (`Outstanding Balances`)**: Emmanuel Bizimana is immediately added with `41,200 RWF` owed.
     - In **Overview (`Who Owes You Money`)**: Total receivables increases by `41,200 RWF`.
     - In **Overview (`Cash Performance Curve`)**: Today's income point elevates immediately.

---

### Scenario 2: Managing Inventory & Low-Stock Alerts

#### Context
A store manager needs to check which building materials need replenishment, add a newly arrived brand of cement, and categorize stock.

#### Step-by-Step User Journey:
1. **Primary Navigation (Panel A):**
   - Clicks **`Products`** (`Package` icon).
2. **Contextual Sidebar (Panel B):**
   - Displays three subpages:
     - `01 All Products`
     - `02 Low Stock`
     - `03 Categories`
3. **Adding a New Product:**
   - On `01 All Products`, clicks the **`Add product`** button.
   - Modal opens with automatic **EAN-13 Barcode Generation** (e.g., `600123894721`).
   - The user enters:
     - Product Name: `"Cimerwa Portland Cement 32.5N (50kg Bag)"`
     - Category: `"Building Materials"`
     - Purchase Cost: `10,500 RWF`
     - Selling Price: `12,500 RWF`
     - Unit Profit & Margin: System calculates `+2,000 RWF (19% margin)` in real time.
     - Initial Stock: `120` bags.
     - Low Stock Alert Threshold: `20` bags.
   - Clicks **`Save & Add to Catalog`**.
4. **Monitoring Low Stock:**
   - User clicks **`02 Low Stock`** in Panel B.
   - The workspace immediately filters the table to show *only* items whose quantity is below their alert threshold (e.g., `Circuit Breakers (3 left)`, `White Undercoat Paint (4 left)`).
   - Each row displays an amber indicator tag: `Low Stock (3 left) · Reorder Recommended`.
5. **Managing Categories:**
   - User clicks **`03 Categories`** in Panel B.
   - The workspace switches to the category management grid showing category names, total assigned items, and action buttons (`Edit`, `Delete`).
   - Clicks **`Create category`** to add a new category with blue sapphire borders.

---

### Scenario 3: Reviewing & Exporting Reports

#### Context
At the end of the month, a business owner needs to review gross sales, verify cash in till versus bank deposits, inspect customer debt aging, and export a formal PDF summary.

#### Step-by-Step User Journey:
1. **Primary Navigation (Panel A):**
   - Clicks **`Reports`** (`BarChart3` icon).
2. **Contextual Sidebar (Panel B):**
   - Displays tailored report categories:
     - `01 Sales & Margins`
     - `02 Stock Valuation`
     - `03 Purchases & Payables`
     - `04 Profit & Loss`
     - `05 Cash Movement & Till Reconciliation`
     - `06 Customer Debts (Receivables)`
     - `07 Supplier Debts (Payables)`
3. **Workspace Display (Panel C):**
   - Selecting **`01 Sales & Margins`** displays the monthly revenue breakdown, top 5 selling items by volume, and profit margins.
   - Selecting **`04 Profit & Loss`** displays the high-level P&L matrix:
     $$\text{Gross Revenue} - \text{Cost of Goods Sold (COGS)} = \text{Gross Profit} - \text{Operating Expenses} = \text{Net Operating Profit}$$
   - Selecting **`06 Customer Debts`** displays the aged debtors list (1–7 days, 8–15 days, 16+ days overdue) with WhatsApp payment reminder shortcuts.
4. **Exporting Formal Documents:**
   - The user selects the desired format pill: `[PDF (Default)]`, `[Excel]`, `[Word]`, or `[CSV]`.
   - Selects Period: `"October 2026"`.
   - Clicks **`Generate & Download Report`**.
   - A branded, publication-ready PDF titled `"EXCELLENCE BOS — Monthly Financial Performance Statement"` downloads instantly to the user's computer.

---

### Scenario 4: Architecture-Specific Workflows

---

#### 4A. Agriculture & Livestock: Feed Duration Forecast & 6-Month Survival

##### User Persona
A pig farmer in Bugesera managing 24 pigs (breeding sows, boars, and growing weaners).

##### Navigation Flow:
1. **Primary Navigation:** Clicks **`Livestock`** (`Activity` icon).
2. **Contextual Sidebar:**
   - `01 Animal Register`
   - `02 Feed Management`
   - `03 Breeding & Births`
   - `04 Health & Vet Care`
   - `05 Trading vs Breeding Evaluation`
3. **Feed Run-Out Prediction (`02 Feed Management`):**
   - The workspace loads `FarmingEnhancementsPanel` focused on Feed Management.
   - Current stock: `150 kg Tunga Breeder Feed`.
   - Herd daily consumption: `12 kg/day`.
   - System calculates: **`12.5 Days of Feed Remaining (Run-Out Date: Nov 14, 2026)`**.
   - System displays a financial advisory: *"Reorder 500 kg before Nov 10 to maintain steady nutrition."*
4. **6-Month Farm Survival Intelligence:**
   - The user navigates to **`Overview -> 03 6-Month Survival & AI`**.
   - The user inputs available operating reserves (`3,900,000 RWF`).
   - Monthly operating overhead: Feed (`280,000`), Labor (`180,000`), Vet (`65,000`), Utilities (`45,000`), Buffer (`50,000`) = `620,000 RWF/month`.
   - Safety Budget required for 6 months: `3,720,000 RWF`.
   - **Survival Status:** **GREEN (6.3 Months Runway Protected)**.
   - The user is confident that the farm can survive unforeseen shocks or delayed market sales without emergency destocking.

---

#### 4B. Make & Sell: Batch Production & Recipe Costing

##### User Persona
A bakery owner in Kigali producing brioche bread and specialty cakes.

##### Navigation Flow:
1. **Primary Navigation:** Clicks **`Production`** (`Factory` icon).
2. **Contextual Sidebar:**
   - `01 Batches`
   - `02 Recipes & Formulas`
   - `03 In Progress`
   - `04 Completed Runs`
3. **Recipe Formula Verification (`02 Recipes & Formulas`):**
   - The user inspects the recipe for `"Family White Loaf (500g)"`:
     - Flour: `25 kg` (`22,500 RWF`)
     - Yeast & Salt: `1,200 RWF`
     - Sugar & Margarine: `4,800 RWF`
     - Baking Gas & Power: `3,500 RWF`
     - Expected Yield: `70 Loaves`.
   - System calculates true unit production cost: **`457 RWF per loaf`**.
   - Selling price: `800 RWF`.
   - Net profit margin per loaf: `+343 RWF (42.8% gross margin)`.
4. **Recording a Completed Batch (`01 Batches`):**
   - The baker logs a finished batch of 70 loaves.
   - Raw material stock (flour, sugar, yeast) is automatically deducted from `Products -> Raw Materials`.
   - Finished goods stock increases by `70 Loaves` ready for morning retail and wholesale delivery.

---

#### 4C. Service-Based: Service Booking & Client Balances

##### User Persona
An auto repair shop owner managing mechanic service tickets.

##### Navigation Flow:
1. **Primary Navigation:** Clicks **`Jobs & Bookings`** (`ClipboardList` icon).
2. **Contextual Sidebar:**
   - `01 All Jobs`
   - `02 Appointments & Calendar`
   - `03 In Progress`
   - `04 Completed & Invoiced`
3. **Registering a Job Ticket (`01 All Jobs`):**
   - Clicks **`New Job Ticket`**.
   - Selects Service: `"Brake Pad Replacement & Disc Machining"`.
   - Assigns Staff: `"Mechanic Patrick"`.
   - Total Job Fee: `45,000 RWF`.
   - Client Deposit Collected: `20,000 RWF` via Cash Till.
   - Remaining Balance: `25,000 RWF`.
   - The remaining `25,000 RWF` is automatically logged to **`Customers -> Outstanding Balances`** for post-repair payment.

---

#### 4D. Food & Hospitality: Restaurant Orders & Room Billing

##### User Persona
A boutique hotel manager running an 8-room lodge with an on-site garden restaurant.

##### Navigation Flow:
1. **Primary Navigation:** Clicks **`Restaurant & Bar`** (`UtensilsCrossed` icon).
2. **Dining Table Order:**
   - Waiter opens Table #04, enters order: `2× Grilled Tilapia Fish (16,000 RWF)` and `2× Virunga Primus Beers (4,000 RWF)`.
   - Order sends to Kitchen Queue (`Preparing`).
   - Guest requests the bill to be charged to their accommodation room (`Room 102 — Nyungwe Suite`).
3. **Guest Folio Consolidation:**
   - Manager navigates to **`Rooms & Lodging -> 03 Guest Folios`**.
   - Room 102 folio automatically shows Room Rate (`45,000 RWF/night`) + Restaurant tab (`20,000 RWF`) = Total Check-Out Balance: `65,000 RWF`.
   - At check-out, the guest pays via Bank Card / MoMo; both accommodation revenue and restaurant food sales are credited cleanly without double counting.

---

#### 4E. Hybrid Business: Selective Stock Switch

##### User Persona
An electronics repair and boutique store owner who sells phone accessories (which must track physical inventory counts) and provides motherboard soldering services (which should not track inventory).

##### Navigation Flow:
1. **Primary Navigation:** Clicks **`Products & Stock`** (`Package` icon).
2. **Contextual Sidebar:** Clicks **`02 Selective Stock Switch`**.
3. **Selective Tracking Configuration:**
   - The user sees their mixed product/service list:
     - `"Original 45W Fast Charger"` -> **Stock Tracking Switch: ON** (Physical Stock: 32 units).
     - `"Motherboard Micro-Soldering Service"` -> **Stock Tracking Switch: OFF** (Physical Stock: N/A).
   - When selling a Fast Charger, stock automatically deducts from 32 to 31.
   - When selling a Soldering Service, the transaction logs revenue immediately without requiring inventory deductions or raising false "out-of-stock" errors.
4. **Reviewing Performance:**
   - Navigates to **`Reports -> 02 Profit by Activity`**.
   - The user inspects a side-by-side comparison:
     - Retail Accessories Net Profit: `+480,000 RWF`.
     - Repair Services Net Profit: `+620,000 RWF`.

---

## 5. Summary of User Journey Guarantees

Across all six business models, EXCELLENCE BOS delivers:
- **Maximum 2 clicks** from the primary rail to any business ledger.
- **Real-time feedback:** Every sale, purchase, or expense immediately updates the Cash Curve, Overview KPI cards, and inventory counts without requiring page refreshes.
- **Plain-language currency:** All amounts feature authentic Rwandan franc formatting and English amount-in-words translation.
- **Fail-safe navigation:** Every subnavigation item displays dedicated, relevant business data and functional actions.
