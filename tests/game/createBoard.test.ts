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
