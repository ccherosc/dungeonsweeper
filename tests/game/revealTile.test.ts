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
    // Make all neighbors of (0,0) numbered so cascade stops at them
    // (0,0) is the only empty tile; its neighbors (0,1),(1,0),(1,1) are numbered
    modified[0][1].adjacentHazards = 1;
    modified[1][0].adjacentHazards = 1;
    modified[1][1].adjacentHazards = 1;
    const result = revealTile(modified, 0, 0);
    // (0,0) is empty → reveals its numbered neighbors; they reveal but do not cascade
    expect(result[0][1].state).toBe('revealed');
    expect(result[1][0].state).toBe('revealed');
    expect(result[1][1].state).toBe('revealed');
    // (2,2) is only reachable through numbered tiles — not cascade revealed
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
