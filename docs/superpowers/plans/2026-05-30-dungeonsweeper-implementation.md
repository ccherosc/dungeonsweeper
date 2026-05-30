# DungeonSweeper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build DungeonSweeper — a browser-based progressive Minesweeper clone ("How Deep Can You Go?") with a pixel-art D&D dungeon theme, using Vite + React + TypeScript.

**Architecture:** Single-page React app. All game logic lives in pure TypeScript functions in `src/game/` (fully unit-tested with Vitest). React components are thin rendering layers. A single `useReducer` in `App.tsx` owns all game state. Three screens (menu/playing/dead) swap via a `screen` field — no router needed.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Vitest 2, plain CSS. Zero backend, zero paid services. Runs entirely in the browser.

---

## File Map

**Created by this plan:**

```
src/
  game/
    types.ts             — all shared types and Action union
    constants.ts         — depth table, flavor text, death quips, tileset sprite map
    depthScaling.ts      — getLevelConfig(depth) pure function
    createBoard.ts       — createBoard(rows, cols) pure function
    placeHazards.ts      — placeHazards(board, count, safeRow, safeCol) pure function
    revealTile.ts        — revealTile(board, row, col) with cascade
    flagTile.ts          — flagTile(board, row, col) toggle
    checkWin.ts          — checkWin(board) predicate
  components/
    MenuScreen.tsx       — splash bg + menu overlay
    GameScreen.tsx       — header + board + adventure log
    DeadScreen.tsx       — splash bg red-tinted + death overlay
    GameBoard.tsx        — grid of Tile components
    Tile.tsx             — single sprite-mapped tile with click/touch handlers
    HowToPlayModal.tsx   — rules modal
    LevelTransition.tsx  — "DESCENDING…" flash overlay
  styles/
    global.css           — reset, body, font
    dungeon.css          — dungeon theme tokens, tile sizing, animations, screen layouts
  App.tsx                — useReducer + screen router + timer + localStorage
  main.tsx               — Vite entry point
tests/
  game/
    depthScaling.test.ts
    createBoard.test.ts
    placeHazards.test.ts
    revealTile.test.ts
    flagTile.test.ts
    checkWin.test.ts
package.json
vite.config.ts
tsconfig.json
index.html
public/
  assets/images/
    splashscreen_main.png   (copied from assets/)
    tileset.png             (copied from assets/)
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "dungeonsweeper",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Write vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DungeonSweeper</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Create all directories**

Run:
```bash
mkdir -p src/game src/components src/styles tests/game public/assets/images
```

- [ ] **Step 7: Copy image assets to public**

Run:
```bash
cp assets/images/splashscreen_main.png public/assets/images/splashscreen_main.png
cp assets/images/tileset.png public/assets/images/tileset.png
```

- [ ] **Step 8: Measure tileset pixel dimensions**

Run:
```bash
node -e "const b=require('fs').readFileSync('public/assets/images/tileset.png'); console.log('Width:', b.readUInt32BE(16), 'Height:', b.readUInt32BE(20));"
```

Expected output: `Width: <W> Height: <H>` — the tileset is a 4×4 grid so tile size = W/4. **Record this value** — it will be used as `--tileset-tile-px` in Task 10.

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.ts tsconfig.json index.html public/
git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Types and Constants

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`

- [ ] **Step 1: Write src/game/types.ts**

```typescript
export type TileState = 'hidden' | 'revealed' | 'flagged';

export type Tile = {
  row: number;
  col: number;
  isHazard: boolean;
  state: TileState;
  adjacentHazards: number;
  hazardVariant: 0 | 1 | 2 | 3 | 4;
};

export type GameMode = 'classic' | 'adventure';
export type Screen = 'menu' | 'playing' | 'dead';

export type GameState = {
  board: Tile[][];
  screen: Screen;
  mode: GameMode;
  depth: number;
  hearts: number;
  flagsUsed: number;
  hazardCount: number;
  secondsElapsed: number;
  timerRunning: boolean;
  firstClickDone: boolean;
  showTransition: boolean;
  lastRevealedCount: number | null;
  adventureLogText: string;
  deathQuip: string;
};

export type Action =
  | { type: 'START_GAME'; mode: GameMode }
  | { type: 'TOGGLE_MODE' }
  | { type: 'REVEAL_TILE'; row: number; col: number }
  | { type: 'FLAG_TILE'; row: number; col: number }
  | { type: 'TICK' }
  | { type: 'TRANSITION_DONE' }
  | { type: 'RESTART' }
  | { type: 'GOTO_MENU' };
```

- [ ] **Step 2: Write src/game/constants.ts**

```typescript
export const DEPTH_LEVELS = [
  { minDepth: 1,  maxDepth: 5,  cols: 8,  rows: 8,  hazards: 10 },
  { minDepth: 6,  maxDepth: 10, cols: 9,  rows: 9,  hazards: 13 },
  { minDepth: 11, maxDepth: 15, cols: 10, rows: 10, hazards: 16 },
  { minDepth: 16, maxDepth: 20, cols: 11, rows: 11, hazards: 20 },
  { minDepth: 21, maxDepth: 30, cols: 12, rows: 12, hazards: 25 },
  { minDepth: 31, maxDepth: 40, cols: 14, rows: 14, hazards: 32 },
  { minDepth: 41, maxDepth: 50, cols: 16, rows: 16, hazards: 42 },
  { minDepth: 51, maxDepth: 65, cols: 18, rows: 18, hazards: 55 },
  { minDepth: 66, maxDepth: 80, cols: 20, rows: 20, hazards: 68 },
  { minDepth: 81, maxDepth: 99, cols: 22, rows: 22, hazards: 80 },
] as const;

export const MAX_DEPTH_GRID = { cols: 24, rows: 24 };
export const MAX_HAZARD_DENSITY = 0.15;

export const FLAVOR_TEXT: Record<number, string[]> = {
  0: [
    'The hallway is quiet. Almost too quiet.',
    'Nothing stirs. A good sign. Probably.',
    'Safe passage. For now.',
  ],
  1: [
    'Faint scratch marks on the stone.',
    'Something was here. Recently.',
    'One candle flickers in the draft.',
  ],
  2: [
    'A cold draft from somewhere close.',
    "Two sets of tracks. Neither returning.",
    'The torchlight dims.',
  ],
  3: [
    'Distant growl. Getting louder.',
    'Three shadows move beyond the wall.',
    'Claw marks. Deep ones.',
  ],
  4: [
    'Blood on the stone. Fresh.',
    'Four choices. None of them good.',
    'Something breathes nearby.',
  ],
  5: [
    'Arcane buzzing fills the air.',
    'Five runes glow faintly on the floor.',
    'The air smells of sulphur.',
  ],
  6: [
    'Bones. Many bones. Very recent.',
    'Six paths lead here. None lead out.',
    'The dungeon is watching.',
  ],
  7: [
    'Ominous chanting from all directions.',
    'Seven curses stacked on one tile.',
    'The walls are closing. Slowly.',
  ],
  8: [
    'Certain death is nearby. Several deaths.',
    'Eight threats. You knew this entering.',
    'The dungeon smiles. It has teeth.',
  ],
};

export const DEATH_QUIPS = [
  'You stepped on a suspiciously obvious rune.',
  'A mimic appreciates your curiosity.',
  'The dungeon remains undefeated.',
  'Your party has decided to retire.',
  'The bard is already telling this story as a cautionary tale.',
  'You have been added to the dungeon\'s trophy collection.',
  'Next time, maybe avoid the glowing floor tile.',
];

// Sprite positions [row, col] in tileset.png (4×4 grid)
export const TILE_SPRITES = {
  hidden:  [0, 0] as [number, number],
  empty:   [0, 1] as [number, number],
  n1:      [0, 2] as [number, number],
  n2:      [0, 3] as [number, number],
  n3:      [1, 0] as [number, number],
  n4:      [1, 1] as [number, number],
  n5:      [1, 2] as [number, number],
  n6:      [1, 3] as [number, number],
  n7:      [2, 0] as [number, number],
  n8:      [2, 1] as [number, number],
  flag:    [2, 2] as [number, number],
  hazard0: [2, 3] as [number, number],
  hazard1: [3, 0] as [number, number],
  hazard2: [3, 1] as [number, number],
  hazard3: [3, 2] as [number, number],
  hazard4: [3, 3] as [number, number],
};

export const NUMBER_SPRITES = [
  TILE_SPRITES.n1,
  TILE_SPRITES.n2,
  TILE_SPRITES.n3,
  TILE_SPRITES.n4,
  TILE_SPRITES.n5,
  TILE_SPRITES.n6,
  TILE_SPRITES.n7,
  TILE_SPRITES.n8,
] as [number, number][];

export const HAZARD_SPRITES = [
  TILE_SPRITES.hazard0,
  TILE_SPRITES.hazard1,
  TILE_SPRITES.hazard2,
  TILE_SPRITES.hazard3,
  TILE_SPRITES.hazard4,
] as [number, number][];
```

