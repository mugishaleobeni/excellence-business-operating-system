# Excellence Business Operating System (ExBOS) — Complete User Guide & Operations Manual

**Publisher:** PYLARIX · Kigali, Rwanda  
**Web App:** https://exbos.pages.dev  
**Updated:** November 23, 2026  

---

## Table of Contents
1. [Platform Overview & Getting Started (7-Step Registration & Login)](#1-platform-overview--getting-started)
2. [Installing the Offline PWA App (Phone & PC) & Language Switching](#2-installing-the-offline-pwa-app--language-switching)
3. [The 6 Business Architectures & Specialized Modules](#3-the-6-business-architectures)
4. [Overview Dashboard, Cash Flow Graph & Live Executions](#4-overview-dashboard-cash-flow-graph--executions)
5. [Products, Inventory, Camera Barcode Scanner & Low-Stock Alerts](#5-products-inventory--camera-barcode-scanner)
6. [Sales, POS Checkout, Receipts & Customer Credit Tracking](#6-sales-pos-checkout--customer-credit)
7. [Intelligent Purchasing & Financial Awareness Engine](#7-intelligent-purchasing--financial-awareness-engine)
8. [Where Is My Money? (8-Bucket Cash & Profit Reconciliation)](#8-where-is-my-money-8-bucket-reconciliation)
9. [Optional RRA Tax-Ready Compliance & Accountant Export Pack](#9-optional-rra-tax-ready-compliance--export-pack)
10. [Documents, Quotations, Invoices, WhatsApp & Email Sharing](#10-documents-quotations-invoices--sharing)
11. [Multi-Branch Control, Stock Transfers & Team Role Permissions](#11-multi-branch-control--team-permissions)
12. [Subscription Plans, Mobile Money Billing & Super Admin Governance](#12-subscription-plans-billing--super-admin-governance)

---

## 1. Platform Overview & Getting Started
**Excellence Business Operating System (ExBOS)** connects inventory, purchasing, sales, received payments, customer debts, supplier payables, operating expenses, and cash flow into one strictly isolated, audited workspace per business.

### 7-Step Guided Registration
1. **Account Credentials:** Full name, business email, WhatsApp phone number, and Argon2id-hashed password.
2. **Email Verification:** Enter the 6-digit email code or click **Verify Email Instantly** / **Copy Code & Auto-Fill** from the branded ExBOS email.
3. **Business Architecture:** Choose Make & Sell, Buy & Sell, Services, Agriculture & Livestock, Food & Hospitality, or Hybrid.
4. **Business Profile:** Business name, category, location, and currency (RWF).
5. **Workspace Configuration:** Confirm modules and language (English or Kinyarwanda).
6. **Subscription Plan:** Choose Free or a Paid plan (Bronze / Silver / Gold). For paid plans, pay via **0781 963 981 (+250 781 963 981)** and paste your payment confirmation SMS message copy or upload a screenshot.
7. **Complete Setup:** Workspace starts cleanly at **0 RWF** with zero leaked or demo data.

### Login, 2-Step Verification & Password Recovery
- Sign in at `/login`.
- Enable **2-Step Email Verification** in *Settings -> Business Profile* for 6-digit OTP protection on every login.
- Use **Forgot Password?** to reset via a 6-digit email code or verified reset link.

---

## 2. Installing the Offline PWA App & Language Switching
- **Install on Phone or PC:** Tap **Install ExBOS App** (Android/Chrome/Edge) or *Share -> Add to Home Screen* (iOS Safari).
- **Live Cloud Sync:** Entries added on your phone automatically sync to your PC dashboard in real time.
- **Offline Queue:** Works during temporary internet drops and syncs once reconnected.
- **English & Kinyarwanda:** Switch languages anytime from the top header or Settings.

---

## 3. The 6 Business Architectures
- **01. Make & Sell:** Raw Materials, Recipes/BOM, Production Batches with shortage alerts, Finished Goods, Purchases, Sales.
- **02. Buy & Sell:** Product Catalog, Barcode/SKU, Stock & Expiry, POS Sales, Intelligent Purchases, Customer & Supplier Credit.
- **03. Service-Based:** Service Catalogue, Bookings/Jobs, Staff Commissions, Consumables, Deposits.
- **04. Agriculture & Livestock:** 18-species Animal Registry, Gestation Tracking, Feed Stock & Feeding Logs, Vet Health, Yield Sales.
- **05. Food & Hospitality:** Menu Items, Kitchen Ingredients, Kitchen Orders, Rooms & Guest Folios, Waste Logs.
- **06. Hybrid Business:** Combine retail, services, food, and production with Mixed Cart Checkouts.

---

## 4. Overview Dashboard, Cash Flow Graph & Executions
- **Strict Zero-Base Isolation:** Every new account starts at `0 RWF` and only displays its own records.
- **Cash Flow Curve Chart:** Supports Area Spline, Comparative Bars, Cumulative Runway, and Net Velocity Waterfall across Days, Weeks, and Months (with smooth horizontal scroll on mobile).
- **Mobile Quick Links & Business Alerts:** Jump directly to New Sale, New Product, or New Expense, and inspect live alerts from the top Notification Bell drawer.

---

## 5. Products, Inventory & Camera Barcode Scanner
- Track SKU, barcode, unit cost, selling price, opening stock, low-stock threshold, and expiry dates.
- Use the built-in **Camera Barcode/QR Scanner** on phone or laptop to look up or register items instantly.
- Sales automatically deduct stock; received purchases automatically restock inventory.

---

## 6. Sales, POS Checkout & Customer Credit
- Supports **Paid in Full**, **Part-Paid**, and **Unpaid (Customer Credit)** across Cash, MTN MoMo Business, Airtel Money, and Bank Transfer.
- Unpaid credit sales increase Sales Revenue and Customer Receivables without inflating available spendable cash.

---

## 7. Intelligent Purchasing & Financial Awareness Engine
Every purchase evaluates inventory, open POs, sales velocity, supplier prices, and real cash affordability in real time:

```
Available Purchasing Budget = Available Business Cash (Cash + MoMo + Bank)
                            - Reserved Operational Funds (15% OpEx + unpaid bills)
                            - Existing Open Purchase Order Commitments
Purchase Shortfall          = Immediate Cash Outlay - Available Purchasing Budget
```

### Key Features
- **Stock Velocity & Open PO Check:** Flags `0` stock, shows days of sales coverage, warns if units are already on an open Purchase Order, and alerts when another supplier previously offered a lower price.
- **1-Click Shortfall Resolutions:**
  1. **I have other side money I can add (+X RWF):** Adds owner side funds as an audited capital top-up inflow so cash stays reconciled.
  2. **Reduce quantity to affordable units.**
  3. **Split into Part-Paid + Supplier Credit.**
  4. **Save as Open Purchase Order (pay on delivery).**
- **PO vs. Received Inventory:** Open Purchase Orders do not add shelf stock until marked *Partially Received* or *Received*.

---

## 8. Where Is My Money? (8-Bucket Reconciliation)
Separates **Cash in Hand**, **Mobile Money**, **Bank Accounts**, **Stock & Materials (Non-Spendable)**, **Owed to Me (Customer Debts)**, **Money I Owe (Supplier Payables)**, **Gross & Net Profit**, and **Available Purchasing Budget**.

---

## 9. Optional RRA Tax-Ready Compliance & Export Pack
- **Opt-In Master Switch:** Enable or disable anytime in *Settings -> Tax & RRA Profile*.
- Tracks 9-digit RRA TIN, tax regime (Flat, 3% Turnover Tax, or 18% VAT Real Regime), Output VAT, Claimable Input VAT, and Net VAT Payable.
- Export **RRA Sales Annex CSV**, **Purchases Annex CSV**, and **Expenses CSV**, or email the branded summary pack straight to your accountant.

---

## 10. Documents, Quotations, Invoices & Sharing
- Create Quotations, Commercial Invoices, Payment Receipts, and Credit Notes.
- Convert Quotations to Invoices in 1 click.
- Share via WhatsApp, Gmail SMTP, printable PDF, or secure public verification links.

---

## 11. Multi-Branch Control & Team Permissions
- Create isolated sub-branches under Main HQ, invite Branch Managers, transfer stock from HQ to branches, set per-branch permissions and expense limits, or Freeze branches instantly.
- Track daily cross-branch activity via the **Main HQ · Branch Activity & Best Performer** heatmap and ranking panel.

---

## 12. Subscription Plans, Billing & Super Admin Governance
- **Plans:** Free (0 RWF), Bronze (10,000 RWF/mo), Silver (20,000 RWF/mo), Gold (40,000 RWF/mo).
- **Official Payment Number:** `0781 963 981` (`+250 781 963 981`) — MTN MoMo / Airtel Money.
- **Super Admin (`/super-admin`):**
  - Inspect user payment confirmation SMS copies & screenshots.
  - Approve upgrades, extend plans (`+30d Renew`), or **Revoke Payment** on corrupt/invalid proof.
  - **Live Renewal Countdown** showing days/hours remaining.
  - **Instant Real-Time Suspension:** Suspending a user immediately blocks API access and logs them out even while actively working.
  - **Permanent User Deletion** with immutable audit logging.
  - **System Health Diagnostics & Auto-Reported Error Inbox.**
