# EXCELLENCE BOS — Organized Documentation

Oct 17, 2026 · @Leobeni

**Product:** EXCELLENCE BOS (Excellence Business Operations System) · **Company:** Pylarix · **Stack:** React (Vite), Tailwind CSS, Python FastAPI, MongoDB Atlas

## 1. Design System — Pylarix Liquid Sapphire

Design EXCELLENCE BOS using the PYLARIX(IN Orbitron FONT) Liquid Sapphire visual identity. Use the provided six-stage glossy blue reference image as the primary color and material inspiration. The interface must feature a progressive palette from near-black navy through midnight blue, royal sapphire, electric blue, and luminous ice blue.

### 1.1 Colors

| Color | Hex |
| --- | --- |
| Abyss Navy | #03091F |
| Midnight Sapphire | #071544 |
| Royal Sapphire | #0A2786 |
| Electric Blue | #1045CA |
| Bright Sapphire | #218DFF |
| Ice Blue | #9EDCFF |

- **Light mode:** near-white background, frosted-white panels, dark sapphire text, and blue highlights.
- **Dark mode:** deep navy background, translucent sapphire panels, white text, and soft electric-blue accents.

### 1.2 Material and style

- Use realistic liquid-glass surfaces, reflective edges, smooth rounded shapes, and translucent white glassmorphism and  also blur. Avoid flat, generic blue gradients.
- Glassmorphism uses background blur, subtle transparency, fine borders, and restrained reflections.
- Use glossy sapphire accents sparingly on active navigation states, buttons, progress indicators, and selected elements.
- Apply the design consistently across the landing page, business tools, pricing, authentication, and dashboard.
- Support dark and light themes, responsive layouts, and reduced-motion accessibility.
- Implement AOS (Animate On Scroll) for scroll-based section reveals, with smooth fade-up animations, staggered card entrances, and subtle transitions.
- Use React with Vite, Tailwind CSS, and AOS. Keep animations lightweight and optimize for mobile performance.

### 1.3 Mandatory UI/UX guidelines and rules

All EXCELLENCE BOS interfaces must follow the Pylarix Liquid Sapphire Design System to maintain a consistent, premium, modern, and professional appearance.

- **Icons:** Never use emojis as interface icons. Use Lucide Icons (lucide-react) as the primary icon library. Font Awesome may be used only when a required icon is unavailable in Lucide. All icons must maintain consistent sizes, stroke weights, alignment, and visual appearance.
- **Color consistency:** Always use the official PYLARIX(IN Orbitron FONT) Liquid Sapphire color palette. Reference images are provided strictly for layout, structure, components, interactions, and animation inspiration. Never copy the color scheme of a reference image. Use EXCELLENCE BOS brand colors instead.
- **Glassmorphism:** Apply premium glassmorphism where appropriate, including navigation panels, dashboards, cards, forms, dropdowns, and modal dialogs. Use translucent surfaces, subtle background blur, delicate borders, soft small shadows, and sapphire reflections. Avoid excessive blur that reduces readability or performance.
- **Responsive design:** Every interface must adapt seamlessly to desktop, laptop, tablet, and mobile screens. All essential content must remain accessible without clipping, overlapping, unnecessary horizontal scrolling, or requiring users to scroll inside multiple nested containers. Prioritize fitting important dashboard information within the available viewport. When content exceeds the screen, allow natural vertical scrolling rather than shrinking or hiding information.
- **Smooth animations:** Use refined and lightweight animations for navigation, cards, popups, buttons, dropdowns, and page transitions. Animations must feel smooth, natural, and responsive. Use subtle fade, scale, slide, and sapphire-glow effects. Modal dialogs should open with elegant Lamp-inspired animations while the background gently blurs. Avoid excessive or distracting motion, and respect reduced-motion accessibility settings.
- **Premium user experience:** The interface must feel clean, polished, interactive, and intuitive. Maintain balanced spacing, consistent rounded corners, clear typography, accessible color contrast, responsive feedback, and predictable navigation. Decorative effects must never interfere with reading information, entering data, or completing business operations.
- **Final rule:** Every page, dashboard, form, card, table, modal, and navigation component must follow the same Liquid Sapphire visual identity. The final result should feel like one carefully designed commercial application, not a collection of unrelated templates.

## 2. Landing Page

### 2.1 Hero section

**Video background**

- Use the provided MP4 video as the full-screen hero background.
- Video must autoplay, loop continuously, remain muted, and play inline on mobile devices.
- Cover the hero area without stretching or distorting the video.
- Add a dark gradient overlay so text remains readable.
- Support responsive layouts on mobile, tablet, and desktop.
- Provide a fallback background image and respect reduced-motion preferences.
and also if video end add other show phone and computer laptop showing our dashboard in video here i will record my self 

**Hero content**

- **Eyebrow:** EXBOS 
- **Main heading:** Build a Business That Survives. And Grows.
- **Description:** Great businesses need more than great ideas. Understand your costs, manage your operations, track performance, and make smarter decisions with EXCELLENCE BOS.
- **Primary button:** Start Free
- **Secondary button:** Explore Business Tools
- **Supporting message:** Plan Smarter. Operate Better. Grow Stronger.

**User experience**

- Start Free opens registration.
- Explore Business Tools scrolls to the financial tools section.
- Visitors can view tools and enter values.
- Clicking Calculate or Analyse requires registration or login.
- After authentication, preserve entered values and continue the calculation.

**Design requirements**

- Modern, professional, cinematic appearance.
- Responsive typography and buttons.
- Smooth entrance animations.
- Text must remain readable in dark and light themes.
- Avoid heavy animations that reduce performance.
- Keep the hero message short and immediately understandable.
- The hero must feel cinematic and premium, with a distinctive sapphire visual composition, strong white typography, and clearly visible Start Free and Explore Business Tools actions.

### 2.2 Why EXCELLENCE BOS

**BUILD BUSINESS IDEAS THAT SURVIVE AND GLOW**

Great businesses need more than great ideas. Understand your costs, manage your operations, track performance, and make smarter decisions with EXCELLENCE BOS.

### 2.3 business archtecture 
# ExBOS — Interactive Business Architecture Showcase Design Prompt

Design and develop a premium, cinematic, scroll-interactive **Business Architecture Showcase** section for **ExBOS (Excellence Business Operations System)**, a product of PYLARIX(IN Orbitron FONT).

This section belongs on the public landing page and must help visitors understand the six different business models supported by ExBOS.

**Section headline:**
Built for the Way You Do Business.

**Supporting text:**
Every business operates differently. Discover how ExBOS adapts to the way you produce, sell, serve, and grow.

## 1. Overall Layout

Use the supplied travel website reference as inspiration for the composition and interactions, but do not copy its colors, brand identity, or imagery.

The section must have:

- A cinematic, full-screen background showing a business-related photograph or might be a video super admin can change the photograph or video.
- A dark sapphire overlay to ensure readable text.
- Large headings and descriptions on the left.
- Six circular business-image selectors arranged along a curved vertical path on the right.
- A highlighted active circle with a luminous sapphire border.
- A small progress indicator displaying the current architecture, for example `01 / 06`.
- A **See How It Works** button for each architecture.

The background image must always correspond to the currently selected business architecture.

## 2. Six Business Architectures

### 01 — Make & Sell

**Headline:** You Make It. We Help You Manage It.

**Description:** From raw materials to finished products, ExBOS helps manufacturers manage production, calculate costs, track inventory, and monitor sales.

**Suggested image:** A real entrepreneur working in a tailoring, furniture, bakery, or manufacturing workshop.
**Suggested video** super admin can add athat video that are according to that real entreprenuer working in tailoring, furniture ....
**Highlighted capabilities:** Production, raw materials, finished goods, sales, and profitability.

### 02 — Buy & Sell

**Headline:** Buy Smarter. Sell Better.

**Description:** Keep your purchases, suppliers, products, inventory, sales, and customer balances organized in one place.

