import { useEffect, Dispatch } from 'react';
import { Action } from '../game/types';

interface LevelTransitionProps {
  depth: number;
  dispatch: Dispatch<Action>;
}

export default function LevelTransition({ depth, dispatch }: LevelTransitionProps) {
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'TRANSITION_DONE' }), 1200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <div className="transition-overlay">
      <div className="transition-text">⬇ DESCENDING…</div>
      <div className="transition-depth">Depth {depth}</div>
    </div>
  );
}
