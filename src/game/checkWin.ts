import { Tile } from './types';

export function checkWin(board: Tile[][]): boolean {
  return board.flat().every(tile => tile.isHazard || tile.state === 'revealed');
}
