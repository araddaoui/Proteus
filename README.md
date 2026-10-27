# Proteus

**The Higher Education AI Compass: Strategic Governance Operating System**

Proteus is a governance platform that helps universities navigate the AI age through structured decision-making, stakeholder collaboration, and constitutional-level ethical reasoning. It is built around the principle that *human flourishing is the objective — AI is neither the objective nor the enemy.*

## Core Philosophy

Proteus is governed by the **Higher Education AI Compass Master Kernel** — a 30-section constitutional framework and 12-point Final Test designed to evaluate any AI initiative through the lens of human agency, academic integrity, equity, and institutional autonomy.

The system's **one-sentence mission**:
> *Use AI to help higher education understand change, imagine alternatives, improve its practices, and expand human possibility — but never allow technological capability, institutional efficiency, commercial interest, or algorithmic prediction to become a substitute for human judgment, democratic deliberation, academic freedom, institutional autonomy, or the common good.*

## Key Capabilities

- **Compass Master**: A 30-section operating framework with 12 Final Tests for evaluating AI proposals.
- **Scenario Engine**: Simulated AI deployment decisions with recorded human dispositions from 6 stakeholder personas.
- **Evidence Ledger**: Source-verified evidence claims with confidence tiers, staging review, and audit trails.
- **Stakeholder Simulation**: Six institutional roles (President, Provost, Faculty Chair, Student Body President, Union Rep, Accreditor Consultant) with distinct privileges and perspectives.
- **Red-Flag Library**: Catalog of AI implementation risks with mitigation guidance.
- **Shadow AI Reporting**: Grassroots mechanism for faculty and students to report unapproved AI tools.
- **Prediction Tracker**: Living record of AI outcome predictions with reconciliation workflows.
- **Governance Jobs**: Automated compliance scanning, red-flag detection, and kernel evaluation runs.

## Features
- Executive governance, institutional profiles, and overlay compliance packs.
- Scenario simulation and recorded human dispositions.
- Evidence ledger with source verification and staging review.
- Dual academic and administrative signoffs with derived implementation gates.
- Tenant-isolated roles, capabilities, and append-only audit logging.
- Isolated RSU demo tenant with resettable seed data.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Firebase client SDK.
- **API**: Express, Zod, Firebase Admin token verification.
- **Database**: PostgreSQL with Drizzle ORM.
- **Deployment**: Vercel serverless API plus Vite static frontend.

## Local setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, Firebase Admin credentials, and the `VITE_FIREBASE_*` client values.
3. Generate/apply the schema: `npm run db:generate`, then `npm run db:migrate`
4. Seed the demo tenant (optional): set `DEMO_MODE=true` and run `npm run db:seed`
5. Start the API: `npm run dev`
6. In another terminal, start the client: `npm run dev:client`

The client proxies `/api` to `http://localhost:3000` in development.

## Authentication
Sign-in uses verified Firebase authentication with Google. A user gains access only after an institutional invite addressed to their verified email is claimed; roles and capabilities come from Postgres memberships and are never accepted from the client. Governance signoffs require a recent reauthentication and, when `REQUIRE_MFA_CLAIM=true`, an MFA claim.

## Quality checks
```bash
npm run lint
npm test
npm run build
```
