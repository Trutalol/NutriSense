# SeptiSense — codebase context

Reviewed: October 17, 2026. This document describes the source currently in this checkout, not a claim about clinical validation or live database contents. Intended for a developer or coding agent continuing the project. No credentials are included.

## Current focus: NutriSense (malnutrition early warning)

The project pivoted from sepsis to malnutrition for the PointClickCare "Catch It Early" challenge. The dashboard is branded **NutriSense** for Maplewood Senior Living.

- **Data:** synthesized daily care logs (`data/nutrition/<id>.csv`: meals %, fluids, weekly weights, appetite, chewing difficulty, CNA notes) created by `npm.cmd run generate` for PSV residents aged 65+. Patterns rotate stable / gradual decline / stable / sudden drop. PhysioNet vitals remain as supporting context only.
- **Score:** `nutrition.mjs` `scoreNutrition()`, a transparent rule-based score (model `nutrition_rules_v1`) inspired by MUST, MNA-SF and the MDS 75% intake trigger: low intake, drop vs the resident's own 2-week baseline, weight loss since first weigh-in, low BMI, low fluids, missed meals, chewing difficulty. Points x 10 = risk 0-100; watch at 30, alert at 70. Every point is returned as a driver with its evidence.
- **Replay:** `npm.cmd run replay-nutrition` writes one day per tick into `septisense.nutrition_logs` and a scored prediction (reasons in `predictions.details`), opening an alert at 70+. `npm.cmd run replay` now defaults to residents aged 65+ (`--min-age`).
- **API:** `/api/patients` takes risk/reasons/alerts from the newest NutriSense score and vitals from the newest PSV snapshot; `/api/nutrition-history` returns daily logs with each day's score. The Blink is `/api/actions/nutrition-review`.
- **Honesty note:** the care logs are synthetic; qSOFA/SIRS and the sepsis label are no longer shown.

## What the project is (original sepsis prototype)

SeptiSense is a local, database-backed healthcare hackathon prototype. The current UI is branded for a senior-living/post-acute facility and calls patients “residents.” Its working data pipeline replays PhysioNet-style PSV files into Tiger Data/TimescaleDB and displays the latest observations plus hourly vital charts.

The original product concept included clinical rules, a trained risk model, an LLM explanation layer, and Solana alerts. Only screening rules, database persistence, demo risk presets, and presentation-level explanations are implemented. There is no trained model or LLM integration. The Solana Blink is real on devnet: `/api/actions/sepsis-review` follows the Solana Actions spec (GET metadata, POST unsigned memo transaction, POST confirm), and the server verifies the signed memo on-chain before storing a row in `blink_receipts` and acknowledging any open alert. See `solana.mjs` (dependency-free transaction builder and JSON-RPC verification).

## Stack and source map

The project uses plain HTML/CSS/browser JavaScript, Node's built-in HTTP server, PostgreSQL through `pg`, and the TimescaleDB extension. There is no React, bundler, build step, or frontend framework. `pg` is the only declared application dependency.

| File | Responsibility |
| --- | --- |
| `frontend/index.html` | Dashboard markup, resident roster, care roles, vital cards, score panels, action buttons, shared dialog. |
| `frontend/style.css` | Responsive dashboard and modal styling; web font imports with fallbacks. |
| `frontend/app.js` | Rendering, filters, role presentation, polling, JSON export, demo SBAR/Blink dialogs, hourly SVG charts, deletion confirmations. |
| `frontend/server.mjs` | Static asset allowlist and API routes; database initialization and local listener. |
| `frontend/database.mjs` | Connection pool, base schema, demo observation writer, reads, acknowledgments, patient deletion, explicit demo seeding. |
| `frontend/demo-data.mjs` | Eight fictional patients with fixed vital arrays and risk percentages. |
| `frontend/psv.mjs` | Pure PSV parser, eight-vital mapping, missing-aware screening scores. |
| `frontend/replay.mjs` | CLI options, input validation, hourly scheduler, run/resume lifecycle. |
| `frontend/replay-store.mjs` | Replay schema migration, manifest verification, transactional hourly persistence. |
| `frontend/psv.test.mjs` | Four automated parser/scoring tests. |
| `frontend/package.json` | Start/check/replay/test commands. |
| `.env` | Local server-only `DATABASE_URL`; never commit or copy into context. |
| `data/psv/` | Default local patient input directory; Git-ignored. |

