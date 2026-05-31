# Agents.md — Yahtzee Project Reference

Quick-reference for coding agents. Read this before touching any file.

---

## Stack

- **React 18** via CDN (`unpkg.com`) — no build step, no bundler
- **Babel Standalone** — browser transpiles JSX at runtime
- **No dependencies beyond React** — no TypeScript, no npm, no node_modules
- **Entry point**: `index.html` — open directly in browser or via `python3 -m http.server`

All JSX files are loaded as `<script type="text/babel" src="...">` in `index.html`. Load order matters: each file depends on globals exported by the files before it.

---

## File Responsibilities

| File | Purpose | Key exports (on `window`) |
|------|---------|--------------------------|
| `index.html` | Entry point, loads all scripts in order, defines CSS animations | — |
| `tweaks-panel.jsx` | Floating design-time tweaks panel (theme colors, screen jump) | `useTweaks`, `TweaksPanel`, `TweakColor`, `TweakSection`, `TweakSelect`, `TweakButton` |
| `yahtzee-dice.jsx` | Dice face rendering, pip layouts, DiceTray component | `DieFace`, `DiceTray`, `MiniDie` |
| `yahtzee-scorecard.jsx` | Scoring math + ScoreRow/ScorecardSheet UI | `UPPER_CATS`, `LOWER_CATS`, `scoreFor`, `upperTotal`, `upperBonus`, `lowerTotal`, `grandTotal`, `ScorecardSheet` |
| `yahtzee-ai.jsx` | CPU hold strategy + category picking, all difficulty levels | `cpuHoldStrategy`, `cpuPickCategory` |
| `yahtzee-screens.jsx` | All screen components: Home, Setup, Game, Results | `HomeScreen`, `SetupModeScreen`, `SetupDifficultyScreen`, `SetupPlayersScreen`, `GameScreen`, `ResultsScreen`, `PrimaryButton`, `GhostButton` |
| `yahtzee-app.jsx` | Root `App` component, all game state, routing, CPU turn driver | `App`, `TWEAK_DEFAULTS`, `makeFreshDice` |

**Load order in `index.html`:**
```
tweaks-panel → yahtzee-dice → yahtzee-scorecard → yahtzee-ai → yahtzee-screens → yahtzee-app
```

---

## Game State Model

All state lives in `App` (yahtzee-app.jsx). Key state vars:

```
route           'home' | 'mode' | 'difficulty' | 'players' | 'game' | 'results'
mode            'pass' | 'cpu'
difficulty      'easy' | 'normal' | 'hard'

players         Player[]        — set at game start, never replaced mid-game
currentPlayerIdx  number        — index into players[]
round           number          — 1–13; increments when all players have had their turn
dice            Die[]           — length 5, each { value: 1-6, held: boolean }
rollsUsed       number          — 0–3; resets each turn
rolling         boolean         — true during roll animation
recap           RecapState|null — set after CPU scores, cleared by Continue button
```

**Player shape:**
```js
{
  name: string,
  color: string,      // hex, from PLAYER_COLORS
  isCpu: boolean,
  scores: {           // only present keys are filled; missing = not yet scored
    ones?: number, twos?: number, threes?: number, fours?: number,
    fives?: number, sixes?: number,
    threeKind?: number, fourKind?: number, fullHouse?: number,
    smStraight?: number, lgStraight?: number, yahtzee?: number, chance?: number,
  }
}
```

**Die shape:**
```js
{ value: 1-6, held: boolean }
```

---

## Scoring System

All scoring logic is in `yahtzee-scorecard.jsx`:

```js
scoreFor(catKey, dice)      // returns points for a category given current dice
upperTotal(scores)          // sum of ones–sixes
upperBonus(scores)          // 35 if upperTotal >= 63, else 0
lowerTotal(scores)          // sum of all lower categories
grandTotal(scores)          // upperTotal + upperBonus + lowerTotal
```

Category keys: `ones`, `twos`, `threes`, `fours`, `fives`, `sixes`, `threeKind`, `fourKind`, `fullHouse`, `smStraight`, `lgStraight`, `yahtzee`, `chance`

