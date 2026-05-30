import { useRef } from 'react';
import { Tile as TileType } from '../game/types';
import { NUMBER_SPRITES, HAZARD_SPRITES, TILE_SPRITES } from '../game/constants';

interface TileProps {
  tile: TileType;
  tileSize: number;
  tilesetTilePx: number;
  onReveal: () => void;
  onFlag: () => void;
}

function getSpritePos(tile: TileType, px: number): string {
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

  return `${-spriteCol * px}px ${-spriteRow * px}px`;
}

export default function Tile({ tile, tileSize, tilesetTilePx, onReveal, onFlag }: TileProps) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMovedRef = useRef(false);

  const handleTouchStart = () => {
    touchMovedRef.current = false;
    longPressRef.current = setTimeout(() => {
      if (!touchMovedRef.current) onFlag();
    }, 500);
  };

  const clearLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleTouchMove = () => {
    touchMovedRef.current = true;
    clearLongPress();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchMovedRef.current && longPressRef.current) {
      clearLongPress();
      if (tile.state === 'hidden') onReveal();
    } else {
      clearLongPress();
    }
    e.preventDefault();
  };

  const sheetPx = tilesetTilePx * 4;

  return (
    <div
      className={`tile ${tile.state}`}
      style={{
        width: tileSize,
        height: tileSize,
        backgroundPosition: getSpritePos(tile, tilesetTilePx),
        backgroundSize: `${sheetPx}px ${sheetPx}px`,
      }}
      onClick={() => { if (tile.state === 'hidden') onReveal(); }}
      onContextMenu={e => { e.preventDefault(); onFlag(); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
