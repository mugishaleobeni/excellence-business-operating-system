# EXCELLENCE Business Operating System (ExBOS) — Complete User Handbook

**Generated:** 2026-11-28  
**Platform:** ExBOS Web, Mobile PWA & 2-Way WhatsApp Business Operating System  
**Languages Supported:** English & Ikinyarwanda  

---

## PART 1 — INTRODUCTION TO EXCELLENCE BUSINESS OPERATING SYSTEM (ExBOS)

EXCELLENCE Business Operating System (ExBOS) is an all-in-one financial, inventory, point-of-sale (POS), multi-branch, tax compliance, and WhatsApp-connected operating system built specifically to help businesses survive, control leakage, understand their true cash position, and scale with discipline.

### 1.1 Why ExBOS Exists: The Business Survival Mission

Across Africa and emerging markets, more than 70% of small and medium businesses struggle or close within their first three years — not because the owner lacks hard work or customers, but because of invisible financial leaks:

1. Confusing Total Sales Revenue with Spendable Cash (spending money that actually belongs to suppliers, tax authorities, or restocking).

2. Uncontrolled branch and staff operations (cashiers or branch managers changing prices, deleting sales records, or manipulating stock counts).

3. Unrecorded customer debts (credit sales forgotten in paper notebooks) and untracked fixed monthly obligations (employee salaries, shop rent, electricity, loan repayments).

4. Internet blackouts that freeze traditional cloud POS systems and cause lost sales.

ExBOS replaces scattered paper books, complex spreadsheets, and fragile POS tools with one unified, offline-capable command center that works on any phone, tablet, or computer — and connects directly with WhatsApp.

### 1.2 Who Uses ExBOS Inside a Company?

| User Role | Primary Responsibility | What They Can Access in ExBOS |
| --- | --- | --- |
| Business Owner (Main HQ Executive) | Overall company strategy, capital control, branch creation, manager supervision, tax compliance, and profit inspection. | Full access to all branches, 'Where Is My Money?', RRA Tax Center, Monthly Payroll & Break-Even, Branch Manager lifecycle controls (Assign, Edit, Deactivate, Activate, Delete), Multi-Item Stock Dispatch, and the Executive Multi-Branch Intelligence Inspector. |
| Branch Manager / Supervisor | Day-to-day operations of one assigned branch (or Main HQ counter). | Locked strictly to their assigned branch. Cannot switch into Main HQ or view other branches. Governed by granular Owner permissions (Standard Manager or Full Supervisor). |
| Sales-Only Cashier (HQ-Issued Stock Mode) | Recording customer sales and opening/closing daily cashier shifts using stock dispatched by Main HQ. | Can ONLY record sales at HQ's locked selling price. Cannot add products, cannot import CSV, cannot edit products or stock quantities, cannot change selling prices, cannot delete records, and cannot view HQ cost/profit margins. |

---

## PART 2 — REAL BUSINESS PROBLEMS & HOW ExBOS SOLVES THEM (PROBLEM -> SOLUTION GUIDE)

Before exploring each button on the screen, use this quick Problem-to-Solution guide to see how ExBOS resolves the daily challenges faced by business owners.

### 2.1 Complete Problem & Solution Matrix

