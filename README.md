# choir.

A room where 2–6 people have a text conversation and watch the
**social physics** of the group render in real time — who is speaking,
whose ideas are being developed, who has gone quiet, whose ideas were
restated by someone else, which threads are unresolved.

> Every meeting tool records what was said. Choir shows what was happening.

---

## What this repo is

A real-time multi-user web app. React 19 + Vite frontend, Vercel
Functions backend (Node.js runtime) for Groq API calls, Supabase
Realtime as the multi-user backbone, SVG for the live visualisation.

- **Arrival** — create a 5-character room code, or join with one.
- **Join** — pick a display name. A bioluminescent colour is assigned by join order.
- **Room** — three panels: message thread, live visualisation, meta panel. Type, send, watch the diagram react.
- **Minutes** — when any participant ends the session, the room is analysed by `llama-3.3-70b-versatile` into a structured minutes document (PDF exportable).
- **Demos** — three pre-built sessions (startup Q2, book club, family holiday) that replay at 6× speed so a reviewer can see the full experience without coordinating a group.

---

## Run it locally (demos only — no API keys needed)

```bash
npm install
npm run dev
```

Open <http://localhost:5173> and visit `/demo`. The demos work entirely offline.

Live multi-user rooms need Supabase + Groq keys — see below.

---

## Full setup

### 1. Supabase (free tier)

1. Create a project at <https://supabase.com>.
2. Open the SQL editor, paste and run `supabase/schema.sql` from this repo.
3. Settings → API → copy **Project URL** and **anon public** key.

### 2. Groq (free tier)

1. Create a key at <https://console.groq.com>.
2. Keep this key server-side only.

### 3. Environment variables

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
GROQ_API_KEY=gsk_...
```

`VITE_*` vars are exposed to the browser (Supabase anon key is meant to be public; RLS policies gate by room-code knowledge). `GROQ_API_KEY` is server-only — used by the Vercel Functions in `api/`.

### 4. Deploy to Vercel

```bash
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add GROQ_API_KEY
vercel --prod
```

Or push to GitHub and import the repo in the Vercel dashboard.

---

## How it works

### The three AI calls

All use `llama-3.3-70b-versatile` in JSON mode.

| Call | When | File |
| --- | --- | --- |
| **Classify** — types each message (`new_idea`, `builds_on`, `contradicts`, `restates`, `steals`, `question`, `agreement`, `disagreement_with_reason`, `filler`) and assigns a voice weight | Every message | `api/classify.ts` |
| **Unresolved** — surfaces up to 5 dropped questions or undeveloped threads | Every 30 s | `api/unresolved.ts` |
| **Minutes** — produces the final structured document | On session end | `api/minutes.ts` |

Only one client — the **leader** (the oldest participant in the room) — fires the classify and unresolved calls, avoiding duplicates. If they leave, the next-oldest takes over automatically. Results are written back to Supabase so every client sees them.

### The visualisation

Pure SVG, driven by React state, animated by Framer Motion. Each participant is a glowing circle positioned on a gentle circle around the centre. Bubble radius tracks total voice weight (sqrt-scaled). Lineage threads — the curves between bubbles — are drawn from the referenced prior speaker to the current speaker, colour-coded:

- **builds_on** / **contradicts** → speaker's colour (dashed for contradictions)
- **restates** → the *original* speaker's colour (reveals attribution chains)
- **steals** → bright red with thicker stroke (the important signal)

Threads fade over ~3 minutes. Participants silent for ≥ 5 min get a soft gold outer ring (never red — the room notices without shaming). Unresolved markers drift near the person who raised them.

The background gradient subtly shifts with the emotional temperature of the recent conversation (warm / cool / thin / neutral).

### Data lifetime

Rooms self-garbage-collect after 14 days via the `choir_gc()` SQL function. Messages and participants cascade-delete. No audio. No transcripts beyond the minutes document. No individual scoring.

---

## Stack

| Concern | Choice |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 (via `@theme` in `src/index.css`) |
| Motion | Framer Motion 12 |
| Icons | Lucide React |
| Routing | React Router v7 |
| Realtime | Supabase (Postgres + Realtime channels) |
| AI | Groq SDK, `llama-3.3-70b-versatile`, JSON mode |
| Hosting | Vercel Functions (Node.js 22 runtime) |
| PDF | jsPDF (lazy-loaded on the Minutes route only) |

---

## Layout

```
api/
  _groq.ts          shared Groq client + helpers
  classify.ts       POST /api/classify
  unresolved.ts     POST /api/unresolved
  minutes.ts        POST /api/minutes
src/
  App.tsx           router (Minutes is lazy)
  components/
    screens/        Arrival, Join, Room, Minutes, DemoLauncher, DemoRoom
    room/           MessageThread, Visualisation, MetaPanel, MessageInput
    ui/             AmbientBackground, Logo, Footer, CurrentUnderline
  hooks/
    useRoom.ts      Supabase subscriptions, leader election, send/leave/end
  lib/
    supabase.ts     browser client (anon key)
    ai.ts           thin fetch wrappers over /api routes
    utils.ts        voice weight, airtime, mood, classification fallbacks
  types/index.ts    shared contracts
  demos/index.ts    three pre-classified scripts + demo minutes
supabase/schema.sql  one-shot schema install
vercel.json          SPA rewrites + Node runtime pin
.env.example         what to fill in
```

---

## Not included (out of scope)

- Audio / video — text only.
- Accounts / auth — rooms are gated by knowledge of the code.
- HR analytics — Choir is a mirror for the people in the room. No manager dashboard. No individual scoring.

---

## Inspiration

A room of four co-founders who have had the same argument six times because one of them talks the most and one of them barely speaks. They open Choir. After 40 minutes they read the minutes and understand, for the first time, what was actually happening in their conversations.
