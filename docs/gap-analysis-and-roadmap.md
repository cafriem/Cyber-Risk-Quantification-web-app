# Northstar Risk Quantification — Gap Analysis & Roadmap

**Scope:** Comparison of the original build specification against the current codebase, with a phased implementation roadmap.

---

## 1. Executive Summary

The original prompt specifies a production-grade, full-stack FAIR-style Cyber Risk Quantification platform built on Next.js, React, TypeScript, PostgreSQL, Prisma, Auth.js, and Zod — with multi-tenancy, RBAC, audit trails, portfolio simulations, treatment comparison, multi-year financial analysis, loss magnitude decomposition, and management reporting.

The current codebase is a **dependency-free, client-only demonstrator** written in vanilla JavaScript ES modules. It implements the core Monte Carlo calculation engine correctly and provides a usable single-user UI, but represents approximately **15% of the full specification** in terms of implemented functionality. The only reusable asset for a production build is `engine.js`, which is well-designed and tested.

Closing the gap requires a **ground-up rebuild in a different stack**, not an incremental refactor.

---

## 2. Codebase Inventory

| File | Lines | Bytes | Role |
|------|------:|------:|------|
| `app.js` | 146 | 37,525 | UI rendering, state, event binding, canvas charts |
| `styles.css` | 19 | 23,359 | Dense custom CSS (minified-style) |
| `engine.js` | 145 | 6,037 | Pure FAIR calculation engine (RNG, distributions, Monte Carlo, financials) |
| `engine.test.js` | 32 | 2,073 | 4 unit tests (node:test) |
| `index.html` | 17 | 740 | Single-page shell |
| `package.json` | — | 287 | No dependencies; `serve`, `check`, `test` scripts |
| `README.md` | — | 1,417 | Brief methodology note and production roadmap pointer |

**Total:** ~359 lines / ~71 KB. No framework, no build tool, no database, no authentication.

---

## 3. Feature-by-Feature Gap Analysis

### 3.1 Technology Stack (Spec §1)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Next.js | ❌ Missing | Static HTML + vanilla ES modules |
| React | ❌ Missing | innerHTML template strings |
| TypeScript | ❌ Missing | Plain JavaScript |
| Tailwind CSS | ❌ Missing | Custom CSS |
| shadcn/ui | ❌ Missing | Hand-built HTML |
| Recharts | ❌ Missing | Raw Canvas 2D drawing |
| PostgreSQL | ❌ Missing | localStorage only |
| Prisma | ❌ Missing | No ORM |
| Auth.js / NextAuth | ❌ Missing | No authentication |
| Zod | ❌ Missing | No validation |

### 3.2 Core FAIR Concepts (Spec §2, §8–§14)

| Requirement | Status | Notes |
|-------------|--------|-------|
| TEF (Threat Event Frequency) | ✅ Present | Triangular min/mode/max as arrays |
| Vulnerability | ✅ Present | Probability 0–1 |
| LEF = TEF × Vulnerability | ✅ Present | Implicit in simulation loop |
| Loss Magnitude (LM) | ✅ Present | Single triangular range |
| Expected Annual Loss | ✅ Present | `runMonteCarlo()` mean |
| Loss magnitude decomposition (primary/secondary components) | ❌ Missing | Spec §13 requires productivity, revenue, replacement, recovery, legal, regulatory, notification, etc. |
| Threat Capability vs. Resistance Strength | ❌ Missing | Spec §9–§11 |
| Multiple distribution types per input | ⚠️ Partial | Engine supports 5 types; UI only exposes them in new-risk form; existing seed risks use triangular only |
| Uncertainty preserved (not point estimates) | ✅ Present | Full distribution sampling |

### 3.3 Monte Carlo Simulation (Spec §15–§17)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Configurable iterations (10K–1M) | ⚠️ Partial | UI offers select but hard-capped at 250K |
| Server-side or worker execution | ❌ Missing | Main thread, no worker |
| Summary statistics (mean, median, P75/P90/P95/P99, max) | ✅ Present | `summarize()` |
| Histogram | ✅ Present | `histogram()` |
| CDF data | ❌ Missing | Spec §17 |
| Loss exceedance curve | ⚠️ Partial | `exceedanceProbability()` exists for a single threshold; no full curve chart |
| Threshold exceedance UI | ✅ Present | "Probability annual loss exceeds $X" input |
| Progress indicator / non-blocking UI | ❌ Missing | Synchronous, freezes UI |
| NaN/infinite prevention | ✅ Present | Input validation in `sampleDistribution()` |

