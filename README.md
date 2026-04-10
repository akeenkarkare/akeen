# akeen-portfolio

Personal portfolio site. Built with Next.js, TypeScript, matter.js, and a hand-written WebGL2 N-body gravitational field.

## What's interesting about it

The cards on the homepage are real rigid bodies — drag them, throw them, stack them, watch them tip over edges. The background isn't a gradient; it's a live 768-particle gravitational simulation running in WebGL2 with additive blending.

The two systems are **coupled**:

- Each card is a gravitational point-mass in the particle field, so particles orbit and pile up around the cards in real time.
- Heavy collisions inject radial velocity impulses into the nearby particles, producing visible shockwaves.
- Hard impacts also nudge a CSS transform on the canvas wrapper for a subtle screen shake.

So dragging a card isn't moving a rectangle — it's moving a gravity source through a simulated universe.

## Tech

- **Framework:** Next.js 15 App Router (React 19, TypeScript, static prerender)
- **Card physics:** [matter.js](https://brm.io/matter-js/) — sequential impulse solver, oriented-box SAT collision, the whole thing
- **Background simulation:** [`lib/nbody.ts`](./lib/nbody.ts) — hand-written brute-force O(N²) gravity, integrated and rendered through a WebGL2 program with additive blending. ~250 lines.
- **Coupling layer:** [`lib/bus.ts`](./lib/bus.ts) — a tiny shared-state module that lets the two simulations exchange data each frame without going through React state.
- **No CSS framework.** All styling is inline objects. The page is ~40kB / 140kB first-load.

## Routes

- `/` — the physics homepage with the cards and N-body field
- `/now` — live "what I'm doing" page pulling from GitHub, Spotify, and Discord (via [Lanyard](https://github.com/Phineas/lanyard))

## Easter eggs

- **`~`** — opens a fake terminal with real commands (`whoami`, `ls`, `cat <project>`, `resume`, `contact`)
- **↑↑↓↓←→←→BA** — Konami code, flips gravity
- **DevTools console** — ASCII signature greeting and a hiring pitch
- **Bottom-right pill** — three gravity modes (down / up / zero)

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000
```

The main page works with no env vars. The `/now` page degrades gracefully — sections without credentials show "not configured."

To enable the live `/now` integrations, copy [`.env.example`](./.env.example) to `.env.local` and follow the inline instructions for getting Spotify and Discord credentials.

## Production build

```bash
npm run build
npm start
```

## Deploy

This deploys to Vercel with zero config. Just point Vercel at the repo and it'll build automatically. Add the env vars from `.env.example` in the Vercel project settings if you want the `/now` page to be live.

## Project layout

```
app/
  page.tsx              # homepage
  now/page.tsx          # /now route — server-rendered, revalidates every 60s
  layout.tsx            # root layout + metadata
  globals.css

components/
  PhysicsStage.tsx      # the card simulation: matter.js + canvas renderer + drag/throw input
  NBodyBackground.tsx   # the WebGL2 gravity-field background
  ProjectModal.tsx      # case study modal (portaled to body)
  Hero.tsx              # title block + nav + stats strip
  HUD.tsx               # physics debug overlay (top-right)
  GravityControls.tsx   # gravity-mode pill (bottom-right)
  ScreenShake.tsx       # CSS transform layer for collision shake
  Terminal.tsx          # the ~-key terminal easter egg
  ConsoleGreeting.tsx   # devtools-console ASCII greeting
  NowBanner.tsx         # "currently building" pill in the hero

lib/
  physics.ts            # matter.js wrapper exposing a clean Body/World API
  nbody.ts              # hand-written N-body sim + WebGL2 renderer
  bus.ts                # shared-state bridge between the two simulations
  projects.ts           # the card content
  now.ts                # GitHub / Spotify / Discord (Lanyard) fetchers

public/
  akeen-karkare-resume.pdf
```

## License

All code in this repo is mine. Project content is mine. Use it as inspiration for your own portfolio, but please don't just clone it and slap your name on top — write your own thing.
