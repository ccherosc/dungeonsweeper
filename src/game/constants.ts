export const DEPTH_LEVELS = [
  { minDepth: 1,  maxDepth: 5,  cols: 8,  rows: 8,  hazards: 10 },
  { minDepth: 6,  maxDepth: 10, cols: 9,  rows: 9,  hazards: 13 },
  { minDepth: 11, maxDepth: 15, cols: 10, rows: 10, hazards: 16 },
  { minDepth: 16, maxDepth: 20, cols: 11, rows: 11, hazards: 20 },
  { minDepth: 21, maxDepth: 30, cols: 12, rows: 12, hazards: 25 },
  { minDepth: 31, maxDepth: 40, cols: 14, rows: 14, hazards: 32 },
  { minDepth: 41, maxDepth: 50, cols: 16, rows: 16, hazards: 42 },
  { minDepth: 51, maxDepth: 65, cols: 18, rows: 18, hazards: 55 },
  { minDepth: 66, maxDepth: 80, cols: 20, rows: 20, hazards: 68 },
  { minDepth: 81, maxDepth: 99, cols: 22, rows: 22, hazards: 80 },
] as const;

export const MAX_DEPTH_GRID = { cols: 24, rows: 24 };
export const MAX_HAZARD_DENSITY = 0.17;

export const FLAVOR_TEXT: Record<number, string[]> = {
  0: [
    'The hallway is quiet. Almost too quiet.',
    'Nothing stirs. A good sign. Probably.',
    'Safe passage. For now.',
  ],
  1: [
    'Faint scratch marks on the stone.',
    'Something was here. Recently.',
    'One candle flickers in the draft.',
  ],
  2: [
    'A cold draft from somewhere close.',
    "Two sets of tracks. Neither returning.",
    'The torchlight dims.',
  ],
  3: [
    'Distant growl. Getting louder.',
    'Three shadows move beyond the wall.',
    'Claw marks. Deep ones.',
  ],
  4: [
    'Blood on the stone. Fresh.',
    'Four choices. None of them good.',
    'Something breathes nearby.',
  ],
  5: [
    'Arcane buzzing fills the air.',
    'Five runes glow faintly on the floor.',
    'The air smells of sulphur.',
  ],
  6: [
    'Bones. Many bones. Very recent.',
    'Six paths lead here. None lead out.',
    'The dungeon is watching.',
  ],
  7: [
    'Ominous chanting from all directions.',
    'Seven curses stacked on one tile.',
    'The walls are closing. Slowly.',
  ],
  8: [
    'Certain death is nearby. Several deaths.',
    'Eight threats. You knew this entering.',
    'The dungeon smiles. It has teeth.',
  ],
};

export const DEATH_QUIPS = [
  'You stepped on a suspiciously obvious rune.',
  'A mimic appreciates your curiosity.',
  'The dungeon remains undefeated.',
  'Your party has decided to retire.',
  'The bard is already telling this story as a cautionary tale.',
  "You have been added to the dungeon's trophy collection.",
  'Next time, maybe avoid the glowing floor tile.',
];

// Sprite positions [row, col] in tileset.png (4×4 grid)
export const TILE_SPRITES = {
  hidden:  [0, 0] as [number, number],
  empty:   [0, 1] as [number, number],
  n1:      [0, 2] as [number, number],
  n2:      [0, 3] as [number, number],
  n3:      [1, 0] as [number, number],
  n4:      [1, 1] as [number, number],
  n5:      [1, 2] as [number, number],
  n6:      [1, 3] as [number, number],
  n7:      [2, 0] as [number, number],
  n8:      [2, 1] as [number, number],
  flag:    [2, 2] as [number, number],
  hazard0: [2, 3] as [number, number],
  hazard1: [3, 0] as [number, number],
  hazard2: [3, 1] as [number, number],
  hazard3: [3, 2] as [number, number],
  hazard4: [3, 3] as [number, number],
};

export const NUMBER_SPRITES = [
  TILE_SPRITES.n1,
  TILE_SPRITES.n2,
  TILE_SPRITES.n3,
  TILE_SPRITES.n4,
  TILE_SPRITES.n5,
  TILE_SPRITES.n6,
  TILE_SPRITES.n7,
  TILE_SPRITES.n8,
] as [number, number][];

export const HAZARD_SPRITES = [
  TILE_SPRITES.hazard0,
  TILE_SPRITES.hazard1,
  TILE_SPRITES.hazard2,
  TILE_SPRITES.hazard3,
  TILE_SPRITES.hazard4,
] as [number, number][];