### 3.4 Risk Register (Spec §5, §29)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Search | ✅ Present | `#riskSearch` |
| Filtering (category, owner, status) | ❌ Missing | No filter controls |
| Sorting | ❌ Missing | Fixed column order |
| Pagination | ❌ Missing | Renders all rows |
| Export CSV | ✅ Present | `exportCsv()` — no escaping, no PDF |
| Export PDF | ❌ Missing | |
| Inherent / Residual / Treatment columns | ⚠️ Partial | Status and EAL shown; inherent/residual/ROI columns absent from table |
| Full status lifecycle (Draft→Closed) | ⚠️ Partial | Statuses displayed but not editable |
| Risk acceptance workflow | ❌ Missing | Spec §30 |

### 3.5 Risk Scenario Definition (Spec §6, §52)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Scenario name, description, asset, owner | ✅ Present | New-risk form |
| Threat actor, threat type | ✅ Present | Dropdowns (limited options vs. spec) |
| Business process, department, business owner | ⚠️ Partial | Process field exists; department/business owner missing |
| Organization | ❌ Missing | Hardcoded "Acme Corporation" |
| Step-by-step wizard (10 steps) | ❌ Missing | Single-page form |
| Save incomplete analysis | ❌ Missing | All-or-nothing create |

### 3.6 Treatment Simulator (Spec §20–§24, §53)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Add control with cost and effect | ✅ Present | Single treatment form |
| Specify FAIR variable affected | ✅ Present | Dropdown (loss / vulnerability / TEF reduction) |
| Run before/after simulation | ✅ Present | Two `runMonteCarlo()` calls |
| Expected risk reduction | ✅ Present | `calculateFinancials()` |
| First-year / ongoing ROI, payback | ✅ Present | `calculateFinancials()` |
| Multiple treatments per risk | ❌ Missing | Only one treatment slot |
| Treatment comparison table (§21) | ❌ Missing | |
| Multi-year analysis (1/3/5/10 years) | ❌ Missing | Spec §23 |
| Control library attachable to risks | ❌ Missing | Spec §32–§33 |
| Confidence / data quality per treatment | ❌ Missing | Spec §25 |

### 3.7 Portfolio Analysis & Dashboard (Spec §4, §27–§28)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Total risks, total EAL, P90/P95 exposure | ⚠️ Partial | Cards display values but sum across only hardcoded 5 risks |
| Risk reduction, security investment, savings, avg ROI | ❌ Missing | |
| Top 10 risks by various metrics | ⚠️ Partial | Top risks list exists but not sortable |
| Risk exposure by category | ⚠️ Partial | Static category list, not computed from data |
| Portfolio Monte Carlo (independent/correlated) | ❌ Missing | Spec §54 |
| Risk prioritization by financial metrics | ⚠️ Partial | Risks shown ranked by EAL; not user-sortable |

### 3.8 Reports (Spec §36–§37)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Reports view | ⚠️ Partial | Static placeholder, no generated content |
| Executive summary | ❌ Missing | |
| PDF export | ❌ Missing | |
| Executive risk view (simplified) | ❌ Missing | Spec §37 |
| Methodology disclaimer | ⚠️ Partial | In README only; not in UI |

### 3.9 Multi-Tenancy, Auth & Security (Spec §39, §40, §47)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Authentication | ❌ Missing | No login |
| RBAC (Admin, Risk Manager, Analyst, Viewer, Executive) | ❌ Missing | |
| Organization isolation | ❌ Missing | Single hardcoded org |
| Server-side authorization | ❌ Missing | No server |
| Zod validation | ❌ Missing | |
| Audit trail (§35) | ❌ Missing | |
| Rate limiting | ❌ Missing | |
| CSRF, XSS protection | ⚠️ Partial | innerHTML injection possible from user input; no sanitization |

### 3.10 Testing (Spec §48)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Distribution function tests | ⚠️ Partial | 1 test covers bounds only |
| FAIR calculations (LEF, LM, annual loss) | ⚠️ Partial | Implicit in Monte Carlo test |
| Percentile tests | ✅ Present | |
| Exceedance probability tests | ❌ Missing | |
| Treatment simulation / ROI / payback tests | ⚠️ Partial | ROI tested; payback not |
| Multi-year calculation tests | ❌ Missing | Feature missing |
| Authorization / isolation tests | ❌ Missing | |
| Risk CRUD tests | ❌ Missing | |
| Deterministic seeds in tests | ✅ Present | All tests use fixed seeds |

