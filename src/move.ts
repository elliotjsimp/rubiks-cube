import type { Face } from './cubie';
import type { Cube } from './cube';
import { rotateFace } from './rotation';

// A type to represent Rubik's Cube moves.
// NOTE: Normally, the prime (counterclockwise) variant of a move is represented with a single quote, 
// as in "move up Face counterclockwise" <=> U', but the sub-p is better in code in my opinion.
export type CubeMove =
  | 'U'   | 'U_p'    // Up (clockwise), Up prime (counterclockwise)
  | 'D'   | 'D_p'    // Down, Down prime
  | 'L'   | 'L_p'    // Left, Left prime
  | 'R'   | 'R_p'    // Right, Right prime
  | 'F'   | 'F_p'    // Front, Front prime
  | 'B'   | 'B_p'    // Back, Back prime

// Map from CubeMove to Face
// NOTE: This feels a bit silly...
const CUBEMOVE_FACE_MAP: Record<CubeMove, Face> = {
    U: 'up',
    U_p: 'up',
    D: 'down',
    D_p: 'down',
    L: 'left',
    L_p: 'left',
    R: 'right',
    R_p: 'right',
    F: 'front',
    F_p: 'front',
    B: 'back',
    B_p: 'back'
}

function degreeOfMove(cubeMove: CubeMove): number {
    // CubeMove degrees is Face relative
    return cubeMove.endsWith('p') ? -90 : 90;
}

// The function to handle performing a CubeMove
export function doMove(cube: Cube, cubeMove: CubeMove) {
    const face: Face = CUBEMOVE_FACE_MAP[cubeMove];
    const theta: number = degreeOfMove(cubeMove);
    rotateFace(cube, face, theta);
}