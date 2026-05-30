import { Dispatch } from 'react';
import { Tile as TileType, Action } from '../game/types';
import TileComponent from './Tile';

interface GameBoardProps {
  board: TileType[][];
  dispatch: Dispatch<Action>;
  disabled?: boolean;
}

export default function GameBoard({ board, dispatch, disabled = false }: GameBoardProps) {
  if (board.length === 0) return null;
  const cols = board[0].length;

  return (
    <div
      className="game-board"
      style={{ gridTemplateColumns: `repeat(${cols}, var(--tile-size))` }}
    >
      {board.flat().map(tile => (
        <TileComponent
          key={`${tile.row}-${tile.col}`}
          tile={tile}
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