**Suggested image:** An entrepreneur managing a retail shop, supermarket, boutique, or wholesale business and also super admin can update the image .
**Suggested video** super admin can add athat video that are according to that real entreprenuer working in retail shop , s....upermarket,..


**Highlighted capabilities:** Purchases, inventory, sales, suppliers, and profits.

### 03 — Service-Based Business

**Headline:** Your Skills. Your Business. Your Growth.

**Description:** Manage services, bookings, customers, invoices, and payments while staying focused on delivering excellent service.

**Suggested image:** A professional providing services in a salon, repair shop, consultancy, or workshop and note that admin can manage that image.
**Suggested video** super admin can add athat video that are according to that according to that architecture ....


**Highlighted capabilities:** Services, appointments, jobs, customers, and payments.

### 04 — Agriculture & Livestock

**Headline:** From Farm to Market, Stay in Control.

**Description:** Organize crops, livestock, farm expenses, production records, agricultural inventory, and sales.

**Suggested image:** A farmer working with crops or livestock in a real agricultural environment.
**Suggested video** super admin can add athat video that are according to that according to that architecture ....


**Highlighted capabilities:** Crops, livestock, farm inputs, production costs, and sales.

### 05 — Food & Hospitality

**Headline:** Serve Better. Waste Less. Earn More.

**Description:** Manage restaurant menus, recipes, ingredients, orders, expenses, and hospitality operations with greater clarity.

**Suggested image:** A professional chef preparing food in a restaurant or a hospitality team serving guests.
**Suggested video** super admin can add athat video that are according to that according to that architecture ....


**Highlighted capabilities:** Menus, recipes, orders, ingredient stock, and accommodation where enabled.

### 06 — Hybrid Business

**Headline:** Multiple Activities. One Powerful System.

**Description:** Combine product sales, services, production, and other business activities in one connected workspace.

**Suggested image:** An electronics shop offering sales and repairs or another business combining multiple activities.
**Suggested video** super admin can add athat video that are according to that according to that architecture ....


**Highlighted capabilities:** Multiple workflows, shared inventory, finance, and consolidated reports.

## 3. Scroll-Driven Architecture Transitions

This section must provide an immersive, controlled scrolling experience.

When visitors scroll:

1. Pin the showcase section while the visitor explores its six architectures.
2. Advance through the business architectures one at a time.
3. Smoothly crossfade the active full-screen background image.
4. Update the corresponding heading, description, and highlighted capabilities.
5. Animate the active circular image with a gentle scale and sapphire glow.
6. Update the architecture number and progress indicator.
7. Release the section after the sixth architecture so visitors can continue down the landing page.

**Important scrolling rule:** Fast mouse-wheel scrolling must not skip multiple business architectures unexpectedly. Use controlled progression with an appropriate transition duration, while avoiding excessive scroll locking or trapping the visitor.

Support reverse scrolling so visitors can return to previous architectures.

Users must also be able to select any architecture directly by clicking its circular image.

## 4. Circular Image Navigation

Each business architecture is represented by a circular image.

The circular selectors must:

- Display real, relevant business imagery.
- Follow an elegant curved arrangement similar to the reference.
- Use consistent sizing and spacing.
- Clearly indicate the active architecture.
- Have subtle hover effects.
- Be clickable and keyboard-accessible.
- Include accessible labels identifying each business model.
- Stay visible during transitions on desktop.

The active circle should appear slightly larger, with a soft electric-blue outer glow and liquid-glass reflection.

## 5. PYLARIX(IN Orbitron FONT) Liquid Sapphire Design Rules

Use ExBOS's official palette:

- Abyss Navy: `#03091F`
- Midnight Sapphire: `#071544`
- Royal Sapphire: `#0A2786`
- Electric Blue: `#1045CA`
- Bright Sapphire: `#218DFF`
- Ice Sapphire: `#9EDCFF`

Apply premium liquid glass and glassmorphism to appropriate elements, including the text container, progress indicator, circular navigation frames, and action buttons.

Use soft translucent surfaces, background blur, illuminated borders, subtle shadows, and carefully controlled sapphire reflections.

**Never copy the color scheme from the reference image.** Reference images are for composition, structure, and interaction behavior only.

Do not use emojis as interface icons. Use **Lucide React icons**, with Font Awesome only when a necessary icon is unavailable in Lucide.

## 6. Animation Requirements

Use **GSAP with ScrollTrigger** for the main scroll-driven business showcase.

Use AOS only for ordinary scroll-reveal effects elsewhere on the landing page.

Recommended animations:

- Background crossfade: approximately 0.6–0.9 seconds.
- Text reveal: subtle fade-up.
- Circular selector: scale and glow transition.
- Description: gentle vertical motion.
- Progress indicator: smooth update.
- Glass elements: restrained reflective hover effects.

Animations must feel smooth and premium, without sudden jumps, flashing, or unnecessary movement.

Respect reduced-motion preferences.

## 7. Responsive Behavior

**Desktop:** Full-screen background, left-aligned content, curved circular navigation on the right.

**Tablet:** Adapt the text width, reduce circular image sizes, and preserve the premium composition.

**Mobile:** Display readable headings, descriptions, and a horizontally scrollable row of circular selectors. Use a simpler, touch-friendly transition system rather than aggressive scroll pinning.

No content may be clipped, hidden behind navigation, or forced into unnecessary horizontal page scrolling.

## 8. See How It Works Interaction

Each architecture must include a **See How It Works** button.

When clicked, open a detailed architecture explanation showing:

- What type of business it supports.
- Typical business examples.
- Core workflows.
- Dashboard features.
- How ExBOS helps manage that business.

The information should remain accessible to visitors without requiring login.

A separate **Get Started** action should lead to registration and preselect the currently active business architecture.

## 9. Technology & Implementation

Use:

- React with Vite.
- Tailwind CSS.
- GSAP ScrollTrigger.
- Lucide React.
- Reusable architecture data and components.

Store the six architecture definitions in a structured data configuration rather than duplicating JSX.

Preload nearby background images, optimize image sizes, and provide graceful fallback behavior when animations or images fail.

Maintain semantic HTML, accessible focus states, and good mobile performance.

## 10. Expected Result

Deliver one visually memorable, fully responsive business architecture section that feels like an interactive journey through six ways of running a business.

It must combine:

**Cinematic photography + Liquid Sapphire glassmorphism + circular business selectors + controlled scrolling + clear business explanations.**

The section must communicate:

**Six Business Architectures. One Intelligent Platform.**

ExBOS by PYLARIX(IN Orbitron FONT) — Don't Just Run Your Business. Understand It.

### 2.3 Explore Business Tools section

The landing page contains a section to explore the features: business tools that teach and help the visitor calculate how much the business needs to earn to survive and grow. The tools are displayed publicly on the landing page under Explore Business Tools.

The section shows Break-Even Analysis, which contains fixed costs such as house rent, internet, and paying employees (if any), or anything else the business needs to continue. For example: rent + salary + electricity + software + internet = fixed monthly cost. Fixed monthly cost × 6 = safety budget. This tells you how much money you need to survive for 6 months even if sales are slow. That is what EXCELLENCE BOS comes to prove to the trusted user.

Before starting any business, calculate: fixed cost, product or service cost, marketing budget, break-even analysis, emergency fund setup, tax, and unexpected expenses. Many businesses do not fail due to bad ideas; they fail because the founder does not know the real cost of survival.

**Five tools in total**

| Tool | What it helps the visitor understand |
| --- | --- |
| Break-Even Calculator | Sales needed to cover operating costs |
| Startup Cost Calculator | Money required before opening |
| Survival Budget Planner | Cash reserves needed during slow sales |
| Pricing & Profit Calculator | Whether product/service pricing is sustainable |
| Emergency Fund Planner | Cash buffer for unexpected expenses |

