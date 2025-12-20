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

// Given a Cubie's current orientation (as [x, y, z] rotation angles from solved state),
// and a Cube relative (global) Face (e.g. 'front', 'up'), 
// this function computes which local Face of the Cubie currently occupies that Cube face.
// This lets us look up the correct color for visualization in print-cube.ts.
// In other words: "Which face of this Cubie is showing on this global Cube face after applying the Cubie's orientation?"

// TODO: Refactor function, after refactoring Cubie class to use rotation matrix directly instead of orientation: Vec3
// We need to do this to properly calculate inverse matrix (right now, we wrongly assume that moves follow sequence x, y, z,
// and then stop I suppose... will fix tomorrow!)
export function getLocalFace(orientation: Vec3, globalFace: Face): Face {
    const [rx, ry, rz] = orientation;

    // TODO: We will delete these individual computations in favor of
    // the transpose (inverse) of the cubie.rotation matrix field (replacing the orientation field)

    // Inverse rotation matrix about the x-axis
    const RxInv = math.matrix([
        [1, 0, 0],
        [0, Math.cos(-rx), -Math.sin(-rx)],
        [0, Math.sin(-rx), Math.cos(-rx)]
    ]);

    // About the y-axis
    const RyInv = math.matrix([
        [Math.cos(-ry), 0, Math.sin(-ry)],
        [0, 1, 0],
        [-Math.sin(-ry), 0, Math.cos(-ry)]
    ]);

    // About the z-axis
    const RzInv = math.matrix([
        [Math.cos(-rz), -Math.sin(-rz), 0],
        [Math.sin(-rz), Math.cos(-rz), 0],
        [0, 0, 1]
    ]);
    
    // TODO: Delete this.
    // Final inverse rotation matrix: sequentially apply inverse rotations Z, Y, then X (rotation order ZYX)
    // R_inv = RxInv * RyInv * RzInv (right-to-left: Rz, then Ry, then Rx)
    const RInv = math.multiply(math.multiply(RxInv, RyInv), RzInv);

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

    return UNITVEC_FACE_MAP[JSON.stringify(localVec)];

    // throw new Error('No matching face found!');
}

