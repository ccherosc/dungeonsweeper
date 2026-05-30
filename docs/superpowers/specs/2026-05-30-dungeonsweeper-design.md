# DungeonSweeper — Design Spec
**Date:** 2026-05-30  
**Status:** Approved

---

## Overview

DungeonSweeper is a browser-based Minesweeper clone with a pixel-art fantasy dungeon theme. The primary game mode is **"How Deep Can You Go?"** — an infinite progressive dungeon run where the player descends deeper as they clear each level, with boards growing larger and more hazardous at every depth.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Build tool | Vite |
| Framework | React 18 |
| Language | TypeScript |
| Styling | Plain CSS (CSS Modules for components) |
| State | `useReducer` in `App.tsx` |
| Persistence | `localStorage` (best depth per mode) |
| Backend | None |
| Auth | None |
| Cost | Zero — all open source, runs in browser |

---

## Game Modes

### Classic Mode
One hazard ends the run instantly. No safety net.

### Adventure Mode
Player has 3 hearts. Revealing a hazard costs 1 heart and the hazard tile is exposed (run continues). Three hazards = game over. Hearts displayed in the header.

Both modes tracked independently for best-depth records.

---

## Progressive Difficulty Scaling

Depth starts at 1 and increments every time a level is cleared. Grid size and hazard count grow per this table (interpolated between milestones):

| Depth Range | Grid | Hazards |
|-------------|------|---------|
| 1–5 | 8×8 | 10 |
| 6–10 | 9×9 | 13 |
| 11–15 | 10×10 | 16 |
| 16–20 | 11×11 | 20 |
| 21–30 | 12×12 | 25 |
| 31–40 | 14×14 | 32 |
| 41–50 | 16×16 | 42 |
| 51–65 | 18×18 | 55 |
| 66–80 | 20×20 | 68 |
| 81–99 | 22×22 | 80 |
| 99+ | 24×24 | 90+ (depth × 0.9, capped density at ~15%) |

No ceiling on depth — depth counter displays the raw number (100, 101, 102…) with no special formatting.

---

## Screens

### Menu Screen (`screen: 'menu'`)
- Full-page background: `splashscreen_main.png`
- Center panel overlay with:
  - **DUNGEONSWEEPER** title
  - *"How Deep Can You Go?"* subtitle
  - Classic / Adventure mode toggle
  - **⚔ Descend Into The Dungeon** start button
  - **? How to Play** button (opens modal)
  - Best Depth stat as display text: *"Your Record: Depth 23"* (shows whichever mode is active; hidden if no record yet)

### Game Screen (`screen: 'playing'`)
- Header: DEPTH counter | hero face button (restart) | TIME elapsed
- Adventure Mode: 3 heart icons in header (filled/empty)
- Centered game grid (tileset sprites, 64×64px tiles)
- Adventure log panel below grid: rotating flavor text based on adjacent hazard count
- Torches remaining = total hazards − flags placed (displayed in header)
- Controls: left-click = reveal, right-click = flag/unflag; mobile: tap = reveal, long-press 500ms = flag
- Context menu suppressed on right-click
- Timer starts on first tile click (not on screen load); stops on win or death

### Dead Screen (`screen: 'dead'`)
- Full-page background: `splashscreen_main.png` with dark-red tint overlay
- Center panel:
  - ☠ skull
  - Random death quip (e.g., *"A mimic appreciates your curiosity."*) — depth interpolated into quip where applicable
  - Depth reached + time elapsed
  - Adventure Mode only: hearts remaining display (e.g., "♡ ♡ ☠" for dying on 3rd heart)
  - **Descend Again** button (restarts at depth 1, same mode)
  - **Main Menu** button

### Level Transition (overlay, not a screen)
- Brief overlay on the game board when a level is cleared
- Gold-tinted flash: *"DESCENDING… Depth 24"*
- Auto-dismisses after ~1.2s, next board loads

---

## Core Game Rules

1. **First-click safety** — hazards placed after first click; clicked tile and its 8 neighbors guaranteed safe
2. **Reveal** — left-click/tap reveals a tile
3. **Flag** — right-click/long-press flags or unflags a tile (flagged tiles cannot be accidentally revealed)
4. **Cascade** — revealing a tile with 0 adjacent hazards recursively reveals all connected empty tiles
5. **Win condition** — all non-hazard tiles revealed → level complete, depth increments
6. **Lose condition (Classic)** — reveal a hazard → dead screen
7. **Lose condition (Adventure)** — reveal a hazard → lose 1 heart, hazard tile exposed, continue; 3rd hazard → dead screen
8. **Browser context menu** — suppressed on right-click over the board

