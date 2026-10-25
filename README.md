# Proteus

Institutional AI governance, scenario modeling, and strategic decision platform for higher education.

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
