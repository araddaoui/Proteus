# RSU Sandbox — Manual Test Plan & Blueprint

This is the reusable testing blueprint for the **Ruritania State University (RSU)**
sandbox. It is a fictional, synthetic dataset that exercises every Proteus module
end-to-end with a realistic regional-public-university scenario: enrollment
decline, a shrinking state appropriation, a pre-AI teaching culture, more teaching
assistants than ever, no new tenure lines, programs under viability review, and a
no-layoff pledge — plus deliberate bright spots.

Everything here is **synthetic data**. No real institution, person, or source is
represented. The dataset lives in `src/sandbox/rsuSeed.ts` and is loaded by
`src/services/db.ts`; `db.resetToBaseline()` restores it.

---

## 1. Scope

- **In scope:** data integrity, governance guardrails, dual-signoff flows, RBAC
  by persona, deterministic (key-free) scenario generation, evidence constraints,
  prediction reconciliation, grassroots input, red-flag library, scheduled jobs,
  cross-tenant isolation, and baseline reset.
- **Out of scope:** real AI/LLM output (AI is off by default), live persistence
  (server DB is in-memory; client mirrors to `localStorage`), production data.

---

## 2. Sandbox Overview

| Item | Value |
| --- | --- |
| Tenant | `inst-1` — Ruritania State University (RSU), public land-grant |
| Overlay pack | `pack-us-landgrant` — US Land-Grant / State Appropriated (HLC) |
| Mode | Deterministic (no external AI calls) |
| Data stores | Server in-memory (`db`); client mirror `proteus_store` in `localStorage` |
| Reset | Header → **Reset Sandbox** (dev builds only) or `POST /api/sandbox/reset` |

### Personas (`SEED_PERSONAS`, `src/types/auth.ts`)

| Persona | Role | Maps to UserRole | Key capability |
| --- | --- | --- | --- |
| Dr. Alina Okafor — President | `high_admin` | `leadership` | Administrative sign-offs, implementation |
| Prof. Dario Marchetti — Senate Chair | `program_director` | `faculty` | Academic sign-offs, scenarios, evidence review |
| Samir Haddad — Student Body President | `student` | `student` | Read-only + pulse/shadow input |
| Dr. Priya Raman — Accreditation Consultant | `consultant` | `consultant` | Read + evidence + final test; no sign-offs |
| Karen Whitfield — Registrar & CIO | `high_admin` | `leadership` | Administrative attestations, jobs, tech risk |
| Luis Ortega — Union Representative | `program_director` | `faculty` | Governance participation; no sign-offs |

### Baseline inventory (expected)

| Collection | Count | Notes |
| --- | --- | --- |
| Institutions | 3 | RSU (`inst-1`) + TecMonterrey (`inst-2`) + UIM (`inst-3`) |
| Overlay packs | 4 | land-grant + FERPA + MENA + EU |
| Diagnostics for `inst-1` | 32 | 6 intentionally missing |
| Evidence claims | 10 | `claim-r1` … `claim-r10` |
| Evidence staging | 3 | `stage-r1` … `stage-r3` (pending review) |
| Decisions | 8 | `dec-r1` … `dec-r8` |
| Scenarios | 15 | 5-type matrices for `dec-r1`, `dec-r2`, `dec-r4` |
| Stakeholder impacts | 18 | `stk-r1-*`, `stk-r2-*`, `stk-r4-*` |
| Predictions | 6 | `pred-r1` … `pred-r6` |
| Red flags | 8 | 5 legacy (`rf-01`…`rf-05`) + 3 RSU (`rf-r1`…`rf-r3`) |
| Pulse surveys | 9 | `pulse-r1` … `pulse-r9` |
| Shadow AI reports | 6 | `sh-r1` … `sh-r6` |

---

## 3. Setup

```powershell
npm install
npm run dev            # starts tsx server.ts on http://localhost:3000
```

- Open `http://localhost:3000`, click **Enter / Select Identity**, and pick an
  RSU persona.
- Reset any time via the amber **Reset Sandbox** button in the header (dev only)
  or:

```powershell
Invoke-RestMethod http://localhost:3000/api/sandbox/reset -Method Post
```

When running the built bundle for API-only checks:

```powershell
npm run build
node build/server.cjs
```

---

## 4. Test Cases

Each case lists **Steps**, then **Expected**. Record pass/fail and any deviation.

### T1 — Baseline loads and tenant is RSU

1. `GET /api/profile/inst-1`
2. `GET /api/decisions/inst-1`

