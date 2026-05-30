import { Tile } from './types';

export function flagTile(board: Tile[][], row: number, col: number): Tile[][] {
  const next = board.map(r => r.map(t => ({ ...t })));
  const tile = next[row][col];
  if (tile.state === 'hidden') tile.state = 'flagged';
  else if (tile.state === 'flagged') tile.state = 'hidden';
  return next;
}
