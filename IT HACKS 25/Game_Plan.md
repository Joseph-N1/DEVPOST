Assumptions (so the plan is explicit)

Single-farm, multiple rooms. CSV uploads (daily/weekly/monthly) are the primary ingestion method.

No hardware; sensor fields will be included but fed via CSV or API (synthetic).

Language support: English, Hausa, Yoruba, Igbo via i18n.

You are the only developer; AI agents will generate code; you will review & integrate.

Deliverables: hosted demo (or local Docker), 2–4 minute demo recording, Devpost write-up + slide deck.

Tech stack (minimal & fast for 3 days)

Frontend

Next.js (React) — fast scaffolding, API routes optional

Tailwind CSS — quick, pleasing UI

react-i18next — localization (English, Hausa, Yoruba, Igbo)

Chart.js (via react-chartjs-2) or Recharts — time-series & comparison charts

Backend / ML

FastAPI (Python) — CSV parsing, analytics and ML endpoints

SQLite (via SQLModel or SQLAlchemy) for simplicity (easy to run and portable)

pandas, scikit-learn or xgboost for modeling, SHAP for explainability

Dev & infra

Docker & docker-compose (frontend + backend + db) for reproducible local deployment

GitHub repo; optional deployment: Vercel (frontend) + Render/Railway (backend) if time allows

OBS / Loom for demo recording

Utilities

OpenWeather (optional) or synthetic weather generator for modeling weather impact

faker / synthetic data scripts to create convincing example CSVs

Minimum viable feature set (must-have for demo)

User page (no complex auth): simple login stub or single demo account.

CSV upload page (farm/room/time series).

Rooms list & room comparison (rank by KPI: FCR, mortality rate, avg weight).

Room detail page with charts: temperature, humidity, feed consumed, mortality, avg weight.

Predictive endpoint: next-cycle predicted KPIs (avg weight, FCR, mortality) + recommended feed/vitamin combo.

Explanation panel showing top drivers (SHAP-style, plain-English).

Export report (CSV/PDF) + short demo video.

CSV format (canonical — use this for synthetic data & uploads)

Provide a single CSV per upload with the following columns (header row) — example row below.

Header:

farm_id,room_id,date,age_days,temperature_c,humidity_pct,ammonia_ppm,feed_consumed_kg,feed_type,vitamins,disinfectant_used,mortality_count,egg_count,avg_weight_kg

Example:

farm_1,room_1,2025-10-01,21,30.2,72,10,125.4,Feed A,Vit A,Yes,2,3500,1.12

Notes:

date format: ISO YYYY-MM-DD

feed_type: categorical (Feed A / Feed B / Feed C / Feed D)

vitamins: simple label (Vit A, Vit B, etc.)

Provide at least 30–90 days per room for a reasonable model.

3-day timeline (detailed, hour-blocked). You are solo + AI agents.
Day 1 — Setup, data & backend core (Hours 0–12)

0–2 hrs: Project & repo scaffold

Create Git repo and branch.

Scaffold frontend/ (Next.js + Tailwind) and backend/ (FastAPI).

Add docker-compose.yml for backend + frontend + sqlite volume.

2–6 hrs: DB schema + CSV parser + synthetic data generator

Implement SQLite schema (users, farms, rooms, metrics, cycles, feed_catalog).

Write CSV import endpoint and Python script to validate CSVs.

Create synthetic data generator (N rooms × T days).

6–12 hrs: Basic analytics endpoints

Implement /api/rooms/{id}/metrics (time-series) and /api/rooms/{id}/analytics (KPIs: FCR = feed_consumed_kg / total_weight_gain_kg, mortality_rate = mortality_count / bird_count, avg_weight).

Unit test CSV import & analytics on synthetic data.

Deliverable EOD Day1: Functional FastAPI with CSV upload, DB storing metrics, analytics endpoints; synthetic dataset produced.

Day 2 — Frontend & ML (Hours 12–36)

