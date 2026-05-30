import { Dispatch, useState } from 'react';
import { Action, GameMode, AdventureDifficulty } from '../game/types';
import HowToPlayModal from './HowToPlayModal';

interface MenuScreenProps {
  mode: GameMode;
  dispatch: Dispatch<Action>;
}

export default function MenuScreen({ mode, dispatch }: MenuScreenProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [difficulty, setDifficulty] = useState<AdventureDifficulty>('easy');

  const bestDepth = parseInt(
    localStorage.getItem(`dungeonsweeper_best_${mode}`) ?? '0',
    10
  );

  return (
    <div className="screen">
      <div className="splash-bg" />

      <div className="menu-panel">
        <div className="menu-title">DUNGEONSWEEPER</div>
        <div className="menu-subtitle">⬥ How Deep Can You Go? ⬥</div>

        <div className="menu-best">
          {bestDepth > 0 ? `Your Record: Depth ${bestDepth}` : ''}
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'classic' ? 'active classic' : ''}`}
            onClick={() => { if (mode !== 'classic') dispatch({ type: 'TOGGLE_MODE' }); }}
          >
            ☠ Classic
          </button>
          <button
            className={`mode-btn ${mode === 'adventure' ? 'active adventure' : ''}`}
            onClick={() => { if (mode !== 'adventure') dispatch({ type: 'TOGGLE_MODE' }); }}
          >
            ♡ Adventure
          </button>
        </div>

        {mode === 'adventure' && (
          <div className="difficulty-section">
            <div className="difficulty-label">⚄ DIFFICULTY</div>
            <div className="difficulty-toggle">
              <button
                className={`diff-btn ${difficulty === 'easy' ? 'active diff-easy' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                ⚄ Easy
              </button>
              <button
                className={`diff-btn ${difficulty === 'hard' ? 'active diff-hard' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                ☠ Hard
              </button>
            </div>
            <div className="difficulty-desc">
              {difficulty === 'easy'
                ? '3 hearts · Dice rolls on every hazard'
                : '3 hearts · 2 lost per hazard · Dice on final heart'}
            </div>
          </div>
        )}

        <button
          className="btn-descend"
          onClick={() => dispatch({ type: 'START_GAME', mode, difficulty: mode === 'adventure' ? difficulty : 'easy' })}
        >
          ⚔ Descend Into The Dungeon
        </button>

        <button className="btn-secondary" onClick={() => setShowHelp(true)}>
          ? How to Play
        </button>
      </div>

      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