## Running locally

Use Node.js 22+ (development has used Node 24). In PowerShell, use `npm.cmd` to avoid execution-policy errors from `npm.ps1`.

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

A repository-root `.env` must define `DATABASE_URL`. Both the HTTP server and replay CLI load it through `database.mjs`. Initialization requires access to the database and permission to create the application schema and hypertable. The Timescale extension must already be available.

The server binds to `127.0.0.1`, defaults to port 5173, and tries subsequent ports through 5193 when occupied. `PORT` can override the initial port. Use the exact `Local:` URL printed at startup; do not assume an older server on another port has the latest backend code. Restart after server/database module changes; reload the browser after frontend edits.

In a second terminal, from `frontend`:

```powershell
npm.cmd run replay
npm.cmd run replay -- --folder "C:\data\patients" --interval 5
npm.cmd run replay -- --dry-run
npm.cmd run replay -- --max-hours 3
npm.cmd run replay -- --run-id YOUR_RUN_UUID
```

Defaults: repository `data/psv`, five-second delay. `--start` supplies the synthetic timestamp for ICU hour 1. `--max-hours` limits pending hour ticks processed by this invocation. `--dry-run` validates inputs without importing the database module or writing data.

Ctrl+C finishes the current write and stops. Uploaded data remains in the database. Starting without `--run-id` creates a new run; resuming requires the same filenames and file hashes. Local PSV files are unchanged by replay or database deletion.

## Data flow and time semantics

```text
PSV files → parse/validate → replay CLI → writeHour transaction → Tiger Data
                                                                ↑
Browser ← polling API ← local Node HTTP server ← database queries
```

For each source hour, replay selects that `ICULOS` row from every file that has one, processes patients sequentially, then waits the configured interval. The actual wall-clock spacing includes database processing time; this is not a fixed-rate real-time scheduler. Files with shorter stays finish independently; missing hours are skipped. All input files are loaded into memory before replay, so use a bounded cohort rather than an entire large dataset.

Three times are deliberately distinct:

- `observed_at`: replay origin plus `(ICULOS - 1)` hours; preserves clinical spacing and may be in the future during accelerated replay.
- `replay_rows.ingested_at`: actual database ingestion time.
- `predictions.predicted_at`: actual snapshot insertion time for imported rows; determines which observation the dashboard treats as latest.

Each hourly transaction writes the raw source row, typed observation, and unscored prediction/snapshot together. A `(run_id, patient_id, source_hour)` primary key and advisory lock prevent duplicate hourly records within one run. Different runs intentionally retain separate copies.

## PSV mapping and missing values

Filenames identify patients: `p000001.psv` becomes database ID `p000001` and display name `Resident 1` (older `Patient N` names are renamed on server start). The trailing filename number drives the display number; it is not a separate sequential allocation. Numeric IDs can collide across different source folders because folder/dataset identity is not namespaced.

The vital array order is shared by the frontend and persistence code and must remain consistent:

| Index | Source | Meaning |
| --- | --- | --- |
| 0 | HR | Heart rate, bpm |
| 1 | Resp | Respiratory rate, breaths/min |
| 2 | SBP | Systolic BP, mmHg |
| 3 | Temp | Temperature, Celsius |
| 4 | O2Sat | Oxygen saturation, percent |
| 5 | None | GCS, always NULL for this importer |
| 6 | WBC | White blood cell count |
| 7 | Lactate | Lactate, mmol/L |

The parser accepts a BOM and CRLF, validates required/duplicate headers and row widths, rejects nonfinite numbers, and requires positive, strictly increasing integer ICULOS. Blank, NaN, NA, and null cells become JavaScript null and SQL NULL. No forward filling or imputation occurs. All numeric source columns are preserved in `raw_data`, including SepsisLabel; that outcome label never becomes a risk score or feature in the implemented rules.

