import { useReducer, useEffect, useRef } from 'react';
import { GameState, GameMode, AdventureDifficulty, Action } from './game/types';
import { getLevelConfig } from './game/depthScaling';
import { createBoard } from './game/createBoard';
import { placeHazards } from './game/placeHazards';
import { revealTile } from './game/revealTile';
import { flagTile } from './game/flagTile';
import { checkWin } from './game/checkWin';
import { DEATH_QUIPS, FLAVOR_TEXT } from './game/constants';
import MenuScreen from './components/MenuScreen';
import GameScreen from './components/GameScreen';
import DeadScreen from './components/DeadScreen';
import './styles/global.css';
import './styles/dungeon.css';

function getDeathQuip(depth: number): string {
  if (Math.random() < 0.2) return `Depth ${depth} was a perfectly reasonable place to die.`;
  return DEATH_QUIPS[Math.floor(Math.random() * DEATH_QUIPS.length)];
}

function pickFlavorText(count: number): string {
  const options = FLAVOR_TEXT[count] ?? FLAVOR_TEXT[0];
  return options[Math.floor(Math.random() * options.length)];
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function makeInitialPlayState(mode: GameMode, difficulty: AdventureDifficulty): GameState {
  const { rows, cols, hazards } = getLevelConfig(1);
  return {
    board: createBoard(rows, cols),
    screen: 'playing',
    mode,
    adventureDifficulty: difficulty,
    depth: 1,
    hearts: 3,
    flagsUsed: 0,
    hazardCount: hazards,
    secondsElapsed: 0,
    timerRunning: false,
    firstClickDone: false,
    showTransition: false,
    showDiceRoll: false,
    diceResult: null,
    lastRevealedCount: null,
    adventureLogText: 'The dungeon awaits. Choose your first room wisely.',
    deathQuip: '',
  };
}

const MENU_STATE: GameState = {
  board: [],
  screen: 'menu',
  mode: 'classic',
  adventureDifficulty: 'easy',
  depth: 1,
  hearts: 3,
  flagsUsed: 0,
  hazardCount: 0,
  secondsElapsed: 0,
  timerRunning: false,
  firstClickDone: false,
  showTransition: false,
  showDiceRoll: false,
  diceResult: null,
  lastRevealedCount: null,
  adventureLogText: '',
  deathQuip: '',
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return makeInitialPlayState(action.mode, action.difficulty);

    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'classic' ? 'adventure' : 'classic' };

    case 'REVEAL_TILE': {
      if (state.screen !== 'playing' || state.showTransition || state.showDiceRoll) return state;
      const { row, col } = action;
      if (state.board[row][col].state !== 'hidden') return state;

      let board = state.board;
      let firstClickDone = state.firstClickDone;
      let timerRunning = state.timerRunning;

      if (!firstClickDone) {
        board = placeHazards(board, state.hazardCount, row, col);
        firstClickDone = true;
        timerRunning = true;
      }

      const nextBoard = revealTile(board, row, col);
      const clickedTile = nextBoard[row][col];

      if (clickedTile.isHazard) {
        // Classic mode: instant death
        if (state.mode === 'classic') {
          return {
            ...state,
            board: nextBoard,
            screen: 'dead',
            timerRunning: false,
            firstClickDone,
            hearts: state.hearts - 1,
            deathQuip: getDeathQuip(state.depth),
          };
        }

        // Adventure Easy: dice rolls every hazard hit
        if (state.adventureDifficulty === 'easy') {
          return {
            ...state,
            board: nextBoard,
            firstClickDone,
            timerRunning,
            showDiceRoll: true,
            diceResult: rollD20(),
            adventureLogText: '⚔ A trap springs! The bones of fate are cast...',
          };
        }

        // Adventure Hard: lose 2 hearts instantly; dice only on last heart
        if (state.hearts > 1) {
          const newHearts = Math.max(0, state.hearts - 2);
          if (newHearts <= 0) {
            return {
              ...state,
              board: nextBoard,
              firstClickDone,
              timerRunning: false,
              screen: 'dead',
              hearts: 0,
              deathQuip: getDeathQuip(state.depth),
            };
          }
          return {
            ...state,
            board: nextBoard,
            firstClickDone,
            timerRunning,
            hearts: newHearts,
            adventureLogText: newHearts === 1
              ? '☠ One heart remains. Tread with extreme caution.'
              : 'A brutal blow. Two hearts lost.',
          };
        }

        // hearts === 1 in hard mode — last chance roll
        return {
          ...state,
          board: nextBoard,
          firstClickDone,
          timerRunning,
          showDiceRoll: true,
          diceResult: rollD20(),
          adventureLogText: '☠ YOUR FINAL HEART! The dice decide your fate!',
        };
      }

      const lastRevealedCount = clickedTile.adjacentHazards;
      const adventureLogText = pickFlavorText(lastRevealedCount);

      if (checkWin(nextBoard)) {
        return {
          ...state,
          board: nextBoard,
          firstClickDone,
          timerRunning,
          showTransition: true,
          depth: state.depth + 1,
          lastRevealedCount,
          adventureLogText,
        };
      }

      return { ...state, board: nextBoard, firstClickDone, timerRunning, lastRevealedCount, adventureLogText };
    }

    case 'FLAG_TILE': {
      if (state.screen !== 'playing' || state.showTransition || state.showDiceRoll) return state;
      if (state.board[action.row][action.col].state === 'revealed') return state;
      const nextBoard = flagTile(state.board, action.row, action.col);
      const delta = nextBoard[action.row][action.col].state === 'flagged' ? 1 : -1;
      return { ...state, board: nextBoard, flagsUsed: state.flagsUsed + delta };
    }

    case 'TICK':
      if (!state.timerRunning) return state;
      return { ...state, secondsElapsed: state.secondsElapsed + 1 };

    case 'DICE_ROLL_DONE': {
      const roll = state.diceResult ?? 1;

      if (state.adventureDifficulty === 'easy') {
        const newHearts = state.hearts - 1;
        const logText = roll === 20
          ? `Natural 20! ...The dungeon takes its toll anyway.`
          : roll === 1
          ? `Critical failure. The dungeon revels.`
          : `Rolled ${roll}. The dungeon draws its toll.`;
        if (newHearts <= 0) {
          return {
            ...state,
            showDiceRoll: false,
            diceResult: null,
            screen: 'dead',
            timerRunning: false,
            hearts: 0,
            deathQuip: getDeathQuip(state.depth),
            adventureLogText: logText,
          };
        }
        return { ...state, showDiceRoll: false, diceResult: null, hearts: newHearts, adventureLogText: logText };
      }

      // Hard mode last-heart saving throw
      if (roll >= 11) {
        return {
          ...state,
          showDiceRoll: false,
          diceResult: null,
          adventureLogText: `Rolled ${roll}! Fortune grants you mercy. Fight on.`,
        };
      }
      return {
        ...state,
        showDiceRoll: false,
        diceResult: null,
        screen: 'dead',
        timerRunning: false,
        hearts: 0,
        deathQuip: getDeathQuip(state.depth),
        adventureLogText: `Rolled ${roll}. The darkness claims you.`,
      };
    }

    case 'TRANSITION_DONE': {
      const { rows, cols, hazards } = getLevelConfig(state.depth);
      return {
        ...state,
        board: createBoard(rows, cols),
        hazardCount: hazards,
        flagsUsed: 0,
        firstClickDone: false,
        showTransition: false,
        lastRevealedCount: null,
        adventureLogText: 'A new floor. A new chance to die.',
      };
    }

    case 'RESTART':
      return makeInitialPlayState(state.mode, state.adventureDifficulty);

    case 'GOTO_MENU':
      return { ...MENU_STATE, mode: state.mode };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, MENU_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.timerRunning) {
      timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.timerRunning]);

  useEffect(() => {
    if (state.screen === 'dead') {
      const key = `dungeonsweeper_best_${state.mode}`;
      const prev = parseInt(localStorage.getItem(key) ?? '0', 10);
      if (state.depth > prev) localStorage.setItem(key, String(state.depth));
    }
  }, [state.screen, state.depth, state.mode]);

  if (state.screen === 'menu') return <MenuScreen mode={state.mode} dispatch={dispatch} />;
  if (state.screen === 'playing') return <GameScreen state={state} dispatch={dispatch} />;
  if (state.screen === 'dead') return <DeadScreen state={state} dispatch={dispatch} />;
  return null;
}