**Expected:** `profile.name` = "Ruritania State University"; `activeOverlayPack.name`
= "US Land-Grant / State Appropriated (HLC)"; `allInstitutions.length` = 3;
decisions length = 8; first decisions include `dec-r1` and `dec-r3`.

### T2 — Diagnostics gap statement

1. `GET /api/compass/diagnostic/inst-1`

**Expected:** `total` = 32, `missingItems.length` = 6
(Staffing Structures & Workloads, Budgets & Financial Constraints, Technology
Architectures & LMS, Collective Bargaining Agreements, White Papers & Taskforce
Reports, Community Relationships & Civic Compacts). `mandatoryGapStatement`
starts with "A reliable recommendation cannot yet be made…".

2. As a **leadership** persona, toggle one missing diagnostic available
   (`PUT /api/compass/diagnostic/inst-1/diag-9` with `{ "isAvailable": true }`).

**Expected:** missing count drops to 5. As `faculty`/`student`, the UI must not
offer the toggle.

### T3 — Governance guardrails block irreversible academic actions

For `dec-r1`, `dec-r2`, `dec-r4`, attempt
`PUT /api/decisions/<id>/status` with `{ "status": "implemented" }`.

**Expected:** all three are rejected (HTTP 400) with a `*_VIOLATION` /
`RECOMMENDED_ACTION_REQUIRED` / `CRITICAL_SAFETY_GATE_VIOLATION` message. None
may reach `implemented` while `humanApprovalGatePassed` is false or signoffs are
not both `approved`.

Also confirm the read-only case: `dec-r3` is `shelved` / `humanDisposition:
rejected` (predictive advising rejected), and `dec-r5` (central AI policy) is
already `implemented` / `accepted` — the bright spot.

### T4 — Dual-signoff flow unlocks implementation

On `dec-r1` (a grading/enrollment-touching decision):

1. Record academic sign-off `approved` via
   `PUT /api/decisions/dec-r1/governance-signoff`
   (`signoffType: "academic"`, `status: "approved"`).
2. Record administrative sign-off `approved` the same way.
3. Set a human disposition via `PUT /api/decisions/dec-r1/disposition`
   (`disposition: "accepted"`) and a recommended action if unset.
4. `PUT /api/decisions/dec-r1/status` with `{ "status": "implemented" }`.

**Expected:** steps 1–3 succeed; `humanApprovalGatePassed` flips true once both
signoffs are approved; step 4 now succeeds. Re-run T3 first to show it was blocked
before. By contrast, `dec-r4` should remain blocked while its administrative
sign-off is `pending`.

### T5 — Deterministic scenario generation (key-free)

1. `GET /api/config` → `{ aiEnabled: false, mode: "deterministic" }`.
2. `POST /api/ai/draft-scenarios` with any decision title.
3. `POST /api/ai/analyze-proposal` with a proposal that automates grading.

**Expected:** returns 5 scenarios with `generationMode: "deterministic"`,
`isAiDrafted: false`, `mode: "deterministic"`, and no external network call. The
UI shows the "Deterministic Mode — no external AI" badge. The analyze-proposal
response surfaces the appropriate human-in-the-loop finding(s).

### T6 — Evidence ledger constraints and staging

1. `POST /api/evidence` with an empty `sourceUrl`.
2. `POST /api/evidence` with a valid `sourceUrl`.
3. `POST /api/evidence/staging/stage-r1/approve`.
4. `POST /api/evidence/staging/stage-r2/reject` with a reason.

**Expected:** (1) rejected with `EVIDENCE_LEDGER_CONSTRAINT_VIOLATION`; (2) claim
created; (3) staging item becomes `approved` and a new active claim appears;
(4) item becomes `rejected` with the reason recorded. Stage `stage-r3` (HLC AI
inquiry template) is a good "should we accept this?" discussion item.

### T7 — Stakeholder ledger

1. `GET /api/stakeholders/dec-r1`, `/dec-r2`, `/dec-r4`.

**Expected:** 6 impacts each; groups include First-Gen Students, International
Students, Adjunct/Contingent Faculty, and Local Community; `powerShift` values
are `gains` / `loses` / `neutral`. Verify the demo reads as a two-sided ledger
(benefit and cost for every group).

### T8 — Prediction tracker & author bridge

1. As a signed-in persona, **Log Strategic Prediction** in the Prediction Tracker.
2. Inspect the new record.

