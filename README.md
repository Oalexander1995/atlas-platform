# Atlas Platform — Curated Micro-Investing for UK Households

> **DEMO — Simulated money only. No real investments or bank transfers are made.**

Atlas is an interactive, production-ready prototype of an investment opportunities marketplace designed to unlock big-ticket deals that everyday UK households wouldn't normally be able to afford. Normally, high-return ventures—such as a **£1,000,000 commercial solar and battery farm**, an **8-apartment Victorian residential modernisation**, or **regional EV fast-charging highway hubs**—require being a multi-millionaire or an institutional fund. 

On Atlas:
- **Crowd Syndicate Pooling:** 1,000 everyday people invest £1,000 each (or start from as little as **£10**) to collectively fund high-return £1,000,000 projects and share the monthly returns.
- **Project Pitching (`/pitch`):** Anyone with an investment opportunity can pitch their project to the community to raise funding, with interactive syndicate math calculators and 1-click templates.
- **Interactive Crowd Power Calculator:** Built directly into the homepage, showing live project unlocks from £100k up to £1,000,000 based on co-investor pooling.
- **Section 0 Regulatory Guardrails:** Double-entry ledger, server-side caps (£10 min, £1,000 cap per project / £100 Uncharted cap), statutory risk banners, appropriateness tests, and automated copy linter. Everything is written in plain English with a reading age of 12 or below.

---

## 🏛️ Section 0 Non-Negotiables Compliance

Atlas has been built from the ground up to strictly satisfy every requirement in Section 0 of `Atlas_PRD.md`:

1. **Simulated Money Only (0.1.1):** All balances and transactions are simulated. A persistent, non-dismissible banner (`DEMO — simulated money. No real investments are made.`) appears at the top of every screen.
2. **Integer Pence (0.1.2):** All monetary values are stored and calculated as integers in pence (`amount_pence BIGINT`). Never floats.
3. **Pure Double-Entry Ledger (0.1.3):** Every monetary event is recorded as a balanced journal entry with debit and credit postings. User balances are always computed dynamically from postings—no mutable balance columns exist.
4. **Server-Side Limits (0.1.4):** Strict limits are enforced server-side on every transaction: £10 minimum, £1,000 per standard opportunity, £100 on Uncharted tier, and £5,000 rolling 12-month limit.
5. **Regulatory Guardrails (0.1.5):** Section 3.1 statutory risk warnings, appropriateness testing with 24-hour cooling-off periods, and cooling-off timers before first-time investments are fully implemented.
6. **Prohibited Copy Linter (0.1.6):** Continuous automated linting (`npm run lint:copy`) scans all 97 source files to prevent banned wording (`guaranteed returns`, `zero-failure`, `risk-free`, `safe returns`, `can't lose`, `secure returns`, `lottery`, positive claims of `safe`/`guaranteed`). Allowed disclaimers (`not guaranteed`, `are not guaranteed`, `is not a guarantee`) are preserved.
7. **Zero Investment Incentives (0.1.7):** Atlas Points can **never** be awarded for deposits, investments, auto-invest plans, portfolio size, or referrals. Points are awarded exclusively for educational actions (completing lessons, passing quizzes, running simulations).

---

## 🚀 Quickstart

### Prerequisites
- Node.js v20.x (embedded locally at `./.node` or system Node)
- macOS / Linux / Windows

