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