### 3.11 UI/UX (Spec §51, §52, §55)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Professional enterprise design | ✅ Present | Clean, dark-toned, card-based layout |
| Light/dark mode toggle | ❌ Missing | Button rendered but non-functional |
| Global search | ⚠️ Partial | Search input rendered; only filters risk register, not global |
| Notifications | ⚠️ Partial | Badge icon rendered; no functionality |
| Analysis wizard (10 steps) | ❌ Missing | Single-page form |
| Tooltips / expandable calculation sections | ❌ Missing | Spec §44 |
| Responsive design | ✅ Present | Media queries in CSS |

---

## 4. Code Quality Observations

| Issue | Severity | Impact |
|-------|----------|--------|
| `app.js` written as extremely long single-line functions | High | Hard to read, review, or maintain |
| Full innerHTML re-render on every interaction | Medium | Performance, focus loss, event leak risk |
| No input sanitization before innerHTML injection | Medium | XSS risk (low impact locally, critical if backend added) |
| CSV export lacks comma/quote escaping | Medium | Corrupted exports for names containing commas |
| `Math.max(...values)` in `histogram()` can throw on >~125K elements | Medium | Simulation at 250K iterations may crash |
| localStorage schema unversioned | Low | Future schema changes may break saved data |
| No TypeScript types on engine | Low | Runtime-only type errors |

---

## 5. Reusable Assets

| Asset | Reusability | Notes |
|-------|-------------|-------|
| `engine.js` distribution sampling | **High** | Pure functions; can be ported directly to TypeScript |
| `engine.js` Monte Carlo runner | **High** | Well-structured; needs worker/async wrapper |
| `engine.js` financial calculations | **High** | ROI/payback logic correct |
| `engine.test.js` | **Medium** | Port to vitest/jest with more coverage |
| `styles.css` design system (colors, spacing, typography) | **Medium** | Can inform Tailwind theme/shadcn tokens |
| `app.js` view structure (dashboard, register, treatment, etc.) | **Low** | Logic reusable as spec; code not portable |
| Seed risk data (5 scenarios) | **Medium** | Port to Prisma seed script |

---

## 6. Phased Roadmap

### Phase 1: Project Setup
**Effort:** 1–2 days

- Scaffold Next.js 14+ (App Router) with TypeScript.
- Configure Tailwind CSS, shadcn/ui, Recharts.
- Set up ESLint, Prettier, and path aliases.
- Create monorepo folder structure:
  - `src/lib/engine/` — port `engine.js` to TypeScript
  - `src/lib/simulation/` — Monte Carlo runner (worker-compatible)
  - `src/components/` — UI components
  - `src/app/api/` — API routes
  - `prisma/` — schema and seed
- Port `engine.js` to TypeScript with full type definitions.
- Port and expand `engine.test.js` to vitest.

### Phase 2: Database & Authentication
**Effort:** 2–3 days

- Design Prisma schema:
  - `Organization`, `User`, `Role` (enum: Admin, RiskManager, Analyst, Viewer, Executive)
  - `RiskScenario`, `Distribution`, `LossComponent`, `Treatment`, `Control`, `SimulationResult`, `AuditLog`, `RiskAcceptance`
- Implement Auth.js with credentials provider.
- Server-side session and org-scoped middleware.
- Zod validation schemas for all API payloads.
- Seed script with 8 realistic scenarios (spec §46).

### Phase 3: Risk Scenario CRUD
**Effort:** 2–3 days

- API routes for create, read, update, delete, list risks.
- Organization-scoped authorization (never trust client org ID).
- Risk register page with search, filtering (category/owner/status), sorting, pagination.
- Audit log on all mutations (user, timestamp, old/new value).
- Export CSV with proper escaping; PDF export via browser print or `puppeteer`.

### Phase 4: Distribution & FAIR Engine
**Effort:** 2–3 days

- Expand engine with named functions per spec §41:
  - `calculateThreatEventFrequency()`
  - `calculateVulnerability()` (threat capability vs. resistance strength)
  - `calculateLossEventFrequency()`
  - `calculatePrimaryLoss()` / `calculateSecondaryLoss()`
  - `calculateLossMagnitude()`
  - `calculateAnnualLoss()`
  - `calculateRiskReduction()`, `calculateTreatmentCost()`, `calculateROI()`, `calculatePaybackPeriod()`
  - `calculateMultiYearCost()` / `calculateMultiYearSavings()`
- Loss magnitude component model (spec §13): each component has its own distribution and enable flag.
- Threat capability vs. resistance strength modeling (spec §9–§11).
- Data quality / confidence metadata on each input (spec §25).

### Phase 5: Monte Carlo Engine (Server-Side)
**Effort:** 2–3 days

