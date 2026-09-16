# Northstar Risk Quantification

A focused, FAIR-inspired cyber risk quantification workspace. This first release is a dependency-light demonstrator that runs locally as a static app and keeps the calculation engine separate from the UI.

## Run

```bash
npm run dev
```

Open the local URL printed by `serve`. For a quick syntax check:

```bash
npm run check
```

## Methodology

The model follows the FAIR-shaped chain:

- **Threat Event Frequency (TEF):** analyst-estimated contact frequency per year.
- **Vulnerability:** the probability that a threat event becomes a loss event.
- **Loss Event Frequency (LEF):** `TEF × Vulnerability`.
- **Loss Magnitude:** the financial impact of one loss event.
- **Expected annual loss:** simulated annual loss from repeated samples of frequency, vulnerability, and magnitude.

Inputs use triangular distributions with minimum, most likely, and maximum values. Results are estimates, not guarantees. The application is FAIR-inspired and does not claim official FAIR certification.

## Security and production roadmap

The current frontend is intentionally self-contained for demonstration. A production deployment should move simulations to a server worker, persist organizations and scenarios in PostgreSQL through Prisma, add Auth.js/RBAC, validate all API payloads with Zod, add tenant-scoped authorization, audit persistence, rate limiting, and background job progress.