- [ ] **Step 3: Commit**

```bash
git add src/game/types.ts src/game/constants.ts
git commit -m "feat: add game types and constants"
```

---

## Task 3: depthScaling (TDD)

**Files:**
- Create: `src/game/depthScaling.ts`
- Create: `tests/game/depthScaling.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/game/depthScaling.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getLevelConfig } from '../../src/game/depthScaling';

describe('getLevelConfig', () => {
  it('returns 8x8 with 10 hazards for depth 1', () => {
    expect(getLevelConfig(1)).toEqual({ rows: 8, cols: 8, hazards: 10 });
  });

  it('returns 8x8 with 10 hazards for depth 5', () => {
    expect(getLevelConfig(5)).toEqual({ rows: 8, cols: 8, hazards: 10 });
  });

  it('returns 9x9 with 13 hazards for depth 6', () => {
    expect(getLevelConfig(6)).toEqual({ rows: 9, cols: 9, hazards: 13 });
  });

  it('returns 22x22 with 80 hazards for depth 99', () => {
    expect(getLevelConfig(99)).toEqual({ rows: 22, cols: 22, hazards: 80 });
  });

  it('returns 24x24 for depth 100', () => {
    const config = getLevelConfig(100);
    expect(config.rows).toBe(24);
    expect(config.cols).toBe(24);
  });

  it('returns more hazards at depth 100 than depth 99', () => {
    expect(getLevelConfig(100).hazards).toBeGreaterThan(80);
  });

  it('caps hazard density at 15% for very deep runs', () => {
    const config = getLevelConfig(999);
    const maxHazards = Math.floor(config.rows * config.cols * 0.15);
    expect(config.hazards).toBeLessThanOrEqual(maxHazards);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL — `Cannot find module '../../src/game/depthScaling'`

- [ ] **Step 3: Implement src/game/depthScaling.ts**

```typescript
import { DEPTH_LEVELS, MAX_DEPTH_GRID, MAX_HAZARD_DENSITY } from './constants';

export type LevelConfig = { rows: number; cols: number; hazards: number };

export function getLevelConfig(depth: number): LevelConfig {
  const level = DEPTH_LEVELS.find(l => depth >= l.minDepth && depth <= l.maxDepth);
  if (level) {
    return { rows: level.rows, cols: level.cols, hazards: level.hazards };
  }
  const { rows, cols } = MAX_DEPTH_GRID;
  const hazards = Math.min(
    Math.floor(depth * 0.9),
    Math.floor(rows * cols * MAX_HAZARD_DENSITY)
  );
  return { rows, cols, hazards };
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/depthScaling.ts tests/game/depthScaling.test.ts
git commit -m "feat: add depth scaling logic"
```

---

## Task 4: createBoard (TDD)

**Files:**
- Create: `src/game/createBoard.ts`
- Create: `tests/game/createBoard.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/game/createBoard.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createBoard } from '../../src/game/createBoard';