12–18 hrs: Frontend initial UI

Build login/demo landing, farms & rooms list, CSV upload page (send to backend).

Room list should show ranking (KPI) table and small sparkline charts.

18–26 hrs: Room detail UI & charts

Build room detail page with Chart.js visualizations for temperature, humidity, feed, weight, mortality.

Add CSV upload feedback and sample data viewer.

26–34 hrs: ML model & prediction endpoint

Create feature engineering pipeline (rolling means, age_of_cycle, recent mortality trend, avg temp/humidity) in Jupyter notebook or script.

Train simple XGBoost or RandomForest to predict next-cycle avg weight and mortality. Save model artifact (pickle).

Implement /api/rooms/{id}/predict that returns predicted KPIs and recommended feed/vitamin combos + SHAP feature importances.

34–36 hrs: Hookup frontend to prediction endpoint

Display predicted KPIs and top recommendation on Room detail page.

Show plain-English explanation for top 3 features.

Deliverable EOD Day2: UI shows data + predictions + explanations.

Day 3 — Polish, localization, reporting & demo (Hours 36–72)

36–44 hrs: Localization & UX polish

Integrate react-i18next; wire English + Hausa + Yoruba + Igbo translations for key strings (dashboard, upload, recommendation text). Keep translations minimal (50–100 strings).

Mobile responsiveness polish (Tailwind breakpoints).

44–56 hrs: Reporting & export

Add “Export report (CSV)” and “Download recommendation” buttons. Create simple PDF or CSV generator backend route.

56–64 hrs: Deployment & CI (quick)

Deploy frontend to Vercel (or run locally); backend to Render or run with docker-compose on a host.

Add a simple GitHub Actions workflow to run tests and build.

64–72 hrs: Demo recording + Devpost + buffer

Record a 2–4 minute demo: problem → upload CSV → show room comparison → open room → show prediction + recommendation → export report.

Create Devpost description & slide deck (4–6 slides). Polish README.

Deliverable EOD Day3: Deployable demo + video + Devpost/slide deck.

Concrete AI prompts (copy/paste for your code-generation agents)

(These are short, practical prompts — prefix with agent role “You are a senior engineer…” where applicable.)

Repo scaffold
You are a senior full-stack engineer. Create a repo scaffold for a Poultry Tracker MVP:

- frontend: Next.js + Tailwind, pages: /, /upload, /farms, /rooms/[id]
- backend: FastAPI app with endpoints for CSV upload, metrics, analytics, and predictions
- docker-compose.yml for frontend, backend, sqlite
  Return files only or a zip structure and minimal README with run commands.

SQLite schema
Task: Generate SQL CREATE TABLE statements for SQLite:
tables: users, farms, rooms, metrics, feed_catalog, predictions
metrics columns: id, farm_id, room_id, date, age_days, temperature_c, humidity_pct, ammonia_ppm, feed_consumed_kg, feed_type, vitamins, disinfectant_used, mortality_count, egg_count, avg_weight_kg
Return SQL.

CSV parser endpoint (FastAPI)
Task: Implement a FastAPI POST /upload-csv endpoint:

- Accept multipart/form-data file upload
- Validate header matches expected columns
- Parse using pandas and insert rows into SQLite
- Return counts inserted per room and any validation errors
  Return Python FastAPI code plus key dependency versions.

Synthetic data generator
Task: Write a Python script `generate_synthetic.py`:
Input: num_rooms, days_per_room, start_date
Output: CSV containing records per day per room with realistic temp/humidity diurnal noise, feed_consumed_kg roughly correlated with avg_weight and age, occasional mortality spikes.
Return the script and one sample output CSV (5 rooms × 90 days).

Analytics & KPIs endpoint
Task: Implement GET /rooms/{id}/analytics which computes:

