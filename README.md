# Pinggan: Malaysian food calorie tracker

Mobile web prototype for the FYP *AI-Based Malaysian Food Recognition and Personalised Calorie
Monitoring for Fitness Users Using Transfer Learning*.

Take a photo of a dish, confirm what it is, and see its standard-serving calories against a
personal daily target. The app recognises the ten classes in the proposal: nasi lemak, roti canai,
chicken rice, char kuey teow, mee goreng mamak, nasi goreng, laksa, satay, rendang and thosai.

It is built mobile-first as a web app so it can be tested on a phone now and wrapped as a native
app later (see [Going native](#going-native)).

## What's in the prototype

| Proposal requirement | Where it lives |
|---|---|
| Accept a valid JPG/PNG photo | `frontend/src/lib/image.ts` (client check), `backend/app/imaging.py` (server check by file signature, size, decodability) |
| Predicted class and confidence | `POST /api/predict` returns the top 3 classes; the result screen shows confidence, a low-confidence warning below 60%, and alternatives |
| Swap in MobileNetV3 / EfficientNet-B0 / ResNet50 | `backend/app/classifier.py` loads any ONNX export; see `backend/models/README.md` |
| Standard-serving nutrition database | `data/malaysian_foods.json`, shared by the API and the app |
| Profile: age, sex, height, weight, activity, goal | Onboarding (`frontend/src/screens/Onboarding.tsx`), editable in Profile |
| Mifflin–St Jeor + activity multiplier target | `frontend/src/lib/energy.ts`; every step is shown on screen |
| Calories counted only after the user confirms dish and serving | Nothing is logged until **Add to …** is pressed on the result or dish screen |
| Meal as a share of the target and remaining allowance | "Your day with this meal" card before adding; Diary ring and totals after |
| Visible disclaimer that the photo doesn't measure portions | Result and dish screens, Diary footer, onboarding acknowledgement |
| Images and profile data not retained | Photos are processed in memory and discarded; profile and diary stay in the phone's local storage |
| Inference latency for the comparison | Each prediction reports `inference_ms`, shown on the result photo |

### Screens

- **Diary**: day switcher, calorie ring (left / over), target and eaten, carbs / protein / fat
  meters, and Breakfast / Lunch / Dinner / Snacks with per-meal totals. Tap an entry to change
  servings, move it to another meal or remove it.
- **Scan**: camera or gallery, photo tips, the list of supported dishes, then the result:
  best match, confidence, alternatives, servings, effect on today's target and meal choice.
- **Dishes**: searchable list of the ten dishes with a nutrition-facts panel per dish, for
  adding food without a photo.
- **Progress**: week view of daily calories against the target (tap a bar for details, or open
  the table view), average intake, macro energy split and most-logged dishes.
- **Profile**: the full target calculation, recognition model status, privacy and data deletion.

## Project layout

```
data/malaysian_foods.json   Standard-serving nutrition for the 10 classes (shared)
backend/                    FastAPI service: upload validation, classification, nutrition lookup
  app/                      config, imaging, classifier (ONNX + demo), nutrition, main
  models/                   Drop model.onnx + model_config.json here
  tests/                    pytest suite
frontend/                   React + TypeScript + Vite mobile web app
  src/lib/                  energy maths, diary arithmetic, dates, API client, image checks (+ tests)
  src/state/                on-device app state, toasts, model status
  src/components/           UI building blocks (ring, meters, sheets, forms)
  src/screens/              Diary, Scan, Dishes, Progress, Profile, Onboarding
```

## Running it

Requirements: Python 3.11+ and Node 20+.

**1. API** (port 8000)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**2. App, development mode** (port 5173, proxies `/api` to the API)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. To try it on your phone, connect it to the same Wi-Fi and open the
"Network" address Vite prints (for example `http://192.168.1.20:5173`).

**Single server.** After `npm run build` in `frontend/`, the API also serves the built app, so
`uvicorn app.main:app --host 0.0.0.0 --port 8000` is all that is needed.

> Phone cameras open from the **Take photo** button on any connection, but browsers only allow
> home-screen installation and some camera features over HTTPS. For wider testing, deploy behind HTTPS.

### Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PINGGAN_MODEL_DIR` | `backend/models` | Where `model.onnx` and `model_config.json` are read from |
| `PINGGAN_CONFIDENCE_THRESHOLD` | `0.6` | Top-1 confidence below which the low-confidence warning shows |
| `PINGGAN_MAX_UPLOAD_BYTES` | `10485760` | Upload size limit |
| `PINGGAN_CORS_ORIGINS` | *(none)* | Comma-separated origins, needed when the app is served from elsewhere (e.g. a native wrapper) |
| `VITE_API_BASE` | *(same origin)* | API base URL used by the app at build time |

## Connecting the trained model

Until a model is exported, the API uses a **demo classifier**. It returns a stable but
meaningless prediction for each photo, and the app shows a "Demo mode" notice on every result.
After training, export the selected network to ONNX and add its config. Step-by-step instructions
for PyTorch and Keras are in [`backend/models/README.md`](backend/models/README.md). No app
changes are needed.

## Tests

```bash
cd backend && pip install -r requirements-dev.txt && pytest
cd frontend && npm test && npm run typecheck
```

These cover the functional tests listed in the proposal:
- invalid uploads (wrong type, renamed GIF, corrupt, empty, tiny, oversized)
- successful classification for JPG and PNG
- missing nutrition entries
- Mifflin–St Jeor targets, activity and goal adjustments, and the minimum target
- arithmetic consistency: entry, meal and day totals always add up, and changing servings doesn't drift
- loading an ONNX model in both NCHW and NHWC layouts

## Nutrition data

`data/malaysian_foods.json` holds energy, carbohydrate, protein and fat per standard serving. These
are reference values compiled for the prototype from published Malaysian and regional figures.
**Check each entry against MyFCD (https://myfcd.moh.gov.my/) before the final evaluation.** Each
entry's macronutrients agree with its stated energy to within 2% using 4/4/9 kcal per gram, and a
test enforces this.

## Going native

The app is a standard Vite build, so it can be wrapped with [Capacitor](https://capacitorjs.com/)
for Android and iOS without a rewrite:

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init Pinggan my.pinggan.app --web-dir dist
npm run build && npx cap add android && npx cap open android
```

Build with `VITE_API_BASE` pointing at the deployed API, and add the app's origin
(`capacitor://localhost`, `http://localhost`) to `PINGGAN_CORS_ORIGINS`.

## Scope and limitations

Single-dish photos of the ten supported classes only. No portion or weight estimation; calories are
always for a referenced standard serving. A closed-set classifier will always choose one of the ten
dishes, so unfamiliar foods can be misidentified. The low-confidence warning helps but doesn't
guarantee those are caught. Targets are estimates for adults aged 18–65 and are not medical or
dietary advice.
