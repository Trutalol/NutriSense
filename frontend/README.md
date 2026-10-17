# SeptiSense frontend

Run `npm run dev` from this folder and visit http://127.0.0.1:5173. Requires Node.js 18+; no dependency installation or build step is needed. `npm run check` validates JavaScript syntax.

Includes a responsive patient dashboard, search and risk filters, eight synthetic patients, qSOFA and available-vitals SIRS scoring, illustrative risk charts, a 60-second pause/resume/reset simulator, an alert dialog, session audit entries, and JSON report export with SHA-256 observation fingerprints.

The simulation switches at 0, 20, and 40 seconds and ends at 60 seconds. Risk values are demo presets, not trained or calibrated probabilities. SIRS uses the four supplied observations; PaCO2 and immature neutrophil alternatives are unavailable. The history chart is illustrative, not recorded time-series data. Session acknowledgments are not persisted. The UI does not diagnose sepsis or septic shock.

Backend integration: replace the synthetic observations and presets in app.js with your prediction API. The exported payload illustrates the integration schema. Action URLs are previews only: there is no /api/predict or Solana action handler, wallet connection, on-chain storage, or LLM call. A locally generated hash alone does not provide an immutable audit log.

Typography uses Google Fonts with system fallbacks. All patient data is fictional.