- avg_weight over period
- FCR = total_feed_consumed_kg / total_weight_gain_kg (approx)
- mortality_rate = total_mortality_count / initial_bird_count
- ranking score (composite)
  Return FastAPI route code.

Train model & prediction endpoint
Task: Create a Jupyter notebook and Python script that:

- Loads CSV/DB
- Engineers features (rolling avg temp/humidity, last 7-day mortality, avg feed per bird, age_of_cycle)
- Trains XGBoost to predict next cycle avg_weight and mortality_rate
- Exports model.pkl and a function predict_for_room(room_df) -> {pred_avg_weight, pred_mortality, recommended_feeds:[{name,score}]}
  Also add a FastAPI route /rooms/{id}/predict that loads model.pkl and returns JSON including SHAP importance for top features.

Frontend pages & charts
Task: Create Next.js pages/components:

- /upload: CSV upload to backend and success/error UI
- /farms: list of farms and rooms with KPIs table
- /rooms/[id]: charts (temperature, humidity, feed, weight, mortality), prediction card with recommended feed combo, explainability panel
  Return React components with Chart.js usage and example fetch calls to backend endpoints.

Localization wiring
Task: Add react-i18next to the Next.js app, provide translation JSON files for keys (en, ha, yo, ig). Translate these strings: dashboard title, upload button, prediction labels, "Why this recommendation", export labels. Provide minimal translations (I will adjust later).
Return code snippets and a small translation JSON for each language with at least 20 keys.

Demo script
Task: Draft a 2–4 minute demo video script showing:

- Problem statement (why this helps poultry farmers)
- Quick upload of a CSV
- Show room comparison + identify best/worst room
- Open room to show charts, prediction & recommended feed combo + plain-English explanation
- Export report
  Return script and 5 slide titles with bullet points for each slide.

How components connect (quick architecture)

Frontend (Next.js) calls backend FastAPI for CSV upload and retrieves analytics/predictions.

Backend persists metrics to SQLite; analytics endpoints compute KPIs and ranking on demand.

Prediction endpoint loads pre-trained model artifact and returns predictions + SHAP importances.

Frontend displays results and allows download/export.

Translation approach (practical for 3 days)

Use react-i18next with in-app language selector.

Keep translation strings short. Start with English copy, then translate key strings into Hausa/Yoruba/Igbo using quick translation (AI can generate labels but review them with a native speaker if possible).

For the demo, supply the UI in English + one example sentence per language for the recommendation card (judges will see multilingual support).

Quick priorities (what must be perfect in 3 days)

CSV upload + reliable parsing (data integrity matters).

Room comparison + clear KPI visualization (judges should immediately see “Room X is best/worst”).

Prediction & recommendation card (headline: “Switch to Feed B next cycle — expected +4% weight, +2% ROI”) with short justification.

Demo video (clear story & actions) — this sells the project.

Deliverables checklist for submission

Live demo link / instructions to run via docker-compose up

Repo on GitHub

Demo video (2–4 minutes)

Slide deck (4–6 slides)

Devpost write-up (problem, tech stack, impact, link to demo & repo)

README with run commands & CSV spec

Final practical commands & file hints

Quick commands you can give your AI agent to generate code and run locally:

Create repo scaffold (agent prompt above).

Start services locally (once scaffold is ready):

# from project root

docker-compose build
docker-compose up

# or run backend (FastAPI)

cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# run frontend

cd frontend
npm install
npm run dev

Upload a sample CSV (use Postman or Next.js upload page) and verify analytics endpoints:

GET http://localhost:8000/rooms/{room_id}/analytics
GET http://localhost:8000/rooms/{room_id}/predict

Quick suggestions to make the project stand out

Show expected ROI for each recommended feed/vitamin — judges love business impact.

Include “what-if” toggles: let the judge try Feed A vs Feed B and show simulated outcome. (Small UI tweak but high impact.)

Add a one-page farmer action checklist: simple steps to implement recommendations (e.g., "Switch feed on day X, monitor weight weekly").
