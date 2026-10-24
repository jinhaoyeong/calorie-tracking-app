# Pinggan: Malaysian food calorie tracker

Mobile web prototype for the FYP *AI-Based Malaysian Food Recognition and Personalised Calorie
Monitoring for Fitness Users Using Transfer Learning*.

Calorie and macro tracking for people who train, built around Malaysian food. Snap a dish,
confirm what it is, adjust it the way you actually ordered it (+ telur mata, kurang manis), and
see how it fits your calorie and protein targets.

The camera recognises dishes in one of two ways. The trained model from the proposal knows ten
classes: nasi lemak, roti canai, chicken rice, char kuey teow, mee goreng mamak, nasi goreng,
laksa, satay, rendang and thosai. Until that model is exported, Claude's vision (Anthropic)
recognises the photo against all 76 foods and drinks in the database and ticks the add-ons it can
see on the plate. Anything can also be logged from the food list, your own foods, or a quick
calorie entry. See [Food recognition](#food-recognition).

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
| Working recognition before the model is trained | `backend/app/vision.py` asks Claude to pick from the food list (structured JSON), including visible add-ons |
| Standard-serving nutrition database | `data/malaysian_foods.json`, shared by the API and the app |
| Profile: age, sex, height, weight, activity, goal | Onboarding (`frontend/src/screens/Onboarding.tsx`), editable under Me |
| Mifflin–St Jeor + activity multiplier target | `frontend/src/lib/energy.ts`; every step is shown on screen |
| Calories counted only after the user confirms dish and serving | Nothing is logged until **Add to …** is pressed |
| Meal as a share of the target and remaining allowance | "Your day after this" card before adding; Home summary after |
| Visible disclaimer that the photo doesn't measure portions | Scan result and food screens, Home footer, onboarding acknowledgement |
| Images and profile data not retained | The server processes photos in memory and discards them. With Claude recognition the photo is sent to Anthropic's API to identify the dish, and the app says so. A small meal thumbnail is kept **on the phone only** if the user leaves "Keep meal photos" on |
| Inference latency for the comparison | Each prediction reports `inference_ms`, shown on the result photo |

### Screens

- **Home**: date, logging streak, week strip with a progress ring per day, the calorie card
  (remaining, % of target, target / eaten, protein-first macro meters), Scan / Search / Quick add,
  the food log by meal with per-entry macros, and the Pinggan Sihat tip. Tap an entry to change
  servings, move or remove it.
- **Scan**: live camera preview with a shutter where the browser allows it (HTTPS or
  localhost), falling back to the phone's camera app and the gallery. The shutter keeps exactly
  what the preview shows and sends only the dish inside the guide frame for recognition. The back
  camera runs at up to 1080p with continuous focus, a torch button appears on phones that have
  one, and the camera is released while the app is in the background. The result shows your
  photo, the best match, confidence, alternatives and a search across every food, then the log
  panel with any add-ons seen in the photo already ticked.
- **Foods**: search in English or Malay, category chips, recent foods, the dishes the camera
  knows, and every category, each row showing kcal, P/C/F grams and a macro split bar. Each food
  has a page with a macro donut, add-ons, sweetness and a nutrition-facts panel.
- **Progress**: week view of daily calories against the target (tap a bar, or view as a table),
  daily average, difference from target, adherence (days within target), streak, calories by
  macro and most-logged foods.
- **Me**: name, age, height, weight and BMI, the full target calculation, settings (halal filter,
  meal photos, my foods), recognition model status, privacy and data deletion.

### Design

A dark training-app interface: near-black surfaces with fine borders, one volt accent for calories
and primary actions, and [Archivo](https://fonts.google.com/specimen/Archivo) (bundled, works
offline) using its condensed width for numbers and headings. Foods are shown with data rather than
pictures: kcal, protein / carbs / fat grams, a macro split bar in lists and a macro donut on each
food page. Scanned meals can show your own photo. Goals and activity use training terms (Cut,
Maintain, Lean bulk; Light, Regular, Hard training). Icons are from
[Phosphor](https://phosphoricons.com/). The macro colours (protein orange, carbs aqua, fat violet)
were checked as a set for colour-vision deficiency on the dark surface.

## Project layout

```
api/index.py                Vercel serverless entry point for the FastAPI backend
data/malaysian_foods.json   76 foods, categories and add-ons per standard serving (shared)
backend/                    FastAPI service: upload validation, classification, nutrition lookup
  app/                      config, imaging, classifier (ONNX + demo), vision (Claude), nutrition, main
  models/                   Drop model.onnx + model_config.json here
  tests/                    pytest suite
frontend/                   React + TypeScript + Vite mobile web app
  service-worker.js         Offline cache for the installed app (built into dist/sw.js)
  src/lib/                  energy maths, diary arithmetic, foods, dates, API client, camera crop, image checks (+ tests)
  src/state/                on-device app state, toasts, model status
  src/components/           UI building blocks (ring, macro charts, week strip, log panel, sheets…)
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
| `ANTHROPIC_API_KEY` | *(none)* | Turns on Claude recognition when no trained model is present. Create a key at https://platform.claude.com |
| `PINGGAN_RECOGNIZER` | `auto` | `auto` (trained model, then Claude, then demo), or force `onnx`, `claude` or `demo` |
| `PINGGAN_CLAUDE_MODEL` | `claude-opus-5-5` | Claude model used for recognition |
| `PINGGAN_MODEL_DIR` | `backend/models` | Where `model.onnx` and `model_config.json` are read from |
| `PINGGAN_CONFIDENCE_THRESHOLD` | `0.6` | Top-1 confidence below which the low-confidence warning shows |
| `PINGGAN_MAX_UPLOAD_BYTES` | `10485760` | Upload size limit |
| `PINGGAN_CORS_ORIGINS` | *(none)* | Comma-separated origins, needed when the app is served from elsewhere (e.g. a native wrapper) |
| `VITE_API_BASE` | *(same origin)* | API base URL used by the app at build time |

## Deploying to Vercel

The repository deploys to Vercel as one project, configured in `vercel.json`:

- the mobile web app is built from `frontend/` and served as static files, with every non-API
  path falling back to `index.html`;
- the FastAPI backend runs as a Python serverless function (`api/index.py`) at `/api/*` on the
  same domain, using the root `requirements.txt`.

Import the GitHub repository in Vercel (leave the root directory as the repository root); every
push to `main` then deploys to production.

**Turn on recognition:** in the Vercel project, open **Settings → Environment Variables**, add
`ANTHROPIC_API_KEY` with your key (Production and Preview), then redeploy (**Deployments → ⋯ →
Redeploy**). Without the key the deployed API runs the demo classifier, and every scan shows a
"Demo mode" notice. **Me → Food recognition** shows which recogniser is live. To serve the trained
model there instead, add `onnxruntime` to the root `requirements.txt` and make the model files
available to the function (they are git-ignored by default).

### Installing on a phone

Pinggan is an installable web app: it gets its own home-screen icon, opens full screen, and keeps
working offline for logging (scanning needs a connection). Share the project's production address
(the short `*.vercel.app` domain under **Settings → Domains**). Vercel protects the long
per-deployment URLs with Vercel Authentication by default, so anyone else opening one gets a
Vercel login page and can't install the app from it.

- **Android:** open the link in Chrome, tap **⋮ → Install app** (or **Add to home screen**). In
  Samsung Internet, tap **≡ → Add page to → Home screen**. Links opened from WhatsApp,
  Instagram, Facebook or TikTok open in that app's built-in browser, which can't install apps. The
  app detects this and offers an **Open in Chrome** button.
- **iPhone:** open the link in Safari, tap **Share → Add to Home Screen**.

**Me → Install app** shows the browser's install dialog where it is available, and these steps
where it isn't. The service worker (`frontend/service-worker.js`, built into `dist/sw.js`) caches
the app itself, never photos or API responses.

## Food recognition

The API picks a recogniser when it starts (`PINGGAN_RECOGNIZER=auto`):

1. **Trained model.** If `backend/models/model.onnx` exists, it is used. Export the selected
   network to ONNX and add its config; step-by-step instructions for PyTorch and Keras are in
   [`backend/models/README.md`](backend/models/README.md). No app changes are needed. Only the ten
   foods marked `"scan": true` are model classes.
2. **Claude vision.** Otherwise, if `ANTHROPIC_API_KEY` is set, each photo is sent to Claude
   with the food list from `data/malaysian_foods.json`. Claude answers in a fixed JSON schema: up
   to three foods from the list with a confidence each, and the add-ons it can see. The server
   drops anything not in the database and the app shows the result the same way as the model's.
   Claude can name all 76 foods and drinks, and it reports when a photo has no food in it instead
   of guessing. The food list is prompt-cached, photos are downsized to 1092 px, and a declined
   request falls back to another Claude model automatically. Its confidence is Claude's own
   estimate, not a softmax probability.
3. **Demo classifier.** With neither, the prediction is stable but meaningless, and the app shows
   a "Demo mode" notice on every result.

To run Claude recognition locally, `export ANTHROPIC_API_KEY=...` before starting `uvicorn`.
Each scan is one Claude API call; with the default model that is roughly a cent (US) per scan
(a ~1,000-token photo plus a short answer). Set `PINGGAN_CLAUDE_MODEL` to use a different
Claude model.

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
- Claude recognition against a fake API: the request (downsized photo, cached food list, JSON
  schema), ranking and add-on filtering, no-food photos, refusals, truncated answers and API
  errors, plus which recogniser is chosen
- the camera crop: what an `object-fit: cover` preview shows and where the guide frame falls
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

The camera handles one dish per photo, of the ten trained classes or, with Claude recognition,
the 76 foods in the database. There is no portion or weight estimation; calories are always for a
referenced standard serving plus the add-ons the user picks. A closed-set classifier always
chooses one of its dishes, so unfamiliar foods can be misidentified; Claude is asked to give low
confidence to foods that aren't on the list, but can still be wrong. The low-confidence warning
helps but doesn't guarantee those are caught. Claude recognition needs a connection and sends the
photo to Anthropic's API. The pork
flag reflects how a dish is usually prepared, not a halal certification. Targets are estimates for
adults aged 18–65 and are not medical or dietary advice.