qSOFA and SIRS return null when a required criterion is missing. Since GCS is absent, imported qSOFA is unavailable. SIRS can be calculated when its four supplied inputs are available; alternative PaCO2/band-neutrophil criteria are not implemented. Imported risk stays NULL and model_version is `psv_unscored_v1`; the importer generates no clinical alerts.

Demographics are simplified: age is rounded, missing age becomes 0, gender maps 1/0 to Male/Female, and bed is the placeholder `Dataset`. These are implementation details, not complete clinical demographic modeling.

## Database layout

All tables live in the `septisense` schema.

| Table | Purpose and keys |
| --- | --- |
| patients | ID, display name, age, sex, bed. |
| encounters | Admission record linked to patient; current writers reuse `ICU-{patient_id}-01` across replays. |
| observations | Timescale hypertable partitioned on observed_at; composite primary key `(observed_at, id)`, encounter/run IDs, the original eight measurement columns plus a typed column for every other PSV column (mapping in `PSV_COLUMNS`, `psv.mjs`; added by `initialize()`, backfilled from `replay_rows` by `migrateReplay()`). |
| predictions | UUID, encounter/run, insertion time, risk integer 0–100 or NULL, scores, JSON vital snapshot, canonical input text/hash, model version. Imported rows are unscored snapshots despite the table name. |
| alerts | Prediction/encounter/run, status, created time; unique encounter/run prevents repeated demo alerts within a run. |
| alert_events | Created/acknowledged events; actor defaults to demo-user. |
| replay_runs | UUID, synthetic origin, input filename/hash manifest. |
| replay_rows | Raw JSON source rows, source hour, observation/ingestion times; unique run/patient/hour. |

`initialize()` creates the six base tables and hypertable in a transaction. It does not automatically seed demo patients. `migrateReplay()` creates replay tables and allows NULL risk/scores. These are runtime DDL operations rather than versioned migrations.

Demo data remains available through explicit `/api/seed`: eight fictional patient records are upserted and fresh observations/predictions are appended under a new run UUID. Repeated seeding appends history; it does not clear imported patients or restore deleted real/imported history.

Hashes are SHA-256 of stored canonical text for database writes. They allow recomputation against that text but are not signatures, external attestations, immutable logs, or on-chain records.

## API contract

All paths are on the same local origin. Query values use parameterized SQL. JSON responses use no-store caching.

| Method/path | Behavior |
| --- | --- |
| GET /api/health | Database SELECT 1 health check. |
| GET /api/patients | Latest prediction snapshot per encounter, demographics, hash, alert ID/status. Patients without prediction rows are excluded. |
| GET /api/vital-history?patient=ID | Raw hourly rows from the run of the latest prediction, sorted by source hour. It does not merge different replays. |
| GET /api/audit | Latest 100 alert events and corresponding hashes. |
| POST /api/observations | Legacy demo writer: `{id, v, risk, run_id}`. Requires a four-digit ID, eight nonnegative finite readings, integer risk 0–100, UUID run. It is not the PSV ingestion endpoint. |
| POST /api/acknowledge | `{alert_id}`; changes an open alert and appends one acknowledgment event transactionally. |
| POST /api/seed | Explicitly inserts/updates the fictional demo cohort and appends demo observations. |
| POST /api/delete-patient | `{patient_id, confirm:true}`; deletes patient and dependent records transactionally. |
| POST /api/delete-all-patients | `{confirm:"DELETE ALL"}`; deletes all patient-related records plus replay runs in one transaction. |

Only `/`, `/index.html`, `/app.js`, and `/style.css` are served as static files. Backend modules, node_modules, input data, and .env are not exposed by that allowlist. There is no `/api/predict` or `/api/actions/sepsis-alert` handler.

## Frontend behavior

The dashboard fetches patients and audit events every three seconds. Selecting a vital opens an SVG chart from the hourly-history endpoint, also refreshed every three seconds while open. Missing readings create gaps; zero remains a valid measurement. A table exposes exact hourly values. If no measurement exists, an empty state is shown.

