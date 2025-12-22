import type { Color } from './cubie.ts';

// Color mapping from Color type to hex colors
export const COLOR_HEX_MAP: Record<Color, number> = {
  'orange': 0xFF6B00,
  'red':    0xB90000,
  'blue':   0x0045AD,
  'green':  0x009B48,
  'yellow': 0xFFD500,
  'white':  0xFFFFFF
};

// Cubie sizing constants
// NOTE: Numbers kind of magic: arrived at by fiddling with them. Probably will change more.
export const CUBIE_SIZE = 0.999;     // Size of a black Cubie itself
export const CUBIE_RADIUS = 0.08;    // Corner radius for rounded cubie body
export const CUBIE_SEGMENTS = 3;     // Smoothness of cubie corners (higher = smoother)
export const STICKER_SIZE = 0.82;    // Size of the colored stickers, less than CUBIE_SIZE so "border"
export const STICKER_RADIUS = 0.12;  // Corner radius for rounded stickers
export const STICKER_OFFSET = 0.5;   // Distance from cubie center to sticker
// NOTE: This is cool to adjust, could make a slider for it or something.
export const CUBIE_SPACING = 1; // Spacing between cubies