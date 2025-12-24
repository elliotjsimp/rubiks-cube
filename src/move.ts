import type { Cube } from './cube';
import { rotateLayer } from './rotation';

// A type to represent Rubik's Cube moves.
// NOTE: Normally, the prime (counterclockwise) variant of a move is represented with a single quote, 
// as in "move up Face counterclockwise" <=> U', but the sub-p is better in code in our opinion.
export type CubeMove =
  | 'U'   | 'U_p'    // Up (clockwise), Up prime (counterclockwise)
  | 'D'   | 'D_p'    // Down, Down prime
  | 'L'   | 'L_p'    // Left, Left prime
  | 'R'   | 'R_p'    // Right, Right prime
  | 'F'   | 'F_p'    // Front, Front prime
  | 'B'   | 'B_p'    // Back, Back prime
  | 'M'   | 'M_p'    // Middle slice (between L/R, follows L)
  | 'E'   | 'E_p'    // Equator slice (between U/D, follows D)
  | 'S'   | 'S_p'    // Standing slice (between F/B, follows F)

// Array of possible moves (outer faces only for scrambling)
export const ALL_MOVES: readonly CubeMove[] = [
  'U', 'U_p',
  'D', 'D_p',
  'L', 'L_p',
  'R', 'R_p',
  'F', 'F_p',
  'B', 'B_p'
];

// Layer definition: axis index, layer position, and rotation direction
// axis: 0=X (left/right), 1=Y (back/front), 2=Z (down/up)
// layer: -1, 0, or 1
// theta: degrees (positive = CCW when looking from positive axis direction)
type LayerDef = { axis: 0 | 1 | 2; layer: -1 | 0 | 1; theta: number };

// Map from CubeMove to layer definition
// Directions follow standard cube notation conventions
export const MOVE_LAYER_MAP: Record<CubeMove, LayerDef> = {
    // Up/Down - Z axis (our coordinate system)
    'U':   { axis: 2, layer:  1, theta:  90 },
    'U_p': { axis: 2, layer:  1, theta: -90 },
    'D':   { axis: 2, layer: -1, theta: -90 },
    'D_p': { axis: 2, layer: -1, theta:  90 },
    
    // Left/Right - X axis
    'L':   { axis: 0, layer: -1, theta: -90 },
    'L_p': { axis: 0, layer: -1, theta:  90 },
    'R':   { axis: 0, layer:  1, theta:  90 },
    'R_p': { axis: 0, layer:  1, theta: -90 },
    
    // Front/Back - Y axis
    'F':   { axis: 1, layer:  1, theta:  90 },
    'F_p': { axis: 1, layer:  1, theta: -90 },
    'B':   { axis: 1, layer: -1, theta: -90 },
    'B_p': { axis: 1, layer: -1, theta:  90 },
    
    // Middle slices
    'M':   { axis: 0, layer:  0, theta: -90 },  // Follows L direction
    'M_p': { axis: 0, layer:  0, theta:  90 },
    'E':   { axis: 2, layer:  0, theta: -90 },  // Follows D direction
    'E_p': { axis: 2, layer:  0, theta:  90 },
    'S':   { axis: 1, layer:  0, theta:  90 },  // Follows F direction
    'S_p': { axis: 1, layer:  0, theta: -90 },
};

// Find CubeMove from axis, layer, and direction
export function findMove(axis: 0 | 1 | 2, layer: -1 | 0 | 1, clockwise: boolean): CubeMove {
    for (const [move, def] of Object.entries(MOVE_LAYER_MAP)) {
        if (def.axis === axis && def.layer === layer) {
            const isPositiveTheta = def.theta > 0;
            if (isPositiveTheta === clockwise) {
                return move as CubeMove;
            }
        }
    }
    // Fallback - shouldn't happen with valid inputs
    throw new Error(`No move found for axis=${axis}, layer=${layer}, clockwise=${clockwise}`);
}

// The function to handle performing a CubeMove
export function doMove(cube: Cube, cubeMove: CubeMove) {
    const { axis, layer, theta } = MOVE_LAYER_MAP[cubeMove];
    rotateLayer(cube, axis, layer, theta);
}