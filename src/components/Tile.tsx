import { useRef } from 'react';
import { Tile as TileType } from '../game/types';
import { NUMBER_SPRITES, HAZARD_SPRITES, TILE_SPRITES } from '../game/constants';

interface TileProps {
  tile: TileType;
  flagMode: boolean;
  onReveal: () => void;
  onFlag: () => void;
}

function getSpritePos(tile: TileType): string {
  let [spriteRow, spriteCol]: [number, number] = [0, 0];

  if (tile.state === 'hidden') {
    [spriteRow, spriteCol] = TILE_SPRITES.hidden;
  } else if (tile.state === 'flagged') {
    [spriteRow, spriteCol] = TILE_SPRITES.flag;
  } else if (tile.isHazard) {
    [spriteRow, spriteCol] = HAZARD_SPRITES[tile.hazardVariant];
  } else if (tile.adjacentHazards === 0) {
    [spriteRow, spriteCol] = TILE_SPRITES.empty;
  } else {
    [spriteRow, spriteCol] = NUMBER_SPRITES[tile.adjacentHazards - 1];
  }

  const x = spriteCol === 0 ? '0px' : `calc(${-spriteCol} * var(--tile-size))`;
  const y = spriteRow === 0 ? '0px' : `calc(${-spriteRow} * var(--tile-size))`;
  return `${x} ${y}`;
}

export default function Tile({ tile, flagMode, onReveal, onFlag }: TileProps) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMovedRef = useRef(false);

  const clearLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleTouchStart = () => {
    touchMovedRef.current = false;
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null; // self-clear so touchEnd knows it fired
      if (!touchMovedRef.current) onFlag();
    }, 500);
  };

  const handleTouchMove = () => {
    touchMovedRef.current = true;
    clearLongPress();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchMovedRef.current) { clearLongPress(); return; }
    if (longPressRef.current !== null) {
      // Timer hasn't fired yet = quick tap
      clearLongPress();
      if (flagMode) {
        onFlag();
      } else if (tile.state === 'hidden') {
        onReveal();
      }
    }
    // If null: long press already fired and flagged — do nothing
  };

  const handleClick = () => {
    if (flagMode) {
      onFlag();
    } else if (tile.state === 'hidden') {
      onReveal();
    }
  };

  return (
    <div
      className={`tile ${tile.state}`}
      style={{ backgroundPosition: getSpritePos(tile) }}
      onClick={handleClick}
      onContextMenu={e => { e.preventDefault(); onFlag(); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
