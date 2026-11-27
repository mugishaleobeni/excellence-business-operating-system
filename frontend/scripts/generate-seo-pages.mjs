/**
 * Post-build Static SEO Pre-Generator for Cloudflare Pages.
 * Generates dedicated dist/<route>/index.html files for every public SEO route with:
 *   - Unique <title> & <meta name="description">
 *   - Exact self-referencing <link rel="canonical"> (fixes Google duplicate-canonical de-indexing!)
 *   - Route-specific Open Graph, Twitter Card & BreadcrumbList JSON-LD
 *   - Crawlable semantic HTML inside <div id="root"> (seamlessly replaced on React hydration)
 */

import fs from 'node:fs'
import path from 'node:path'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const BASE_URL = 'https://exbos.pages.dev'

const SEO_ROUTES = [
  {
    route: '/',
    title: 'ExBOS — #1 Business Operations, POS & Inventory Software in Rwanda | By PYLARIX',
    description:
      "ExBOS (Excellence Business Operations System) by PYLARIX is Rwanda's all-in-one business management, POS, stock inventory, MTN MoMo cash-flow, WhatsApp POS, RRA tax-ready, and multi-branch profit software for SMEs.",
    h1: 'ExBOS — Build a Business That Survives and Grows in Rwanda',
    summary:
      'All-in-one business operations, POS, live stock inventory, MTN MoMo & Airtel Money cash-flow tracking, WhatsApp Business POS automation, RRA VAT 18% tax readiness, and multi-branch profit analytics built by PYLARIX for Rwandan and East African SMEs.',
    bullets: [
      '6 Dedicated Business Architectures: Make & Sell, Buy & Sell, Service-Based, Agriculture & Livestock, Food & Hospitality, and Hybrid.',
      'Where Is My Money 8-Bucket Cash, MTN MoMo, Airtel Money & Bank Reconciliation.',
      'Official WhatsApp Business POS: Record sales, restock inventory, edit/delete products, send unpaid customer reminders, and register accounts directly on WhatsApp in English & Kinyarwanda.',
      'Multi-Branch Control: Branch Manager logins, inter-branch stock transfers, branch freeze controls, and live Main HQ performance heatmaps.',
      'Forever Free Plan (0 RWF/mo), Bronze (10,000 RWF/mo), Silver (20,000 RWF/mo), and Gold (35,000 RWF/mo).'
    ]
  },
  {
    route: '/features',
    title: 'Features — POS, Inventory, WhatsApp Automation & MTN MoMo Tracking | ExBOS Rwanda',
    description:
      'Discover ExBOS features: Where Is My Money 8-bucket cash/MoMo/bank tracker, WhatsApp Business POS & debt reminders, multi-branch stock transfers, RRA VAT 18% invoicing, and real-time profit analytics.',
    h1: 'ExBOS Platform Features — Complete Business Control in Rwanda',
    summary:
      'Every operational, financial, and compliance tool a Rwandan SME needs in one bilingual (English & Kinyarwanda) cloud & offline-ready platform.',
    bullets: [
      'Live POS & Inventory Management with barcode/QR scanning, low-stock alerts, and automatic COGS profit calculation.',
      'Where Is My Money Dashboard separating Cash in Hand, MTN MoMo Business, Airtel Money, Bank Accounts, Customer Credit, and Supplier Payables.',
      'Official WhatsApp Business Console with mandatory verification before saving (YES / EDIT / NO) and automatic customer debt reminders.',
      'RRA Tax-Ready VAT 18% & EBM invoice formatting plus instant PDF/Excel export.'
    ]
  },
  {
    route: '/business-models',
    title: '6 Business Architectures — Retail, Manufacturing, Services, Farms & Hospitality | ExBOS',
    description:
      'Explore all 6 ExBOS business architectures tailored for Rwanda & East Africa: Make & Sell, Buy & Sell, Service-Based, Agriculture & Livestock, Food & Hospitality, and Hybrid Enterprises.',
    h1: 'Six Specialized Business Architectures in One Operating System',
    summary:
      'Unlike generic accounting tools, ExBOS adapts its modules, workflows, and KPIs to match your exact industry.',
    bullets: [
      'Make & Sell: Raw materials, production batches, recipes/BOM, and finished goods profit tracking.',
      'Buy & Sell: Retail, wholesale, pharmacy, electronics, barcode POS, and multi-branch stock transfers.',
      'Service-Based: Job cards, appointments, staff commissions, and service invoicing.',
      'Agriculture & Livestock: Herd/animal registry, feed & vet tracking, crop plots, and harvest yields.',
      'Food & Hospitality: Kitchen orders, menu costing, rooms/guest folios, and daily table turnover.',
      'Hybrid Business: Combine retail, manufacturing, services, or hospitality under one unified ledger.'
    ]
  },
  {
    route: '/business-models/make-and-sell',
    title: 'Make & Sell Software in Rwanda — Bakery, Tailoring & Manufacturing ERP | ExBOS',
    description:
      'Manage raw materials, production costs, recipes, finished goods stock, and true unit profit for bakeries, workshops, tailoring houses, and manufacturers in Rwanda with ExBOS.',
    h1: 'Make & Sell — Production & Manufacturing Software for Rwanda',
    summary:
      'Track raw material purchases, production batches, wastage, landed unit cost, and finished goods sales in RWF with real-time profit visibility.',
    bullets: [
      'Raw material stock deduction and finished product batch costing.',
      'Automatic unit profit margin calculation and loss warnings when cost exceeds selling price.',
      'Wholesale & retail order invoicing with MTN MoMo & WhatsApp receipts.'
    ]
  },
  {
    route: '/business-models/buy-and-sell',
    title: 'Buy & Sell POS & Inventory Software in Kigali, Rwanda — Retail & Wholesale | ExBOS',
    description:
      'Best POS, barcode inventory, supplier payables, customer credit, and multi-branch retail management software in Rwanda. Supports MTN MoMo, Cash, WhatsApp POS, and Kinyarwanda.',
    h1: 'Buy & Sell — Retail, Wholesale & Shop POS Software for Rwanda',
    summary:
      'Built for shops, supermarkets, pharmacies, electronics stores, hardware depots, and wholesalers across Kigali and Rwanda.',
    bullets: [
      'Fast POS checkout with barcode scanning, cash/MoMo/credit split, and instant stock deduction.',
      'Intelligent purchasing advisor showing affordability, stock velocity, and landed cost.',
      'Multi-branch stock transfers and isolated Branch Manager dashboards.'
    ]
  },
  {
    route: '/business-models/services',
    title: 'Service Business Management Software in Rwanda — Clinics, Salons & Agencies | ExBOS',
    description:
      'Track client bookings, service jobs, staff commissions, consumables, and paid/unpaid invoices for clinics, salons, garages, and agencies in Rwanda with ExBOS.',
    h1: 'Service-Based Business Operations Software for Rwanda',
    summary:
      'Run clinics, salons, repair workshops, consultancies, and agencies with structured job tracking, client billing, and automated payment reminders.',
    bullets: [
      'Client directory, service job cards, and recurring invoice tracking.',
      'Automated staff commission calculations and consumable cost tracking.',
      'WhatsApp payment reminders for unpaid client balances.'
    ]
  },
  {
    route: '/business-models/agriculture',
    title: 'Agriculture & Livestock Management Software in Rwanda — Dairy, Poultry & Farms | ExBOS',
    description:
      'Track livestock herds, milk & egg yields, feed & veterinary costs, crop plots, and agribusiness profit in Rwanda with ExBOS Agriculture & Livestock workspace.',
    h1: 'Agriculture & Livestock Agribusiness Software for Rwanda',
    summary:
      'Monitor dairy farms, poultry projects, crop cooperatives, and agro-dealers with live input-to-harvest profitability in RWF.',
    bullets: [
      'Individual animal registry, health/vaccination logs, and daily production yields.',
      'Crop field plots, fertilizer/seed input tracking, and harvest revenue analytics.',
      'Offline-ready field logging with automatic MongoDB cloud sync.'
    ]
  },
  {
    route: '/business-models/food-and-hospitality',
    title: 'Restaurant POS & Hotel Management Software in Rwanda — Cafes & Lodges | ExBOS',
    description:
      'Manage kitchen orders, menu items, ingredient stock, guest folios, and daily hospitality cash flow for restaurants, cafes, bars, and hotels in Kigali & Rwanda with ExBOS.',
    h1: 'Food & Hospitality — Restaurant POS & Hotel Operations for Rwanda',
    summary:
      'Control kitchen orders, recipe ingredients, room folios, and waiter/cashier accountability with live MTN MoMo and cash reconciliation.',
    bullets: [
      'Menu item costing and live ingredient inventory alerts.',
      'Fast kitchen order billing and guest folio management.',
      'Daily shift cash-up and multi-branch hospitality reporting.'
    ]
  },
  {
    route: '/business-models/hybrid',
    title: 'Hybrid Business Software in Rwanda — Multi-Activity Enterprise ERP | ExBOS',
    description:
      'Combine Retail, Manufacturing, Services, Agriculture, and Hospitality inside one unified ExBOS Hybrid workspace with consolidated P&L, cash flow, and multi-branch control.',
    h1: 'Hybrid Business Architecture — Combine Multiple Revenue Models',
    summary:
      'Built for diversified Rwandan enterprises running multiple business activities under one roof or across multiple branches.',
    bullets: [
      'Toggle any combination of ExBOS operational modules in one workspace.',
      'Consolidated cash flow, MTN MoMo, bank balances, and net profit reporting.',
      'Unified multi-branch analytics and staff access governance.'
    ]
  },
  {
    route: '/business-tools',
    title: 'Free Business Calculators for Rwanda — 6-Month Survival & Break-Even Tools | ExBOS',
    description:
      'Use free RWF business calculators built for Rwandan entrepreneurs: 6-Month Business Survival Planner, Break-Even Point Calculator, and Profit Margin Pricing Tool.',
    h1: 'Free Financial Survival & Break-Even Calculators (RWF)',
    summary:
      'Calculate your exact break-even sales target, 6-month runway, and safe product pricing margins in Rwandan Francs before spending capital.',
    bullets: [
      '6-Month Business Survival Planner for new and growing SMEs.',
      'Instant Break-Even Revenue & Unit Volume Calculator in RWF.',
      'Product Cost-to-Selling Price Profit Margin Calculator.'
    ]
  },
  {
    route: '/pricing',
    title: 'ExBOS Pricing in RWF — Forever Free, Bronze, Silver & Gold Plans | Rwanda',
    description:
      'Transparent ExBOS pricing in Rwandan Francs: Forever Free (0 RWF), Bronze Growth (10,000 RWF/mo), Silver Enterprise (20,000 RWF/mo), and Gold Corporate (35,000 RWF/mo). Pay via MTN MoMo or Airtel Money.',
    h1: 'Simple, Transparent ExBOS Pricing in Rwandan Francs (RWF)',
    summary:
      'Start on the Forever Free plan with zero risk, and upgrade anytime via MTN MoMo or Airtel Money as your branches and team grow.',
    bullets: [
      'Forever Free — 0 RWF/month: 1 branch, core sales/inventory/expense ledgers, and survival calculators.',
      'Bronze Growth — 10,000 RWF/month: 2 staff logins, WhatsApp POS automation, RRA Tax Pack, and full money buckets.',
      'Silver Enterprise — 20,000 RWF/month: Up to 5 branches, 10 staff logins, inter-branch stock transfers, and Google Drive sync.',
      'Gold Corporate — 35,000 RWF/month: Unlimited branches, unlimited staff, all 6 architectures, and 24/7 priority support.'
    ]
  },
  {
    route: '/about',
    title: 'About ExBOS & PYLARIX — Built in Kigali for Rwandan & African Businesses',
    description:
      'Learn about PYLARIX and the mission behind ExBOS (Excellence Business Operations System): helping Rwandan and African SMEs eliminate cash leaks, track true profit, and scale across branches.',
    h1: 'About ExBOS & PYLARIX — Beyond Technology, Solution Matters',
    summary:
      'Headquartered in Kigali, Rwanda, PYLARIX engineered ExBOS to give every shop, workshop, farm, clinic, and restaurant enterprise-grade operational discipline.',
    bullets: [
      'Built specifically for Rwandan Francs (RWF), MTN MoMo, Airtel Money, RRA VAT 18%, and bilingual English/Kinyarwanda teams.',
      'Designed for low-bandwidth mobile & offline-first reliability with instant cloud sync.',
      'Official WhatsApp Business Support & Onboarding: +250 792 946 680.'
    ]
  },
  {
    route: '/resources',
    title: 'SME Business Guides & Resources in Rwanda — Inventory, Cash Flow & RRA Tax | ExBOS',
    description:
      'Practical guides for Rwandan business owners: how to stop stock theft, separate MTN MoMo & cash profit, manage customer credit via WhatsApp, and stay RRA tax-ready.',
    h1: 'ExBOS Business Growth Resources & Operational Guides',
    summary:
      'Actionable playbooks for Rwandan entrepreneurs covering cash-flow discipline, inventory control, multi-branch delegation, and tax readiness.',
    bullets: [
      'How to Separate Revenue from True Spendable Profit Using the 8-Bucket Money Method.',
      'Preventing Branch Stock Leaks with Role-Based Permissions & Inter-Branch Transfers.',
      'Collecting Unpaid Customer Credit Faster with Automated WhatsApp Reminders.'
    ]
  }
]

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildBreadcrumbJsonLd(route) {
  const segments = route.split('/').filter(Boolean)
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` }
  ]
  segments.forEach((seg, idx) => {
    const acc = '/' + segments.slice(0, idx + 1).join('/')
    items.push({
      '@type': 'ListItem',
      position: idx + 2,
      name: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${BASE_URL}${acc}`
    })
  })
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  })
}