| Real Business Problem | ExBOS Solution & Module | Step-by-Step How It Works |
| --- | --- | --- |
| Problem 1: 'I sold a lot this month, but my cash drawer is empty. Where did my money go?' | Overview -> Where Is My Money? & Spendable Cash Card | ExBOS separates Total Revenue from Spendable Cash. It shows exactly how much of your money is sitting in Cash in Hand, MTN MoMo / Airtel Money, Bank Accounts, unsold Stock on Shelves, or unpaid Customer Debts — and subtracts what you owe suppliers. |
| Problem 2: 'My branch manager or cashier changes prices, deletes sales, or adds fake stock.' | Settings -> Branch Management -> Security & Permissions (Sales-Only Cashier Mode) | In 1 click, the Owner selects 'Sales-Only Cashier (HQ Issues Stock)'. ExBOS immediately hides Add Product, Edit Product, Delete Product, and CSV Import for that manager, and locks the Selling Price input at checkout. If a manager left the company, the Owner clicks 'Deactivate' or 'Delete Manager' to cut off their Web and WhatsApp access immediately. |
| Problem 3: 'I want to give stock from Main HQ to a branch and inspect their stock, low stock, and profit without switching into their branch.' | Settings -> Branch Management -> Tab 2: Branch Stock, Profit & Activity Inspector | The Owner dispatches multiple products from Main HQ to the branch with handover notes, then opens Tab 2 to inspect that branch's live product stock, quantity, cost/retail valuation, low-stock alerts, most-bought products today, chronological action history (with Day, Date & Time), and side-by-side profit comparison graphs filtered by Period and Day of Week (Monday–Sunday). |
| Problem 4: 'My internet connection dropped while customers are waiting to buy — or I see Failed to Fetch errors.' | Offline-First Reactive Engine & Local Salted SHA-256 Auth/PIN Verifier | When offline, adding a product, recording a sale, logging an expense, opening a cashier shift, or importing CSV updates the screen in 0ms and saves to your device (IndexedDB + localStorage) with zero 'Failed to fetch' errors. Even Owner PIN branch unlock and returning sign-in work offline. Once internet returns, ExBOS syncs everything to MongoDB automatically. |
| Problem 5: 'I don't know if my sales profit this month is enough to pay my workers' salaries and shop rent.' | Expenses -> Monthly Payroll, Fixed Bills & Live Break-Even Engine | Register your employees' monthly salaries and fixed bills (Shop Rent, Electricity, Water, Internet, Loan Repayments). ExBOS calculates your Total Monthly Fixed Burden and displays a live Break-Even Progress Bar showing whether you are in the Loss Zone or Profitable Zone and how much more sales you need to break even. |
| Problem 6: 'Products run out of stock on the shelf without me or my branch manager realizing.' | Automatic Bilingual Out-of-Stock WhatsApp Alerts + Low-Stock Radar | The moment a sale brings any product's stock down to 0 units, ExBOS automatically sends an instant WhatsApp Out-of-Stock Alert (in English or Kinyarwanda) to BOTH the Business Owner and the assigned Branch Manager. |
| Problem 7: 'RRA tax filing arrives and I have multiple branches — some using HQ's TIN and some with their own branch TIN.' | Reports / Settings -> RRA Tax & VAT Compliance Center | Turn on RRA Tax Tracking to automatically split 18% VAT on every sale and purchase, record Customer TIN and EBM Invoice Numbers, choose 'Inherit Main HQ TIN' or 'Separate Branch TIN' per branch, view per-branch tax breakdowns, and export RRA-ready Excel/CSV declarations. |
| Problem 8: 'Customers take goods on credit (dette) and delay paying back.' | Customers -> Unpaid Customers & 1-Click WhatsApp Reminders | ExBOS lists every customer with an outstanding balance and lets you send a polite, itemized WhatsApp payment reminder with 1 click, or record partial debt settlements that automatically update your cash flow. |

---

## PART 3 — THE 6 SPECIALIZED BUSINESS ARCHITECTURES IN ExBOS

When you register or configure your business in ExBOS, the dashboard adapts its terminology, KPIs, and workflows to match your exact industry model:

### 3.1 Choosing Your Business Model