The current care-role selector changes labels, persona, and notifications only. It is not authentication or authorization. Resident locations are derived from IDs/beds, not a real facility database. Behavioral signal cards are deterministic text selected by risk tier, not recorded meal, cognition, mobility, or hydration logs. SBAR is assembled locally from templates. JSON export is assembled in the browser and generates a fresh timestamp/hash; it is not a byte-for-byte export of a persisted prediction's canonical input.

Deleting one patient removes related observations, snapshots, alerts/events, encounters, and replay rows, but leaves replay-run manifests. Deleting all also removes manifests. UI confirmation is required, including typed DELETE ALL for bulk deletion. The operations leave source files intact. Stop replay before deleting: ongoing imports can recreate records, and a process using deleted run metadata can fail. Shared manifests may still contain a deleted patient's filename/hash after individual deletion.

## Important findings and implementation gaps

These are findings from code inspection, not changes made during this documentation task:

1. **Solana UI claims exceed implementation.** Buttons say sign/on-chain, but acknowledgment only writes PostgreSQL; action links target a missing endpoint. No wallet SDK, RPC call, transaction signature, or Devnet submission exists.
2. **Clinical AI presentation exceeds implementation.** Behavioral observations, explanations, and SBAR are hardcoded/template-derived. The risk chart uses a fixed illustrative sequence, not prediction history. There is no trained or calibrated risk probability and no LLM call.
3. **Unknown risk is partly presented as stable.** Main badges say Not scored, but roster secondary labels, baseline tags, and stable summary counts also treat unscored residents as stable. Unknown data should remain visibly distinct.
4. **Some metrics are placeholders.** The element named average is set to literal 85 whenever any scored patient exists. Facility identities, care-role personas, date, room/wing derivations, and some initial counts are presentation values, not database-derived facts.
5. **Demo reset copy is misleading.** Empty/deletion text references Reset demo cohort, but the inspected markup/JS does not wire such a button. The backend seed endpoint exists. Seeding cannot restore deleted imported records; those require replaying files.
6. **Migration lifecycle is split.** A fresh server creates base tables only; replay creates replay tables and changes score nullability. A demo patient's history request before replay initialization can hit a missing replay_rows table.
7. **Data model is limited.** Multiple admissions per patient are not fully supported by writers or the UI. Filename identity is global. Predictions are also used as display snapshots, and demo ingestion accepts client-provided risk rather than calculating it.
8. **Replay capacity and resilience are basic.** Files are read fully, writes are sequential, no automatic retry/backoff exists, and resume manifest comparison uses JSON.stringify rather than structural comparison. Single-run deduplication is present; broad distributed replay orchestration is not.
9. **Security is local-prototype level.** No authentication, authorization, rate limiting, or clinical privacy controls are implemented. POST Origin is checked only when supplied. Several database-derived values are interpolated into innerHTML; use escaped output or DOM text nodes before accepting arbitrary user data.
10. **TLS depends on configuration.** The code honors URL sslmode using libpq semantics; require encrypts but can accept self-signed certificates without identity verification. If missing, the code defaults to verify-full. Pool max is 5, connection timeout 10s, query timeout 15s.
11. **UI error recovery is incomplete.** Some buttons disabled after initial loading failure may not all re-enable after polling recovers. Legacy simulation variables remain. Modal history refresh can replace expanded table state.
12. **Documentation has drift.** The root README describes aspirations. Older frontend README statements about automatic seeding and synthetic-only contents do not fully reflect the present explicit seed endpoint and imported dataset flow.

## Verification performed for this document

- Reviewed server, database, replay/parser, frontend behavior, markup, styles, package scripts, and existing documentation.
- `npm.cmd --prefix frontend test`: all four current tests passed.
- `npm.cmd --prefix frontend run check`: browser app syntax passed.
- The test named for reordered columns does not actually reorder its fixture headers; that coverage should be added.
- No live patient counts are asserted here. No database writes, deletions, replay uploads, seed calls, or browser workflow tests were performed for this documentation task.

Recommended next work: reconcile UI claims with actual data; separate unknown from normal; introduce versioned migrations and integration tests; add the real model behind an explicit prediction contract; implement authenticated roles before deployment; and implement Solana only when a wallet/transaction design is ready.
