import { useEffect, useRef, useState, Dispatch } from 'react';
import { Action, AdventureDifficulty } from '../game/types';

interface DiceRollProps {
  finalResult: number;
  difficulty: AdventureDifficulty;
  dispatch: Dispatch<Action>;
}

function getDiceFlavor(roll: number, difficulty: AdventureDifficulty): string {
  if (difficulty === 'hard') {
    if (roll === 20) return 'Natural 20! The gods themselves intervene!';
    if (roll >= 11) return `${roll} — Fortune grants you mercy. You survive.`;
    if (roll === 1) return 'Critical failure. The dungeon feasts tonight.';
    return `${roll} — The dice have spoken. Darkness takes you.`;
  }
  if (roll === 20) return 'Natural 20! ...The dungeon takes its toll anyway.';
  if (roll === 1) return 'Critical failure. The sting is expected.';
  if (roll >= 15) return `${roll} — A brave roll. The hazard leaves its mark.`;
  if (roll >= 8) return `${roll} — The dungeon draws what it is owed.`;
  return `${roll} — The bones are unkind.`;
}

export default function DiceRoll({ finalResult, difficulty, dispatch }: DiceRollProps) {
  const [displayed, setDisplayed] = useState<number>(() => Math.floor(Math.random() * 20) + 1);
  const [settled, setSettled] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let delay = 55;
    const totalRollTime = 1800;
    let elapsed = 0;

    function step() {
      elapsed += delay;
      if (elapsed < totalRollTime) {
        setDisplayed(Math.floor(Math.random() * 20) + 1);
        delay = Math.min(delay * 1.075, 380);
        timeoutRef.current = setTimeout(step, delay);
      } else {
        setDisplayed(finalResult);
        setSettled(true);
        timeoutRef.current = setTimeout(() => {
          dispatch({ type: 'DICE_ROLL_DONE' });
        }, 1100);
      }
    }

    timeoutRef.current = setTimeout(step, delay);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [finalResult, dispatch]);

  const isSave = difficulty === 'hard' && settled && finalResult >= 11;
  const isDoom = difficulty === 'hard' && settled && finalResult < 11;

  let numberClass = 'dice-number';
  if (isSave) numberClass += ' dice-saved';
  else if (isDoom) numberClass += ' dice-doomed';
  if (settled) numberClass += ' dice-settled';

  let statusText = settled ? 'YOU ROLLED' : 'ROLLING...';
  if (isSave) statusText = finalResult === 20 ? '✦ NATURAL 20! ✦' : '✦ FATE SPARED YOU ✦';
  else if (isDoom) statusText = finalResult === 1 ? '✦ CRITICAL FAILURE ✦' : '✦ YOUR FATE IS SEALED ✦';

  let statusClass = 'dice-status';
  if (isSave) statusClass += ' dice-status-save';
  else if (isDoom) statusClass += ' dice-status-doom';

  return (
    <div className="dice-overlay">
      <div className="dice-container">
        <div className={statusClass}>{statusText}</div>

        <div className={`dice-image-wrap ${settled ? 'dice-wrap-settled' : 'dice-wrap-rolling'}`}>
          <img
            src="/assets/images/dsweeperdice.png"
            className="dice-img"
            alt="D20 die"
            draggable={false}
          />
          <div className={numberClass}>{displayed}</div>
        </div>

        <div className={`dice-flavor ${settled ? 'dice-flavor-visible' : ''}`}>
          {settled ? getDiceFlavor(finalResult, difficulty) : ' '}
        </div>
      </div>
    </div>
  );
}
