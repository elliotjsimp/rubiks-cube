import { Cube } from './cube';
import { Cubie } from './cubie';
import type { Face, Color, Vec3 } from './cubie';
import { getLocalFace } from './inverse-rotation';
import * as math from 'mathjs';

// Map to go from 2D unwrapped position on a face to 3D position
const FACE_POSITION_MAP: Record<Face, (row: number, col: number) => Vec3> = {
    up:    (r, c) => [c - 1, r - 1, 1],
    down:  (r, c) => [c - 1, -(r - 1), -1],
    left:  (r, c) => [-1, c - 1, -(r - 1)],
    right: (r, c) => [1, -(c - 1), -(r - 1)],
    front: (r, c) => [c - 1, 1, -(r - 1)],
    back:  (r, c) => [-(c - 1), -1, -(r - 1)],
};

// Function to print 2D representation of 3D Cube.
// NOTE: Fixed inverse-rotation.ts and cubie.ts to use cubie.rotation (rotation matrix),
// so now should work with any Cube state...
export function printCube(cube: Cube) {
    const cubeGrid: string[][][] = getCubeGrid(cube);
    // Face indices: 0=up, 1=left, 2=front, 3=right, 4=back, 5=down
    // e.g., cubeGrid[0] is up face.
    
    // Print Row 1: up face, with padding
    for (let row = 0; row < 3; row++) {
        let rowStr = "       "; // Left padding, 7 spaces
        for (let col = 0; col < 3; col++) {
            // First letter of Color of up face tile at row, col
            const letter = cubeGrid[0][row][col][0].toUpperCase();
            rowStr += letter + " ";
        }
        console.log(rowStr);
    }
    
    // Print Row 2: left, front, right, back (side-by-side)
    for (let row = 0; row < 3; row++) {
        let rowStr = ""; // No left padding
        const middleFaces: number[] = [1, 2, 3, 4];  // left, front, right, back
        
        for (let faceId of middleFaces) {
            for (let col = 0; col < 3; col++) {
                // First letter of Color of faceId face tile at row, col
                const letter = cubeGrid[faceId][row][col][0].toUpperCase();
                rowStr += letter;
                // Add space after tile (except last tile of face)
                if (col < 2) {
                    rowStr += " ";
                }
            }
            // Add spacing between faces
            if (faceId !== 4) {
                rowStr += "  ";
            }
        }
        console.log(rowStr);
    }
    
    // Print Row 3: down face, with padding
    for (let row = 0; row < 3; row++) {
        let rowStr = "       "; // Left padding
        for (let col = 0; col < 3; col++) {
            // First letter of Color of down face tile at row, col
            const letter = cubeGrid[5][row][col][0].toUpperCase();
            rowStr += letter + " ";
        }
        console.log(rowStr);
    }
}

// Helper function to get a 2D representation of 3D cube in specified pattern
function getCubeGrid(cube: Cube): string[][][] {
    const cubeGrid: string[][][] = [];
    // Pattern: up, left, front, right, back, down
    cubeGrid.push(getFaceGrid(cube, 'up'));
    cubeGrid.push(getFaceGrid(cube, 'left'));
    cubeGrid.push(getFaceGrid(cube, 'front'));
    cubeGrid.push(getFaceGrid(cube, 'right'));
    cubeGrid.push(getFaceGrid(cube, 'back'));
    cubeGrid.push(getFaceGrid(cube, 'down'));
    return cubeGrid;
}

// Helper function to get a 2D representation of each 3D face
function getFaceGrid(cube: Cube, face: Face): string[][] {
    const faceGrid: string[][] = [];

    // For each position in the 3x3 grid
    for (let row = 0; row < 3; row++) {
        const rowArray: string[] = [];

        for (let col = 0; col < 3; col++) {
            // The desired Cubie's position in 3D
            const position: Vec3 = FACE_POSITION_MAP[face](row, col);
            
            // NOTE: The following is not great time-complexity-wise, 
            // but fine because this is just for debugging/basic visualization.
            const cubie: Cubie | undefined = cube.cubies.find(c =>
                c.position[0] === position[0] &&
                c.position[1] === position[1] &&
                c.position[2] === position[2]
            );

            // Some checks
            if (!cubie) {
                throw new Error(`Cubie not found at position ${position}!`);
            }
            if (!cubie.rotation) {
                throw new Error(`cubie.rotation was not found!`);
            }
            if (!cubie.faceColors[face]) {
                throw new Error(`cubie.faceColors[face] not found at position: ${position}, face: ${face}!`);
            }
            
            // If Cubie rotation is identity matrix, local Cubie color of desired face 
            // matches global (Cube), skip getLocalFace function.
            // NOTE: I think this check is a good thing computation wise?
            if (math.deepEqual(cubie.rotation, math.identity(3))) {
                rowArray.push(cubie.faceColors[face] as Color);
            } else {

                // Use getLocalFace to determine which Cubie relative (local) Face
                // corresponds to the specified global face (the parameter) (on the Cube), given the Cubie's rotation.
                // The Color at this local Face is the Color that should appear on the Cube's face.

                const localFace = getLocalFace(cubie.rotation, face);
                rowArray.push(cubie.faceColors[localFace] as Color);
            }
        }
        faceGrid.push(rowArray);
    }
    return faceGrid;
}