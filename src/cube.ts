import { Cubie } from './cubie';
import type { Vec3, Face, Color, FaceColors } from './cubie';

export class Cube {
    // A hashmap that describes the relationship from
    // axis to position to FaceColors for a Cubie on a solved Cube.
    static readonly FACE_MAP: { [key: number]: { [key: string]: { face: Face, color: Color } } } = {
        0: { // x axis
          "-1": { face: 'left',  color: 'orange' },
           "1": { face: 'right', color: 'red'    }
        },
        1: { // y axis
          "-1": { face: 'back',  color: 'blue'   },
           "1": { face: 'front', color: 'green'  }
        },
        2: { // z axis
          "-1": { face: 'down',  color: 'yellow' },
           "1": { face: 'up',    color: 'white'  }
        }
      };

    public cubies: Cubie[];
    public solvedState: Cubie[];


    public constructor() {
        this.cubies = [];
        this.solvedState = [];
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
                        const mapping = Cube.FACE_MAP[axis]?.[position[axis]];
                        if (mapping) {
                            faceColors[mapping.face as Face] = mapping.color as Color;
                        }

                    }

                    // Could assert expected length of FaceColors makes sense based on position.

                    // Orientation for every Cubie in a solved Cube is [0, 0, 0]
                    // Create both array's with different references.
                    this.cubies.push(new Cubie(position, [0, 0, 0], faceColors));
                    this.solvedState.push(new Cubie([...position], [0, 0, 0], {...faceColors}));

                }
            }
        }

        return cubies;
    }

}