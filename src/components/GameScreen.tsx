import { Dispatch, useState } from 'react';
import { GameState, Action } from '../game/types';
import GameBoard from './GameBoard';
import LevelTransition from './LevelTransition';
import DiceRoll from './DiceRoll';

interface GameScreenProps {
  state: GameState;
  dispatch: Dispatch<Action>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function GameScreen({ state, dispatch }: GameScreenProps) {
  const { board, depth, mode, adventureDifficulty, hearts, hazardCount, flagsUsed, secondsElapsed, showTransition, showDiceRoll, diceResult, adventureLogText } = state;
  const [flagMode, setFlagMode] = useState(false);
  const torchesLeft = hazardCount - flagsUsed;

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="header-stat">
          <span className="header-label">Depth</span>
          <span className="header-value">{String(depth).padStart(3, '0')}</span>
        </div>

        {mode === 'adventure' && (
          <div className="hearts">
            {[0, 1, 2].map(i => (
              <span key={i} className={i < hearts ? 'heart-full' : 'heart-empty'}>
                {i < hearts ? '♥' : '♡'}
              </span>
            ))}
          </div>
        )}

        <button
          className="hero-btn"
          title="New Dungeon"
          onClick={() => dispatch({ type: 'RESTART' })}
        >
          🧙
        </button>

        <button
          className={`flag-mode-btn${flagMode ? ' active' : ''}`}
          title={flagMode ? 'Flag mode — tap to plant torch' : 'Explore mode — tap to reveal'}
          onClick={() => setFlagMode(f => !f)}
          aria-pressed={flagMode}
        >
          🚩
        </button>

        <div className="header-stat">
          <span className="header-label">Torches</span>
          <span className="header-value">{torchesLeft}</span>
        </div>

        <div className="header-stat">
          <span className="header-label">Time</span>
          <span className="header-value">{formatTime(secondsElapsed)}</span>
        </div>
      </div>

      <div className="board-wrapper">
        <GameBoard board={board} dispatch={dispatch} disabled={showTransition} flagMode={flagMode} />
        <div className="adventure-log">{adventureLogText}</div>
      </div>

      {showTransition && <LevelTransition depth={depth} dispatch={dispatch} />}
      {showDiceRoll && diceResult !== null && (
        <DiceRoll finalResult={diceResult} difficulty={adventureDifficulty} dispatch={dispatch} />
      )}
    </div>
  );
}
