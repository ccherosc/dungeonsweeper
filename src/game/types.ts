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
export type AdventureDifficulty = 'easy' | 'hard';
export type Screen = 'menu' | 'playing' | 'dead';

export type GameState = {
  board: Tile[][];
  screen: Screen;
  mode: GameMode;
  adventureDifficulty: AdventureDifficulty;
  depth: number;
  hearts: number;
  flagsUsed: number;
  hazardCount: number;
  secondsElapsed: number;
  timerRunning: boolean;
  firstClickDone: boolean;
  showTransition: boolean;
  showDiceRoll: boolean;
  diceResult: number | null;
  lastRevealedCount: number | null;
  adventureLogText: string;
  deathQuip: string;
};

export type Action =
  | { type: 'START_GAME'; mode: GameMode; difficulty: AdventureDifficulty }
  | { type: 'TOGGLE_MODE' }
  | { type: 'REVEAL_TILE'; row: number; col: number }
  | { type: 'FLAG_TILE'; row: number; col: number }
  | { type: 'TICK' }
  | { type: 'TRANSITION_DONE' }
  | { type: 'DICE_ROLL_DONE' }
  | { type: 'RESTART' }
  | { type: 'GOTO_MENU' };
