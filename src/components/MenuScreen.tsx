import { Dispatch, useState } from 'react';
import { Action, GameMode } from '../game/types';
import HowToPlayModal from './HowToPlayModal';

interface MenuScreenProps {
  mode: GameMode;
  dispatch: Dispatch<Action>;
}

export default function MenuScreen({ mode, dispatch }: MenuScreenProps) {
  const [showHelp, setShowHelp] = useState(false);

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

        <button
          className="btn-descend"
          onClick={() => dispatch({ type: 'START_GAME', mode })}
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
