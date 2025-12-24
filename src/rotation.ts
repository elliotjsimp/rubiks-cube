import { Cube } from './cube';
import { Cubie } from './cubie';
import type { Vec3 } from './cubie';
import * as math from 'mathjs';

// Axis unit vectors in logical coordinate system (x=right, y=front, z=up)
const AXIS_VECTORS: Vec3[] = [
    [1, 0, 0],  // X axis
    [0, 1, 0],  // Y axis  
    [0, 0, 1],  // Z axis
];

// Function to handle rotating a layer of the Cube, given theta (a multiple of 90).
// axis: 0=X, 1=Y, 2=Z
// layer: -1, 0, or 1 (position along the axis)
export function rotateLayer(cube: Cube, axis: 0 | 1 | 2, layer: -1 | 0 | 1, theta: number) {
    if (theta % 90 !== 0) {
        throw new Error(`The angle ${theta} is not a multiple of 90 degrees!`);
    }
    
    const axisVec: Vec3 = AXIS_VECTORS[axis];
    
    // Get cubies in this layer
    const cubiesInLayer = getCubiesInLayer(cube, axis, layer);
    
    // Convert degrees to radians for mathjs
    const radians = theta * Math.PI / 180;
    
    // Calculate the rotation matrix
    const R: math.Matrix = math.rotationMatrix(radians, math.matrix(axisVec));

    for (const cubie of cubiesInLayer) {
        // Update rotation matrix of each Cubie
        cubie.rotation = math.multiply(R, cubie.rotation);
        
        // Update position
        const rotatedPosMatrix: math.Matrix = math.multiply(R, cubie.position);
        const rotatedPosArray = rotatedPosMatrix.toArray().flat();
        
        // Update with final position, round to handle floating point
        cubie.position = rotatedPosArray.map(
            coord => Math.round(Number(coord))
        ) as Vec3;
    }
}

// Helper function to get cubies in a specific layer
function getCubiesInLayer(cube: Cube, axis: number, layer: number): Cubie[] {
    if (cube.cubies.length !== 26) {
        throw new Error(`Cube doesn't have 26 Cubies, it has ${cube.cubies.length} Cubies!`);
    }

    const cubiesInLayer = cube.cubies.filter(
        cubie => cubie.position[axis] === layer
    );

    // Outer layers have 9 cubies, middle layers have 8 (no center-center)
    const expectedCount = layer === 0 ? 8 : 9;
    if (cubiesInLayer.length !== expectedCount) {
        throw new Error(`Layer has wrong number of cubies! Expected ${expectedCount}, got ${cubiesInLayer.length}`);
    }

    return cubiesInLayer;
}