**Enhancement of the section:** For each financial tool (Break-Even Analysis, Startup Cost Calculator, Survival Budget Planner, Pricing & Profit Calculator, Emergency Fund Planner), provide a concise, benefit-driven description. Include a visual element or icon for each tool and emphasize how they help users calculate earnings, understand costs, and ensure business survival and growth. For the Survival Budget Planner, explicitly mention the calculation: Fixed Monthly Costs × 6 = Safety Budget, explaining its purpose for surviving slow sales.

### 2.4 Pricing plan categories

1. Forever Free — Super Admin sets how much RWF.
2. Bronze — Super Admin sets how much RWF.
3. Silver — Super Admin sets how much RWF.
4. Gold — Super Admin sets how much RWF.
5. platinum membership — Admin assigns the number of referrals a user must bring to EXCELLENCE BOS, and chooses the prize given to that user, such as a discount on other PYLARIX(IN Orbitron FONT) products.

### 2.5 User count card

A card that displays the total users of the system that count user see it like 1,2 nd finally show him tatol, showing the total companies that are live from the database — not a guess, not a default.

### 2.6 Frequently Asked Questions

The landing page should include an FAQ section with questions such as:

**What is EXCELLENCE BOS?** EXCELLENCE BOS is a business operations platform designed to help businesses organize their daily activities, manage records, and understand financial performance.

**Can I use EXCELLENCE BOS for free?** Yes. The Free plan provides access to selected core features within defined usage limits.

**Can I change my subscription plan?** Yes. Businesses can request an upgrade or downgrade, subject to the applicable billing and subscription policies.

**What is the Break-Even Calculator?** It estimates the sales volume required to cover fixed and variable operating costs, helping entrepreneurs plan before starting or expanding a business.

**What is Diamond Membership?** Diamond is a configurable loyalty and referral reward program. Eligibility and available benefits are determined by published program rules.

**Can I use EXCELLENCE BOS on my phone?** The platform is intended to support responsive browser access on phones, tablets, and computers. This should be confirmed through device testing before launch.

**What happens if my subscription expires?** The intended policy is to preserve business records and restrict paid-only capabilities until renewal, rather than automatically deleting data.

## 3. Business Financial Tools

The module provides financial planning tools to help entrepreneurs understand business costs, estimate profitability, prepare for financial risks, and make informed decisions before starting or expanding a business. The tools are displayed publicly on the landing page under Explore Business Tools.

**Main objective:** Help entrepreneurs calculate before they invest, understand their true operating costs, and build financially sustainable businesses.

### 3.1 Available financial tools

**A. Break-Even Analysis Calculator**

Helps users calculate how many products or services they must sell to cover their operating costs.

- **Inputs:** fixed costs, selling price, variable cost per product/service.
- **Outputs:** break-even sales quantity, break-even revenue, and contribution margin.

**B. Business Survival Budget Calculator**

Estimates the money required to keep a business operating during periods of low sales.

- **Inputs:** rent, employee salaries, electricity, internet, software, and other monthly fixed expenses.
- **Outputs:** total monthly fixed costs; six-month fixed-cost reserve; estimated operating survival budget.
- **Formula:** Monthly Fixed Costs × 6 = Six-Month Fixed-Cost Reserve.

**C. Startup Cost Calculator**

Helps entrepreneurs estimate the initial capital required to start a business.

- **Inputs:** equipment, premises, inventory, registration, marketing, and other startup expenses.
- **Output:** estimated startup capital required.

**D. Pricing & Profit Calculator**

Helps users determine product or service profitability.

- **Inputs:** selling price, production/service costs, expected sales, and applicable expenses.
- **Outputs:** estimated revenue, gross profit, profit margin, and projected net profit where sufficient cost information is provided.

**E. Emergency Fund Calculator**

Helps businesses plan reserves for unexpected financial difficulties.

- **Inputs:** monthly operating expenses, desired reserve period, and existing savings.
- **Outputs:** emergency fund target and additional savings required.

### 3.2 Authentication requirements

- All visitors can view the financial tools and enter information.
- When a visitor clicks Calculate or Analyse, the system checks authentication.
- Unauthenticated visitors receive a Register or Login prompt.
- After successful authentication, the system returns the user to the selected calculator and preserves entered values.
- Authenticated users can calculate results according to their subscription permissions.
- Users can save and review their financial analyses.

### 3.3 Money input formatting

- If someone enters money in the system, add commas automatically, e.g. 1000000 becomes 1,000,000 RWF.
- At the bottom of each monetary input, show the entered amount in words, based on the money entered and the current language. For example: "one million Rwandan francs" in English, or "milioni imwe" if Kinyarwanda is selected.

### 3.4 Super Administrator controls

The Super Administrator can:

- Enable or disable financial tools.
- Assign tools to Free, Bronze, Silver, and Gold plans.
- Manage tool descriptions and educational content.
- View aggregate tool usage statistics.
- Configure supported financial assumptions without modifying validated calculation formulas.

### 3.5 Technical requirements

- Frontend must be responsive and must fit all devices.
- The system must validate financial inputs, enforce authentication and subscription access, calculate accurate results, and securely store saved analyses.
- **Important:** Financial results are estimates for business planning and must not be presented as guaranteed profits or business survival outcomes.

## 4. Authentication and Registration

### 4.1 Login page

Features:

- Business Email
- Password
- Show/Hide Password
- Stay signed in this device 
- Forgot Password
- Sign In
- Create Account

### 4.2 Registration flow — Get Started

**Step 1 — Create Account.** The user clicks Get Started on the landing page. The registration form asks for: Full Name, Email Address, Phone Number, Password, Confirm Password.

**Step 2 — Verify Email.** The system sends a verification code or link to the user's email address. The user verifies their account before continuing.

**Step 3 — Choose Business Architecture.** The system asks: *How does your business operate?* The user selects one of:

1. Make & Sell
2. Buy & Sell
3. Service-Based
4. Agriculture & Livestock
5. Food & Hospitality
6. Hybrid Business

**Step 4 — Register Business.** The user enters: Business Name, Business Category, Country and Location, Preferred Currency (RWF by default in Rwanda), Preferred Language (English or Kinyarwanda).

**Step 5 — Configure Business.** The system displays setup options based on the selected architecture. Examples:

- Buy & Sell: add products, stock, and suppliers.
- Make & Sell: add raw materials and finished products.
- Services: add services and their prices.
- Agriculture: register crops or livestock.
- Food & Hospitality: configure restaurant or accommodation operations.
- Hybrid: select multiple business activities.

Users may skip optional setup and complete it later.

**Step 6 — Choose Subscription.** Display available plans: Free, Bronze, Silver, Gold. Prices and features come directly from settings managed by the Super Administrator. Free users continue without payment. Paid users complete the required payment process before paid access is activated.

**Step 7 — Complete Registration.** The system:

- Saves the user account.
- Creates the business workspace.
- Saves the selected business architecture.
- Configures the appropriate dashboard navigation.
- Applies the subscription and permissions.
- Redirects the user to their personalized dashboard.

### 4.3 Forgot password flow

1. User clicks Forgot Password.
2. User enters their registered email.
3. System sends a secure, time-limited password reset link.
4. User creates a new password.
5. System invalidates applicable previous sessions.
6. User signs in again.

### 4.4 Authentication security

- Hash passwords securely using Argon2id.
- Never store passwords in plain text.
- Use secure HttpOnly cookies for authenticated sessions.
- Use HTTPS in production.
- Apply login rate limiting.
- Protect state-changing requests against CSRF when using cookies.
- Require email verification.
- Support secure logout and session expiration.
- Enforce business-level data isolation.
- Apply role-based permissions.
- Require stronger authentication, preferably MFA, for Super Administrators.
- Store audit records for important account and security changes.

### 4.5 Design requirements

All authentication and registration pages must use PYLARIX(IN Orbitron FONT) Liquid Sapphire styling:

