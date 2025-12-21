import type { Vec3, Face } from './cubie'
import * as math from 'mathjs';

// Map from Face to unit vector
// NOTE: I feel like I might have 1 or 2 too many "FACE_[to something]" maps in my project...
// Maybe I could consolidate some?
// Although, it isn't like there is a milion values in each or anything...
const FACE_UNITVEC_MAP: Record<Face, Vec3>  = {
    up:    [0,0,1],
    down:  [0,0,-1],
    left:  [-1,0,0],
    right: [1,0,0],
    back:  [0,-1,0],
    front: [0,1,0]
}

// Initialize the reversed map
const UNITVEC_FACE_MAP: Record<string, Face> = {};

// Assemble the reversed map for use at the end of the getLocalFace function
for (const [face, vec] of Object.entries(FACE_UNITVEC_MAP) as [Face, Vec3][]) {
    UNITVEC_FACE_MAP[JSON.stringify(vec)] = face;
}

// Given a Cubie's rotation matrix (relative to solved state) and a global Cube face,
// this function computes which local face of the Cubie occupies that Cube face.
// This lets us look up the correct face color for visualization.
// Currently only used in print-cube.ts (2D tester visualization)
export function getLocalFace(rotation: math.Matrix, globalFace: Face): Face {

    // Inverse rotation matrix is transpose of Cubie's rotation matrix 
    const RInv = math.transpose(rotation);

    // The Face that we are trying to find the 2D representation of, as a unit vector
    const globalVec: Vec3 = FACE_UNITVEC_MAP[globalFace];

    // The equivalent local unit vector of the Cubie
    const localDir: math.Matrix = math.multiply(RInv, globalVec);

    // Convert back to Vec3, round to avoid potential float arith. errors
    const localVec: Vec3 = [
        Math.round(localDir.get([0])),
        Math.round(localDir.get([1])),
        Math.round(localDir.get([2]))
    ];

    const face: Face = UNITVEC_FACE_MAP[JSON.stringify(localVec)];
    if (face) return face;

    throw new Error(`Face was not found with unit vector ${localVec}`)
}