- Server-side simulation in API route or background job.
- Web Worker fallback for client-only deployments.
- Configurable iterations up to 1M.
- Return summary statistics, percentiles, histogram, CDF data, exceedance curve.
- Store simulation summaries (not raw samples) in database.
- Progress indicator via streaming or polling.

**Status:** Core server-side simulation and persistence are implemented. Summary statistics, histogram, loss samples, and exceedance curve data are returned and visualized. Treatment comparison is available in the treatment simulator. The remaining Phase 5 items—background/worker execution above current limits and progress streaming/polling—can be addressed during performance hardening.

### Phase 6: Risk Analysis UI (FAIR Wizard)
**Effort:** 3–4 days

- Multi-step wizard per spec §52:
  1. Define Scenario
  2. Threat Event Frequency
  3. Vulnerability
  4. Loss Magnitude
  5. Run Simulation
  6. Review Results
  7. Add Controls
  8. Simulate Treatment
  9. Compare Results
  10. Approve Treatment
- Recharts visualizations: histogram, CDF, exceedance curve, loss decomposition.
- "How was this calculated?" expandable sections (spec §44).
- Data quality warnings (spec §45).
- Save incomplete analyses.

### Phase 7: Treatment Simulator
**Effort:** 3–4 days

- Add multiple treatments per risk.
- Treatment comparison table with ROI per treatment (spec §21).
- Inherent vs. residual simulation with side-by-side chart (spec §19).
- Multi-year cost/benefit line chart (1/3/5/10 years) (spec §23).
- Treatment variable modeling (which FAIR parameter is affected) (spec §24).
- Confidence per treatment.

### Phase 8: Portfolio Dashboard
**Effort:** 2–3 days

- Executive dashboard cards: total EAL, P90/P95, risk reduction, investment, savings, avg ROI, open treatment plans.
- Top 10 risks ranked by user-selectable metric.
- Risk exposure by category chart.
- Inherent vs. residual exposure chart.
- Portfolio Monte Carlo (independent risks first; architecture supports future correlation) (spec §54).

### Phase 9: Reports
**Effort:** 2–3 days

- Generated executive summary with real computed numbers.
- Management-ready report template: portfolio risk, top risks, loss distribution, treatment recommendations, investment, savings, ROI, residual risk, assumptions, methodology.
- PDF export.
- Executive risk view (simplified, no FAIR jargon) (spec §37).

### Phase 10: Controls Library & Settings
**Effort:** 1–2 days

- Pre-populated control library (MFA, EDR, SIEM, etc.) per spec §32.
- Attach controls to risks; track effectiveness and cost.
- Organization settings: currency (USD/AED/EUR/GBP/SAR), org name.
- User management (admin only).

### Phase 11: Testing & Security Hardening
**Effort:** 2–3 days

- Unit tests for all engine functions.
- Integration tests for API routes.
- Authorization tests (org isolation, RBAC).
- Zod validation tests.
- Rate limiting on simulation endpoints.
- CSRF and XSS review.
- Security audit.

### Phase 12: Documentation & Polish
**Effort:** 1–2 days

- Comprehensive README per spec §56: architecture, database schema, FAIR methodology, formulas, installation, env vars, deployment, security, limitations.
- Methodology disclaimer in UI.
- UI polish, dark mode, tooltips, loading states.

---

## 7. Estimated Total Effort

| Phase | Days (1 dev) |
|-------|-------------:|
| 1 — Project Setup | 1–2 |
| 2 — Database & Auth | 2–3 |
| 3 — Risk CRUD | 2–3 |
| 4 — FAIR Engine | 2–3 |
| 5 — Monte Carlo | 2–3 |
| 6 — FAIR Wizard UI | 3–4 |
| 7 — Treatment Simulator | 3–4 |
| 8 — Portfolio Dashboard | 2–3 |
| 9 — Reports | 2–3 |
| 10 — Controls & Settings | 1–2 |
| 11 — Testing & Security | 2–3 |
| 12 — Docs & Polish | 1–2 |
| **Total** | **23–35 days** |

**Minimum viable demo** (Phases 1–6): ~12–18 days.

---

## 8. Recommended Next Steps

1. **Confirm the stack decision.** The current vanilla app is clean but architecturally incompatible with the spec. A rebuild is required.
2. **Start with Phase 1** (project scaffold + TypeScript engine port). This is low-risk and immediately testable.
3. **Defer Phase 9 (Reports) and Phase 10 (Controls Library)** if time is constrained — they are lower priority than the core quantification workflow.
4. **Consider the "demo-ready" milestone** as the end of Phase 6: a user can define a scenario, run a simulation, and view results — the core acceptance criteria (spec §58 steps 1–11).
5. **Add remaining phases iteratively** based on feedback from the demo.