- Deep sapphire blue backgrounds.
- Frosted white glassmorphism forms.
- Rounded input fields.
- Soft glowing blue borders.
- Floating user icon.
- Smooth transitions.
- Dark and light mode support.
- Fully responsive layouts.

### 4.6 Main user journey

**New users:** Landing Page → Get Started → Create Account → Verify Email → Choose Business Architecture → Register Business → Configure Workspace → Select Plan → Open Dashboard

**Returning users:** Landing Page → Sign In → Authentication → Business Selection (if needed) → Dashboard

If registration was triggered by a financial calculator, return the user to that calculator with their previous inputs preserved after authentication.

**Important:** Registration should feel like a guided setup rather than one long form. The user should see their progress, be able to go back, and continue an unfinished setup later.

## 5. Business Dashboard Features by Architecture

Oct 14, 2026 · @Leobeni

### 5.1 Where is my money?

Every dashboard opens with one screen that shows where all the owner's money sits right now, split into money in hand, money stuck in goods, money owed to the business, and money the business owes.

| Where the money is | What the owner sees | Problem it solves |
| --- | --- | --- |
| Cash in hand | Cash in the till or drawer, counted vs expected | Cash goes missing and nobody knows when |
| Mobile money (MoMo) | Balance per wallet or number | Wallet money gets mixed with personal use |
| Bank | Balance per account | Owner only learns the balance at the bank |
| Stock and materials | Value of goods on the shelf, raw materials, animals, crops | Money is sleeping in stock that does not sell |
| Owed to me | Customers who owe, how much, how many days late | Credit given and then forgotten |
| I owe | Suppliers, loans, wages, rent, with due dates | Late payments hurt supplier trust and credit |
| Money in projects or jobs | Spent so far vs received so far per job | Job looks fine while cash is drained |
| Business vs personal | What the owner took out for home needs | Business cash used for personal expenses |

**The one number at the top:** Money I really have = cash + MoMo + bank + money owed to me, minus money I owe. Stock value is shown next to it, not added in, because it is not spendable until sold.

**Movement view:** a simple "money in / money out" list per day, tagged by account (cash, MoMo, bank), so any difference between the books and the real balance can be traced to a day.

**Alerts tied to this screen:** cash below the safe minimum, a wallet or bank balance that does not match the records, a debt overdue by more than a set number of days, and personal withdrawals above the owner's own limit.

### 5.2 Shared core (every architecture)

These features answer the questions every owner has: "Am I really making profit? Where did my money go? Who owes me?"

| Feature | Problem it solves |
| --- | --- |
| Today's snapshot: money in, money out, profit today | Owner does not know how the day went |
| Cash and mobile money balances, shown separately | Money is scattered across cash, MoMo and bank |
| Real profit (revenue minus true costs, not just purchases) | Owners confuse sales with profit |
| Money owed to me and money I owe, with due dates | Forgotten debts and late supplier payments |
| Expenses: rent, transport, wages, electricity, taxes | Hidden costs eat the profit |
| Business vs personal money separation | Owners spend business cash on home needs |
| Weekly and monthly trends | Good and bad periods go unnoticed |
| Alerts: low cash, overdue debts, unusual drops | Problems are caught late |
| Simple reports (PDF or share) | Needed for loans, tax and partners |

### 5.3 Buy & Sell

Covers shops, pharmacies, supermarkets, electronics, hardware and wholesalers. Problem: money is stuck in stock, and profit is unclear because transport costs are ignored.

- Product list with buying price, selling price and margin per item
- Stock levels with low-stock and out-of-stock warnings
- Landed cost per item (price plus ticket, moto, loading)
- Best sellers, slow movers and dead stock (money sleeping on the shelf)
- Customer debts (credit book) with reminders
- Supplier purchases and what is owed to suppliers
- Returns and damaged goods
- Customer orders and reorder suggestions
- Expiry dates (pharmacies, supermarkets)

### 5.4 Make & Sell

Covers bakeries, tailoring, furniture, soap, restaurants, catering and food outlets. Problem: owners price by guessing and do not know what each unit really costs.

- Raw material stock with warnings
- Recipes or formulas with auto-calculated cost per unit
- Batch production log (what went in, what came out)
- Waste and spoilage tracking
- Finished product stock
- Margin per product, with a "you are underpricing this" alert
- Customer and bulk orders (cakes, uniforms, catering) with deposits
- Material price changes that update costs automatically

### 5.5 Grow & Harvest

Covers poultry, pigs, dairy, fish, crops and horticulture. Problem: costs and losses (disease, death, bad weather) are not tracked per cycle.

- Animals or crops grouped by batch, pen, field or pond
- Feed and water logs with cost
- Health and vaccine calendar with reminders
- Mortality and loss tracking
- Breeding and expected dates
- Farm cycles: start, costs so far, expected harvest date
- Harvest and production output (eggs, milk, kg, fish)
- Cost per cycle and profit per cycle, plus cost per egg, litre or kg
- Seasonal planning

### 5.6 Service-Based

Covers salons, repairs, cleaning, consultants and agencies. Problem: no-shows, unpaid balances, and not knowing which services or staff earn the most.

- Service catalogue with prices and duration
- Booking calendar with reminders to clients
- Deposits and remaining balances
- Staff schedule, hours and commissions (team labor)
- Supplies used per service (shampoo, spare parts, cleaning products)
- Revenue per service and per staff member
- Repeat customers and client history
- No-show and cancellation rate

### 5.7 Projects & Jobs

Covers construction, events, installations and large custom orders. Problem: the job looks profitable until costs overrun, and the client pays late.

- Estimate, quote and approved project flow
- Milestones with payment due per milestone
- Budget vs actual cost, live, per project
- Cash gap view: money spent versus money received so far
- Change orders (extra client requests priced and approved)
- Material and labor costs per project
- Subcontractors and what they are owed
- Project closing: final profit and lessons for the next quote
- Multiple active projects side by side

### 5.8 Hybrid & Custom

Covers mixed businesses and anything that fits nowhere else. Problem: the business does not fit one box, and the owner wants flexibility without complexity.

- Own products and services list
- Stock tracking switch: on only for items the owner chooses
- Shared money records (sales, expenses, debts)
- Pick-your-own dashboard widgets
- Ability to add modules from other architectures later (for example, add recipes to a shop)

### 5.9 Build order and design rule

Build the shared core and "Where is my money" first, because every owner needs them on day one.

1. Shared core and "Where is my money" (cash, profit, debts, expenses)
2. Buy & Sell: the largest user group and the simplest model
3. Service-Based and Make & Sell
4. Grow & Harvest and Projects & Jobs: more specialized
5. Hybrid & Custom: assembled from modules already built

**Design rule for all six:** the top of every dashboard answers three questions in plain language: "Did I make money today? Who owes me? What needs attention?"

## 6. Dashboard UI/UX

Design and develop a modern, premium, fully responsive dashboard interface for EXCELLENCE BOS (Excellence Business Operations System), a business management platform developed by PYLARIX(IN Orbitron FONT). The dashboard must follow a sophisticated three-panel layout inspired by the provided reference image, combining minimalism, floating navigation, frosted-white glassmorphism, soft shadows, and the proprietary PYLARIX(IN Orbitron FONT) Liquid Sapphire visual identity. The design must feel professional, intelligent, elegant, and suitable for a real commercial SaaS product. Avoid generic admin dashboard templates.

### 6.1 Technology stack

- React with Vite.
- Tailwind CSS.
- Lucide React icons.
- Reusable React components.
- React Router for navigation.
- Responsive layouts for desktop, tablet, and mobile.
- Support light and dark themes.
- Prepare components for future FastAPI backend integration.

### 6.2 Visual identity

Use the PYLARIX(IN Orbitron FONT) Liquid Sapphire palette (see section 1). Use a clean, near-white background for light mode and deep navy for dark mode. Apply glassmorphism using translucent white or sapphire surfaces, backdrop blur, subtle borders, and soft shadows. Use glossy sapphire accents sparingly on active navigation states, buttons, progress indicators, and selected elements. The dashboard should feel layered and dimensional without becoming visually overwhelming.

