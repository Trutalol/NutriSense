# NutriSense

**Early malnutrition detection for senior living.**
Built for the PointClickCare "Catch It Early" challenge.

In senior living, malnutrition is common and easy to miss. A resident eats a little less each day, and by the time the weight loss is obvious, weeks have passed. NutriSense watches each resident's daily care logs, compares them with that resident's own normal, and flags the people who are starting to decline, with a plain-language reason and the care steps to take.

> Prototype. All care logs are synthetic, so do not use real resident data.

---

## Features

- **Daily risk score (0–100) for every resident.** It is built from meals, fluids, weight, appetite and chewing problems logged by aides, plus an AI screening prediction. Every point is explained.
- **Grouped by urgency.** The resident list is split into **Critical Warning**, **Signed off**, **Watch** and **Stable**, and is built for hundreds of residents. Residents who just moved up a tier are tagged **New**. You can search by name, room or reason, and filter by wing.
- **Facility overview.** Count chips and KPI cards show open alerts, average meal intake, and residents who are down 2% or more in weight.
- **Resident detail:**
  - **Resident Information** shows screening results in dropdowns: demographics, body measures, 24-hour diet recall, vitals, and balance and falls.
  - **Daily Nutrition** cards for meals, fluids, weight and appetite. Each opens a day-by-day chart.
  - **Risk trajectory** chart of the daily score.
  - **Nutrition Screening** meters: meal intake, weight change, fluids, BMI and predicted malnutrition risk.
  - **Flag Information** explains each warning sign and turns it into care steps, such as a food chart, hydration rounds or a dietitian referral.
- **AI prediction toggle.** Switch the whole dashboard between **All factors** and **AI prediction only** to see the model's view on its own.
- **SBAR handoff.** One click writes the nurse-to-physician handoff (Situation, Background, Assessment, Recommendation).
- **Sign off.** The reviewing nurse approves a memo transaction on the **Solana devnet** with a wallet such as Phantom. This creates a receipt of who reviewed which score and when that can't be quietly edited. The resident then moves to **Signed off** but stays monitored.
- **Early alerts and care report export.** The dashboard auto-refreshes every 3 seconds.

## How the score works

The daily score adds up points from the care logs and multiplies by 10, capped at 100. **70 or more is Critical Warning**, 30–69 is Watch, and below 30 is Stable.

| Sign | Points |
|---|---|
| 7-day meal intake below 50% (below 75%) | 3 (1) |
| Intake down 25+ points from the resident's usual (15+) | 2 (1) |
| Weight loss of 5%+ (2%+) | 3 (1) |
| BMI below 19 (below 21) | 2 (1) |
| 3-day fluids below 1,200 mL (below 1,500 mL) | 2 (1) |
| 2+ meals refused in the last 2 days | 1 |
| Chewing or swallowing difficulty in the last 7 days | 1 |
| AI screening prediction of 70%+ (60–69%) | 3 (1) |

Thresholds follow common screening practice: MUST, MNA-SF, and the MDS 75% meal-intake trigger.

### AI screening model

- **Model:** ridge (L2) logistic regression in scikit-learn, with `C=0.0189`, `intercept_scaling=10` and the liblinear solver.
- **Training:** trained on the screening dataset (`data/csv/data.csv`, 518 people) and exported to `frontend/model.json`.
- **In the app:** `frontend/model.mjs` runs it in Node and matches scikit-learn's predictions exactly.
- **Inputs:** 24 body, diet, blood pressure and balance measurements, plus sex and balance answers.
- **Left out on purpose:** race, education, income and marital status, so the prediction doesn't depend on demographics. The dataset's own risk columns were never given to the model and have since been removed.
- **Accuracy:** cross-validated AUC is 0.62 ± 0.05, so treat it as a second opinion, not a diagnosis.

## Tech stack

- **Server:** Node.js 22, plain HTTP with no framework (`server.mjs`).
- **Frontend:** plain HTML, CSS and JavaScript (`index.html`, `style.css`, `app.js`).
- **Database:** PostgreSQL / TimescaleDB on Tiger Data, through `pg`.
- **Blockchain:** Solana Actions on devnet. The memo transaction is built without dependencies (`solana.mjs`).
- **Model training:** Python with pandas and scikit-learn (`train-model.py`).

## Getting started

**Requirements:** Node.js 22+, and a PostgreSQL database with the TimescaleDB extension (for example, Tiger Data).

1. Create a `.env` file in the repository root. It is Git-ignored.
   ```
   DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=require
   ```
2. Install dependencies and start the server.
   ```powershell
   cd frontend
   npm.cmd install
   npm.cmd start
   ```
   Open the Local URL printed in the terminal. The default is http://127.0.0.1:5173.
3. In a second terminal, load the residents and their 28 days of care logs.
   ```powershell
   cd frontend
   npm.cmd run replay -- --interval 0.1
   ```
   Without `--interval`, it plays one day every 5 seconds, so you can watch residents move between groups live.

### Data

The `data/` folder is Git-ignored.

- `data/csv/data.csv` is the screening dataset: one row per resident.
- `data/nutrition/r<ID>.csv` holds the synthetic daily care logs, one file per resident. To regenerate them:
  ```powershell
  npm.cmd run generate              # all residents, 28 days
  npm.cmd run generate -- --days 42 --limit 100
  ```

### Other commands

| Command | What it does |
|---|---|
| `npm.cmd test` | Runs the unit tests (scoring, screening data, model, Solana) |
| `npm.cmd run check` | Syntax-checks the frontend |
| `npm.cmd run replay -- --dry-run` | Validates the care logs and prints final scores without writing to the database |
| `npm.cmd run replay -- --max-days 7` | Replays only the first 7 days |
| `python train-model.py` | Retrains the model. This needs the original file with its `HAS_MALNUTRITION` label, which has been removed from `data.csv`. |

### Sign-off with Solana

Sign-off uses the Solana **devnet**, so no real money is involved.

1. Install Phantom or another Solana wallet.
2. Switch the wallet to devnet.
3. Get free devnet SOL from a faucet.

To use a different RPC endpoint, set `SOLANA_RPC_URL` in `.env`.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Database status |
| GET | `/api/patients` | Compact list of all residents with latest score |
| GET | `/api/resident?id=` | Full record for one resident (screening, score reasons, sign-off) |
| GET | `/api/nutrition-history?patient=` | Daily logs and scores for one resident |
| GET | `/api/audit` | Alert history |
| POST | `/api/acknowledge` | Acknowledge an alert |
| GET/POST | `/api/actions/nutrition-review` | Solana Action for sign-off |
| POST | `/api/delete-patient`, `/api/delete-all-patients` | Remove resident data |

## Project structure

```
data/
  csv/data.csv              screening dataset (Git-ignored)
  nutrition/                synthetic daily care logs (Git-ignored)
frontend/
  server.mjs                HTTP server and API
  database.mjs              schema, queries, batch writes
  nutrition.mjs             daily score, reasons, care-log generator
  nutrition-replay.mjs      loads care logs into the database day by day
  generate-nutrition.mjs    builds the synthetic care logs
  nhanes.mjs                reads and decodes the screening dataset
  model.mjs / model.json    AI screening model (runs in Node)
  train-model.py            trains and exports the model
  solana.mjs                Solana devnet sign-off
  index.html, app.js, style.css   dashboard
```

## Security notes

- The server binds to localhost only and has no login, so it is for local demos.
- `DATABASE_URL` stays on the server and is never sent to the browser.
- Add authentication before exposing it anywhere else.
