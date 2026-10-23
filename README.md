# Pinggan: Malaysian food calorie tracker

Mobile web prototype for the FYP *AI-Based Malaysian Food Recognition and Personalised Calorie
Monitoring for Fitness Users Using Transfer Learning*.

*Kira kalori, cara Malaysia.* Snap a dish, confirm what it is, adjust it the way you actually
ordered it (+ telur mata, kurang manis), and see how it fits your daily target.

The camera recognises the ten classes in the proposal: nasi lemak, roti canai, chicken rice,
char kuey teow, mee goreng mamak, nasi goreng, laksa, satay, rendang and thosai. Everything else
can be logged from a list of 76 everyday Malaysian foods and drinks, your own foods, or a quick
calorie entry.

It is built mobile-first as a web app so it can be tested on a phone now and wrapped as a native
app later (see [Going native](#going-native)).

## Made for Malaysian eating

| Feature | What it does |
|---|---|
| 76 local foods and drinks | Nasi kandar, mee rebus, roti telur, kuih, cendol, teh tarik, kopi O, durian and more, in 8 categories (Nasi, Mee & kuey teow, Roti, Lauk, Kuih, Desserts, Minuman, Buah) |
| Malay serving units | 1 bungkus, 1 pinggan, 1 mangkuk, 10 cucuk, 1 gelas, alongside the English label and gram weight |
| Add-ons ("Tambah") | Nasi lemak + ayam goreng / telur mata / rendang ayam / sambal sotong; roti canai + kuah dhal; satay + ketupat, and so on |
| Drink sweetness | Normal, **Kurang manis** (half the sugar) or **Kosong** (no added sugar) |
| Malaysian meals | Breakfast, Lunch, **Tea time** (minum petang), Dinner and **Supper**, suggested by time of day |
| Halal-friendly filter | Hides dishes that usually contain pork (bak kut teh, char siu pau, wantan mee…) |
| Asian BMI cut-offs | Healthy 18.5–22.9, as in Malaysia's clinical practice guidelines |
| Pinggan Sihat Malaysia | The MOH "suku-suku separuh" plate guide on the Home screen |
| Your own foods | Masakan rumah or a stall favourite, saved once and logged any time |
| Quick add | Calories only, when you just want it counted |
| Malay greetings | Selamat pagi / tengah hari / petang / malam |

## What's in the prototype

| Proposal requirement | Where it lives |
|---|---|
| Accept a valid JPG/PNG photo | `frontend/src/lib/image.ts` (client check), `backend/app/imaging.py` (server check by file signature, size, decodability) |
| Predicted class and confidence | `POST /api/predict` returns the top 3 classes; the result shows "% match", the 60% low-confidence threshold and alternatives |
| Swap in MobileNetV3 / EfficientNet-B0 / ResNet50 | `backend/app/classifier.py` loads any ONNX export; see `backend/models/README.md` |
| Standard-serving nutrition database | `data/malaysian_foods.json`, shared by the API and the app |
| Profile: age, sex, height, weight, activity, goal | Onboarding (`frontend/src/screens/Onboarding.tsx`), editable under Me |
| Mifflin–St Jeor + activity multiplier target | `frontend/src/lib/energy.ts`; every step is shown on screen |
| Calories counted only after the user confirms dish and serving | Nothing is logged until **Add to …** is pressed |
| Meal as a share of the target and remaining allowance | "Your day after this" card before adding; Home summary after |
| Visible disclaimer that the photo doesn't measure portions | Scan result and food screens, Home footer, onboarding acknowledgement |
| Images and profile data not retained | The server processes photos in memory and discards them. A small meal thumbnail is kept **on the phone only** if the user leaves "Keep meal photos" on |
| Inference latency for the comparison | Each prediction reports `inference_ms`, shown on the result photo |

### Screens

- **Home**: greeting, logging streak, week strip with a progress ring per day, the dark calorie
  card (left / over, macros), Scan / Search / Quick add, five meal cards with food art or your
  meal photo, and the Pinggan Sihat tip. Tap an entry to change servings, move or remove it.
- **Scan**: live camera preview with a shutter where the browser allows it (HTTPS or
  localhost), falling back to the phone's camera app and the gallery. The result shows your photo,
  the best match, confidence, alternatives and a search across every food, then the log panel.
- **Foods**: search in English or Malay, category chips, recent foods, the dishes the camera
  knows, and every category. Each food has its own page with add-ons, sweetness and a
  nutrition-facts panel.
- **Progress**: week view of daily calories against the target (tap a bar, or view as a table),
  average, days within target, streak, macro energy split and most-logged foods.
- **Me**: name, age, height, weight and BMI, the full target calculation, settings (halal filter,
  meal photos, my foods), recognition model status, privacy and data deletion.

### Design

Plus Jakarta Sans (bundled, works offline) on a cool neutral canvas, black pill buttons, a pandan
green accent and a dark summary card. Every food has a flat, top-down illustration drawn in SVG
(`frontend/src/art/`): bespoke art for the ten scan-ready dishes and tinted plate, bowl, glass,
kuih and fruit art for the rest, so the app has no image files to download. Icons are from
[Phosphor](https://phosphoricons.com/). The macro colours were checked for colour-vision
deficiency in light and dark mode. Light and dark themes follow the phone's setting.

## Project layout

```
data/malaysian_foods.json   76 foods, categories and add-ons per standard serving (shared)
backend/                    FastAPI service: upload validation, classification, nutrition lookup
  app/                      config, imaging, classifier (ONNX + demo), nutrition, main
  models/                   Drop model.onnx + model_config.json here
  tests/                    pytest suite
frontend/                   React + TypeScript + Vite mobile web app
  src/art/                  SVG food illustrations
  src/lib/                  energy maths, diary arithmetic, foods, dates, API client, image checks (+ tests)
  src/state/                on-device app state, toasts, model status
  src/components/           UI building blocks (summary ring, week strip, log panel, sheets…)
  src/screens/              Home, Scan, Foods, Food detail, Create food, Progress, Me, Onboarding
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

> Over plain HTTP on a phone, browsers block the live camera preview, so the shutter opens the
> phone's own camera app instead. Serve over HTTPS (or use `localhost`) to get the live viewfinder.

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
changes are needed. Only the ten foods marked `"scan": true` are model classes.

## Tests

```bash
cd backend && pip install -r requirements-dev.txt && pytest
cd frontend && npm test && npm run typecheck
```

These cover the functional tests listed in the proposal:
- invalid uploads (wrong type, renamed GIF, corrupt, empty, tiny, oversized)
- successful classification for JPG and PNG
- missing nutrition entries
- Mifflin–St Jeor targets, activity and goal adjustments, the minimum target, and Asian BMI bands
- arithmetic consistency: entry, meal and day totals always add up, including add-ons and
  sweetness, and changing servings doesn't drift
- loading an ONNX model in both NCHW and NHWC layouts
- the Malaysian features: add-ons, kurang manis / kosong, the five meals and their times, quick
  add, custom foods, the halal filter, search by Malay names, streaks and migration of older diary
  data

## Nutrition data

`data/malaysian_foods.json` holds energy, carbohydrate, protein and fat per standard serving for 76
foods, 13 add-ons, the sugar from sweetener in drinks (`sugar_g`) and a `pork` flag. These are
reference values compiled for the prototype from published Malaysian and regional figures.
**Check each entry against MyFCD (https://myfcd.moh.gov.my/) before the final evaluation.** Every
food's macronutrients agree with its stated energy using 4/4/9 kcal per gram, and a test enforces
this.

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

The camera handles single-dish photos of the ten supported classes only. There is no portion or
weight estimation; calories are always for a referenced standard serving plus the add-ons the user
picks. A closed-set classifier always chooses one of the ten dishes, so unfamiliar foods can be
misidentified. The low-confidence warning helps but doesn't guarantee those are caught. The pork
flag reflects how a dish is usually prepared, not a halal certification. Targets are estimates for
adults aged 18–65 and are not medical or dietary advice.
