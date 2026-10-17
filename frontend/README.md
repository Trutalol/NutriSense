# SeptiSense connected demo

From this folder run `npm.cmd install`, then `npm.cmd run dev` (Node.js 22+). Open the exact Local URL printed in the terminal; occupied ports are skipped. Stop older preview servers with Ctrl+C to avoid opening an old version.

The backend loads DATABASE_URL from the repository-root .env, which must remain ignored by Git. No credentials are sent to the browser. Only index.html, app.js, and style.css are served publicly. The server binds to loopback for this unauthenticated local demo.

Startup creates a dedicated septisense schema with patients, encounters, observations (Timescale hypertable), predictions, alerts, and alert_events. Eight synthetic patients are seeded only once. Observation and prediction writes are transactional; repeat startup preserves stored data. Each simulation run has a UUID; alerts are deduplicated per encounter and run. Acknowledgments and audit events persist in Tiger Data. Risk values remain illustrative presets, and the six-hour chart remains illustrative rather than a database history plot. Solana and LLM integrations are not implemented.

API routes:
- GET /api/health
- GET /api/patients
- GET /api/audit
- POST /api/observations with id, v (eight numeric readings), risk (0-100 integer), run_id (UUID)
- POST /api/acknowledge with alert_id

The backend honors DATABASE_URL's sslmode with PostgreSQL-compatible semantics. sslmode=require encrypts the connection but does not verify server identity for a self-signed certificate. Use verify-full and a trusted certificate for a production connection. Add authentication and authorization before exposing this demo beyond localhost. Use synthetic data only.

Checks: npm.cmd run check and node --check server.mjs. Dependencies are locked in package-lock.json.

## Replay a folder of PhysioNet PSV files

Place .psv files in `data/psv/` at the repository root (a sample p000001.psv has been copied there). The folder and PSV files are Git-ignored. Every file represents a patient; filenames become dataset patient IDs. The original file is not changed.

From `frontend`:

```powershell
npm.cmd run replay -- --folder ../data/psv --interval 5
```

Each tick uploads one ICU hour from every eligible patient, with a five-second delay between ticks. Shorter files finish independently; missing ICU hours are skipped. The dashboard polls every three seconds: reload the browser once after updating the code. Search for p000001 to find the sample. Keep the website server running in a separate terminal.

Validate without database writes:

```powershell
npm.cmd run replay -- --folder ../data/psv --dry-run
```

Stop with Ctrl+C. The current database transaction finishes safely. Copy the printed run ID to resume without duplicate rows:

```powershell
npm.cmd run replay -- --folder ../data/psv --interval 5 --run-id YOUR_RUN_UUID
```

Use `--max-hours 3` to limit a test to three pending source-hour ticks. A new invocation without --run-id starts a separate replay; stored prior runs are preserved. Resume requires the same filenames and file contents (SHA-256 checked). This implementation validates and loads all files into memory, so use a selected patient cohort rather than the full challenge dataset at once.

Observation time = run start + (ICULOS - 1) hours, preserving source-time spacing despite accelerated wall-clock ingestion. `--start 2026-10-17T00:00:00Z` chooses the simulated origin. The replay_rows table also records actual ingestion time, ICU hour, run ID, and every original column in raw_data. A database transaction stores each source row, typed vitals, and an unscored dashboard snapshot together.

NaN and blank readings remain NULL. GCS is absent in this dataset and stays NULL; incomplete screening scores are unavailable. No forward-fill is performed. SepsisLabel remains an outcome label in raw_data and is never converted into a predicted risk. Imported patients show Not scored until a real scoring engine is connected. No automatic clinical alerts are created by this importer.