| Architecture ID & Name | Who It Is Built For | Specialized Workspace Modules Included |
| --- | --- | --- |
| 01 · Buy & Sell (Retail & Wholesale Trading) | Shops, supermarkets, pharmacies, hardware stores, electronics dealers, cosmetics, boutiques, and wholesale distributors. | Overview, Products & Stock Lines (Batch/Expiry/IMEI/Wholesale tiers), Sales & Thermal Receipts, Purchases & Returns, Customers & Debts, Suppliers, Expenses & Payroll Break-Even, Reports & RRA Tax Center. |
| 02 · Make & Sell (Manufacturing & Production) | Bakeries, carpentry workshops, tailoring/garments, soap/cosmetics makers, brick makers, and agro-processors. | Raw Materials Inventory, Production Batch Costing & Yield Calculator, Finished Goods Stock, Sales Orders, Waste/Scrap Tracking, and True Unit Production Margin. |
| 03 · Services (Service Providers & Agencies) | Hair/beauty salons, repair workshops, clinics, consulting firms, cleaning agencies, IT services, and transport fleets. | Service Catalog, Jobs & Bookings Schedule, Staff Commissions & Technician Tracking, Consumables Used per Job, Client Invoicing, and Service Profit Margins. |
| 04 · Agriculture (Livestock & Crop Farming) | Dairy farms, poultry farms, piggery/cattle ranches, crop farmers, and agribusiness cooperatives. | Individual & Group Livestock Registry (Ear Tag, Breed, Sex, Weight, Pregnancy/Breeding Countdown), Daily Feeding Logs, Vet Health & Mortality Tracking, Farm Production (Milk, Eggs, Harvest), and True Raising Cost vs. Market Sale Profit. |
| 05 · Food & Hospitality (Restaurants, Bars & Hotels) | Restaurants, cafes, bars, lodges, guesthouses, and hotels. | Menu Items & Recipe Ingredient Costing, Kitchen & Bar Orders, Dining Tables, Hotel Rooms & Guest Check-In/Folio Billing, Ingredients Stock, and Daily Food/Beverage Margin. |
| 06 · Hybrid Business (Multi-Activity Enterprise) | Businesses combining two or more activities (e.g., an Electronics Shop that both sells phones AND runs a repair service workshop). | Unified Hybrid Catalog (Products + Services), Mixed Sales Checkout Drawer, Cross-Activity Profit Breakdown, and Consolidated Multi-Branch Financial Intelligence. |

---

## PART 4 — COMPLETE TOUR OF THE ExBOS DASHBOARD & OVERVIEW CARDS

This section explains every bar, icon, card, and chart you see the moment you sign in to the ExBOS Dashboard.

### 4.1 The Top Navigation Bar (Header Controls)

At the very top of your dashboard, you have quick global controls that stay accessible from any screen:

• Active Branch Switcher Pill: Shows which branch you are currently viewing (e.g., 'Main HQ' or 'Remera Branch'). The Business Owner can switch branches here (or lock Main HQ with an Owner Security PIN so staff cannot switch into HQ).

• Live Global Search Bar: Instantly filters records, products, sales, customers, or suppliers by name, SKU, barcode, or phone number.

• Sync Status Pill & Popover ('Synced' / 'Offline' / 'Pending Sync'): Shows your live connection state. Clicking it opens the Sync Status Popover showing how many offline actions are queued, the last synced timestamp, and a 'Sync Now' button.

• Privacy Eye Toggle (Hide/Show Financials): Masks all sensitive RWF numbers on screen with '••••••' when a customer or visitor is standing near your screen.

• Language Selector (EN / RW): Switches the entire ExBOS interface instantaneously between English and Ikinyarwanda.

• Theme Toggle (Dark / Light): Switches between the signature ExBOS Sapphire Dark theme and High-Contrast Daylight mode.

• Owner Notification Bell: Alerts the Business Owner in real time when a Branch Manager activates their invite link, edits/deletes a product, or closes a cashier shift with a cash shortage.

### 4.2 The Dashboard Overview — Every KPI Card Explained in Detail

When you open 'Overview' (the home screen of your dashboard), ExBOS presents your business health at a glance through six primary financial cards and four deep intelligence panels:

