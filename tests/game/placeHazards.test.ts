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
