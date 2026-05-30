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