| Overview Card / Panel | What It Measures | How to Read It & Business Decision to Take |
| --- | --- | --- |
| Card 1: Monthly Revenue (Total Sales Inflow) | Total value of all sales recorded in the current month (RWF). | Shows your top-line selling activity. Remember: Revenue is NOT profit and NOT spendable cash — never spend straight from this number without checking Card 2 and Card 3. |
| Card 2: Net Profit (True Earnings) | Revenue minus Cost of Goods Sold (purchase cost of items sold) minus Operating Expenses. | This is what your business actually earned. If Revenue is high but Net Profit is low or negative, either your selling prices are too close to your buying cost or your daily expenses are too high. |
| Card 3: Spendable Cash ('Safe Cash You Can Spend') | Liquid cash currently available after setting aside money owed to suppliers and operating commitments. | Check this card BEFORE withdrawing money for personal use or buying non-essential items. It protects you from accidentally spending supplier or restock capital. |
| Card 4: Stock Value (Inventory Valuation) | Total monetary value of all unsold products currently sitting in your inventory. | If Stock Value keeps rising while Spendable Cash drops, too much of your cash is trapped in slow-moving stock on the shelves. |
| Card 5: Customers Owe Me (Unpaid Customer Debts) | Total unpaid balance from credit or partial-payment sales given to customers. | Click through to the Customers module to send 1-click WhatsApp reminders and collect this cash back into your till. |
| Card 6: I Owe Suppliers (Unpaid Purchases) | Total unpaid balance you owe to wholesalers or suppliers for goods received on credit. | Helps you plan upcoming supplier payments before your credit due dates expire. |
| Panel A: 'Where Is My Money?' Visual Breakdown | Live breakdown of where every Franc of your business capital is located right now. | Shows exact amounts in: (1) Cash in Hand / Main Till, (2) MTN MoMo / Airtel Money, (3) Bank Accounts, (4) Stock on Shelves, and (5) Owed by Customers. |
| Panel B: Cash Flow Curve Chart (Money In vs. Money Out) | Interactive daily/monthly curve comparing Cash Inflows (emerald/sapphire) against Cash Outflows (rose). | Hover or tap any day/month point to see exact Money In, Money Out, and Net Cash Flow. |
| Panel C: Multi-Branch Performance & Activity Pulse Heatmap | GitHub-style daily activity grid + Best Performing Branch trophy + 4-tab view (Both, Pulse Grid, Revenue Bars, Profit & Margin Table). | Lets the Business Owner see which days of the year had the highest sales intensity and which branch leads the company. |
| Panel D: Recent Executions & Quick Action Strip | Latest sales, purchases, and expenses + 1-click '+ New Sale', '+ New Product', '+ New Purchase', '+ New Expense' buttons. | Allows immediate transaction entry right from the Overview screen. |

---

## PART 5 — STEP-BY-STEP USER GUIDE FOR EVERY DASHBOARD MODULE

Follow these step-by-step instructions to perform every daily operation in ExBOS on desktop or mobile.

### 5.1 Module 1: Products & Stock (Catalog, Stock Lines, Categories & Bulk CSV Import)

The Products module organizes your entire catalog into four sub-views: All Products, Stock (Batch & Expiry Valuation), Low Stock, and Categories.

• Mobile Responsive Product Cards: On mobile phones, ExBOS automatically displays products as clean vertical cards (showing Stock Left, Selling Price, Purchase Cost, Stock Value, Status Badge, and View/Edit/Delete buttons) so you never have to scroll horizontally.

• Floating Quick-Action Bar: When scrolling through long product lists (100+ items), the '+ Add Product', 'Import CSV', and 'Receive Stock' buttons float at the bottom-right corner so they are always 1 tap away.

Step-by-Step: How to Add a Single Product:

1. Open Products (or tap the floating '+ Add Product' button).

2. Enter the Product Name, Category (or create a new Category inline), Unit (piece, box, kg, liter, pack), and optional SKU / Barcode (you can tap the camera icon to scan a physical barcode).

3. Enter the Purchase Cost (RWF), Retail Selling Price (RWF), Current Stock Quantity, and Low-Stock Alert threshold (e.g., 5 units).

4. Optional Advanced Retail Fields: Enter Wholesale Price (RWF) & Wholesale Minimum Quantity (for bulk buyers), Batch Number & Expiry Date (for pharmacies/food/cosmetics), or Serial / IMEI Numbers (for phones/electronics).

5. Click 'Save Product'. The product appears immediately in your table/cards — even if you are offline!

Step-by-Step: How to Import 100–500 Products from Excel / CSV:

1. In Products, click 'Import Products from Excel / CSV' (or the floating 'Import CSV' button).

2. Click 'Download CSV Template' to get the ready-to-fill columns (title, sku, category, unit, purchasePriceRWF, sellingPriceRWF, wholesalePriceRWF, wholesaleMinQty, quantity, lowStockAlert, batchNumber, expiryDate, serialNumbers).

3. Upload your filled CSV file, review the preview table, and click 'Import'. ExBOS deduplicates matching SKUs automatically and works both online and offline.