**Expected:** `madeByUserName` and `madeByUserId` match the **active identity**
(not "Current User"), and `madeByRole` matches the mapped UserRole. Then resolve
a past-due prediction and confirm the outcome + lessons-learned render.

### T9 — Grassroots input instruments

1. Submit a pulse survey and a shadow-AI report as a **student** persona.
2. As **leadership**, run the `evidence_refresh` job and inspect staging.

**Expected:** both submissions appear immediately; the job adds one staging
candidate (never a live claim directly); shadow reports default to `flagged`.

### T10 — Red-flag library

1. `GET /api/red-flags`

**Expected:** 8 entries — the 5 legacy cases plus RSU cases `rf-r1` (analytics-
driven program cuts / governance backlash), `rf-r2` (surveillance advising harm),
`rf-r3` (TA/adjunct displacement). Each has warning signs and mitigations.

### T11 — RBAC matrix

Sign in as each persona and confirm navigation + capabilities:

| Capability | President/CIO (`high_admin`) | Senate/Union (`program_director`) | Student | Consultant |
| --- | --- | --- | --- | --- |
| Scenario Engine & Decisions visible | Yes | Yes | No | Yes |
| Prediction Tracker visible | Yes | Yes | No | Yes |
| Institutional Profile visible | Yes | Yes | Yes | Yes |
| Evidence Ledger view | Yes | Yes | Yes | Yes |
| Edit evidence / approve staging | Yes | Yes | No | Yes |
| Diagnostics toggle | Yes | No | No | No |
| Governance Jobs & Kernel tab | Yes | No | No | Yes |
| Issue Academic sign-off | No | Yes | No | No |
| Issue Administrative sign-off | Yes | No | No | No |
| Implementation transition | Yes | No | No | No |
| Pulse survey / Shadow AI submit | Yes | Yes | Yes | Yes |

**Expected:** the header role reflects the active identity; forbidden tabs are
absent; student views are read-only with input instruments available.

### T12 — Cross-tenant isolation

1. Switch the tenant selector to `TecMonterrey` (`inst-2`) and `UIM MENA`
   (`inst-3`).

**Expected:** no RSU decisions/claims/predictions appear; diagnostics fall back
to a cloned `inst-1` checklist; `inst-1` data is unchanged after switching back.
A reset must only touch `inst-1` content and the global red-flag library, leaving
`inst-2`/`inst-3` institution records intact.

### T13 — Reset restores baseline

1. Make several mutations (disposition, status attempt, new claim, new pulse).
2. Reset (header button or `POST /api/sandbox/reset`).

**Expected:** counts return to the baseline inventory in §2; the API responds
`{ ok: true, counts: { decisions: 8, ... } }`; a full page reload shows the clean
RSU dataset.

---

## 5. Adversarial / edge tests

- **Bypass the gate:** try to set `implemented` while spoofing a request header —
  the gate is server-side and must still reject.
- **Stale client mirror:** mutate data, hard-refresh; server remains authoritative
  and overwrites the client cache on load.
- **Injection-ish claim text:** submit a claim with script-like content and a
  valid source URL — it is stored as text, not executed.
- **Empty inputs:** empty prediction text, empty claim, empty pulse submission —
  the UI and API must reject or no-op safely.
- **Conflicting signoffs:** approve academic, reject administrative → gate stays
  closed and status cannot advance.
- **Determinism:** run `draft-scenarios` repeatedly — output is stable and
  identical; no `mode` drift to `ai_assisted`.

---

## 6. Acceptance criteria

The sandbox is "green" when:

1. Baseline loads with RSU identity, land-grant overlay, and expected counts.
2. The 6-item diagnostics gap statement renders and only leadership can toggle.
3. `dec-r1`, `dec-r2`, `dec-r4` cannot be implemented without dual signoff +
   human disposition + gate; `dec-r5` shows the completed happy path.
4. Scenario generation is deterministic and honest about mode (no AI claim).
5. Evidence requires a source URL; staging approve/reject works.
6. Predictions record the active author; reconciliation works.
7. RBAC matrix in T11 holds exactly.
8. Tenants are isolated; reset restores the baseline.
9. `npm run lint` and `npm run build` both pass.

---

## 7. Cleanup

- Reset the sandbox (`POST /api/sandbox/reset`) and clear the local mirror:

```powershell
Invoke-RestMethod http://localhost:3000/api/sandbox/reset -Method Post
# then in the browser devtools console:
#   localStorage.removeItem('proteus_store'); location.reload();
```

- Stop the dev server. The server DB is in-memory, so a restart also returns to
  baseline.
