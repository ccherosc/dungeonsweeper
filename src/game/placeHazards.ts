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

  const actualCount = Math.min(hazardCount, candidates.length);
  candidates.slice(0, actualCount).forEach(([r, c]) => {
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
