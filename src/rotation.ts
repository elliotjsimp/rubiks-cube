import { Cube } from './cube';
import { Cubie } from './cubie';
import type { Face, Vec3 } from './cubie';
import { FACE_UNITVEC_MAP, FACE_AXIS_INDEX_MAP} from './face-utils';
import * as math from 'mathjs';

// Function to handle rotating a Face of the Cube, given theta (a multiple of 90).
export function rotateFace(cube: Cube, face: Face, theta: number) {
    // theta is relative to the CubeMove, i.e. the Face itself. See file move.ts
    if (theta % 90 != 0) throw new Error(`The angle ${theta} is not a multiple of 90 degrees!`);
    
    const faceIndex: number = FACE_AXIS_INDEX_MAP[face];
    const faceUnitVec: Vec3 = FACE_UNITVEC_MAP[face];
    const faceSign: number = faceUnitVec[faceIndex]; // -1 or 1

    if (faceSign === 0) throw new Error(`faceSign === 0, which doesn't make sense! 
        faceIndex = ${faceIndex}, faceUnitVec = ${faceUnitVec}`);

    // Don't need to (potentially) negate theta, math.rotationMatrix handles negative axis.
    
    // The cubies to be rotated
    const cubiesOfFace: Cubie[] = getCubiesOfFace(cube, faceIndex, faceSign);
    // Convert degrees to radians for mathjs
    const radians = theta * Math.PI / 180;
    // Calculate the new rotation matrix based on radians
    const R: math.Matrix = math.rotationMatrix(radians, math.matrix(faceUnitVec));

    for (const cubie of cubiesOfFace) {
        // Update rotation matrix of each Cubie
        cubie.rotation = math.multiply(R, cubie.rotation);
        // Update position
        const rotatedPosMatrix: math.Matrix = math.multiply(R, cubie.position);
        // Convert to array
        const rotatedPosArray = rotatedPosMatrix.toArray().flat();
        // Update with final position, round just in case
        cubie.position = rotatedPosArray.map(
            coord => Math.round(Number(coord))
        ) as Vec3;
    }
}

// Helper function to construct array of relevant cubies
function getCubiesOfFace(cube: Cube, faceIndex: number, faceSign: number): Cubie[] {
    // There are 26 Cubies on a 3^3 Cube
    if (cube.cubies.length !== 26) {
        throw new Error(`Cube doesn't have 26 Cubies, it has ${cube.cubies.length} Cubies!`);
    }

    const cubiesOfFace: Cubie[] = cube.cubies.filter(
        cubie => cubie.position[faceIndex] === faceSign
    );

    // A Face has 9 Cubies
    if (cubiesOfFace.length != 9) {
        throw new Error(`cubiesOfFace array is the wrong size! It has ${cubiesOfFace.length} Cubies.`);
    }

    return cubiesOfFace;
}