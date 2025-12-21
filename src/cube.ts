import { Cubie } from './cubie';
import type { Vec3, Face, Color, FaceColors } from './cubie';
import { FACE_COLOR_SOLVED_MAP } from './face-utils';
import * as move from './move';
import * as math from 'mathjs';

export class Cube {
    public cubies: Cubie[];
    public solvedStateCubies: Cubie[];

    public constructor() {
        this.cubies = [];
        this.solvedStateCubies = [];
        this.initializeSolvedCubies();
    }

    // Generates the array of Cubie objects for a solved cube
    private initializeSolvedCubies(): Cubie[] {
        let cubies: Cubie[] = [];
        let position: Vec3;
        let faceColors: FaceColors = {};
        
        // For all Cubie positions on the Cube (26 unique Cubies)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <=1; z++) {
                    
                    // Center (of the Cube, not of a face) Cubie is not a valid Cubie
                    if (x == 0 && y == 0 && z == 0) continue;

                    position = [x, y, z];
                    
                    // Determine faceColors
                    for (let axis = 0; axis < 3; axis++) {
                        const mapping = FACE_COLOR_SOLVED_MAP[axis]?.[position[axis]];
                        if (mapping) {
                            faceColors[mapping.face as Face] = mapping.color as Color;
                        }

                    }

                    // NOTE: Could assert expected length of FaceColors makes sense based on position here.
                    // i.e., if corner, length of FaceColors is 3.

                    // A Cubie is created with identity rotation matrix in constructor, 
                    // as a Cube is always created in solved state.
                    
                    // Create both arrays with different references.
                    this.cubies.push(new Cubie(position, faceColors));
                    this.solvedStateCubies.push(new Cubie([...position], {...faceColors}));

                }
            }
        }

        return cubies;
    }

    public isSolved(): boolean {
        for (let i = 0; i < this.cubies.length; i++) {
            const cubie = this.cubies[i];
            const solvedCubie = this.solvedStateCubies[i];

            for (let p = 0; p < 3; p++) {
                if (cubie.position[p] !== solvedCubie.position[p]) return false;
            }

            if (!math.deepEqual(cubie.rotation, math.identity(3))) return false;
        }
        return true;
    }

    public scramble(numMoves: number = 25) {
        for (let i = 0; i < numMoves; i++) {
            // Choose a random move
            const randomMove: move.CubeMove = move.ALL_MOVES[
                Math.floor(Math.random() * move.ALL_MOVES.length)
            ];
            move.doMove(this, randomMove);
        }
    }


}