### 6.3 Three-panel layout

All three panels must have rounded corners, consistent spacing, subtle borders, and soft shadows.

**A. Primary navigation rail**

- Narrow, floating vertical rail on the far left; fixed position on desktop.
- Dark sapphire background, large rounded corners, floating appearance with soft shadows.
- Icons arranged vertically with consistent spacing, centered vertically.
- Active item highlighted using a translucent sapphire glass background.
- Tooltips on hover (icon labels); smooth transitions when switching modules.
- Settings icon positioned near the bottom.
- Icons: Dashboard, Sales, Inventory, Purchases, Finance, Customers, Reports, Documents, Integrations, Settings.
- Icons are dynamically adjusted according to the selected business architecture and user permissions; the navigation may contain different items according to the architecture.
- Clicking an icon updates the secondary sidebar and main workspace without refreshing the page.

**B. Secondary navigation sidebar**

- Wider floating glassmorphism sidebar placed immediately beside the primary rail, with a small gap.
- Frosted-white translucent surface in light mode; translucent dark sapphire glass in dark mode.
- Rounded outer corners, thin borders, soft shadows.
- Grouped navigation with clear section headings and expandable submenus with smooth expand/collapse animations.
- Active menu items highlighted with soft sapphire backgrounds.
- Independently scrollable when content exceeds the screen height; collapsible to provide additional workspace.
- Top area: business avatar or logo, business name, logged-in user's name or role, and business switching dropdown where applicable.
- Displays the navigation options belonging to the selected module, and updates dynamically without reloading the application.
- Example, Sales selected: Sales Overview, New Sale, Sales History, Invoices & Receipts, Sales Returns, Outstanding Payments, Sales Reports. When Inventory is selected, the submenu is replaced with inventory-specific navigation.

**C. Main content workspace**

- Large, rounded dashboard workspace occupying the remaining screen width.
- Spacious layout, subtle glassmorphism, clean typography, consistent padding, responsive content grids.
- Clear page headings and descriptions; smooth page transitions.
- Modern professional charts; reusable cards, tables, filters, and modal dialogs.
- Financial amounts support a hide/show privacy toggle.
- Loading, empty, and error states displayed appropriately.
- Content changes according to the selected navigation item.
- Avoid excessive decorative effects inside operational forms and tables.

### 6.4 Dashboard header

The main workspace contains a top navigation/header area with: current page title, business selector, global search, notifications, language selector, dark/light theme toggle, user profile dropdown, and help/support access. The header should remain clean and adapt to smaller devices.

### 6.5 Dashboard overview

The overview shows actual business information from the backend once connected. Do not fabricate production business figures; display proper empty states when there is no data.

Financial KPI cards: Today's Sales, Total Revenue, Total Expenses, Estimated Profit, Customer Debts, Inventory Value, Low-Stock Alerts, Recent Transactions.

Cards include relevant icons, primary values, comparison indicators when historical data exists, helpful descriptions, optional hide/show controls for sensitive financial amounts, and clickable navigation to detailed reports.

### 6.6 Analytics card design

Dashboard cards follow the uploaded sales analytics reference for shape, spacing, typography, chart integration, and depth, using the PYLARIX(IN Orbitron FONT) Liquid Sapphire palette rather than the reference image's black-grey colors.

**Visual requirements:**

- Large rounded corners.
- Deep sapphire and frosted glass surfaces.
- Thin illuminated sapphire borders.
- Soft directional lighting.
- Subtle reflective highlights.
- Large, readable financial values.
- Small metric labels.
- Percentage changes where valid comparisons exist.
- Compact line or area charts.
- Gentle hover elevation and glow.
- Consistent spacing and responsive dimensions.

**Card interactions:** cards support clicking to open detailed analytics; changing reporting periods; hiding or showing sensitive financial amounts; optional chart tooltips; drag-and-drop repositioning when dashboard customization is enabled; pinning and hiding cards; saving each user's preferred widget layout. Do not display invented financial values or growth percentages when actual data is unavailable.

### 6.7 Charts and analytics

Professional responsive charts for: Revenue Trends, Expense Trends, Profitability, Sales Performance, Cash Flow, Inventory Movement, Customer Growth. Support filtering by daily, weekly, monthly, and custom date ranges. Use the Liquid Sapphire palette consistently without compromising chart readability.

### 6.8 Business architectures and their navigation

The dashboard supports six architectures. Do not create six separate applications: build one configurable dashboard with architecture-specific navigation and modules. All architectures share common financial management, customer management, reporting, settings, and subscription capabilities. The same dashboard design structure is maintained across all six.

| Architecture | Specialized navigation |
| --- | --- |
| Make & Sell | Production, Raw Materials, Finished Products, Purchases, Sales, Suppliers, Production Costs, Reports |
| Buy & Sell | Products, Inventory, Purchases, Suppliers, Sales, Customers, Debts, Reports |
| Service-Based | Services, Bookings, Jobs, Customers, Staff, Invoices, Payments, Reports |
| Agriculture & Livestock | Farm Management, Livestock, Crops, Farm Inputs, Farm Inventory, Agricultural Sales, Expenses, Reports |
| Food & Hospitality — Restaurant | Menu, Recipes, Orders, Kitchen, Ingredients, Inventory, Sales, Reports |
| Food & Hospitality — Accommodation | Rooms, Reservations, Guests, Check-In/Check-Out, Housekeeping, Guest Billing, Reports |
| Hybrid Business | Allows multiple workflows inside one workspace; navigation adapts according to enabled business activities |

Food & Hospitality provides separate configurable modules for restaurant and accommodation operations.

### 6.9 Reports and document explorer

A document management area inspired by the folder-navigation layout shown in the design reference. Includes: Report Center, Generated Reports, Saved Documents, Recent Documents, Export History, Document Search, Folder Navigation.

Users can: preview documents; download PDF, XLSX, DOCX, or CSV; print documents; export to Google Drive; send documents through connected Gmail; share supported documents through EXCELLENCE BOS WhatsApp. Use a clean document preview interface with a file toolbar and print controls.

### 6.10 Interactive behavior

The dashboard must be genuinely interactive. Implement: clickable primary navigation icons; dynamic secondary sidebar; expandable and collapsible submenus; business architecture switching for demonstration; functional theme switching; responsive navigation drawers; user profile dropdown; notification panel; search interaction; page navigation without full reload. Use realistic loading, empty, error, and success states. Avoid decorative buttons that perform no action.

### 6.11 Responsive design

- **Desktop:** complete three-level layout — primary icon rail + secondary sidebar + main workspace.
- **Tablet:** keep the primary icon rail visible when space permits (icon rail and main workspace); allow the secondary sidebar to open or collapse.
- **Mobile:** replace the desktop sidebar arrangement with a mobile-friendly drawer or compact bottom navigation. The main workspace occupies the available screen width.
- Financial tables, charts, forms, and navigation remain usable without horizontal page overflow. All elements remain readable and accessible.

### 6.12 Animations

Subtle, premium animations: smooth sidebar expansion/transitions, active navigation transitions, gentle card entrances, soft glass hover effects and subtle hover effects, smooth modal transitions, skeleton loading states, lightweight chart animations, soft sapphire glow for selected elements, smooth light/dark theme transitions, accessible keyboard navigation. Avoid excessive AOS or heavy scroll effects inside dashboards, and avoid excessive animations that interfere with business operations. Respect the user's reduced-motion preferences.

### 6.13 Authentication and permissions

The interface supports these roles: Business Owner, Business Administrator, Authorized Employees, and Platform Super Administrator. Navigation depends on both user permissions and subscription entitlements. The backend must enforce actual authorization; hiding a navigation item is not sufficient security. The Super Administrator has a separate protected platform administration workspace.

### 6.14 Localization and financial display

