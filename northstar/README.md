# Northstar Risk Quantification

FAIR-style cyber risk quantification platform built on Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Architecture

```
src/
  app/          — Next.js App Router pages and layouts
  lib/
    engine/     — Pure FAIR calculation engine (TypeScript)
    simulation/ — Monte Carlo runner (worker-compatible)
```

## Calculation Engine

The engine (`src/lib/engine/`) is a pure, dependency-free TypeScript module implementing:

- **Distributions:** triangular, uniform, normal, lognormal, PERT
- **Monte Carlo simulation:** seeded, reproducible, up to 250,000 iterations
- **Statistics:** percentiles (P50/P75/P90/P95/P99), histogram, mean, max
- **Exceedance probability:** P(annual loss > threshold)
- **Financial analysis:** risk reduction, first-year/ongoing ROI, payback period, multi-year cost/benefit

## Getting Started

```bash
cd northstar
npm install
npm run dev
```

## Testing

```bash
npm test              # run all tests
npm run test:coverage # with coverage
```

39 unit tests cover the full engine: RNG determinism, distribution bounds, percentile interpolation, histogram bucketing, Monte Carlo reproducibility, treatment effects, exceedance probability, ROI, payback, and multi-year analysis.

## Methodology

The model follows the FAIR-shaped chain:

```
Threat Event Frequency (TEF)
        ↓
   Vulnerability
        ↓
Loss Event Frequency (LEF) = TEF × Vulnerability
        ↓
   Loss Magnitude (LM)
        ↓
Annual Loss = LEF × LM (simulated)
```

All inputs use probability distributions (not point estimates) to preserve uncertainty. Results are estimates, not guarantees. The application is FAIR-inspired and does not claim official FAIR certification.

## Build

```bash
npm run build
```

## Project Status

Phase 1 complete. See `docs/gap-analysis-and-roadmap.md` for the full roadmap.

### Completed
- Next.js 16 + TypeScript + Tailwind CSS scaffold
- FAIR calculation engine ported to TypeScript with strict typing
- 53 unit tests (vitest)
- Production build verified
- Prisma 8 (SQLite) database with full schema
- Auth.js credentials provider with bcrypt password hashing
- RBAC (Admin, Risk Manager, Analyst, Viewer, Executive)
- Zod validation on all API inputs
- Audit trail on all mutations
- Organization-scoped data isolation
- Dashboard with portfolio stats
- Risk register page with Server Component data fetching
- Create Risk wizard (Client Component) with distribution type selection
- Risk detail page with simulation results and treatment list
- Server Actions for risk creation and deletion
- Threat Capability vs. Resistance Strength vulnerability model
- Loss Magnitude decomposition (primary/secondary components with enable flags)
- Multi-year cost/benefit breakdown (cumulative savings and net benefit arrays)
- 53 unit tests covering the expanded FAIR engine
- Root `.gitignore`
- Login page backed by Auth.js credentials
- Loss histogram, loss exceedance curve, multi-year chart, and treatment comparison visualizations
- Treatment simulator comparing inherent and residual risk with ROI and recommendations
- Server-side simulations persist loss samples for exceedance curves

### Next (Phase 6)
- Full FAIR analysis wizard (scenario, threat, vulnerability, loss magnitude, simulation, review, treatments)
- How-calculated explanations and data quality warnings
- Draft/incomplete analysis saving