---

## Data Model

```typescript
type TileState = 'hidden' | 'revealed' | 'flagged';

type Tile = {
  row: number;
  col: number;
  isHazard: boolean;
  state: TileState;
  adjacentHazards: number;
  hazardVariant: 0 | 1 | 2 | 3 | 4; // which hazard sprite (skull/spikes/pit/rune/green skull)
};

type GameState = {
  board: Tile[][];
  screen: 'menu' | 'playing' | 'dead';
  mode: 'classic' | 'adventure';
  depth: number;
  hearts: number;        // 3 in adventure, irrelevant in classic
  flagsUsed: number;
  hazardCount: number;   // total hazards on current board
  secondsElapsed: number;
  timerRunning: boolean;
  firstClickDone: boolean;
  showTransition: boolean; // level-clear overlay visible
  deathQuip: string;
};
```

---

## Tileset Sprite Sheet

`tileset.png` — 4×4 grid of tiles. Assumed 64×64px per tile (256×256px total) — **verify actual pixel dimensions at implementation time** and update the CSS accordingly.  
CSS: `background-image: url(tileset.png); background-size: 256px 256px; background-position: calc(-64px * col) calc(-64px * row);`

| Tile | Row | Col |
|------|-----|-----|
| Hidden (dark stone) | 0 | 0 |
| Revealed empty | 0 | 1 |
| Number 1 (blue) | 0 | 2 |
| Number 2 (green) | 0 | 3 |
| Number 3 (red) | 1 | 0 |
| Number 4 (purple) | 1 | 1 |
| Number 5 (gold) | 1 | 2 |
| Number 6 (cyan) | 1 | 3 |
| Number 7 (orange) | 2 | 0 |
| Number 8 (white) | 2 | 1 |
| Flag | 2 | 2 |
| Skull hazard | 2 | 3 |
| Spikes hazard | 3 | 0 |
| Pit hazard | 3 | 1 |
| Magic rune hazard | 3 | 2 |
| Green skull hazard | 3 | 3 |

---

## Adventure Log Flavor Text

Shown below the board during play. Cycles through messages keyed to the last-revealed tile's adjacent hazard count.

| Count | Sample Messages |
|-------|----------------|
| 0 | "The hallway is quiet. Almost too quiet." |
| 1 | "Faint scratch marks on the stone." |
| 2 | "A cold draft from somewhere close." |
| 3 | "Distant growl. Getting louder." |
| 4 | "Blood on the stone. Fresh." |
| 5 | "Arcane buzzing fills the air." |
| 6 | "Bones. Many bones. Very recent." |
| 7 | "Ominous chanting from all directions." |
| 8 | "Certain death is nearby. Several deaths." |

---

## Death Quips

Random selection on death:
- "You stepped on a suspiciously obvious rune."
- "A mimic appreciates your curiosity."
- "The dungeon remains undefeated."
- "Your party has decided to retire."
- "The bard is already telling this story as a cautionary tale."
- "You have been added to the dungeon's trophy collection."
- "Next time, maybe avoid the glowing floor tile."
- "Depth {depth} was a perfectly reasonable place to die."

---

## Folder Structure

```
c:\Project_DungeonSweeper\
  src/
    components/
      MenuScreen.tsx
      GameScreen.tsx
      DeadScreen.tsx
      GameBoard.tsx
      Tile.tsx
      HowToPlayModal.tsx
      LevelTransition.tsx
    game/
      types.ts
      constants.ts
      createBoard.ts
      placeHazards.ts
      revealTile.ts
      flagTile.ts
      checkWin.ts
      depthScaling.ts
    styles/
      global.css
      dungeon.css
    App.tsx
    main.tsx
  public/
    assets/
      images/
        splashscreen_main.png
        tileset.png
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  docs/
    superpowers/
      specs/
        2026-05-30-dungeonsweeper-design.md
  assets/
    DungeonSweeper.pdf
    images/
      splashscreen_main.png
      tileset.png
```

---

## Out of Scope (MVP)

- Power-ups (Scout Owl, Rogue's Instinct, Wizard's Pulse) — post-MVP
- Leaderboard / online scores — post-MVP
- Sound effects / music — post-MVP
- Login / accounts — never (by design)
- "How Deep Can You Go?" plus-level achievements — post-MVP