function buildCrawlableFallbackHtml(meta) {
  const navLinks = SEO_ROUTES.map(
    (r) => `<a href="${r.route}">${escapeHtml(r.route === '/' ? 'Home' : r.h1.split('—')[0].trim())}</a>`
  ).join(' · ')
  const listItems = meta.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')
  return `
      <main data-seo-static="true" style="max-width:960px;margin:0 auto;padding:48px 24px;font-family:Manrope,system-ui,sans-serif;line-height:1.6;">
        <header>
          <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.75;">ExBOS — Excellence Business Operations System by PYLARIX (Rwanda)</p>
          <h1 style="font-size:32px;font-weight:800;margin:12px 0;">${escapeHtml(meta.h1)}</h1>
          <p style="font-size:16px;opacity:0.9;">${escapeHtml(meta.summary)}</p>
        </header>
        <section style="margin-top:24px;">
          <h2 style="font-size:20px;font-weight:700;">Key Capabilities</h2>
          <ul>${listItems}</ul>
        </section>
        <nav aria-label="ExBOS Pages" style="margin-top:32px;font-size:14px;">
          ${navLinks} · <a href="/register">Create Free Account</a> · <a href="/login">Sign In</a>
        </nav>
      </main>`
}

function renderRouteHtml(baseHtml, meta) {
  const canonicalUrl = meta.route === '/' ? `${BASE_URL}/` : `${BASE_URL}${meta.route}`
  let html = baseHtml

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  )
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  )
  html = html.replace(
    /<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>/,
    `<link rel="alternate" hreflang="en" href="${canonicalUrl}" />`
  )
  html = html.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/,
    `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`
  )
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
  )
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
  )
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  )
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`
  )
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`
  )

  if (meta.route !== '/') {
    const breadcrumbTag = `\n    <script id="exbos-static-breadcrumb-ld" type="application/ld+json">${buildBreadcrumbJsonLd(meta.route)}</script>\n  </head>`
    html = html.replace('</head>', breadcrumbTag)
  }

  const loadingShellHtml = `
      <div style="min-height:100vh;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:32px;background:#03091F;background-image:radial-gradient(circle at 50% 38%,rgba(16,69,202,0.22) 0%,transparent 58%);color:#EAF2FF;font-family:Manrope,system-ui,sans-serif;box-sizing:border-box;">
        <div style="position:relative;width:128px;height:128px;animation:exbosRingPulse 4s cubic-bezier(0.4,0,0.6,1) infinite;">
          <div style="position:absolute;inset:0;border-radius:9999px;background:conic-gradient(from 0deg,transparent 0deg,#9EDCFF 90deg,transparent 180deg);mask:radial-gradient(circle at 50% 50%,transparent 35%,black 37%,black 39%,transparent 41%);-webkit-mask:radial-gradient(circle at 50% 50%,transparent 35%,black 37%,black 39%,transparent 41%);opacity:0.85;animation:exbosRingSpin 3s linear infinite;"></div>
          <div style="position:absolute;inset:0;border-radius:9999px;background:conic-gradient(from 0deg,transparent 0deg,#218DFF 120deg,rgba(16,69,202,0.55) 240deg,transparent 360deg);mask:radial-gradient(circle at 50% 50%,transparent 42%,black 44%,black 48%,transparent 50%);-webkit-mask:radial-gradient(circle at 50% 50%,transparent 42%,black 44%,black 48%,transparent 50%);opacity:0.95;animation:exbosRingSpin 2.5s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
          <div style="position:absolute;inset:0;border-radius:9999px;background:conic-gradient(from 180deg,transparent 0deg,rgba(158,220,255,0.65) 45deg,transparent 90deg);mask:radial-gradient(circle at 50% 50%,transparent 52%,black 54%,black 56%,transparent 58%);-webkit-mask:radial-gradient(circle at 50% 50%,transparent 52%,black 54%,black 56%,transparent 58%);opacity:0.45;animation:exbosRingSpinReverse 4s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
          <div style="position:absolute;inset:0;border-radius:9999px;background:conic-gradient(from 270deg,transparent 0deg,rgba(52,211,153,0.7) 20deg,transparent 40deg);mask:radial-gradient(circle at 50% 50%,transparent 61%,black 62%,black 63%,transparent 64%);-webkit-mask:radial-gradient(circle at 50% 50%,transparent 61%,black 62%,black 63%,transparent 64%);opacity:0.65;animation:exbosRingSpin 3.5s linear infinite;"></div>
        </div>
        <div style="text-align:center;max-width:240px;">
          <div style="font-size:16px;font-weight:500;line-height:1.2;letter-spacing:-0.01em;color:#EAF2FF;animation:exbosTextBreathe 3s cubic-bezier(0.4,0,0.6,1) infinite;">Loading ExBOS...</div>
          <div style="margin-top:8px;font-size:13px;line-height:1.45;color:rgba(158,220,255,0.7);animation:exbosSubBreathe 4s cubic-bezier(0.4,0,0.6,1) infinite;">Please wait while we prepare everything for you</div>
        </div>
      </div>
      <style>
        @keyframes exbosRingSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes exbosRingSpinReverse{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
        @keyframes exbosRingPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        @keyframes exbosTextBreathe{0%,100%{opacity:0.92}50%{opacity:0.65}}
        @keyframes exbosSubBreathe{0%,100%{opacity:0.68}50%{opacity:0.42}}
      </style>`

  html = html.replace(
    /<div id="root">[\s\S]*?(?=<\/body>)/,
    `<div id="root">${loadingShellHtml}\n    </div>\n    <noscript>${buildCrawlableFallbackHtml(meta)}\n    </noscript>\n  `
  )
  return html
}

const rootIndexPath = path.join(DIST_DIR, 'index.html')
if (!fs.existsSync(rootIndexPath)) {
  console.error('SEO generator error: dist/index.html not found. Run vite build first.')
  process.exit(1)
}

const baseHtml = fs.readFileSync(rootIndexPath, 'utf8')
let generatedCount = 0

for (const meta of SEO_ROUTES) {
  const rendered = renderRouteHtml(baseHtml, meta)
  if (meta.route === '/') {
    fs.writeFileSync(rootIndexPath, rendered, 'utf8')
  } else {
    const targetDir = path.join(DIST_DIR, meta.route.replace(/^\/+/, ''))
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(path.join(targetDir, 'index.html'), rendered, 'utf8')
  }
  generatedCount += 1
}

console.log(`SEO static pre-generator: built ${generatedCount} crawlable route HTML files in dist/.`)

