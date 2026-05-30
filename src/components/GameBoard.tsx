import { Dispatch } from 'react';
import { Tile as TileType, Action } from '../game/types';
import TileComponent from './Tile';

interface GameBoardProps {
  board: TileType[][];
  dispatch: Dispatch<Action>;
  disabled?: boolean;
}

const TILE_DISPLAY_SIZE = 48;
const TILESET_TILE_PX = 313.5; // 1254px / 4 tiles = 313.5 exactly

export default function GameBoard({ board, dispatch, disabled = false }: GameBoardProps) {
  if (board.length === 0) return null;
  const cols = board[0].length;

  return (
    <div
      className="game-board"
      style={{ gridTemplateColumns: `repeat(${cols}, ${TILE_DISPLAY_SIZE}px)` }}
    >
      {board.flat().map(tile => (
        <TileComponent
          key={`${tile.row}-${tile.col}`}
          tile={tile}
          tileSize={TILE_DISPLAY_SIZE}
          tilesetTilePx={TILESET_TILE_PX}
          onReveal={() => {
            if (!disabled) dispatch({ type: 'REVEAL_TILE', row: tile.row, col: tile.col });
          }}
          onFlag={() => {
            if (!disabled) dispatch({ type: 'FLAG_TILE', row: tile.row, col: tile.col });
          }}
        />
      ))}
    </div>
  );
}