Support: English and Kinyarwanda; RWF currency formatting; automatic thousands separators; currency amounts written in words in the selected language; financial privacy toggle to hide/show amounts; localized dates and numerical formats.

Example: 1,000,000 RWF — English: One million Rwandan francs. Kinyarwanda: Miliyoni imwe y'amafaranga y'u Rwanda.

### 6.15 Data editing requirements

Editing a transaction must preserve: original creation date; original entry source (Dashboard or WhatsApp); original creator; edit history; last modified timestamp; identity of the authorized user who made changes.

Changes affecting inventory, customer balances, or finances must update dependent records consistently. Posted financial transactions should use controlled corrections, voiding, or reversal workflows instead of unrestricted permanent deletion.

### 6.16 Quality requirements

The interface must: be visually consistent across every module; use reusable, maintainable components; provide accessible buttons, forms, and navigation; work on major modern browsers; load efficiently on lower-powered devices; avoid unnecessary animations and dependencies; keep business data isolated between customer accounts; be prepared for real FastAPI and MongoDB integration.

### 6.17 Expected result

A premium business management dashboard featuring a floating dark sapphire primary icon rail, a layered white-glass secondary navigation sidebar, and a spacious glassmorphism business workspace. The dashboard should closely follow the structural layout of the provided reference image (three-panel structure, floating icon navigation, layered sidebar, rounded workspace, minimal appearance, and soft glassmorphism) while maintaining EXCELLENCE BOS's own Liquid Sapphire design identity instead of the reference's grey color scheme. It must look like a polished, production-quality SaaS application rather than a generic admin template, and be premium, clean, responsive, interactive, and consistent for all EXCELLENCE BOS business architectures. Record management uses smooth, accessible, animated glassmorphism dialogs.

**EXCELLENCE BOS — Don't Just Run Your Business. Understand It.**

**Developed by PYLARIX(IN Orbitron FONT) — We Create Solutions, Not Technology.**

## 7. Integrations and Document Management

**Module:** External Integrations, Reports & Document Export. **Applies to:** all six business architectures.

EXCELLENCE BOS allows businesses to securely connect external services, generate reports, preview documents, download files, print documents, and export reports to Google Drive. These capabilities are available across all six business architectures, subject to user permissions and subscription plans.

**Main objective:** Allow business owners to manage their operations, generate professional documents, and securely access their reports through EXCELLENCE BOS, Gmail, Google Drive, and WhatsApp — from one connected platform.

### 7.1 External integrations

**A. Gmail integration** — users connect their Gmail accounts through Google OAuth 2.0.

- Connect and disconnect Gmail.
- Send invoices, receipts, and reports by email.
- Email generated documents to selected recipients.
- View email delivery status where supported.
- Manage integration permissions.

**B. Google Drive integration** — users connect their Google Drive accounts through Google OAuth 2.0.

- Export reports directly to Google Drive.
- Choose a destination folder.
- Create an EXCELLENCE BOS reports folder.
- Save invoices, receipts, and financial reports.
- View export history.
- Revoke access at any time.

**C. EXCELLENCE BOS WhatsApp integration** — EXCELLENCE BOS provides an official WhatsApp Business number that customers can use to interact with the system.

- Link a registered EXCELLENCE BOS business account to its authorized WhatsApp phone number.
- Record sales, purchases, and expenses through conversations.
- Request business summaries and reports.
- Receive supported reports as WhatsApp documents.
- Request export of a report to the connected Google Drive.
- Confirm sensitive or business-changing actions before execution.

**Important:** Customers do not need to create their own Meta developer applications. They interact with the official EXCELLENCE BOS WhatsApp number after securely linking their accounts.

### 7.2 Document export formats

Users select their preferred file format before exporting.

| Format | Extension | Main purpose |
| --- | --- | --- |
| PDF | .pdf | Professional reports and printing |
| Excel | .xlsx | Financial data and calculations |
| Word | .docx | Editable business reports |
| CSV | .csv | Raw data and spreadsheet imports |

The system supports report titles, business branding, reporting periods, currency, and generation dates.

### 7.3 Document preview and printing

Before downloading, sending, or exporting a report, users must be able to:

- Preview the document.
- Choose a file format.
- Select a reporting period.
- Select included information.
- Download the document.
- Print the document.
- Send it through Gmail.
- Save it to Google Drive.
- Share it through supported WhatsApp workflows.

PDF is the default print-ready format. Excel and Word files are downloadable in their native formats.

### 7.4 Dashboard navigation

Add the following navigation to every business dashboard:

**Reports & Documents:** Report Center, Generate Report, Document Preview, Download & Export, Print Documents, Export History.

**Integrations:** Gmail, Google Drive, EXCELLENCE BOS WhatsApp, Connected Accounts, Integration Settings.

### 7.5 Document generation workflow

1. User opens Reports & Documents.
2. User selects a report type and reporting period.
3. System retrieves authorized business data.
4. User selects PDF, Excel, Word, or CSV.
5. System generates a document preview.
6. User chooses Download, Print, Email, Google Drive, or WhatsApp.
7. System performs the selected action and records its status.

For WhatsApp requests, the system must verify the linked business identity and permissions before generating or exporting reports.

### 7.6 Super Administrator controls

The Super Administrator can:

- Enable or disable integrations.
- Configure platform WhatsApp settings.
- Manage Google integration configuration.
- Assign integration access by subscription plan.
- Configure report export limits.
- Monitor aggregate integration usage.
- View integration errors and operational logs.

The Super Administrator must not have unrestricted access to customers' private Gmail messages, Google Drive files, or confidential business documents.

### 7.7 Security requirements

- Use Google OAuth 2.0 with minimum required permissions.
- Store OAuth tokens securely and encrypted.
- Allow users to revoke integrations.
- Verify WhatsApp account linking.
- Enforce business-level data isolation.
- Validate report access before every export.
- Use secure, temporary download links.
- Maintain export audit logs.
- Require confirmation before sending sensitive reports to external recipients.
- Never expose Google credentials or access tokens in the frontend.

Google integration availability depends on the required OAuth permissions, Google verification requirements, and applicable API policies.

### 7.8 Technical implementation

**Frontend:** React (Vite). **Backend:** Python FastAPI. **Database:** MongoDB Atlas.

**Suggested backend modules:** integrations/google, integrations/whatsapp, reports/generator, reports/export, documents/preview, documents/print, audit/export\_history.

Document generation should use suitable server-side libraries for PDF, XLSX, DOCX, and CSV. Printing should use a print-ready document preview and the browser's print functionality.

## 8. Super Administrator — Subscription Architecture

### 8.1 Super Administrator dashboard modules

A dedicated Billing & Subscriptions section with these capabilities:

| Module | Capabilities |
| --- | --- |
| Pricing Plan Management | Create, edit, publish, unpublish, and archive subscription plans. Change prices, descriptions, user limits, product limits, and branch allowances. Control their display order and recommended-plan labels. |
| Feature Management | Create a central feature catalog, then enable or disable features for each plan. For example, enable inventory management for Bronze or allow automation only for Gold. |
| Customer Subscription Management | Search businesses, view subscription history, assign plans, extend expiry dates, upgrade or downgrade accounts, and suspend subscriptions when necessary. |
| Complimentary Access Management | Give selected businesses free access to Bronze, Silver, or Gold for a specified duration — or grant a documented indefinite complimentary subscription. |
| Payments and Billing | Review transactions, verify payment status, record manual payments, handle refunds, and manage failed or expired subscriptions. |
| Revenue Analytics | Track paying customers, complimentary subscriptions, monthly recurring revenue, plan distribution, expired subscriptions, and conversion from Free to paid. |

### 8.2 Assigning paid or free access to a customer

Separate subscription tier from payment status. For example, a business may have Gold access without paying because it was granted as a promotional benefit. That should not be recorded as an actual paid transaction.

