"""
Generator script for the Official ExBOS Complete User Guide & Operations Manual (PDF + Markdown).
Uses WeasyPrint to produce a clean, executive, Sapphire-themed PDF with the official ExBOS logo,
table of contents, architecture breakdowns, formulas, workflows, and Super Admin handbook.
"""

import os
from datetime import datetime
from pathlib import Path
import weasyprint

ROOT = Path("/home/engineer/ExBos")
DOCS_DIR = ROOT / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

LOGO_PATH = ROOT / "frontend" / "public" / "logo" / "exboslogo.png"
LOGO_URI = LOGO_PATH.as_uri() if LOGO_PATH.exists() else ""

PDF_OUT = DOCS_DIR / "ExBOS_User_Guide_Manual.pdf"
MD_OUT = DOCS_DIR / "ExBOS_User_Guide_Manual.md"
HTML_OUT = DOCS_DIR / "ExBOS_User_Guide_Manual.html"

GENERATED_DATE = datetime.now().strftime("%B %d, %Y")

HTML_DOC = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>ExBOS Complete User Guide &amp; Operations Manual</title>
<style>
  @page {{
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @top-left {{
      content: "EXCELLENCE BOS (ExBOS) — OFFICIAL USER GUIDE & OPERATIONS MANUAL";
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.8px;
    }}
    @bottom-left {{
      content: "PYLARIX · Kigali, Rwanda · exbos.pages.dev";
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 7.5pt;
      color: #64748B;
    }}
    @bottom-right {{
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #0A2786;
    }}
  }}
  @page :first {{
    margin: 0;
    @top-left {{ content: none; }}
    @bottom-left {{ content: none; }}
    @bottom-right {{ content: none; }}
  }}

  * {{ box-sizing: border-box; }}
  body {{
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #0F172A;
    font-size: 9.8pt;
    line-height: 1.55;
    margin: 0;
    padding: 0;
  }}

  /* Cover Page */
  .cover {{
    width: 210mm;
    height: 297mm;
    background: linear-gradient(155deg, #03091F 0%, #071544 50%, #0A2786 100%);
    color: #FFFFFF;
    padding: 28mm 22mm 22mm 22mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    position: relative;
  }}
  .cover-top {{
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid rgba(158, 220, 255, 0.28);
    padding-bottom: 18px;
  }}
  .cover-logo {{
    width: 56px;
    height: 56px;
    border-radius: 14px;
    border: 1.5px solid rgba(158, 220, 255, 0.5);
    background: #03091F;
  }}
  .cover-brand-title {{
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 2px;
    color: #FFFFFF;
  }}
  .cover-brand-sub {{
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 1.6px;
    color: #9EDCFF;
    text-transform: uppercase;
    margin-top: 2px;
  }}
  .cover-main {{
    margin-top: 28mm;
  }}
  .cover-badge {{
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(33, 141, 255, 0.22);
    border: 1px solid rgba(158, 220, 255, 0.45);
    color: #9EDCFF;
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }}
  .cover h1 {{
    font-size: 32pt;
    line-height: 1.15;
    font-weight: 900;
    margin: 0 0 14px 0;
    color: #FFFFFF;
    letter-spacing: -0.5px;
  }}
  .cover-desc {{
    font-size: 11.5pt;
    line-height: 1.65;
    color: #CBD5E1;
    max-width: 155mm;
    margin: 0 0 28px 0;
  }}
  .cover-grid {{
    display: table;
    width: 100%;
    border-collapse: separate;
    border-spacing: 10px 0;
    margin-left: -10px;
  }}
  .cover-card {{
    display: table-cell;
    width: 33.3%;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(158, 220, 255, 0.22);
    border-radius: 12px;
    padding: 14px;
    vertical-align: top;
  }}
  .cover-card-num {{
    font-size: 16pt;
    font-weight: 900;
    color: #218DFF;
    margin-bottom: 4px;
  }}
  .cover-card-label {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 3px;
  }}
  .cover-card-sub {{
    font-size: 7.8pt;
    color: #94A3B8;
  }}
  .cover-footer {{
    border-top: 1px solid rgba(158, 220, 255, 0.25);
    padding-top: 14px;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #9EDCFF;
  }}

  /* Typography */
  h2 {{
    font-size: 15.5pt;
    font-weight: 800;
    color: #071544;
    border-bottom: 2.5px solid #218DFF;
    padding-bottom: 6px;
    margin: 22px 0 12px 0;
    page-break-after: avoid;
  }}
  .chapter-num {{
    color: #218DFF;
    margin-right: 6px;
  }}
  h3 {{
    font-size: 11.5pt;
    font-weight: 800;
    color: #0A2786;
    margin: 14px 0 6px 0;
    page-break-after: avoid;
  }}
  p {{
    margin: 0 0 8px 0;
    color: #1E293B;
  }}
  ul, ol {{
    margin: 4px 0 10px 0;
    padding-left: 18px;
  }}
  li {{
    margin-bottom: 4px;
    color: #1E293B;
  }}

  /* Callout Boxes */
  .callout {{
    background: #F0F7FF;
    border-left: 4px solid #218DFF;
    border-radius: 0 10px 10px 0;
    padding: 11px 14px;
    margin: 10px 0 14px 0;
    page-break-inside: avoid;
  }}
  .callout-title {{
    font-size: 9pt;
    font-weight: 800;
    color: #071544;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 4px;
  }}
  .formula-box {{
    background: #071544;
    color: #FFFFFF;
    border: 1px solid #218DFF;
    border-radius: 10px;
    padding: 12px 16px;
    margin: 10px 0 14px 0;
    font-family: Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 9pt;
    line-height: 1.6;
    page-break-inside: avoid;
  }}
  .formula-box strong {{
    color: #9EDCFF;
  }}

  /* Tables */
  table.data-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 8.8pt;
    page-break-inside: avoid;
  }}
  table.data-table th {{
    background: #071544;
    color: #FFFFFF;
    text-align: left;
    padding: 8px 10px;
    font-weight: 700;
    font-size: 8.2pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  table.data-table td {{
    padding: 7.5px 10px;
    border-bottom: 1px solid #E2E8F0;
    vertical-align: top;
    color: #1E293B;
  }}
  table.data-table tr:nth-child(even) td {{
    background: #F8FAFC;
  }}

  /* TOC */
  .toc-box {{
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 18px;
  }}
  .toc-title {{
    font-size: 13pt;
    font-weight: 800;
    color: #071544;
    margin: 0 0 10px 0;
    border-bottom: 1.5px solid #218DFF;
    padding-bottom: 6px;
  }}
  .toc-item {{
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px dotted #CBD5E1;
    font-size: 9.4pt;
  }}
  .toc-item strong {{
    color: #0A2786;
  }}

  .page-break {{ page-break-before: always; }}
  .badge {{
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    background: #DBEAFE;
    color: #1E40AF;
    font-size: 7.8pt;
    font-weight: 700;
  }}
  .step-grid {{
    display: table;
    width: 100%;
    border-collapse: separate;
    border-spacing: 8px;
    margin: 6px -8px 12px -8px;
  }}
  .step-cell {{
    display: table-cell;
    width: 50%;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 10px 12px;
    vertical-align: top;
  }}
</style>
</head>
<body>

<!-- ==================== COVER PAGE ==================== -->
<div class="cover">
  <div>
    <div class="cover-top">
      {f'<img src="{LOGO_URI}" class="cover-logo" alt="ExBOS Logo" />' if LOGO_URI else ''}
      <div>
        <div class="cover-brand-title">EXCELLENCE BOS</div>
        <div class="cover-brand-sub">Business Operating System · By PYLARIX</div>
      </div>
    </div>

    <div class="cover-main">
      <div class="cover-badge">Official Platform Documentation · Version 2026</div>
      <h1>Complete User Guide &amp; Operations Manual</h1>
      <p class="cover-desc">
        The definitive operational handbook for business owners, branch managers, accountants, and
        administrators using Excellence Business Operating System (ExBOS). Covers all 6 Business
        Architectures, the Intelligent Purchasing &amp; Financial Awareness Engine, Where Is My Money
        reconciliation, RRA Tax-Ready Exports, Multi-Branch Security, Offline PWA, and Super Admin Governance.
      </p>

      <div class="cover-grid">
        <div class="cover-card">
          <div class="cover-card-num">06</div>
          <div class="cover-card-label">Business Architectures</div>
          <div class="cover-card-sub">Make &amp; Sell, Buy &amp; Sell, Services, Agriculture, Hospitality, Hybrid</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-num">8-Bucket</div>
          <div class="cover-card-label">Financial Clarity</div>
          <div class="cover-card-sub">Real Cash, MoMo, Bank, Stock, Receivables, Payables &amp; Budget</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-num">100%</div>
          <div class="cover-card-label">Cloud &amp; Offline PWA</div>
          <div class="cover-card-sub">Live phone &amp; PC sync with MongoDB Atlas &amp; camera barcode scan</div>
        </div>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <div><strong>Publisher:</strong> PYLARIX · Kigali, Rwanda</div>
    <div><strong>Web App:</strong> https://exbos.pages.dev</div>
    <div><strong>Updated:</strong> {GENERATED_DATE}</div>
  </div>
</div>

<!-- ==================== TABLE OF CONTENTS ==================== -->
<div class="toc-box">
  <div class="toc-title">Table of Contents</div>
  <div class="toc-item"><span><strong>Chapter 1.</strong> Platform Overview &amp; Getting Started (7-Step Registration &amp; Login)</span><span>Section 1</span></div>
  <div class="toc-item"><span><strong>Chapter 2.</strong> Installing the Offline PWA App (Phone &amp; PC) &amp; Language Switching</span><span>Section 2</span></div>
  <div class="toc-item"><span><strong>Chapter 3.</strong> The 6 Business Architectures &amp; Specialized Modules</span><span>Section 3</span></div>
  <div class="toc-item"><span><strong>Chapter 4.</strong> Overview Dashboard, Cash Flow Graph &amp; Live Executions</span><span>Section 4</span></div>
  <div class="toc-item"><span><strong>Chapter 5.</strong> Products, Inventory, Camera Barcode Scanner &amp; Low-Stock Alerts</span><span>Section 5</span></div>
  <div class="toc-item"><span><strong>Chapter 6.</strong> Sales, POS Checkout, Receipts &amp; Customer Credit Tracking</span><span>Section 6</span></div>
  <div class="toc-item"><span><strong>Chapter 7.</strong> Intelligent Purchasing &amp; Financial Awareness Engine</span><span>Section 7</span></div>
  <div class="toc-item"><span><strong>Chapter 8.</strong> Where Is My Money? (8-Bucket Cash &amp; Profit Reconciliation)</span><span>Section 8</span></div>
  <div class="toc-item"><span><strong>Chapter 9.</strong> Optional RRA Tax-Ready Compliance &amp; Accountant Export Pack</span><span>Section 9</span></div>
  <div class="toc-item"><span><strong>Chapter 10.</strong> Documents, Quotations, Invoices, WhatsApp &amp; Email Sharing</span><span>Section 10</span></div>
  <div class="toc-item"><span><strong>Chapter 11.</strong> Multi-Branch Control, Stock Transfers &amp; Team Role Permissions</span><span>Section 11</span></div>
  <div class="toc-item"><span><strong>Chapter 12.</strong> Subscription Plans, Mobile Money Billing &amp; Super Admin Governance</span><span>Section 12</span></div>
</div>

<!-- ==================== CHAPTER 1 ==================== -->
<h2><span class="chapter-num">01</span> Platform Overview &amp; Getting Started</h2>
<p>
  <strong>Excellence Business Operating System (ExBOS)</strong> is an all-in-one cloud business operating system
  engineered for Rwandan and East African enterprises. Unlike basic sales apps that mix revenue, credit, and cash,
  ExBOS connects inventory, purchasing, sales, received payments, customer debts, supplier payables, operating
  expenses, and cash flow into one strictly isolated, audited workspace per business.
</p>

<h3>1.1 Creating Your Account (7-Step Guided Registration)</h3>
<ol>
  <li><strong>Step 1 — Account Credentials:</strong> Enter your full name, business email address, WhatsApp-ready phone number, and a strong password (protected with Argon2id hashing).</li>
  <li><strong>Step 2 — Email Verification:</strong> ExBOS sends a branded email containing a 6-digit verification code plus two 1-click buttons: <em>Verify Email Instantly</em> and <em>Copy Code &amp; Auto-Fill</em>. Clicking the verified link automatically confirms your email across tabs and devices.</li>
  <li><strong>Step 3 — Choose Your Business Architecture:</strong> Select the exact operating model that fits your business (Make &amp; Sell, Buy &amp; Sell, Services, Agriculture &amp; Livestock, Food &amp; Hospitality, or Hybrid).</li>
  <li><strong>Step 4 — Business Profile:</strong> Enter your official Business Name, category, country, district/location, and default currency (RWF).</li>
  <li><strong>Step 5 — Configure Workspace:</strong> Confirm your primary operational modules and optional language preference (English or Kinyarwanda).</li>
  <li><strong>Step 6 — Choose Subscription Plan:</strong> Start on the <strong>Free</strong> plan or select a paid tier (Bronze, Silver, or Gold). For paid plans, ExBOS displays the official MTN MoMo / Airtel Money payment number (<strong>0781 963 981 / +250 781 963 981</strong>) and asks you to paste your payment confirmation SMS message copy or upload a screenshot proof to record your payment timestamp and activate your 30-day cycle.</li>
  <li><strong>Step 7 — Complete Setup:</strong> Your isolated zero-base workspace initializes at <strong>0 RWF</strong> with no fake or shared records, ready for your real entries.</li>
</ol>

<h3>1.2 Signing In, 2-Step Verification &amp; Password Recovery</h3>
<ul>
  <li><strong>Standard Login:</strong> Sign in at <code>/login</code> with your registered email and password. Sessions use encrypted JWT tokens synchronized with MongoDB Atlas.</li>
  <li><strong>Optional 2-Step Email Verification (2FA):</strong> Enable 2-Step Verification in <em>Settings &rarr; Business Profile</em> to require a 6-digit email OTP (with 1-click auto-fill link) on every login.</li>
  <li><strong>Forgot Password:</strong> Click <em>Forgot Password?</em> on the login page to receive a 6-digit reset code and verified reset link valid for 15 minutes.</li>
</ul>

<!-- ==================== CHAPTER 2 ==================== -->
<h2><span class="chapter-num">02</span> Installing the Offline PWA App &amp; Language Switching</h2>
<h3>2.1 Installable Progressive Web App (Phone &amp; PC)</h3>
<p>
  ExBOS is a full Progressive Web App (PWA). Installing it gives you a native app icon on your phone home screen
  or computer desktop, faster startup, and automatic offline resilience:
</p>
<ul>
  <li><strong>Android / Chrome / Edge:</strong> Tap the <strong>Install ExBOS App</strong> banner at the bottom of the screen (or browser menu &rarr; <em>Install App</em>).</li>
  <li><strong>iPhone / iPad (Safari):</strong> Tap the <strong>Share</strong> icon in Safari and select <em>Add to Home Screen</em>.</li>
  <li><strong>Live Phone &harr; PC Cloud Sync:</strong> Products, sales, and purchases entered on your phone automatically synchronize to your PC dashboard in real time whenever both devices are online.</li>
  <li><strong>Offline Resilience:</strong> If internet drops temporarily, entries are queued locally and synced automatically once connectivity returns.</li>
</ul>

<h3>2.2 Instant Language Switching (English &amp; Kinyarwanda)</h3>
<p>
  Use the Language Dropdown in the top header or <em>Settings</em> to switch instantaneously between
  <strong>English</strong> and <strong>Kinyarwanda</strong>. Currency amounts are also converted into readable words
  in your selected language.
</p>

<!-- ==================== CHAPTER 3 ==================== -->
<div class="page-break"></div>
<h2><span class="chapter-num">03</span> The 6 Business Architectures</h2>
<p>
  Every business operates differently. ExBOS adapts its sidebar navigation, inventory buckets, formulas, and KPIs
  to your chosen architecture while keeping all data isolated per business:
</p>

<table class="data-table">
  <thead>
    <tr>
      <th style="width:20%;">Architecture</th>
      <th style="width:28%;">Ideal For</th>
      <th style="width:52%;">Specialized Operational Modules</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>01. Make &amp; Sell</strong></td>
      <td>Bakeries, tailors, carpentry, fabrication, food processors</td>
      <td>Raw Materials Inventory, Recipes / Bill of Materials (BOM), Production Batches with automatic shortage checks, Finished Goods Stock, Raw Material Purchases, Sales &amp; Margin Tracking.</td>
    </tr>
    <tr>
      <td><strong>02. Buy &amp; Sell</strong></td>
      <td>Hardware shops, boutiques, wholesalers, pharmacies, electronics</td>
      <td>Product Catalog &amp; SKU/Barcodes, Stock Levels &amp; Expiry Tracking, POS Sales, Intelligent Purchases &amp; Open POs, Customer Credit Book, Supplier Payables.</td>
    </tr>
    <tr>
      <td><strong>03. Service-Based</strong></td>
      <td>Salons, clinics, auto garages, IT agencies, consultants</td>
      <td>Service Catalogue, Client Bookings &amp; Job Tickets, Staff Commissions, Service Consumables Stock, Deposits &amp; Balance Collections.</td>
    </tr>
    <tr>
      <td><strong>04. Agriculture &amp; Livestock</strong></td>
      <td>Dairy farms, poultry, piggery, crop &amp; livestock producers</td>
      <td>Individual &amp; Group Animal Registry (18 species), Breeding &amp; Gestation Countdown, Feed Stock &amp; Feeding Logs (auto-deducts kg), Vet Health Records, Milk/Egg/Harvest Yield Sales.</td>
    </tr>
    <tr>
      <td><strong>05. Food &amp; Hospitality</strong></td>
      <td>Restaurants, cafes, bars, hotels, guesthouses</td>
      <td>Menu Items &amp; Kitchen Ingredients, Live Kitchen Orders, Room Directory &amp; Guest Folios, Waste Logs, Combined Dining &amp; Lodging Cash Flow.</td>
    </tr>
    <tr>
      <td><strong>06. Hybrid Business</strong></td>
      <td>Tech store + repair shop, pharmacy + clinic, supermarket + cafe</td>
      <td>Toggle multiple business activities simultaneously with Unified Hybrid Items (physical stock + services) and Mixed Cart Sales Checkouts.</td>
    </tr>
  </tbody>
</table>

<!-- ==================== CHAPTER 4 ==================== -->
<h2><span class="chapter-num">04</span> Overview Dashboard, Cash Flow Graph &amp; Executions</h2>
<h3>4.1 Clean Zero-Base Architecture</h3>
<p>
  Every newly registered business starts at an exact <strong>0 RWF</strong> baseline across all KPI cards, charts,
  and execution lists. Tenant data is strictly scoped by authenticated user account so no other business's
  transactions can ever appear in your dashboard.
</p>

<h3>4.2 Interactive Cash Flow Curve Chart</h3>
<ul>
  <li><strong>4 Visualization Modes:</strong> Switch between <em>Area Spline</em>, <em>Comparative Dual Bars</em>, <em>Cumulative Runway</em>, and <em>Net Velocity Waterfall</em>.</li>
  <li><strong>Timeframe Switching:</strong> Inspect <em>Days (Last 7 Days)</em>, <em>Weeks (Last 4 Weeks)</em>, or <em>Months (12-Month Rolling Calendar)</em>. On mobile devices, the 12-month chart scrolls smoothly horizontally while keeping the Y-axis pinned and readable.</li>
  <li><strong>Period KPIs:</strong> Displays total period inflows, total outflows, net profit velocity percentage, and peak inflow period.</li>
</ul>

<h3>4.3 Mobile Quick Links &amp; Business Alerts Drawer</h3>
<ul>
  <li><strong>Quick Links:</strong> On mobile Overview, tap <em>New Sale</em>, <em>New Product</em>, <em>New Expense</em>, <em>Where Is Money</em>, or <em>Profit &amp; Loss</em> to jump straight into the exact form for your architecture.</li>
  <li><strong>Notification Bell (Business Alerts):</strong> Tap the bell icon in the top bar (desktop or mobile) to open the live Business Alerts drawer highlighting low-stock items, overdue customer debts, and unpaid supplier invoices.</li>
</ul>

<!-- ==================== CHAPTER 5 ==================== -->
<h2><span class="chapter-num">05</span> Products, Inventory &amp; Camera Barcode Scanner</h2>
<ul>
  <li><strong>Adding Products:</strong> Go to <em>Products &rarr; All Products</em> (or tap the <em>New Product</em> Quick Link) to record product name, category, SKU/barcode, unit of measure, opening stock, unit purchase cost, selling price, low-stock threshold, and optional expiry date.</li>
  <li><strong>Camera Barcode &amp; QR Scanner:</strong> Click the camera scan icon inside the Product or Sales modal to scan any product barcode or QR code directly with your phone or laptop camera—automatically looking up existing items or filling the SKU field.</li>
  <li><strong>Automatic Stock Synchronization:</strong> Recording a Sale automatically deducts sold quantity from inventory. Recording a <em>Received</em> Purchase automatically increments stock and updates the latest unit cost.</li>
  <li><strong>Low Stock &amp; Expiry Monitoring:</strong> Items at or below their <code>lowStockAlert</code> threshold automatically appear under <em>Products &rarr; Low Stock</em> and trigger Business Alerts.</li>
</ul>

<!-- ==================== CHAPTER 6 ==================== -->
<div class="page-break"></div>
<h2><span class="chapter-num">06</span> Sales, POS Checkout &amp; Customer Credit</h2>
<ul>
  <li><strong>Recording a Sale:</strong> Select a product from your catalog (unit price and available stock load automatically), enter quantity, choose customer (walk-in or named credit customer), and select the payment channel (<em>Cash</em>, <em>MTN MoMo Business</em>, <em>Airtel Money</em>, <em>Bank Transfer</em>, or <em>Customer Credit</em>).</li>
  <li><strong>Payment Status Separation:</strong>
    <ul>
      <li><strong>Paid in Full:</strong> Full sale amount increases both Sales Revenue and Actual Payments Received in your chosen cash/MoMo/bank channel.</li>
      <li><strong>Part-Paid:</strong> Only the cash paid today enters your liquid balance; the remaining unpaid portion is automatically added to <em>Customers &rarr; Outstanding Balances</em>.</li>
      <li><strong>Unpaid (Customer Credit):</strong> Increases Sales Revenue and Customer Receivables, but adds <strong>0 RWF</strong> to spendable cash until the customer actually pays.</li>
    </ul>
  </li>
  <li><strong>Collecting Customer Debt:</strong> Open <em>Customers &rarr; Outstanding Balances</em> or <em>Reports</em> and click <strong>Record Payment</strong> to collect full or partial debt repayments.</li>
</ul>

<!-- ==================== CHAPTER 7 ==================== -->
<h2><span class="chapter-num">07</span> Intelligent Purchasing &amp; Financial Awareness Engine</h2>
<p>
  ExBOS transforms purchasing from a passive form into a live financial advisor. Every time you open
  <strong>New Purchase</strong> (in Buy &amp; Sell, Make &amp; Sell, or any architecture), the engine evaluates your
  inventory, sales velocity, open purchase orders, supplier price history, and real cash affordability in real time.
</p>

<div class="formula-box">
  <strong>Available Purchasing Budget</strong> = Available Business Cash (Cash + MoMo + Bank)<br />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&minus; Reserved Operational Funds (default 15% of OpEx + unpaid bills)<br />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&minus; Existing Open Purchase Order Commitments<br />
  <strong>Purchase Shortfall</strong> = Immediate Cash Outlay &minus; Available Purchasing Budget
</div>

<h3>7.1 Live Assessment &amp; Smart Recommendations</h3>
<ul>
  <li><strong>Stock &amp; Demand Awareness:</strong> Alerts you when stock is <code>0</code> or below reorder level, estimates how many days of expected sales your current stock covers, and warns you if you already have units on an <strong>Open Purchase Order</strong> to prevent duplicate ordering.</li>
  <li><strong>Lower Supplier Price Alert:</strong> Compares your current unit cost against historical purchases and notifies you if another supplier previously offered a lower price.</li>
  <li><strong>1-Click Shortfall Resolution Options:</strong> Whenever a purchase exceeds your available purchasing budget, ExBOS clearly displays the shortfall and provides four 1-click resolutions:
    <ol>
      <li><strong>I Have Other Side Money I Can Add (+X RWF):</strong> Lets the business owner add personal/external side funds to afford the purchase. ExBOS records this as an audited <em>Owner Side Money / Capital Top-Up</em> inflow so your cash ledger stays 100% reconciled.</li>
      <li><strong>Reduce Quantity to Affordable Units:</strong> Automatically adjusts the order quantity to the maximum units your current budget can cover.</li>
      <li><strong>Pay Available Budget Now &amp; Put Remainder on Supplier Credit:</strong> Splits the invoice into <em>Part-Paid</em> so cash never goes negative while tracking supplier debt accurately.</li>
      <li><strong>Save as Open Purchase Order (Pay on Delivery):</strong> Records the commitment without immediate cash outflow and without adding stock until goods physically arrive.</li>
    </ol>
  </li>
</ul>

<h3>7.2 Purchase Orders vs. Received Inventory &amp; Partial Payments</h3>
<ul>
  <li><strong>Received Immediately:</strong> Adds full quantity to shelf stock immediately.</li>
  <li><strong>Purchase Order / In Transit:</strong> Tracks the order as an open commitment (<code>receivedQuantity = 0</code>). Stock increases only when you update the PO to <em>Partially Received</em> or <em>Received</em>.</li>
  <li><strong>No Double Deductions:</strong> Paying a supplier balance later via <em>Pay Supplier</em> updates the purchase's paid total and supplier payable balance without double-counting the original invoice cost.</li>
</ul>

<!-- ==================== CHAPTER 8 ==================== -->
<div class="page-break"></div>
<h2><span class="chapter-num">08</span> Where Is My Money? (8-Bucket Reconciliation)</h2>
<p>
  Located under <strong>Finance / Where Is My Money</strong>, this executive panel answers the single most important
  question for every business owner: <em>Where is my money sitting right now, and how much can I safely spend?</em>
</p>

<table class="data-table">
  <thead>
    <tr>
      <th style="width:28%;">Financial Bucket / Metric</th>
      <th style="width:72%;">What It Measures &amp; Why It Matters</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Cash in Hand (Till / Drawer)</strong></td>
      <td>Physical cash reconciled from cash sales, collections, and cash expenses/purchases.</td>
    </tr>
    <tr>
      <td><strong>Mobile Money (MTN MoMo / Airtel)</strong></td>
      <td>Liquid business mobile wallet balances separated from personal spending.</td>
    </tr>
    <tr>
      <td><strong>Bank Accounts (BK / Equity / BPR)</strong></td>
      <td>Reconciled bank transfer inflows and supplier/operating bank outflows.</td>
    </tr>
    <tr>
      <td><strong>Stock &amp; Materials (Non-Spendable)</strong></td>
      <td>Inventory sitting on shelves valued at purchase cost—shown beside cash, never added to spendable cash.</td>
    </tr>
    <tr>
      <td><strong>Owed to Me (Customer Debts)</strong></td>
      <td>Unpaid customer invoices tracked separately—never treated as spendable cash until collected.</td>
    </tr>
    <tr>
      <td><strong>Money I Owe (Supplier Payables)</strong></td>
      <td>Unpaid balances owed to vendors on received goods.</td>
    </tr>
    <tr>
      <td><strong>Gross Profit &amp; Net Profit</strong></td>
      <td><code>Gross Profit = Sales Revenue &minus; COGS</code>; <code>Net Profit = Gross Profit &minus; Operating Expenses</code>.</td>
    </tr>
    <tr>
      <td><strong>Available Purchasing Budget</strong></td>
      <td>Liquid cash minus operational safety reserves and open Purchase Order commitments.</td>
    </tr>
  </tbody>
</table>

<!-- ==================== CHAPTER 9 ==================== -->
<h2><span class="chapter-num">09</span> Optional RRA Tax-Ready Compliance &amp; Export Pack</h2>
<p>
  ExBOS includes an optional <strong>RRA Tax-Ready Pack</strong> designed specifically for Rwanda Revenue Authority
  (RRA) preparation. Businesses that are not yet ready for RRA reporting can leave it turned off—it is completely
  opt-in.
</p>
<ul>
  <li><strong>Opt-In / Opt-Out Master Switch:</strong> Navigate to <em>Settings &rarr; Tax &amp; RRA Profile</em> and toggle <strong>Enable RRA Tax-Ready Features</strong> on or off at any time.</li>
  <li><strong>Tax Profile Configuration:</strong> Enter your 9-digit RRA TIN, tax regime (<em>Flat / Micro</em>, <em>3% Quarterly Turnover Tax</em>, or <em>Real Regime — 18% VAT &amp; CIT/PIT</em>), VAT registration status, and EBM readiness.</li>
  <li><strong>RRA Tax Center (Reports &rarr; RRA Tax Center):</strong> View real-time Output VAT (18%), Claimable Input VAT, Net VAT Payable/Credit, Estimated 3% Turnover Tax, and Estimated Net Profit for any date range or branch.</li>
  <li><strong>1-Click CSV Exports &amp; Accountant Email:</strong> Download itemized <em>RRA Sales Annex CSV</em>, <em>RRA Purchases Annex CSV</em>, or <em>Expenses Ledger CSV</em>, or click <strong>Send Pack to Accountant</strong> to dispatch a branded ExBOS summary email directly to your accountant.</li>
</ul>

<!-- ==================== CHAPTER 10 ==================== -->
<h2><span class="chapter-num">10</span> Documents, Quotations, Invoices &amp; Sharing</h2>
<ul>
  <li><strong>Commercial Documents:</strong> Generate professional <em>Quotations (Proforma)</em>, <em>Commercial Invoices</em>, <em>Payment Receipts</em>, and <em>Credit Notes</em> customized with your business details and TIN.</li>
  <li><strong>1-Click Quote-to-Invoice Conversion:</strong> Draft price estimates as Quotations without affecting inventory or sales revenue; convert approved quotes into Commercial Invoices in one click.</li>
  <li><strong>WhatsApp, Email &amp; Secure Public Links:</strong> Share any document via WhatsApp, Gmail SMTP, printable PDF, or a verified public verification link (<code>/public/document/...</code>). All dispatches are logged in <em>Sent History</em>.</li>
</ul>

<!-- ==================== CHAPTER 11 ==================== -->
<div class="page-break"></div>
<h2><span class="chapter-num">11</span> Multi-Branch Control &amp; Team Permissions</h2>
<h3>11.1 Creating &amp; Managing Branches (Main HQ)</h3>
<p>
  Business owners on eligible plans can create isolated sub-branches in <em>Settings &rarr; Branches &amp; Multi-Location Control</em>:
</p>
<ul>
  <li><strong>Branch Isolation:</strong> Each branch maintains its own sales, purchases, expenses, and stock records while Main HQ views consolidated performance in the <strong>Main HQ · Branch Activity &amp; Best Performer</strong> dashboard card (Contribution Heatmap + Best Performing Branch Ranking).</li>
  <li><strong>Branch Manager Invitations:</strong> Assign a dedicated Branch Manager with their own login credentials. They receive a branded ExBOS email invitation and are automatically locked to their assigned branch.</li>
  <li><strong>HQ Security Controls:</strong> Configure per-branch permissions (<em>Can Delete Records</em>, <em>Can Edit Prices</em>, <em>Can View Profit Reports</em>, <em>Can Record Expenses</em>, and <em>Maximum Expense Limit in RWF</em>), require an Owner PIN to switch back to Main HQ, or <strong>Freeze</strong> a branch (read-only mode) instantly.</li>
  <li><strong>HQ-to-Branch Stock Transfers:</strong> Transfer inventory quantities from Main HQ directly into any sub-branch with automatic stock deduction at HQ and restock at the destination branch.</li>
</ul>

<h3>11.2 Team Members &amp; Role-Based Access</h3>
<p>
  Under <em>Settings &rarr; Team &amp; Permissions</em>, invite staff members (<em>Cashier</em>, <em>Store Manager</em>,
  <em>Accountant</em>, or <em>Branch Manager</em>) with granular module permissions. Staff members automatically
  inherit the owner's subscription tier.
</p>

<!-- ==================== CHAPTER 12 ==================== -->
<h2><span class="chapter-num">12</span> Subscription Plans, Billing &amp; Super Admin Governance</h2>
<h3>12.1 Subscription Tiers &amp; Mobile Money Activation</h3>
<table class="data-table">
  <thead>
    <tr>
      <th style="width:16%;">Plan Tier</th>
      <th style="width:18%;">Monthly Price</th>
      <th style="width:66%;">Key Capabilities &amp; Limits (Editable by Super Admin)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Free</strong></td>
      <td>0 RWF / mo</td>
      <td>1 Branch, up to 2 Staff, core catalog &amp; monthly sales quota, Where Is My Money dashboard, offline PWA.</td>
    </tr>
    <tr>
      <td><strong>Bronze</strong></td>
      <td>10,000 RWF / mo</td>
      <td>Expanded product &amp; monthly sales quotas, RRA Tax-Ready Pack unlock, full financial reports, document sharing.</td>
    </tr>
    <tr>
      <td><strong>Silver</strong></td>
      <td>20,000 RWF / mo</td>
      <td>Multi-branch support, expanded staff seats, advanced analytics, WhatsApp &amp; Gmail integrations, priority support.</td>
    </tr>
    <tr>
      <td><strong>Gold</strong></td>
      <td>40,000 RWF / mo</td>
      <td>Unlimited branches, unlimited staff, unlimited products &amp; sales, all 6 business architectures, executive SLA.</td>
    </tr>
  </tbody>
</table>

<div class="callout">
  <div class="callout-title">Official ExBOS Subscription Payment Details</div>
  Pay via <strong>MTN MoMo or Airtel Money</strong> to <strong>0781 963 981 (+250 781 963 981)</strong>. Paste your
  confirmation SMS message copy or upload a screenshot during signup or in <em>Settings &rarr; Subscription &amp; Billing</em>.
  Your payment timestamp and 30-day renewal countdown are tracked automatically.
</div>

<h3>12.2 Super Admin Platform Control Center (<code>/super-admin</code>)</h3>
<ul>
  <li><strong>Live Platform Analytics &amp; MRR:</strong> Tracks real registered businesses, active vs. suspended accounts, and Paid MRR strictly separated from Complimentary grants.</li>
  <li><strong>Payment Proof Review &amp; Corrupt Payment Revocation:</strong> View every user's submitted payment confirmation SMS message copy and uploaded screenshot directly in the <em>Users</em> and <em>Subscriptions</em> tabs. Approve pending upgrades for 30 days, extend with <em>+30d Renew</em>, or click <strong>Revoke Payment</strong> if a payment proof is corrupt/unverified (immediately reverting the workspace to Free and emailing the user).</li>
  <li><strong>Live Renewal Countdown:</strong> Every paid workspace displays exact days/hours remaining until renewal (<em>Active</em>, <em>Renew Soon</em>, or <em>Expired</em>).</li>
  <li><strong>Real-Time Account Suspension &amp; Permanent Deletion:</strong> Suspending a user immediately enforces a live server-side block across every API call and automatically logs the user out within seconds even while they are actively working. Administrators can also permanently delete non-admin accounts and all associated tenant data with an immutable audit log entry.</li>
  <li><strong>System Health &amp; Auto-Reported Error Inbox:</strong> Run 1-click live diagnostics across MongoDB Atlas, Email/2FA, WhatsApp API, and monitor automatic frontend/backend error reports.</li>
</ul>

</body>
</html>
"""

MD_DOC = f"""# Excellence Business Operating System (ExBOS) — Complete User Guide & Operations Manual

**Publisher:** PYLARIX · Kigali, Rwanda  
**Web App:** https://exbos.pages.dev  
**Updated:** {GENERATED_DATE}  

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
"""

MD_OUT.write_text(MD_DOC, encoding="utf-8")
HTML_OUT.write_text(HTML_DOC, encoding="utf-8")
weasyprint.HTML(string=HTML_DOC, base_url=str(ROOT)).write_pdf(str(PDF_OUT))

print(f"GENERATED PDF: {PDF_OUT} ({PDF_OUT.stat().st_size:,} bytes)")
print(f"GENERATED MD:  {MD_OUT} ({MD_OUT.stat().st_size:,} bytes)")
print(f"GENERATED HTML:{HTML_OUT} ({HTML_OUT.stat().st_size:,} bytes)")