Step-by-Step: How to Delete or Edit a Product:

1. Click the Edit (pencil) icon on any product row/card to update its price, stock, or details.

2. Click the Delete (trash) icon and confirm in the popup dialog to permanently remove the product from all catalog buckets.

### 5.2 Module 2: Sales, Cashier Shifts & Thermal POS Receipts

Step-by-Step: How to Record a Sale:

1. Open Sales and click '+ New Sale' (or tap the floating 'New Sale' button).

2. Select the Product from the searchable dropdown (or scan its barcode with your camera). ExBOS displays the live available stock.

3. Choose Retail Price or Wholesale Price tier (if the product has wholesale pricing) and enter the Quantity sold. Note: If the user is a Branch Manager in Sales-Only / Locked-Price mode, the Selling Price per unit is locked by Main HQ.

4. Select the Payment Method (Cash, MTN MoMo, Airtel Money, Bank Transfer) and Payment Status (Paid in Full, Partial Payment, or Credit / Unpaid).

5. Optional: Enter Customer Name, Customer Phone (for WhatsApp receipts/reminders), Customer TIN, and EBM Invoice Number.

6. Click 'Complete Sale'. ExBOS automatically deducts the sold quantity from stock, updates Overview Revenue & Net Profit, and triggers an automatic WhatsApp Out-of-Stock alert if stock reaches 0.

Step-by-Step: How to Print a 58mm / 80mm Thermal Receipt or A4 Invoice:

• Immediately after saving a sale (or by clicking 'View / Print' on any sale row), choose '58mm Thermal Receipt', '80mm Thermal Receipt', or 'A4 Invoice / Download PDF', or send the receipt directly to the customer on WhatsApp.

Step-by-Step: How to Open & Close a Cashier Shift (Daily Z-Report):

1. In Sales, click 'Cashier Shift & Z-Report' (or the floating 'Shift Z-Report' button).

2. At the start of the day, enter your Opening Drawer Float (RWF) and click 'Open Shift'.

3. At closing time, count the physical cash in your drawer, enter 'Actual Counted Cash in Drawer (RWF)', and click 'Close Shift'.

4. ExBOS compares Counted Cash against Expected Cash (Opening Float + Cash Sales - Cash Expenses), prints an 80mm Z-Report, and silently alerts the Business Owner on WhatsApp if there is a cash shortage.

### 5.3 Module 3: Purchases, Stock Receiving & Purchase Returns

1. Open Purchases and click '+ New Purchase' (or '+ Receive Stock' inside Products -> Stock).

2. Select the existing product to restock (or type a new item), enter Quantity Received, Unit Cost (RWF), Supplier Name & Phone, optional Expiry Date, and Payment Status (Paid in Full, Partial, or Unpaid Credit).

3. Saving the purchase automatically increases your product's stock quantity and logs any unpaid balance under 'I Owe Suppliers'.

4. If defective or damaged goods must be returned to a supplier, switch to the 'Purchase Returns' sub-page to record the return and automatically adjust stock and supplier debt.

### 5.4 Module 4 & 5: Customers (Debt Recovery) & Suppliers (Payables)

• Customers Module: Tracks your customer directory, total purchase history, and outstanding credit balances. At the top of Customers and Sales, the 'Unpaid Customers & WhatsApp Reminders' panel lets you click 'Send WhatsApp Reminder' to message any debtor with their exact balance owed.

• Suppliers Module: Tracks all vendors, their phone numbers, what products they supply, and any unpaid supplier invoices.

### 5.5 Module 6: Expenses, Monthly Payroll, Rent & Live Break-Even Engine

The Expenses module manages both daily variable expenses (transport, packaging, repairs) AND your fixed monthly commitments:

1. Daily Expense: Click '+ New Expense', enter title, category, amount (RWF), and payment method. (If a branch has a Max Single Expense Limit set by Main HQ, expenses above that cap are blocked for Branch Managers.)

2. Employee Payroll Tab: Click '+ Add Employee', enter the staff member's name, role (e.g., Cashier), phone, monthly salary (RWF), and pay day. Click 'Pay Salary' to record full or partial salary payments — ExBOS tracks Paid vs. Remaining Owed for the month and logs the expense automatically.