| Business | Access plan | Billing type | Status |
| --- | --- | --- | --- |
| Business A | Bronze | Paid | Active |
| Business B | Gold | Complimentary | Active |
| Business C | Silver | Paid | Active |
| Business D | Gold | Complimentary trial | Expires in 14 days |
| Business E | Free | Free | Active |

The Super Administrator should be able to:

- Assign any plan to a business.
- Mark a verified manual payment as paid.
- Grant complimentary access without creating a fake payment.
- Set a start and expiry date.
- Revoke or extend access, with a required reason and audit record.
- See who made each administrative change.

### 8.3 How automatic frontend updates work

When the Gold price is changed from 20,000 RWF to another amount:

1. The Super Admin dashboard submits the change to FastAPI.
2. FastAPI verifies that the operator has Super Admin permission.
3. The backend validates the new pricing configuration and stores a new plan version in MongoDB.
4. The public React frontend fetches the latest published pricing from an API.
5. New customers see the updated price without a frontend redeployment.

For existing paying customers, price changes should follow a defined policy: keep their agreed price until the next eligible renewal or a properly communicated price change. Do not silently increase active subscriptions.

### 8.4 Business (user) management

The Super Administrator sees:

- How businesses perform.
- How much they spend on the system, and the top users who spend the most money.
- Which businesses have active branches, and how those branches perform.

### 8.5 Super Admin advertisement

When the Super Admin writes an advertisement, every business sees it in its business notifications, and sees the notification again when they log in to the dashboard. For example: a notice telling users that from 13:00 to 14:00 at night the system will be under maintenance.
# ExBOS — Search Engine Optimization (SEO) Requirements

**Product:** ExBOS — Excellence Business Operations System  
**Company:** PYLARIX(IN Orbitron FONT)  
**Priority:** High  
**Scope:** Public website, landing page, business architecture pages, financial tools, and marketing content

## 1. Main Objective

ExBOS must have strong technical and content-based SEO to improve visibility on Google, Bing, and other search engines.

The website must be optimized for branded searches, business management keywords, and local and international audiences.

SEO must be implemented during frontend development, not added only after launch.

## 2. Brand Search Optimization

Use consistent branding across all public pages:

**Primary Name:** ExBOS

**Full Name:** Excellence Business Operations System

**Developer:** PYLARIX(IN Orbitron FONT)

**Brand Description:** ExBOS is a business operations platform designed to help entrepreneurs manage sales, inventory, expenses, customers, and business performance.

Use both ExBOS and its full name naturally in relevant page titles, headings, descriptions, and structured data.

Do not repeatedly insert unrelated keywords to manipulate rankings.

## 3. Technical SEO Requirements

The frontend must include:

- Unique HTML title and meta description for each public page.
- Semantic HTML with correctly structured headings.
- Clean, descriptive URLs.
- Canonical URLs.
- XML sitemap.
- Properly configured `robots.txt`.
- Search-engine-readable navigation links.
- Open Graph and social-sharing metadata.
- Appropriate image alternative text.
- Optimized images and videos.
- Mobile-friendly responsive layouts.
- Fast page loading and Core Web Vitals monitoring.
- HTTPS and secure redirects.
- Structured data where applicable.

Use prerendering or server-side rendering for important public marketing pages if necessary to ensure search engines can reliably access their content.

The private business dashboards, authentication-only content, personal records, and internal administration pages must not appear in public search results.

## 4. SEO Page Architecture

Create indexable public pages with meaningful content:

| Page | Suggested URL |
|---|---|
| Homepage | `/` |
| Features | `/features` |
| Business Architectures | `/business-models` |
| Make & Sell | `/business-models/make-and-sell` |
| Buy & Sell | `/business-models/buy-and-sell` |
| Services | `/business-models/services` |
| Agriculture | `/business-models/agriculture` |
| Food & Hospitality | `/business-models/food-and-hospitality` |
| Hybrid Business | `/business-models/hybrid` |
| Financial Tools | `/business-tools` |
| Pricing | `/pricing` |
| About ExBOS | `/about` |
| Help & Resources | `/resources` |

Each page must contain genuinely useful, original information explaining a business problem and how ExBOS addresses it.

## 5. Keyword Strategy

### Branded Keywords

- ExBOS
- ExBOS software
- ExBOS by Pylarix
- Excellence Business Operations System

### Business Software Keywords

- Business management software
- Inventory management software
- Sales tracking software
- Small business management system
- Expense tracking software
- Business financial planning tools

### Local Keywords

- Business management software Rwanda
- Inventory management Rwanda
- Sales tracking for Rwandan businesses
- Small business software Kigali

Target keywords naturally according to actual page content. Do not claim features that are not available.

## 6. Structured Data

Implement valid JSON-LD structured data, including:

- `Organization` for Pylarix.
- `SoftwareApplication` for ExBOS where applicable.
- `BreadcrumbList` on appropriate pages.

Include verified business identity, official domain, logo, product name, descriptions, and relevant public profiles.

Do not invent reviews, ratings, prices, or business information.

## 7. Multilingual SEO

Support English and Kinyarwanda public content.

Requirements:

- Dedicated URLs for translated pages.
- Correct language metadata.
- Appropriate `hreflang` annotations.
- Consistent canonical URLs.
- Accurate human-reviewed translations.
- Language-specific titles and descriptions.

Both languages should be accessible to search engines without requiring users to log in.

## 8. Video & Image Optimization

The landing page will include a cinematic hero video and business architecture images.

Requirements:

- Compress the hero video without excessive loss of quality.
- Provide a lightweight fallback image.
- Avoid blocking initial text rendering while media loads.
- Use descriptive image filenames and alt text.
- Lazy-load noncritical images.
- Maintain readable text independently of video playback.
- Use appropriately sized responsive images.

Glassmorphism and animations must not significantly reduce performance.

## 9. Search Engine Registration

After publishing the website:

1. Verify the official domain in Google Search Console.
2. Verify the website in Bing Webmaster Tools.
3. Submit the XML sitemap.
4. Inspect important URLs for indexing problems.
5. Fix crawling and rendering errors.
6. Monitor search performance.

## 10. SEO Analytics

Monitor:

- Search impressions.
- Search clicks.
- Branded keyword visibility.
- Nonbranded keyword visibility.
- Click-through rate.
- Indexed page status.
- Organic visitor registrations.
- Landing-page conversions.
- Core Web Vitals.

The website analytics system must respect applicable privacy and consent requirements.

## 11. Content Strategy

Publish useful educational articles related to business management.

Example topics:

- How to calculate business profit.
- How much money a business needs to survive six months.
- How to manage inventory in a small shop.
- How to calculate a business break-even point.
- How to record business expenses.
- How to choose a business management system.

Articles should prioritize accurate, practical information rather than keyword repetition.

## 12. SEO Quality Rules

- Never promise first-place search rankings.
- Do not purchase artificial backlinks.
- Do not create repetitive keyword-stuffed pages.
- Do not hide misleading text from users.
- Keep page descriptions accurate.
- Maintain working internal links.
- Use one consistent official website domain.
- Regularly fix broken links and indexing issues.
- Publish content that is useful even when visitors do not register.

## 13. Final Requirement

ExBOS must be built as a search-engine-friendly, responsive, accessible, and high-performance software website.

**Primary SEO Goal:** Make ExBOS easily discoverable by people searching for the brand and by entrepreneurs looking for business management solutions.

**Long-Term Goal:** Build credible organic visibility in Rwanda, across Africa, and in international markets through useful content, strong engineering, and consistent brand recognition.
# ExBOS — FARMING FEATURE ENHANCEMENTS
### Smart Farming, Financial Sustainability & Business Growth

**Type:** Additional Features  
**Target:** Existing ExBOS Farming Module  
**Important:** Extend existing features. Do not redesign or rebuild them.

## 1. SIX-MONTH BUSINESS SURVIVAL

Add a **Business Survival Calculator** to the existing financial management features.

**Core principle:**

A business should be financially prepared to operate for at least six months without generating revenue.

The system should calculate:

