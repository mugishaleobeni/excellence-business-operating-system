# ExBOS Multi-Branch Executive Intelligence & Stock Command Guide

**Document Version:** 1.0  
**Module:** Settings -> Branch Management (`Branches, Managers & Security` + `Branch Intelligence, Stock & Audit`)  
**Audience:** Business Owners, Executive Directors, Operations Managers, and Product Documentation Teams  

---

## 1. Executive Summary

In a growing multi-branch business, the **Business Owner** does not sit behind the counter selling products — even **Main HQ** often has its own dedicated Branch Manager or Cashier. Instead, the Business Owner operates **above all locations** (Main HQ + all sub-branches) and needs instant visibility without manually switching into each branch one by one.

The **ExBOS Multi-Branch Executive Intelligence & Stock Command Center** gives the Business Owner a unified control room to:

1. **Manage Every Branch & Manager (Including Main HQ):** Create branches, assign/edit/deactivate/activate/remove branch managers (including a manager for Main HQ), apply 1-click **Sales-Only Cashier** permissions, and dispatch multi-item stock batches from HQ.
2. **Inspect Any Single Branch in Deep Detail (Zero Branch-Switching Required):** View every product's live stock quantity, purchase cost valuation, retail valuation, low-stock / out-of-stock alerts, today's most-bought products, smart restock predictions, and a chronological action audit history (`Who · What Action · Day of Week, Date & Exact Time`).
3. **Compare All Branches Side-by-Side (Graph & Matrix):** Visually compare branches by **Net Profit Earned**, **Total Sales Revenue**, **Expenses**, and **Stock Valuation**, and see which products perform best in each location.
4. **Filter by Time Period & Day of the Week:** Filter all branch metrics, top-bought products, profit graphs, and action histories by **Time Period** (`Today`, `Last 7 Days`, `This Month`, `All Time`) **AND** by **Day of the Week** (`All Days`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`) to discover peak trading days per branch.

---

## 2. Core Operational Scenarios

### Scenario A: Business Owner Above Main HQ & Sub-Branches
- The Business Owner assigns a **Branch Manager / Cashier** to **Main HQ** as well as to each sub-branch (`Remera Branch`, `Musanze Branch`, etc.).
- Each manager can be placed in **Sales-Only Cashier Mode** (`canAddInventory: false`, `canEditProducts: false`, `canDeleteProducts: false`, `canEditPrices: false`, `canDeleteRecords: false`), meaning they only sell stock issued to their branch at the exact selling price set by the Owner.
- The Business Owner views the entire empire from the **Branch Intelligence, Stock & Audit** tab.

### Scenario B: Deep Single-Branch Inspection
When the Business Owner selects a specific branch (e.g., `Main HQ` or `Musanze Branch`), ExBOS displays:

1. **Branch Stock & Profit KPI Cards:**
   - **Products & Total Units:** Total distinct products and total physical units currently on the shelf in that branch.
   - **Branch Stock Cost Valuation (RWF):** $\sum (\text{Quantity Left} \times \text{Purchase Cost})$.
   - **Branch Retail Valuation & Expected Margin (RWF):** $\sum (\text{Quantity Left} \times \text{Selling Price})$.
   - **Low-Stock / Out-of-Stock Count & Period Net Profit:** Immediate health indicator for the selected branch.

2. **Most Bought Products & Demand Velocity ("Deep Product Intelligence"):**
   - Ranks the products most bought in that branch during the selected period and day of the week (e.g., *Today* or *Saturdays*) by **Units Sold**, **Sales Revenue (RWF)**, and **Net Profit Earned (RWF)**.
   - **Smart Restock Recommendation:** Flags fast-moving products whose current branch stock is running low relative to their daily buying speed, with a 1-click **Dispatch Stock from HQ** action.

3. **Branch Product Stock & Valuation Ledger (Desktop Table + Mobile Cards):**
   - Filterable by: `All Branch Stock` | `Low Stock` | `Out of Stock` | `Top Performers`.
   - Columns / Card metrics: Product Name, Category & SKU, **Quantity Left**, **Purchase Price**, **Selling Price**, **Stock Valuation (RWF)**, **Units Sold (Selected Period)**, **Profit Earned (RWF)**, and Stock Status.

4. **Chronological Branch Action & Audit History (`Day · Date · Time · Actor · Action`):**
   - Complete activity log for that branch showing:
     - **Day of Week, Date & Exact Time** (e.g., `Monday, 2026-11-28 · 14:35`)
     - **Actor** (Branch Manager / Cashier name or Business Owner)
     - **Action Category** (`Sale Recorded`, `Expense Logged`, `Stock Dispatched`, `Product / Price Audit`, `Cashier Shift`)
     - **Details & Amount (RWF)**

### Scenario C: Multi-Branch Head-to-Head Comparison (2+ Branches)
When the Business Owner selects **Compare All Branches**:

1. **Profit & Revenue Comparison Bar Graph:**
   - Visual side-by-side comparison of every branch by **Net Profit Earned (RWF)**, **Sales Revenue (RWF)**, **Expenses (RWF)**, and **Stock Valuation (RWF)**.
   - Automatically highlights the **#1 Most Profitable Branch** and **#1 Top-Selling Branch** for the selected period and day of week.
2. **All-Branches Deep Comparison Table / Cards:**
   - Compares every branch across: Assigned Manager & Status, Product Count, Total Units in Stock, **Stock Valuation (RWF)**, **Low-Stock Alerts**, **Out-of-Stock Count**, **Sales Count**, **Total Revenue (RWF)**, **Net Profit (RWF)**, **Profit Margin %**, and **#1 Best-Performing Product**.
3. **Cross-Branch Product Winners Matrix:**
   - Shows the top-performing products across the company and which branch sells the most of each product, helping the Owner rebalance stock between branches.

---

## 3. Time Period & Day-of-Week Filtering

Every metric, product ranking, comparison graph, and action history log in the Branch Intelligence Center responds live to two combined filters:

| Filter Type | Options | Business Purpose |
| :--- | :--- | :--- |
| **Time Period** | `Today` · `Last 7 Days` · `This Month` · `All Time` | Inspect live daily sales or monthly/cumulative branch profitability. |
| **Day of Week** | `All Days` · `Monday` · `Tuesday` · `Wednesday` · `Thursday` · `Friday` · `Saturday` · `Sunday` | Identify which products and branches perform best on specific days of the week (e.g., comparing Monday vs. Saturday sales and actions). |

---

## 4. Security & Role Isolation

- **Business Owner Only:** The Multi-Branch Executive Intelligence Center, cross-branch comparison graphs, and manager lifecycle controls are restricted strictly to the **Business Owner** (`isBranchManager === false`).
- **Branch Manager Isolation:** A Branch Manager (whether assigned to a sub-branch or to Main HQ) is locked strictly to their assigned branch and respects their branch's granular action permissions (`Sales-Only`, price locks, deletion locks, and expense caps).