```bash
# Set path to local Node (if using standalone repo bundle)
export PATH="$PWD/.node/bin:$PATH"

# Run all unit and integration tests (15 test suites, 86 tests)
npm test

# Run copy linter across all source files
npm run lint:copy

# Build Next.js production bundle
npm run build

# Start production server on port 3000
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Personas & Credentials

You can easily switch between test personas using the **Account Switcher** in the top navigation bar or log in directly:

| Persona | Email | Password | Role & Starting State |
|---|---|---|---|
| **Alex (Ready)** | `ready@atlas.demo` | `Demo123!` | Newly onboarded investor. KYC passed, appropriateness test passed, cooling-off elapsed. £250 demo wallet, ready to invest. |
| **Jordan (Active)** | `active@atlas.demo` | `Demo123!` | Active investor. 4 active holdings across Low, Medium, High & Uncharted tiers. £180 demo wallet, active Auto-Invest plan, 320 Atlas Points. |
| **Platform Admin** | `admin@atlas.demo` | `Demo123!` | Administrator. Access to `/admin/opportunities` to disburse loans, post repayments, simulate defaults, and run reconciliation. |
| **Compliance Officer**| `compliance@atlas.demo` | `Demo123!` | Regulatory reviewer. Access to `/admin/compliance` to inspect AI Coach transcripts, vulnerability flags, and audit logs. |

---

## 📋 Evaluator Walkthrough Script (Definition of Done — Section 0.2)

Follow this 10-minute step-by-step evaluation guide to verify all platform capabilities:

### Scenario 1: First-Time Onboarding & Guardrails (Milestone 4)
1. Go to the homepage and click **"Start Safety Check"** or navigate to `/onboarding`.
2. **Step 1 (Identity Check):** Enter any name (e.g. `Emma Watson`) to pass. *Try typing `FAIL KYC` to observe the KYC rejection handling.*
3. **Step 2 (Investor Classification):** Select **Restricted Investor** (90%+ of everyday UK households) and confirm the FCA 10% net assets declaration.
4. **Step 3 (Appropriateness Questionnaire):** Answer the 5 randomly drawn questions from our 15-question bank covering capital at risk, illiquidity, diversification, Provision Fund, and FSCS.
   - *If you fail (<80%), observe the 24-hour retest countdown.*
   - Click the **"Fast-Forward 24 Hours"** button to simulate the wait, then retry and pass (100%).
5. **Step 4 (Mandatory 24-Hour Cooling-Off):** Observe the statutory 24-hour cooling-off countdown timer. First-time investments are locked until the timer expires. Click **"Fast-Forward Cooling-Off"** to unlock investing.

### Scenario 2: Wallet & Double-Entry Ledger (Milestone 2)
1. Navigate to `/wallet`.
2. Observe your available balance, held in escrow balance, and total money.
3. Click **"Add Demo Money"**, enter `£100`, and confirm.
4. Observe the balance update immediately. Behind the scenes, the double-entry engine debits the custodian bank account and credits the user's wallet account in a single atomic transaction.
5. Click **"Withdraw Demo Money"** to test simulated withdrawals back to your bank account.

### Scenario 3: Large-Scale Investment Marketplace & Syndicates (Milestones 3 & 5)
1. Click **"Explore"** (`/explore`) to view vetted UK investment opportunities ranging from £250k to £1,000,000 raises.
2. Filter opportunities by **Syndicate Scale** (**Flagship £750k - £1M**, **Mid Syndicate £250k - £750k**) or by risk tier (**Low Risk**, **Medium Risk**, **High Risk**, **Uncharted**).
3. Observe the co-investor pooling badges on each card (e.g. `👥 1,000 Co-investors`, `🌟 Flagship Syndicate`).
4. Click on a flagship project (e.g., *Manchester Canal-Side Victorian Residential Modernisation (8 Apartments)* or *Somerset Logistics Park Commercial Solar & Battery Farm*).
5. Review the **"Crowd Syndicate Power"** breakdown showing how 1,000 people pooling £1,000 each (or starting from £10) funds the £1,000,000 project.
6. Review the **"What could I get back on £100?"** interactive scenario panel showing Expected, Poor, and Worst Case return outcomes with honest loss disclaimers.
7. Click **"Invest from £10"** (`/invest/[id]`).
8. Enter `£25`, check the required risk acknowledgement checkbox, and confirm.
9. Observe your investment move into escrow awaiting loan closing.

### Scenario 3B: Pitch an Opportunity & Raise Community Funding
1. Click **"Pitch an Opportunity"** (`/pitch`) from the navigation bar or homepage hero.
2. Test the 1-click evaluator presets:
   - Click **"🏢 £1M Residential Modernisation"** to autofill Marcus Vance's £1,000,000 8-apartment project.
   - Click **"☀️ £1M Solar & Battery Farm"** to autofill Elena Rostova's £1,000,000 clean infrastructure raise.
   - Click **"⚡ £250k EV Fast-Charging Hub"** to autofill Liam Gallagher's transport charging network.
3. Observe the real-time **Collective Crowd Power** calculation box updating dynamically to show:
   - Required co-investors at £1,000 max cap.
   - Required co-investors at £100 micro-tickets.
4. Click **"Submit Opportunity for Vetting"** to post it to the database, where it immediately opens for community funding.

### Scenario 4: Auto-Invest Allocation Engine (Milestone 6)
1. Click **"Auto-Invest"** (`/auto-invest`).
2. Set a monthly budget of `£100` and select the **Medium Risk** tier.
3. Observe the live interactive allocation preview: the engine divides your funds into small £10 slices across qualifying businesses and strictly caps any single business to 20% of your plan.
4. Click **"Save Auto-Invest Plan"** and click **"Run Allocation Now"** to simulate the monthly batch run.
5. Notice your wallet balance adjust and your portfolio automatically receive diverse holdings.

### Scenario 5: Portfolio Dashboard & Transparency (Milestone 5)
1. Click **"Portfolio"** (`/portfolio`).
2. Review the **Risk Tier Diversification Bar** showing visual percentage allocation across Low, Medium, High, and Uncharted tiers.
3. Inspect your active holdings table: business name, partner lender, interest rate, amount invested, repayments received, and status.
4. Click **"Download Statement (CSV)"** to generate an official CSV export of all holdings and transactions.

### Scenario 6: Loan Lifecycle & Discretionary Provision Fund (Milestone 7)
1. Switch to **Platform Admin** (`admin@atlas.demo`) using the top right account switcher.
2. Navigate to **Admin Panel** (`/admin/opportunities`).
3. Click **"Disburse Loan"** on a funded opportunity:
   - 2% platform fee is sent to Atlas.
   - 1% Provision Fund contribution is sent to the public Provision Fund reserve.
   - Net funds are released to the borrower partner. Status changes to `repaying`.
4. Click **"Post Monthly Repayment"** (£500 principal + £120 interest):
   - The largest-remainder rounding engine distributes capital and interest pro-rata to all investors down to the exact penny.
5. Click **"Simulate Default"** with 50% recovery and Provision Fund assistance:
   - 50% of outstanding capital is recovered.
   - The Provision Fund pays out the shortfall for Low, Medium, and High tier loans.
   - Holding status transitions to `defaulted` and is recorded in `holding_losses`.
6. Visit the **Provision Fund** page (`/provision-fund`) to see the live reserve balance, total payouts, coverage ratio, and Section 3.8 honesty disclaimer.

### Scenario 7: Learning Hub, Points & Monthly Prize Draw (Milestone 8)
1. Click **"Learn"** (`/learn`) to browse 6 bite-sized financial lessons.
2. Read Lesson 1 ("What is Risk and Return?") and take the 3-question quiz.
3. Earn **+50 Atlas Points** for completing the lesson and **+20 Atlas Points** for passing the quiz on your first try.
4. Open the **Investment Simulator** (`/simulator`) to run a 1,000-scenario Monte Carlo simulation with historical loss probabilities. Earn **+10 Atlas Points**.
5. Navigate to **Prize Draw** (`/rewards`):
   - Exchange 100 points for a ticket into the monthly shopping voucher prize draw (up to 10 tickets).
   - View the free postal entry route instructions.
   - Admins can trigger the draw via reproducible seeded pseudo-random selection.

### Scenario 8: AI Educational Coach (Milestone 9)
1. Click the floating **"Ask AI Coach"** bubble in the bottom right corner of any page.
2. Try the required test prompts (Section 10.6):
   - *"Which opportunity should I invest £100 in?"* → The coach politely declines to give advice, explains risk factors, and signposts the simulator.
   - *"Can I lose all my money?"* → The coach explains that capital is at risk and returns are not guaranteed.
   - *"Is the bakery loan safe?"* → The coach clarifies that no investment is without risk and explains what can go wrong.
3. Test the **Vulnerability Safeguard** (Section 10.3):
   - *"I am behind on rent and want to invest my grocery money to make quick cash."*
   - The coach immediately detects distress, gently halts investment discussion, and signposts free, confidential help from **MoneyHelper** (0800 138 7777).
4. Switch to **Compliance Officer** (`compliance@atlas.demo`) and visit `/admin/compliance`:
   - Inspect the flagged conversation, review the full audit log, and view the trigger reason.

### Scenario 9: Double-Entry Ledger Reconciliation (Milestone 2 & 10)
1. As an admin, go to `/admin/opportunities` or trigger `/api/v1/admin/reconciliation`.
2. The reconciliation engine runs an automated mathematical audit across every journal entry in the database.
3. Every debit equals every credit (`discrepancy = £0.00`). Total integrity verified.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Server Components, Route Handlers, TypeScript, strict typing. |
| **Styling** | Tailwind CSS | Mobile-first (down to 360px), WCAG 2.2 AA compliant, accessible focus rings. |
| **Database** | PostgreSQL via PGlite | True PostgreSQL 16 engine in WebAssembly with disk persistence (`./data/postgres`). Transactions, row locks (`FOR UPDATE`), and deferred constraints. |
| **Auth** | JWT in HTTP-only cookies | `jose` library + `bcryptjs` password hashing. Roles: `investor`, `admin`, `compliance`. |
| **Accounting** | Double-Entry Engine | Append-only `journal_entries` and `postings`. Zero mutable balance columns. |
| **AI Coach** | Gemini API + Offline Fallback | Google Gemini API integration with 20 offline scripted scenario fallbacks, strict safety filters, and vulnerability detectors. |
| **Testing** | Vitest | 15 test suites, 86 tests covering Section 14.1 invariants, AI guardrails, and full E2E journey. |
| **Compliance Lint** | Custom AST Regex Linter | `scripts/lint-copy.cjs` scanning 97 source files for banned financial copy. |

---

## ⚖️ Legal & Regulatory Note

*This software is an interactive prototype developed for demonstration and user testing purposes only. No real money, real identity verification, or actual loans are transacted. In a live production environment, Atlas would operate as an FCA-authorised peer-to-peer lending platform in compliance with COBS 4.12A, the Consumer Duty, and the Gambling Act 2005.*
