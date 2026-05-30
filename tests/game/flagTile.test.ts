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