---

## AI Architecture

AI is fully isolated in `yahtzee-ai.jsx`. Two public functions:

The CPU opponent is named per difficulty (`CPU_NAMES` in `yahtzee-app.jsx`):
`easy → Mouse`, `normal → Queenie`, `hard → Cleo`. The internal difficulty keys
(`easy`/`normal`/`hard`) are unchanged — only display names differ.

### `cpuHoldStrategy(dice, scores, difficulty) → Die[]`
Returns new dice array with `.held` flags updated. Called after each roll during CPU turn.

| Difficulty | Hold behavior |
|-----------|---------------|
| `easy` | Hold only the most-frequent single value |
| `normal` | Pairs+, prefers straights if 4-in-sequence, full house if both pairs visible |
| `hard` | Full heuristic: chases Yahtzee (4-of-a-kind), then 3-of-a-kind, then straights, then pairs |

### `cpuPickCategory(dice, scores, difficulty) → { key, pts }`
Returns the category key and points to score.

| Difficulty | Pick behavior |
|-----------|---------------|
| `easy` | First positive-scoring row (not best), may accept zero rows |
| `normal` | Best-scoring row with mild bias toward Yahtzee/straights (+5–15 pts) |
| `hard` | Monte-Carlo EV + always-optimal pick via `_categoryValue`. Par-aware upper scoring: below-par fills are penalized steeply (`surplus*2.2`), above-par mildly (`*0.5`), with a floor so a positive fill never loses to zeroing the box. Two 6's (-13.2) scores below two 2's (-4.4), so it dumps the low face and keeps chasing 3+ of a high face rather than locking a bonus deficit. Strongly preserves Chance early (penalty `~(remaining-1)*3`, decaying to 0), so it sacrifices a cheap upper box before spending Chance |

### CPU Turn Flow (yahtzee-app.jsx)
```
useEffect fires when currentPlayerIdx changes and player.isCpu === true
→ wait 800ms
→ doRoll() [Roll 1]
→ wait 900ms
→ cpuHoldStrategy() [hold after Roll 1]
→ wait 500ms
→ doRoll() [Roll 2]
→ wait 900ms
→ cpuHoldStrategy() [optional re-hold after Roll 2]
→ wait 400ms
→ cpuPickCategory() → pickCategory()
```

The `diceRef` / `playersRef` pattern ensures the async CPU logic reads live state, not stale closures.

---

## UI Layout

- **Narrow (< 900px)**: single-column, current player's scorecard inline, dice tray at bottom
- **Wide (≥ 900px)**: two-column grid, one card per player (active has accent border), dice tray centered below
- **Responsive hook**: `useIsWide(900)` in yahtzee-screens.jsx

Design system tokens (from tweaks, defaults in TWEAK_DEFAULTS):
- `accent` — coral `#E26D5C`
- `feltColor` — forest green `#1F3D38`
- `bg` — cream paper `#F2EBDC`
- Typography: Instrument Serif (display), Geist (UI/body), JetBrains Mono (numbers/mono)

---

## How to Run

```bash
cd /path/to/Yahtzee
python3 -m http.server 8080
# open http://localhost:8080
```

Or open `index.html` directly in Chrome/Firefox (CORS restrictions may block font loading from `file://`).

---

## Common Gotchas

- **No build step** — editing JSX files takes effect on browser refresh immediately
- **Script load order** — if you add a new file, add it to `index.html` in dependency order
- **Stale closures in async** — CPU turn logic uses `diceRef.current` / `playersRef.current` not the state vars directly; async callbacks capturing `dice` / `players` directly will get old values
- **`UPPER_CATS` / `LOWER_CATS`** are global arrays from yahtzee-scorecard.jsx — they must be loaded before yahtzee-ai.jsx or yahtzee-app.jsx
- **`rollsUsed` is 1-indexed** from the perspective of state: `rollsUsed === 0` means no roll yet, `rollsUsed === 3` means all rolls used
