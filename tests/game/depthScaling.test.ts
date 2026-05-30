import { describe, it, expect } from 'vitest';
import { getLevelConfig } from '../../src/game/depthScaling';

describe('getLevelConfig', () => {
  it('returns 8x8 with 10 hazards for depth 1', () => {
    expect(getLevelConfig(1)).toEqual({ rows: 8, cols: 8, hazards: 10 });
  });

  it('returns 8x8 with 10 hazards for depth 5', () => {
    expect(getLevelConfig(5)).toEqual({ rows: 8, cols: 8, hazards: 10 });
  });

  it('returns 9x9 with 13 hazards for depth 6', () => {
    expect(getLevelConfig(6)).toEqual({ rows: 9, cols: 9, hazards: 13 });
  });

  it('returns 22x22 with 80 hazards for depth 99', () => {
    expect(getLevelConfig(99)).toEqual({ rows: 22, cols: 22, hazards: 80 });
  });

  it('returns 24x24 for depth 100', () => {
    const config = getLevelConfig(100);
    expect(config.rows).toBe(24);
    expect(config.cols).toBe(24);
  });

  it('returns more hazards at depth 100 than depth 99', () => {
    expect(getLevelConfig(100).hazards).toBeGreaterThan(80);
  });

  it('caps hazard density at 17% for very deep runs', () => {
    const config = getLevelConfig(999);
    const maxHazards = Math.floor(config.rows * config.cols * 0.17);
    expect(config.hazards).toBeLessThanOrEqual(maxHazards);
  });
});
