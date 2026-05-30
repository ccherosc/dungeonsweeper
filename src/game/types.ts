export type TileState = 'hidden' | 'revealed' | 'flagged';

export type Tile = {
  row: number;
  col: number;
  isHazard: boolean;
  state: TileState;
  adjacentHazards: number;
  hazardVariant: 0 | 1 | 2 | 3 | 4;
};

export type GameMode = 'classic' | 'adventure';
export type Screen = 'menu' | 'playing' | 'dead';

export type GameState = {
  board: Tile[][];
  screen: Screen;
  mode: GameMode;
  depth: number;
  hearts: number;
  flagsUsed: number;
  hazardCount: number;
  secondsElapsed: number;
  timerRunning: boolean;
  firstClickDone: boolean;
  showTransition: boolean;
  lastRevealedCount: number | null;
  adventureLogText: string;
  deathQuip: string;
};

export type Action =
  | { type: 'START_GAME'; mode: GameMode }
  | { type: 'TOGGLE_MODE' }
  | { type: 'REVEAL_TILE'; row: number; col: number }
  | { type: 'FLAG_TILE'; row: number; col: number }
  | { type: 'TICK' }
  | { type: 'TRANSITION_DONE' }
  | { type: 'RESTART' }
  | { type: 'GOTO_MENU' };
