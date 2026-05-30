import { Dispatch } from 'react';
import { GameState, Action } from '../game/types';

interface DeadScreenProps {
  state: GameState;
  dispatch: Dispatch<Action>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function DeadScreen({ state, dispatch }: DeadScreenProps) {
  const { depth, secondsElapsed, deathQuip, mode, hearts } = state;

  return (
    <div className="screen">
      <div className="splash-bg tint-red" />

      <div className="dead-panel">
        <div className="dead-skull">☠</div>
        <div className="dead-title">YOUR PARTY FALLS</div>

        <div className="dead-quip">"{deathQuip}"</div>

        {mode === 'adventure' && (
          <div className="dead-hearts">
            {[0, 1, 2].map(i => (
              <span key={i} className={i < hearts ? 'heart-full' : 'heart-empty'}>
                {i < hearts ? '♥' : '♡'}
              </span>
            ))}
          </div>
        )}

        <div className="dead-stats">
          Depth {depth} · {formatTime(secondsElapsed)}
        </div>

        <button
          className="btn-danger"
          onClick={() => dispatch({ type: 'RESTART' })}
        >
          ⚔ Descend Again
        </button>

        <button
          className="btn-secondary"
          onClick={() => dispatch({ type: 'GOTO_MENU' })}
        >
          ← Main Menu
        </button>
      </div>
    </div>
  );
}
