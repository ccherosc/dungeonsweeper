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

  it('returns false when a safe tile is flagged (player must reveal it to win)', () => {
    const board = createBoard(2, 2);
    const modified = board.map(r => r.map(t => ({ ...t, state: 'revealed' as const })));
    modified[0][0].isHazard = true;    // hazard, ok
    modified[1][1].state = 'flagged';  // safe tile flagged — blocks win
    expect(checkWin(modified)).toBe(false);
  });
});