describe('createBoard', () => {
  it('creates correct number of rows', () => {
    expect(createBoard(8, 8).length).toBe(8);
  });

  it('creates correct number of cols', () => {
    expect(createBoard(8, 12)[0].length).toBe(12);
  });

  it('assigns correct row and col to each tile', () => {
    const board = createBoard(3, 4);
    expect(board[2][3]).toMatchObject({ row: 2, col: 3 });
    expect(board[0][0]).toMatchObject({ row: 0, col: 0 });
  });

  it('all tiles start hidden', () => {
    createBoard(4, 4).flat().forEach(t => expect(t.state).toBe('hidden'));
  });

  it('all tiles start with no hazards', () => {
    createBoard(4, 4).flat().forEach(t => {
      expect(t.isHazard).toBe(false);
      expect(t.adjacentHazards).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL — `Cannot find module '../../src/game/createBoard'`

- [ ] **Step 3: Implement src/game/createBoard.ts**

```typescript
import { Tile } from './types';

export function createBoard(rows: number, cols: number): Tile[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isHazard: false,
      state: 'hidden' as const,
      adjacentHazards: 0,
      hazardVariant: 0 as const,
    }))
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/createBoard.ts tests/game/createBoard.test.ts
git commit -m "feat: add createBoard"
```

---

## Task 5: placeHazards (TDD)

**Files:**
- Create: `src/game/placeHazards.ts`
- Create: `tests/game/placeHazards.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/game/placeHazards.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { placeHazards } from '../../src/game/placeHazards';
import { createBoard } from '../../src/game/createBoard';

describe('placeHazards', () => {
  it('places the correct number of hazards', () => {
    const board = createBoard(8, 8);
    const result = placeHazards(board, 10, 3, 3);
    expect(result.flat().filter(t => t.isHazard).length).toBe(10);
  });

  it('never places a hazard on the safe tile', () => {
    for (let i = 0; i < 30; i++) {
      const result = placeHazards(createBoard(8, 8), 10, 4, 4);
      expect(result[4][4].isHazard).toBe(false);
    }
  });

  it('never places a hazard on safe tile neighbors', () => {
    for (let i = 0; i < 30; i++) {
      const result = placeHazards(createBoard(8, 8), 10, 4, 4);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          expect(result[4 + dr][4 + dc].isHazard).toBe(false);
        }
      }
    }
  });

  it('correctly calculates adjacentHazards', () => {
    const result = placeHazards(createBoard(8, 8), 10, 0, 0);
    result.flat().filter(t => !t.isHazard).forEach(tile => {
      const actualNeighborHazards = result.flat().filter(
        t => t.isHazard &&
          Math.abs(t.row - tile.row) <= 1 &&
          Math.abs(t.col - tile.col) <= 1
      ).length;
      expect(tile.adjacentHazards).toBe(actualNeighborHazards);
    });
  });

  it('does not mutate the input board', () => {
    const board = createBoard(8, 8);
    placeHazards(board, 10, 3, 3);
    expect(board.flat().every(t => !t.isHazard)).toBe(true);
  });

  it('assigns hazardVariant between 0 and 4', () => {
    const result = placeHazards(createBoard(8, 8), 10, 0, 0);
    result.flat().filter(t => t.isHazard).forEach(t => {
      expect(t.hazardVariant).toBeGreaterThanOrEqual(0);
      expect(t.hazardVariant).toBeLessThanOrEqual(4);
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL — `Cannot find module '../../src/game/placeHazards'`

- [ ] **Step 3: Implement src/game/placeHazards.ts**

```typescript
import { Tile } from './types';

function neighborCoords(
  row: number, col: number, rows: number, cols: number
): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) result.push([r, c]);
    }
  }
  return result;
}

export function placeHazards(
  board: Tile[][],
  hazardCount: number,
  safeRow: number,
  safeCol: number
): Tile[][] {
  const rows = board.length;
  const cols = board[0].length;

  const safeSet = new Set<string>();
  safeSet.add(`${safeRow},${safeCol}`);
  neighborCoords(safeRow, safeCol, rows, cols).forEach(([r, c]) =>
    safeSet.add(`${r},${c}`)
  );

  const candidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeSet.has(`${r},${c}`)) candidates.push([r, c]);
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const next: Tile[][] = board.map(row => row.map(t => ({ ...t })));

  candidates.slice(0, hazardCount).forEach(([r, c]) => {
    next[r][c].isHazard = true;
    next[r][c].hazardVariant = (Math.floor(Math.random() * 5)) as 0 | 1 | 2 | 3 | 4;
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!next[r][c].isHazard) {
        next[r][c].adjacentHazards = neighborCoords(r, c, rows, cols)
          .filter(([nr, nc]) => next[nr][nc].isHazard).length;
      }
    }
  }

  return next;
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/placeHazards.ts tests/game/placeHazards.test.ts
git commit -m "feat: add placeHazards with first-click safety"
```

---

## Task 6: revealTile (TDD)

**Files:**
- Create: `src/game/revealTile.ts`
- Create: `tests/game/revealTile.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/game/revealTile.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { revealTile } from '../../src/game/revealTile';
import { createBoard } from '../../src/game/createBoard';

describe('revealTile', () => {
  it('reveals a hidden tile', () => {
    const board = createBoard(4, 4);
    const result = revealTile(board, 0, 0);
    expect(result[0][0].state).toBe('revealed');
  });

  it('does not change a flagged tile', () => {
    const board = createBoard(4, 4);
    const flagged = board.map(r => r.map(t => ({ ...t })));
    flagged[1][1].state = 'flagged';
    const result = revealTile(flagged, 1, 1);
    expect(result[1][1].state).toBe('flagged');
  });

  it('does not change an already-revealed tile', () => {
    const board = createBoard(4, 4);
    const revealed = board.map(r => r.map(t => ({ ...t })));
    revealed[2][2].state = 'revealed';
    const result = revealTile(revealed, 2, 2);
    expect(result[2][2].state).toBe('revealed');
  });

  it('cascade reveals all connected empty tiles', () => {
    // 3x3 board with no hazards — all adjacentHazards = 0 — full cascade
    const result = revealTile(createBoard(3, 3), 1, 1);
    expect(result.flat().every(t => t.state === 'revealed')).toBe(true);
  });

  it('stops cascade at numbered tiles', () => {
    const board = createBoard(3, 3);
    const modified = board.map(r => r.map(t => ({ ...t })));
    // Make center tile have adjacentHazards=1 to stop cascade
    modified[1][1].adjacentHazards = 1;
    const result = revealTile(modified, 0, 0);
    // (0,0) is empty → reveals neighbors; (1,1) has a number → revealed but not cascaded
    expect(result[1][1].state).toBe('revealed');
    // Tiles not reachable via empty-cascade should stay hidden
    // (2,2) is adjacent to (1,1) only via numbered tile — not cascade revealed
    expect(result[2][2].state).toBe('hidden');
  });

  it('reveals a hazard tile without cascading neighbors', () => {
    const board = createBoard(4, 4);
    const modified = board.map(r => r.map(t => ({ ...t })));
    modified[2][2].isHazard = true;
    const result = revealTile(modified, 2, 2);
    expect(result[2][2].state).toBe('revealed');
    expect(result[2][1].state).toBe('hidden');
    expect(result[1][2].state).toBe('hidden');
  });

  it('does not mutate the input board', () => {
    const board = createBoard(4, 4);
    revealTile(board, 0, 0);
    expect(board[0][0].state).toBe('hidden');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL — `Cannot find module '../../src/game/revealTile'`

- [ ] **Step 3: Implement src/game/revealTile.ts**

```typescript
import { Tile } from './types';

export function revealTile(board: Tile[][], row: number, col: number): Tile[][] {
  const rows = board.length;
  const cols = board[0].length;
  const next = board.map(r => r.map(t => ({ ...t })));

  function reveal(r: number, c: number): void {
    const tile = next[r][c];
    if (tile.state !== 'hidden') return;
    tile.state = 'revealed';
    if (tile.isHazard || tile.adjacentHazards > 0) return;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) reveal(nr, nc);
      }
    }
  }

  reveal(row, col);
  return next;
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/revealTile.ts tests/game/revealTile.test.ts
git commit -m "feat: add revealTile with cascade"
```

---

## Task 7: flagTile + checkWin (TDD)

**Files:**
- Create: `src/game/flagTile.ts`
- Create: `src/game/checkWin.ts`
- Create: `tests/game/flagTile.test.ts`
- Create: `tests/game/checkWin.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/game/flagTile.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { flagTile } from '../../src/game/flagTile';
import { createBoard } from '../../src/game/createBoard';

describe('flagTile', () => {
  it('flags a hidden tile', () => {
    expect(flagTile(createBoard(4, 4), 2, 2)[2][2].state).toBe('flagged');
  });

  it('unflags a flagged tile', () => {
    const board = createBoard(4, 4);
    const flagged = flagTile(board, 2, 2);
    expect(flagTile(flagged, 2, 2)[2][2].state).toBe('hidden');
  });

  it('does not change a revealed tile', () => {
    const board = createBoard(4, 4);
    const revealed = board.map(r => r.map(t => ({ ...t })));
    revealed[1][1].state = 'revealed';
    expect(flagTile(revealed, 1, 1)[1][1].state).toBe('revealed');
  });

  it('does not mutate the input board', () => {
    const board = createBoard(4, 4);
    flagTile(board, 2, 2);
    expect(board[2][2].state).toBe('hidden');
  });
});
```

Create `tests/game/checkWin.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { checkWin } from '../../src/game/checkWin';
import { createBoard } from '../../src/game/createBoard';

describe('checkWin', () => {
  it('returns false when all tiles are hidden', () => {
    expect(checkWin(createBoard(4, 4))).toBe(false);
  });

  it('returns true when all non-hazard tiles are revealed', () => {
    const board = createBoard(2, 2);
    const modified = board.map(r => r.map(t => ({ ...t, state: 'revealed' as const })));
    modified[0][0].state = 'hidden';
    modified[0][0].isHazard = true;
    expect(checkWin(modified)).toBe(true);
  });

  it('returns false when a safe tile is still hidden', () => {
    const board = createBoard(2, 2);
    const modified = board.map(r => r.map(t => ({ ...t, state: 'revealed' as const })));
    modified[0][0].isHazard = true;
    modified[1][1].state = 'hidden';
    expect(checkWin(modified)).toBe(false);
  });

  it('returns true for a board with no hazards when all revealed', () => {
    const board = createBoard(2, 2);
    const all = board.map(r => r.map(t => ({ ...t, state: 'revealed' as const })));
    expect(checkWin(all)).toBe(true);
  });

  it('flagged hazards do not prevent win', () => {
    const board = createBoard(2, 2);
    const modified = board.map(r => r.map(t => ({ ...t, state: 'revealed' as const })));
    modified[0][0].isHazard = true;
    modified[0][0].state = 'flagged';
    expect(checkWin(modified)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement src/game/flagTile.ts**

```typescript
import { Tile } from './types';

export function flagTile(board: Tile[][], row: number, col: number): Tile[][] {
  const next = board.map(r => r.map(t => ({ ...t })));
  const tile = next[row][col];
  if (tile.state === 'hidden') tile.state = 'flagged';
  else if (tile.state === 'flagged') tile.state = 'hidden';
  return next;
}
```

- [ ] **Step 4: Implement src/game/checkWin.ts**

```typescript
import { Tile } from './types';

export function checkWin(board: Tile[][]): boolean {
  return board.flat().every(tile => tile.isHazard || tile.state === 'revealed');
}
```

- [ ] **Step 5: Run tests — verify all pass**

Run: `npm test`

Expected: All 9 tests PASS (4 flagTile + 5 checkWin).

- [ ] **Step 6: Commit**

```bash
git add src/game/flagTile.ts src/game/checkWin.ts tests/game/flagTile.test.ts tests/game/checkWin.test.ts
git commit -m "feat: add flagTile and checkWin"
```

---

## Task 8: App.tsx — Reducer and State

**Files:**
- Create: `src/App.tsx`

- [ ] **Step 1: Write src/App.tsx**

```typescript
import { useReducer, useEffect, useRef } from 'react';
import { GameState, GameMode, Action } from './game/types';
import { getLevelConfig } from './game/depthScaling';
import { createBoard } from './game/createBoard';
import { placeHazards } from './game/placeHazards';
import { revealTile } from './game/revealTile';
import { flagTile } from './game/flagTile';
import { checkWin } from './game/checkWin';
import { DEATH_QUIPS } from './game/constants';

function getDeathQuip(depth: number): string {
  if (Math.random() < 0.2) return `Depth ${depth} was a perfectly reasonable place to die.`;
  return DEATH_QUIPS[Math.floor(Math.random() * DEATH_QUIPS.length)];
}

function makeInitialPlayState(mode: GameMode, existingDepth?: number, existingHearts?: number): GameState {
  const depth = existingDepth ?? 1;
  const { rows, cols, hazards } = getLevelConfig(depth);
  return {
    board: createBoard(rows, cols),
    screen: 'playing',
    mode,
    depth,
    hearts: existingHearts ?? 3,
    flagsUsed: 0,
    hazardCount: hazards,
    secondsElapsed: 0,
    timerRunning: false,
    firstClickDone: false,
    showTransition: false,
    lastRevealedCount: null,
    adventureLogText: 'The dungeon awaits. Choose your first room wisely.',
    deathQuip: '',
  };
}

const MENU_STATE: GameState = {
  board: [],
  screen: 'menu',
  mode: 'classic',
  depth: 1,
  hearts: 3,
  flagsUsed: 0,
  hazardCount: 0,
  secondsElapsed: 0,
  timerRunning: false,
  firstClickDone: false,
  showTransition: false,
  lastRevealedCount: null,
  adventureLogText: '',
  deathQuip: '',
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return makeInitialPlayState(action.mode);

    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'classic' ? 'adventure' : 'classic' };

    case 'REVEAL_TILE': {
      if (state.screen !== 'playing' || state.showTransition) return state;
      const { row, col } = action;
      if (state.board[row][col].state !== 'hidden') return state;

      let board = state.board;
      let firstClickDone = state.firstClickDone;
      let timerRunning = state.timerRunning;

      if (!firstClickDone) {
        board = placeHazards(board, state.hazardCount, row, col);
        firstClickDone = true;
        timerRunning = true;
      }

      const nextBoard = revealTile(board, row, col);
      const clickedTile = nextBoard[row][col];

      if (clickedTile.isHazard) {
        const newHearts = state.hearts - 1;
        if (state.mode === 'classic' || newHearts <= 0) {
          return {
            ...state,
            board: nextBoard,
            screen: 'dead',
            timerRunning: false,
            firstClickDone,
            hearts: newHearts,
            deathQuip: getDeathQuip(state.depth),
          };
        }
        return { ...state, board: nextBoard, firstClickDone, timerRunning, hearts: newHearts };
      }

      const lastRevealedCount = clickedTile.adjacentHazards;

      if (checkWin(nextBoard)) {
        return {
          ...state,
          board: nextBoard,
          firstClickDone,
          timerRunning,
          showTransition: true,
          depth: state.depth + 1,
          lastRevealedCount,
        };
      }

      return { ...state, board: nextBoard, firstClickDone, timerRunning, lastRevealedCount };
    }

    case 'FLAG_TILE': {
      if (state.screen !== 'playing' || state.showTransition) return state;
      if (state.board[action.row][action.col].state === 'revealed') return state;
      const nextBoard = flagTile(state.board, action.row, action.col);
      const delta = nextBoard[action.row][action.col].state === 'flagged' ? 1 : -1;
      return { ...state, board: nextBoard, flagsUsed: state.flagsUsed + delta };
    }

    case 'TICK':
      if (!state.timerRunning) return state;
      return { ...state, secondsElapsed: state.secondsElapsed + 1 };

    case 'TRANSITION_DONE': {
      const { rows, cols, hazards } = getLevelConfig(state.depth);
      return {
        ...state,
        board: createBoard(rows, cols),
        hazardCount: hazards,
        flagsUsed: 0,
        firstClickDone: false,
        showTransition: false,
        lastRevealedCount: null,
      };
    }

    case 'RESTART':
      return makeInitialPlayState(state.mode);

    case 'GOTO_MENU':
      return { ...MENU_STATE, mode: state.mode };

    default:
      return state;
  }
}

// Components are added in later tasks — export reducer for now
export { reducer, MENU_STATE, makeInitialPlayState };

export default function App() {
  const [state, dispatch] = useReducer(reducer, MENU_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.timerRunning) {
      timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.timerRunning]);

  useEffect(() => {
    if (state.screen === 'dead') {
      const key = `dungeonsweeper_best_${state.mode}`;
      const prev = parseInt(localStorage.getItem(key) ?? '0', 10);
      if (state.depth > prev) localStorage.setItem(key, String(state.depth));
    }
  }, [state.screen, state.depth, state.mode]);

  // Screen components added in Tasks 13–17
  return <div>Game loads here — components coming in later tasks.</div>;
}
```

- [ ] **Step 2: Run existing tests to ensure nothing broken**

Run: `npm test`

Expected: All existing game logic tests still PASS.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add game reducer and App scaffold"
```

---

## Task 9: CSS — Global and Dungeon Theme

**Files:**
- Create: `src/styles/global.css`
- Create: `src/styles/dungeon.css`

- [ ] **Step 1: Write src/styles/global.css**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: 'Georgia', serif;
  background: #0d0a06;
  color: #d4b483;
  -webkit-font-smoothing: antialiased;
}

button {
  font-family: inherit;
  cursor: pointer;
}

button:focus-visible {
  outline: 2px solid #c8a060;
  outline-offset: 2px;
}
```

- [ ] **Step 2: Write src/styles/dungeon.css**

```css
/* ─── Design tokens ─────────────────────────────────────────── */
:root {
  --clr-bg:          #0d0a06;
  --clr-panel:       #1a1208;
  --clr-border:      #5a3a10;
  --clr-border-gold: #c08020;
  --clr-gold:        #f0c040;
  --clr-gold-dim:    #c8a060;
  --clr-red:         #cc2200;
  --clr-red-dark:    #8b0000;
  --clr-text:        #d4b483;
  --clr-text-dim:    #8a6a30;
  --clr-heart:       #e84040;
  --clr-heart-empty: #444;

  /* Tile sizing — overridden per-board in GameBoard via inline style */
  --tile-size: 48px;

  /* Tileset sprite constants — SET THESE from Task 1 Step 8 measurement */
  /* If tileset is 256×256px (64px tiles): */
  --tileset-tile-px: 64;
  --tileset-sheet-px: 256;
}

/* ─── Screen containers ─────────────────────────────────────── */
.screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.splash-bg {
  position: absolute;
  inset: 0;
  background-image: url('/assets/images/splashscreen_main.png');
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.splash-bg.tint-red::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(100, 0, 0, 0.72);
}

/* ─── Menu screen ───────────────────────────────────────────── */
.menu-panel {
  position: relative;
  z-index: 1;
  background: rgba(16, 10, 4, 0.88);
  border: 2px solid var(--clr-border-gold);
  border-radius: 8px;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 320px;
  max-width: 480px;
}

.menu-title {
  font-size: 2rem;
  color: var(--clr-gold);
  text-shadow: 0 0 12px #ff8800, 0 2px 4px #000;
  letter-spacing: 3px;
  text-align: center;
}

.menu-subtitle {
  font-size: 0.85rem;
  color: var(--clr-gold-dim);
  letter-spacing: 2px;
  margin-top: -8px;
}

.menu-best {
  font-size: 0.8rem;
  color: var(--clr-text-dim);
  min-height: 1.2em;
}

.mode-toggle {
  display: flex;
  gap: 8px;
}

.mode-btn {
  padding: 7px 18px;
  border-radius: 4px;
  border: 1px solid var(--clr-border);
  background: var(--clr-panel);
  color: var(--clr-text-dim);
  font-size: 0.8rem;
  transition: all 0.15s;
}

.mode-btn.active.classic {
  border-color: var(--clr-red);
  color: #ff8060;
  background: rgba(100, 0, 0, 0.25);
}

.mode-btn.active.adventure {
  border-color: #30a060;
  color: #60e090;
  background: rgba(0, 80, 40, 0.25);
}

.btn-descend {
  background: linear-gradient(180deg, #6b3a00, #3d1f00);
  border: 2px solid var(--clr-border-gold);
  color: #ffe080;
  padding: 10px 32px;
  border-radius: 4px;
  font-size: 1rem;
  letter-spacing: 1px;
  transition: filter 0.15s;
}

.btn-descend:hover { filter: brightness(1.2); }

.btn-secondary {
  background: var(--clr-panel);
  border: 1px solid var(--clr-border);
  color: var(--clr-gold-dim);
  padding: 7px 20px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.btn-secondary:hover { border-color: var(--clr-border-gold); }

/* ─── Game screen ───────────────────────────────────────────── */
.game-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #13100a;
  overflow: auto;
}

.game-header {
  width: 100%;
  max-width: 900px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--clr-border);
}

.header-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 70px;
}

