import { DEPTH_LEVELS, MAX_DEPTH_GRID, MAX_HAZARD_DENSITY } from './constants';

export type LevelConfig = { rows: number; cols: number; hazards: number };

export function getLevelConfig(depth: number): LevelConfig {
  const level = DEPTH_LEVELS.find(l => depth >= l.minDepth && depth <= l.maxDepth);
  if (level) {
    return { rows: level.rows, cols: level.cols, hazards: level.hazards };
  }
  const { rows, cols } = MAX_DEPTH_GRID;
  const hazards = Math.min(
    Math.floor(depth * 0.9),
    Math.floor(rows * cols * MAX_HAZARD_DENSITY)
  );
  return { rows, cols, hazards };
}