3. Monthly Fixed Bills Tab: Click '+ Add Fixed Bill' to register Shop Rent, Electricity & Water, Internet, Security, or Loan Repayments.

4. Live Monthly Break-Even Engine: At the top of the panel, ExBOS compares your Month-to-Date Gross Profit against your Total Monthly Fixed Costs + Variable Expenses, showing your Break-Even Progress % and the exact sales still needed to cross from the Loss Zone into the Profitable Zone.

### 5.6 Module 7: Reports & RRA Tax / VAT Compliance Center

• Executive Reports: Generate and export Profit & Loss (P&L) Statements, Sales Trends, Stock Valuation Reports, Customer Debt Schedules, and Supplier Debt Schedules in PDF, Excel, Word, or CSV.

• RRA Tax & VAT Center: Designed for Rwanda Revenue Authority compliance:

  1. Toggle 'Enable RRA Tax Tracking' ON in Tax Profile Settings.

  2. Enter your Company TIN, Tax Regime (VAT 18% Registered, Flat Tax, or 3% Turnover), and EBM Device Serial.

  3. Multi-Branch TIN Modes: Choose 'Inherit Main HQ TIN' (all branches report under one company TIN) or 'Separate Branch TIN' (assign individual TINs to specific branches).

  4. View live Output VAT (on sales), Input VAT (on purchases), Net VAT Payable to RRA, and the Per-Branch Tax Breakdown table, and click 'Export RRA Excel / CSV' for tax filing.

### 5.7 Module 8: Settings & Multi-Branch Executive Control Center

Open Settings -> Branch Management to control all locations and managers from two dedicated tabs:

TAB 1: Manage Branches, Managers & Stock Dispatch

• Create a Branch: Enter Branch Name and Location and click '+ Create Branch'.

• Assign a Branch Manager (Including Main HQ): Click the green User+ icon on any branch card (including Main HQ) to generate a single-use 7-day setup link (or assign credentials directly) and share it via WhatsApp or Email.

• Edit, Deactivate (Cut Off), Activate, or Delete an Existing Manager: Every branch card with a manager displays quick lifecycle buttons:

  - 'Edit Manager': Update their name, email, phone, or reset their password.

  - 'Deactivate' / 'Activate': Immediately cut off a manager's Web session and WhatsApp POS access (shows 'Deactivated / Cut Off' badge), or restore them in 1 click.

  - 'Delete Manager': Permanently remove a departed manager's account from the branch while preserving all historical branch sales.

• Configure Branch Security & Sales-Only Permissions: Click the Shield icon on any branch card to choose a 1-click preset:

  - 'Sales-Only Cashier (HQ Issues Stock)': Manager can ONLY record sales at HQ's locked prices; cannot add, import, edit, or delete products or records.

  - 'Standard Branch Manager' or 'Full Branch Supervisor', plus custom toggles and Max Single Expense Limit (RWF).

• Multi-Item Stock Dispatch from Main HQ: Click the Package icon on any branch card to select multiple Main HQ products, add quantities to a Dispatch Batch with a handover note, and transfer stock atomically while logging the handover history.

TAB 2: Branch Stock, Profit & Activity Inspector (Zero Branch-Switching Required)

• Compare All Branches Mode: View the company-wide summary strip (#1 Most Profitable Branch, Total Company Net Profit, Total Stock Valuation, Low-Stock Alerts), the visual Branch Performance Comparison Bar Graph (switchable by Net Profit, Sales Revenue, Stock Valuation, or Units Sold), side-by-side branch comparison cards, and the Cross-Branch Top Products Matrix.

• Single-Branch Deep Inspector Mode: Click any branch pill (or 'Inspect Deep') to view that branch's 4 KPI cards, Most Bought Products leaderboard, full Branch Product Stock & Valuation Ledger (filterable by All, Low Stock, Out of Stock, Top Performers), and the Chronological Action & Activity History Timeline showing exact Day of Week, Date, Time, Actor, and Action.

• Combined Time Period & Day-of-Week Filters: Filter everything by 'Today', 'Last 7 Days', 'This Month', or 'All Time' AND by specific days of the week ('All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').

---