.header-label {
  font-size: 0.6rem;
  letter-spacing: 2px;
  color: var(--clr-text-dim);
  text-transform: uppercase;
}

.header-value {
  font-size: 1.2rem;
  color: var(--clr-gold);
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.hero-btn {
  background: none;
  border: 2px solid var(--clr-border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 1.4rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.hero-btn:hover { border-color: var(--clr-border-gold); }

.hearts {
  display: flex;
  gap: 4px;
  font-size: 1.2rem;
}

.heart-full  { color: var(--clr-heart); }
.heart-empty { color: var(--clr-heart-empty); }

/* ─── Game board ────────────────────────────────────────────── */
.board-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  gap: 12px;
}

.game-board {
  display: grid;
  gap: 2px;
  /* grid-template-columns set inline in GameBoard component */
}

/* ─── Tile ──────────────────────────────────────────────────── */
.tile {
  width: var(--tile-size);
  height: var(--tile-size);
  background-image: url('/assets/images/tileset.png');
  background-repeat: no-repeat;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.08s;
}

.tile:hover {
  transform: scale(1.05);
  z-index: 1;
  position: relative;
}

.tile.revealed, .tile.flagged {
  cursor: default;
}

.tile-reveal-pop {
  animation: tile-pop 0.12s ease-out;
}

@keyframes tile-pop {
  0%   { transform: scale(0.85); }
  60%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}

/* ─── Adventure log ─────────────────────────────────────────── */
.adventure-log {
  width: 100%;
  max-width: 600px;
  padding: 8px 16px;
  border: 1px solid var(--clr-border);
  border-radius: 4px;
  background: rgba(16, 10, 4, 0.7);
  font-size: 0.8rem;
  color: var(--clr-gold-dim);
  font-style: italic;
  text-align: center;
  min-height: 2em;
}

/* ─── Level transition overlay ──────────────────────────────── */
.transition-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  animation: fade-in 0.2s ease-out;
}

.transition-text {
  font-size: 1.6rem;
  color: var(--clr-gold);
  text-shadow: 0 0 20px #ff8800;
  letter-spacing: 3px;
  animation: gold-pulse 0.6s ease-in-out infinite alternate;
}

.transition-depth {
  font-size: 1rem;
  color: var(--clr-gold-dim);
  margin-top: 8px;
}

@keyframes gold-pulse {
  from { text-shadow: 0 0 10px #ff8800; }
  to   { text-shadow: 0 0 30px #ffcc00, 0 0 60px #ff8800; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ─── Dead screen ───────────────────────────────────────────── */
.dead-panel {
  position: relative;
  z-index: 1;
  background: rgba(16, 4, 4, 0.9);
  border: 2px solid var(--clr-red);
  border-radius: 8px;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 320px;
  max-width: 440px;
  animation: fade-in 0.3s ease-out;
}

.dead-skull   { font-size: 2.5rem; }
.dead-title   { font-size: 1.3rem; color: var(--clr-red); letter-spacing: 2px; }
.dead-quip    { font-size: 0.85rem; color: var(--clr-gold-dim); font-style: italic; text-align: center; }
.dead-stats   { font-size: 0.8rem; color: var(--clr-text-dim); }
.dead-hearts  { display: flex; gap: 6px; font-size: 1.3rem; }

.btn-danger {
  background: linear-gradient(180deg, #5c1a00, #3a0d00);
  border: 2px solid var(--clr-red);
  color: #ffcc44;
  padding: 9px 26px;
  border-radius: 4px;
  font-size: 0.9rem;
  letter-spacing: 1px;
  transition: filter 0.15s;
}

.btn-danger:hover { filter: brightness(1.2); }

/* ─── How To Play modal ─────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-box {
  background: #1a1208;
  border: 2px solid var(--clr-border-gold);
  border-radius: 8px;
  padding: 28px 32px;
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 1.2rem;
  color: var(--clr-gold);
  margin-bottom: 16px;
}

.modal-section { margin-bottom: 14px; }
.modal-section h4 { color: var(--clr-gold-dim); margin-bottom: 6px; font-size: 0.85rem; letter-spacing: 1px; }
.modal-section p, .modal-section li { font-size: 0.8rem; color: var(--clr-text); line-height: 1.6; }
.modal-section ul { padding-left: 16px; }

.modal-close {
  margin-top: 16px;
  width: 100%;
}

/* ─── Responsive ────────────────────────────────────────────── */
@media (max-width: 600px) {
  :root { --tile-size: 36px; }

  .menu-panel { padding: 24px 20px; min-width: 280px; }
  .menu-title  { font-size: 1.5rem; }

  .game-header { padding: 6px 10px; }
  .header-value { font-size: 1rem; }
}

@media (max-width: 380px) {
  :root { --tile-size: 28px; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css src/styles/dungeon.css
git commit -m "feat: add dungeon CSS theme"
```

---

## Task 10: Tile Component

**Files:**
- Create: `src/components/Tile.tsx`

- [ ] **Step 1: Write src/components/Tile.tsx**

```typescript
import { useRef } from 'react';
import { Tile as TileType } from '../game/types';
import { NUMBER_SPRITES, HAZARD_SPRITES, TILE_SPRITES } from '../game/constants';

interface TileProps {
  tile: TileType;
  tileSize: number;
  tilesetTilePx: number;
  onReveal: () => void;
  onFlag: () => void;
}

function getSpritePos(tile: TileType, px: number): string {
  let [spriteRow, spriteCol]: [number, number] = [0, 0];

  if (tile.state === 'hidden') {
    [spriteRow, spriteCol] = TILE_SPRITES.hidden;
  } else if (tile.state === 'flagged') {
    [spriteRow, spriteCol] = TILE_SPRITES.flag;
  } else if (tile.isHazard) {
    [spriteRow, spriteCol] = HAZARD_SPRITES[tile.hazardVariant];
  } else if (tile.adjacentHazards === 0) {
    [spriteRow, spriteCol] = TILE_SPRITES.empty;
  } else {
    [spriteRow, spriteCol] = NUMBER_SPRITES[tile.adjacentHazards - 1];
  }

  return `${-spriteCol * px}px ${-spriteRow * px}px`;
}

export default function Tile({ tile, tileSize, tilesetTilePx, onReveal, onFlag }: TileProps) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMovedRef = useRef(false);

  const handleTouchStart = () => {
    touchMovedRef.current = false;
    longPressRef.current = setTimeout(() => {
      if (!touchMovedRef.current) onFlag();
    }, 500);
  };

  const clearLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleTouchMove = () => {
    touchMovedRef.current = true;
    clearLongPress();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchMovedRef.current && longPressRef.current) {
      clearLongPress();
      if (tile.state !== 'revealed') onReveal();
    } else {
      clearLongPress();
    }
    e.preventDefault();
  };

  const sheetPx = tilesetTilePx * 4;

  return (
    <div
      className={`tile ${tile.state}`}
      style={{
        width: tileSize,
        height: tileSize,
        backgroundPosition: getSpritePos(tile, tilesetTilePx),
        backgroundSize: `${sheetPx}px ${sheetPx}px`,
      }}
      onClick={() => { if (tile.state === 'hidden') onReveal(); }}
      onContextMenu={e => { e.preventDefault(); onFlag(); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
```

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Tile.tsx
git commit -m "feat: add Tile component with sprite mapping"
```

---

## Task 11: GameBoard Component

**Files:**
- Create: `src/components/GameBoard.tsx`

- [ ] **Step 1: Write src/components/GameBoard.tsx**

```typescript
import { Dispatch } from 'react';
import { Tile as TileType, Action } from '../game/types';
import Tile from './Tile';

interface GameBoardProps {
  board: TileType[][];
  dispatch: Dispatch<Action>;
  disabled?: boolean;
}

const TILE_DISPLAY_SIZE = 48;
const TILESET_TILE_PX = 64; // Update if Task 1 Step 8 shows different value

export const EFFECTIVE_TILE_SIZE = TILE_DISPLAY_SIZE;
export const EFFECTIVE_TILESET_PX = TILESET_TILE_PX;

export default function GameBoard({ board, dispatch, disabled = false }: GameBoardProps) {
  if (board.length === 0) return null;
  const cols = board[0].length;

  return (
    <div
      className="game-board"
      style={{ gridTemplateColumns: `repeat(${cols}, ${TILE_DISPLAY_SIZE}px)` }}
    >
      {board.flat().map(tile => (
        <Tile
          key={`${tile.row}-${tile.col}`}
          tile={tile}
          tileSize={TILE_DISPLAY_SIZE}
          tilesetTilePx={TILESET_TILE_PX}
          onReveal={() => {
            if (!disabled) dispatch({ type: 'REVEAL_TILE', row: tile.row, col: tile.col });
          }}
          onFlag={() => {
            if (!disabled) dispatch({ type: 'FLAG_TILE', row: tile.row, col: tile.col });
          }}
        />
      ))}
    </div>
  );
}
```

> **Note:** If the tileset tile size measured in Task 1 Step 8 is not 64px, update `TILESET_TILE_PX` here to match.

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameBoard.tsx
git commit -m "feat: add GameBoard component"
```

---

## Task 12: LevelTransition Component

**Files:**
- Create: `src/components/LevelTransition.tsx`

- [ ] **Step 1: Write src/components/LevelTransition.tsx**

```typescript
import { useEffect, Dispatch } from 'react';
import { Action } from '../game/types';

interface LevelTransitionProps {
  depth: number;
  dispatch: Dispatch<Action>;
}

export default function LevelTransition({ depth, dispatch }: LevelTransitionProps) {
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'TRANSITION_DONE' }), 1200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <div className="transition-overlay">
      <div className="transition-text">⬇ DESCENDING…</div>
      <div className="transition-depth">Depth {depth}</div>
    </div>
  );
}
```

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelTransition.tsx
git commit -m "feat: add LevelTransition overlay"
```

---

## Task 13: HowToPlayModal Component

**Files:**
- Create: `src/components/HowToPlayModal.tsx`

- [ ] **Step 1: Write src/components/HowToPlayModal.tsx**

```typescript
interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⚔ How to Play</div>

        <div className="modal-section">
          <h4>THE GOAL</h4>
          <p>Reveal every safe room in the dungeon without triggering a trap. Clear the floor to descend deeper. How deep can you go?</p>
        </div>

        <div className="modal-section">
          <h4>CONTROLS</h4>
          <ul>
            <li><strong>Left-click / Tap</strong> — Explore a room</li>
            <li><strong>Right-click / Long-press</strong> — Plant a torch (flag as dangerous)</li>
          </ul>
        </div>

        <div className="modal-section">
          <h4>THE NUMBERS</h4>
          <p>Each revealed room shows how many hazards lurk in adjacent rooms (up to 8 neighbors). Use the numbers to deduce safe paths.</p>
        </div>

        <div className="modal-section">
          <h4>MODES</h4>
          <ul>
            <li><strong>Classic</strong> — One hazard ends your run instantly.</li>
            <li><strong>Adventure</strong> — You have 3 hearts. Each hazard costs one heart. Three strikes and you fall.</li>
          </ul>
        </div>

        <div className="modal-section">
          <h4>DEPTH SCALING</h4>
          <p>Each floor cleared increases depth. The dungeon grows: bigger boards, more hazards. There is no ceiling.</p>
        </div>

        <button className="btn-secondary modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/HowToPlayModal.tsx
git commit -m "feat: add HowToPlayModal"
```

---

## Task 14: MenuScreen Component

**Files:**
- Create: `src/components/MenuScreen.tsx`

- [ ] **Step 1: Write src/components/MenuScreen.tsx**

```typescript
import { Dispatch, useState } from 'react';
import { Action, GameMode } from '../game/types';
import HowToPlayModal from './HowToPlayModal';

interface MenuScreenProps {
  mode: GameMode;
  dispatch: Dispatch<Action>;
}

export default function MenuScreen({ mode, dispatch }: MenuScreenProps) {
  const [showHelp, setShowHelp] = useState(false);

  const bestDepth = parseInt(
    localStorage.getItem(`dungeonsweeper_best_${mode}`) ?? '0',
    10
  );

  return (
    <div className="screen">
      <div className="splash-bg" />

      <div className="menu-panel">
        <div className="menu-title">DUNGEONSWEEPER</div>
        <div className="menu-subtitle">⬥ How Deep Can You Go? ⬥</div>

        <div className="menu-best">
          {bestDepth > 0 ? `Your Record: Depth ${bestDepth}` : ''}
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'classic' ? 'active classic' : ''}`}
            onClick={() => { if (mode !== 'classic') dispatch({ type: 'TOGGLE_MODE' }); }}
          >
            ☠ Classic
          </button>
          <button
            className={`mode-btn ${mode === 'adventure' ? 'active adventure' : ''}`}
            onClick={() => { if (mode !== 'adventure') dispatch({ type: 'TOGGLE_MODE' }); }}
          >
            ♡ Adventure
          </button>
        </div>

        <button
          className="btn-descend"
          onClick={() => dispatch({ type: 'START_GAME', mode })}
        >
          ⚔ Descend Into The Dungeon
        </button>

        <button className="btn-secondary" onClick={() => setShowHelp(true)}>
          ? How to Play
        </button>
      </div>

      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/MenuScreen.tsx
git commit -m "feat: add MenuScreen"
```

---

## Task 15: GameScreen Component

**Files:**
- Create: `src/components/GameScreen.tsx`

- [ ] **Step 1: Write src/components/GameScreen.tsx**

```typescript
import { Dispatch } from 'react';
import { GameState, Action } from '../game/types';
import GameBoard from './GameBoard';
import LevelTransition from './LevelTransition';

interface GameScreenProps {
  state: GameState;
  dispatch: Dispatch<Action>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function GameScreen({ state, dispatch }: GameScreenProps) {
  const { board, depth, mode, hearts, hazardCount, flagsUsed, secondsElapsed, showTransition, adventureLogText } = state;
  const torchesLeft = hazardCount - flagsUsed;

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="header-stat">
          <span className="header-label">Depth</span>
          <span className="header-value">{String(depth).padStart(3, '0')}</span>
        </div>

        {mode === 'adventure' && (
          <div className="hearts">
            {[0, 1, 2].map(i => (
              <span key={i} className={i < hearts ? 'heart-full' : 'heart-empty'}>
                {i < hearts ? '♥' : '♡'}
              </span>
            ))}
          </div>
        )}

        <button
          className="hero-btn"
          title="New Dungeon"
          onClick={() => dispatch({ type: 'RESTART' })}
        >
          🧙
        </button>

        <div className="header-stat">
          <span className="header-label">Torches</span>
          <span className="header-value">{torchesLeft}</span>
        </div>

        <div className="header-stat">
          <span className="header-label">Time</span>
          <span className="header-value">{formatTime(secondsElapsed)}</span>
        </div>
      </div>

      <div className="board-wrapper">
        <GameBoard board={board} dispatch={dispatch} disabled={showTransition} />
        <div className="adventure-log">{adventureLogText}</div>
      </div>

      {showTransition && <LevelTransition depth={depth} dispatch={dispatch} />}
    </div>
  );
}
```

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameScreen.tsx
git commit -m "feat: add GameScreen with header, board, and adventure log"
```

---

## Task 16: DeadScreen Component

**Files:**
- Create: `src/components/DeadScreen.tsx`

- [ ] **Step 1: Write src/components/DeadScreen.tsx**

```typescript
import { Dispatch } from 'react';
import { GameState, Action } from '../game/types';

interface DeadScreenProps {
  state: GameState;
  dispatch: Dispatch<Action>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function DeadScreen({ state, dispatch }: DeadScreenProps) {
  const { depth, secondsElapsed, deathQuip, mode, hearts } = state;

  return (
    <div className="screen">
      <div className="splash-bg tint-red" />

      <div className="dead-panel">
        <div className="dead-skull">☠</div>
        <div className="dead-title">YOUR PARTY FALLS</div>

        <div className="dead-quip">"{deathQuip}"</div>

        {mode === 'adventure' && (
          <div className="dead-hearts">
            {[0, 1, 2].map(i => (
              <span key={i} className={i < hearts ? 'heart-full' : 'heart-empty'}>
                {i < hearts ? '♥' : '♡'}
              </span>
            ))}
          </div>
        )}

        <div className="dead-stats">
          Depth {depth} · {formatTime(secondsElapsed)}
        </div>

        <button
          className="btn-danger"
          onClick={() => dispatch({ type: 'RESTART' })}
        >
          ⚔ Descend Again
        </button>

        <button
          className="btn-secondary"
          onClick={() => dispatch({ type: 'GOTO_MENU' })}
        >
          ← Main Menu
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/DeadScreen.tsx
git commit -m "feat: add DeadScreen"
```

---

## Task 17: Wire App.tsx and main.tsx

**Files:**
- Modify: `src/App.tsx` — add screen routing + import components
- Create: `src/main.tsx`

- [ ] **Step 1: Update src/App.tsx — replace the placeholder return**

Replace the entire file with:

```typescript
import { useReducer, useEffect, useRef } from 'react';
import { GameState, GameMode, Action } from './game/types';
import { getLevelConfig } from './game/depthScaling';
import { createBoard } from './game/createBoard';
import { placeHazards } from './game/placeHazards';
import { revealTile } from './game/revealTile';
import { flagTile } from './game/flagTile';
import { checkWin } from './game/checkWin';
import { DEATH_QUIPS, FLAVOR_TEXT } from './game/constants';
import MenuScreen from './components/MenuScreen';
import GameScreen from './components/GameScreen';
import DeadScreen from './components/DeadScreen';
import './styles/global.css';
import './styles/dungeon.css';

function getDeathQuip(depth: number): string {
  if (Math.random() < 0.2) return `Depth ${depth} was a perfectly reasonable place to die.`;
  return DEATH_QUIPS[Math.floor(Math.random() * DEATH_QUIPS.length)];
}

function pickFlavorText(count: number): string {
  const options = FLAVOR_TEXT[count] ?? FLAVOR_TEXT[0];
  return options[Math.floor(Math.random() * options.length)];
}

function makeInitialPlayState(mode: GameMode): GameState {
  const { rows, cols, hazards } = getLevelConfig(1);
  return {
    board: createBoard(rows, cols),
    screen: 'playing',
    mode,
    depth: 1,
    hearts: 3,
    flagsUsed: 0,
    hazardCount: hazards,
    secondsElapsed: 0,
    timerRunning: false,
    firstClickDone: false,
    showTransition: false,
    lastRevealedCount: null,
    adventureLogText: 'The dungeon awaits. Choose your first room wisely.',
    deathQuip: '',
  };
}

const MENU_STATE: GameState = {
  board: [],
  screen: 'menu',
  mode: 'classic',
  depth: 1,
  hearts: 3,
  flagsUsed: 0,
  hazardCount: 0,
  secondsElapsed: 0,
  timerRunning: false,
  firstClickDone: false,
  showTransition: false,
  lastRevealedCount: null,
  adventureLogText: '',
  deathQuip: '',
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return makeInitialPlayState(action.mode);

    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'classic' ? 'adventure' : 'classic' };

    case 'REVEAL_TILE': {
      if (state.screen !== 'playing' || state.showTransition) return state;
      const { row, col } = action;
      if (state.board[row][col].state !== 'hidden') return state;

      let board = state.board;
      let firstClickDone = state.firstClickDone;
      let timerRunning = state.timerRunning;

      if (!firstClickDone) {
        board = placeHazards(board, state.hazardCount, row, col);
        firstClickDone = true;
        timerRunning = true;
      }

      const nextBoard = revealTile(board, row, col);
      const clickedTile = nextBoard[row][col];

      if (clickedTile.isHazard) {
        const newHearts = state.hearts - 1;
        if (state.mode === 'classic' || newHearts <= 0) {
          return {
            ...state,
            board: nextBoard,
            screen: 'dead',
            timerRunning: false,
            firstClickDone,
            hearts: newHearts,
            deathQuip: getDeathQuip(state.depth),
          };
        }
        return { ...state, board: nextBoard, firstClickDone, timerRunning, hearts: newHearts };
      }

      const lastRevealedCount = clickedTile.adjacentHazards;
      const adventureLogText = pickFlavorText(lastRevealedCount);

      if (checkWin(nextBoard)) {
        return {
          ...state,
          board: nextBoard,
          firstClickDone,
          timerRunning,
          showTransition: true,
          depth: state.depth + 1,
          lastRevealedCount,
          adventureLogText,
        };
      }

      return { ...state, board: nextBoard, firstClickDone, timerRunning, lastRevealedCount, adventureLogText };
    }

    case 'FLAG_TILE': {
      if (state.screen !== 'playing' || state.showTransition) return state;
      if (state.board[action.row][action.col].state === 'revealed') return state;
      const nextBoard = flagTile(state.board, action.row, action.col);
      const delta = nextBoard[action.row][action.col].state === 'flagged' ? 1 : -1;
      return { ...state, board: nextBoard, flagsUsed: state.flagsUsed + delta };
    }

    case 'TICK':
      if (!state.timerRunning) return state;
      return { ...state, secondsElapsed: state.secondsElapsed + 1 };

    case 'TRANSITION_DONE': {
      const { rows, cols, hazards } = getLevelConfig(state.depth);
      return {
        ...state,
        board: createBoard(rows, cols),
        hazardCount: hazards,
        flagsUsed: 0,
        firstClickDone: false,
        showTransition: false,
        lastRevealedCount: null,
        adventureLogText: 'A new floor. A new chance to die.',
      };
    }

    case 'RESTART':
      return makeInitialPlayState(state.mode);

    case 'GOTO_MENU':
      return { ...MENU_STATE, mode: state.mode };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, MENU_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.timerRunning) {
      timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.timerRunning]);

  useEffect(() => {
    if (state.screen === 'dead') {
      const key = `dungeonsweeper_best_${state.mode}`;
      const prev = parseInt(localStorage.getItem(key) ?? '0', 10);
      if (state.depth > prev) localStorage.setItem(key, String(state.depth));
    }
  }, [state.screen, state.depth, state.mode]);

  if (state.screen === 'menu') return <MenuScreen mode={state.mode} dispatch={dispatch} />;
  if (state.screen === 'playing') return <GameScreen state={state} dispatch={dispatch} />;
  if (state.screen === 'dead') return <DeadScreen state={state} dispatch={dispatch} />;
  return null;
}
```

- [ ] **Step 2: Write src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Run all tests**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 4: Start dev server and verify the game loads**

Run: `npm run dev`

Open `http://localhost:5173` in a browser. Verify:
- [ ] Menu screen appears with DUNGEONSWEEPER title and splash background
- [ ] Classic / Adventure toggle works
- [ ] "Descend Into The Dungeon" button starts the game
- [ ] Game board renders with visible tiles
- [ ] Clicking a tile reveals it
- [ ] Right-clicking places a flag
- [ ] Timer starts on first click
- [ ] Depth counter shows in header

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire up App with full screen routing"
```

---

## Task 18: Tileset Pixel Size Correction

**Files:**
- Modify: `src/components/GameBoard.tsx` — update TILESET_TILE_PX if needed
- Modify: `src/styles/dungeon.css` — update --tileset-tile-px if needed

- [ ] **Step 1: Confirm tile size from Task 1 Step 8**

If the tileset width reported was `W`, then each tile is `W / 4` pixels. Common values:

| Sheet width | Tile px |
|-------------|---------|
| 256         | 64      |
| 512         | 128     |
| 1024        | 256     |

- [ ] **Step 2: Update GameBoard.tsx if tile size ≠ 64**

In `src/components/GameBoard.tsx`, change:
```typescript
const TILESET_TILE_PX = 64; // ← change to actual value
```

Also update the display tile size if needed. For a 128px tileset, you may want to display at 48px or 64px by adjusting `TILE_DISPLAY_SIZE`.

- [ ] **Step 3: Update dungeon.css if tile size ≠ 64**

In `src/styles/dungeon.css`, update:
```css
--tileset-tile-px: 64; /* ← change to actual value */
```

- [ ] **Step 4: Verify tiles display correctly**

With `npm run dev` running, check that all tile sprites align correctly: numbers 1-8 each show distinct colored numerals, the flag shows a red flag, and hazard tiles show the monster/trap sprites.

- [ ] **Step 5: Commit if changes were made**

```bash
git add src/components/GameBoard.tsx src/styles/dungeon.css
git commit -m "fix: correct tileset pixel dimensions"
```

---

## Task 19: Full Game Flow Verification

- [ ] **Step 1: Test Classic Mode full run**

With `npm run dev`:
1. Select Classic mode on menu
2. Start game — click a tile to start timer
3. Play until you either clear the board OR hit a hazard
4. Verify death screen shows: skull, quip, depth, time, "Descend Again" and "Main Menu" buttons
5. Click "Descend Again" — verify new game starts at depth 1

- [ ] **Step 2: Test Adventure Mode hearts**

1. Select Adventure mode
2. Start game
3. Find a hazard and click it (use flags to help locate, or just explore)
4. Verify: heart count decreases by 1, hazard tile is revealed, game continues
5. Lose all 3 hearts — verify dead screen shows Adventure hearts display

- [ ] **Step 3: Test level clear and transition**

1. Start a game
2. Flag known hazards using right-click
3. Reveal all safe tiles
4. Verify: "DESCENDING…" overlay appears, auto-dismisses after ~1.2s, new board loads at depth 2
5. Verify: depth counter in header increments

- [ ] **Step 4: Test best depth persistence**

1. Play to depth 3 then die
2. Go to main menu — verify "Your Record: Depth 3" appears
3. Restart and die at depth 1 — verify best depth still shows 3
4. Play to depth 5 — verify record updates to 5

- [ ] **Step 5: Test How to Play modal**

1. Click "? How to Play" on menu
2. Verify modal opens with rules content
3. Click Close or backdrop — verify modal closes

- [ ] **Step 6: Test responsive layout on mobile width**

In browser DevTools, set viewport to 375px wide. Verify:
- All tiles are visible without horizontal scrolling
- Header fits without overflow
- Menu panel fits on screen

- [ ] **Step 7: Run all tests one final time**

Run: `npm test`

Expected: All tests PASS.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete DungeonSweeper MVP"
```

---

## Quick Reference

**Run dev server:** `npm run dev` → `http://localhost:5173`

**Run tests:** `npm test`

**Key tileset assumption:** The plan assumes 64×64px tiles in a 256×256px sheet. If Task 1 Step 8 returns different dimensions, update `TILESET_TILE_PX` in `GameBoard.tsx` and `--tileset-tile-px` in `dungeon.css`.

**localStorage keys:**
- `dungeonsweeper_best_classic` — best depth in classic mode
- `dungeonsweeper_best_adventure` — best depth in adventure mode