- Monthly operating expenses.
- Feed requirements.
- Employee salaries.
- Veterinary expenses.
- Emergency expenses.
- Available operating capital.
- Financial survival duration.

### Survival Indicator

| Status | Meaning |
|---|---|
| Green | Can operate for at least 6 months |
| Yellow | Operating funds are becoming insufficient |
| Red | Cannot sustain the planned operations |

The system should explain any funding shortages and recommend possible adjustments.

The six-month target must be configurable.

## 2. SMART BUDGET CLASSIFICATION

Enhance existing budgeting features to distinguish:

| Category | Description |
|---|---|
| Fixed Capital | Equipment and infrastructure purchased once |
| Livestock Investment | Animals purchased for breeding or trading |
| Operating Expenses | Regular business expenses |
| Safety Budget | Essential operating funds for a selected period |
| Emergency Reserve | Funds for unexpected problems |

**Important logic:**

One-time expenses must not be repeated monthly.

Safety Budget must not be counted twice as an additional expense.

Unknown costs should remain marked as pending until confirmed.

## 3. INTELLIGENT FEED MANAGEMENT

Extend existing feed inventory and feeding schedules.

### Additional capabilities

- Register feed quantities and prices.
- Calculate price per kilogram.
- Define feeding schedules.
- Track daily consumption.
- Automatically deduct consumed feed from inventory.
- Calculate remaining feed.
- Predict when feed will run out.
- Forecast feed expenses.
- Alert farmers before feed shortages.

### Example

**Tunga Feed**
- 50 kg = 35,000 Frw.
- Daily consumption = 4 kg.
- Estimated duration = 12.5 days.

Feed calculations should consider animal age, weight, reproductive stage and changing nutritional needs.

Farmers should also record supplementary feed when available.

## 4. LIVESTOCK INVESTMENT INTELLIGENCE

Enhance existing animal registration.

The system should distinguish:

**Existing Animals:** Animals already owned by the farm.

**Purchased Animals:** Animals acquired through investment.

**Born Animals:** Animals born within the farm.

**Trading Animals:** Animals purchased specifically for resale.

Each animal should have a clear business purpose:

- Breeding.
- Fattening.
- Resale.
- Production.

ExBOS should calculate the costs associated with each animal.

## 5. SMART BREEDING PLANNING

Extend existing breeding and lifecycle features.

Add:

- Planned breeding dates.
- Breeding readiness checks.
- Pregnancy tracking.
- Estimated birth dates.
- Breeding expenses.
- Expected offspring planning.
- Reminders and alerts.

### Example

A farmer plans to breed pigs in month three.

ExBOS should check the recorded age, weight and reproductive readiness before displaying the breeding plan.

The system must not assume animals are ready simply because the planned date has arrived.

## 6. PIG TRADING INTELLIGENCE

Add trading capabilities to existing livestock sales and purchasing features.

Farmers should be able to:

- Purchase animals for resale.
- Track purchase prices.
- Record feeding and transportation costs.
- Record selling prices.
- Calculate trading profit.
- Reinvest profits into farming.

### Trading Profit

**Profit = Selling Price − Total Associated Costs**

Trading must be tracked separately from breeding operations while remaining part of the same business.

## 7. SMART CASH FLOW FORECASTING

Enhance existing financial forecasting.

The system should simulate:

- Six months without sales.
- Increasing feed prices.
- Unexpected veterinary expenses.
- Delayed breeding.
- Delayed animal sales.
- Additional livestock purchases.
- Changes in labour costs.

### Main Question

**"Can my farm continue operating if no money comes in?"**

ExBOS should answer using actual business records and clearly identified estimates.

## 8. BUSINESS EXPANSION INTELLIGENCE

Before a farmer expands, ExBOS should evaluate whether the business can support the investment.

### Example

A farmer wants to purchase two additional pigs.

ExBOS calculates:

- Animal purchase cost.
- Additional feed requirements.
- Veterinary costs.
- Available housing capacity.
- Impact on cash flow.
- Impact on the six-month Safety Budget.

### Recommendation Example

"Purchasing two additional pigs would reduce your financial survival coverage from six months to three months. Consider delaying the purchase or increasing operating capital."

Recommendations must come from recorded financial data.

## 9. FARM INFRASTRUCTURE BUDGETING

Enhance existing farm infrastructure and expense management.

Farmers should be able to:

- Plan construction.
- Register materials and quantities.
- Record prices.
- Identify missing prices.
- Compare estimates with actual spending.
- Track solar systems and other farm equipment.

Infrastructure should be treated as long-term assets rather than recurring purchases.

## 10. CIRCULAR BUSINESS GROWTH

Support multiple connected activities within the same farming business.

### Future AGUKA FARM Model

**Crop Purchasing → Feed Production → Pig Farming → Meat Sales → Reinvestment**

Additional activities:

- Feed sales to other farmers.
- Livestock trading.
- Organic fertilizer.
- Farm-to-Consumer sales.

Each activity should have its own revenue, expenses and profit analysis.

The system should also provide a consolidated view of the entire business without double-counting internal transfers.

These are future business activities, not requirements for every farmer.

## 11. EXISTING AI ASSISTANT INTEGRATION

Extend ExBOS's existing AI assistant to understand the additional farming logic.

### Example conversations

**Farmer:** "I bought two pigs for 500,000 Frw."

**ExBOS:** "Are they for breeding, fattening or trading?"

After confirmation, ExBOS updates the existing livestock and financial records.

**Farmer:** "How many days will my feed last?"

**ExBOS:** Calculates using available inventory and feeding schedules.

**Farmer:** "Can I expand my farm?"

**ExBOS:** Analyzes available capital, livestock costs and six-month operating requirements.

**Farmer:** "What happens if I make no sales for six months?"

**ExBOS:** Generates a survival forecast.

All AI actions should follow the existing confirmation and transaction-saving workflow.

## 12. FARM DASHBOARD ENHANCEMENTS

Add optional widgets to the existing customizable dashboard.

| Widget | Purpose |
|---|---|
| Business Survival | Estimated months of financial coverage |
| Feed Forecast | Remaining feed and estimated duration |
| Operating Expenses | Monthly business costs |
| Livestock Investment | Capital invested in animals |
| Breeding Calendar | Upcoming breeding and birth events |
| Trading Profit | Profit from buying and reselling animals |
| Growth Readiness | Whether expansion is financially sustainable |
| Budget Health | Planned versus actual expenses |

Users should be able to enable, disable and rearrange these widgets using existing dashboard customization.

---

## 13. IMPLEMENTATION PRIORITY

| Priority | Enhancement |
|---|---|
| P0 | Smart Budget Classification |
| P0 | Six-Month Business Survival |
| P0 | Feed Forecasting |
| P1 | Livestock Investment Tracking |
| P1 | Cash Flow Simulations |
| P1 | Breeding Intelligence |
| P1 | Trading Profit |
| P2 | Growth Recommendations |
| P2 | AI Farming Improvements |
| Future | Circular Business Integration |

## 14. IMPORTANT IMPLEMENTATION RULES

1. **Do not redesign the existing Farming Module.**
2. Do not create a separate farming application.
3. Extend the existing inventory, sales, expense and financial reporting features.
4. Reuse existing dashboard components and customization.
5. Maintain existing WhatsApp-assisted transactions.
6. Avoid duplicate financial records.
7. Preserve existing features and user data.
8. Make enhancements optional where appropriate.
9. Allow farmers to configure financial planning periods.
10. Keep the six-month survival principle central to business planning.

## FINAL OBJECTIVE

ExBOS Farming must evolve from simply recording livestock activities into helping farmers make better business decisions.

**Core Logic:**

Animal Management → Feed Management → Operating Expenses → Financial Survival → Production → Sales → Profit → Reinvestment → Business Growth.

**Most Important Feature:**

ExBOS should help business owners know whether they can survive financially before deciding to expand.

** all the implementation must be implemented **