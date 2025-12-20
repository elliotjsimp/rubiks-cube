export type Vec3 = [number, number, number];
export type Color = 'orange' | 'red' | 'blue' | 'green' | 'yellow' | 'white';
export type Face = 'left'  | 'right' | 'back' | 'front' | 'down' | 'up';

// Relative to solved position
export type FaceColors = {
    // A Cubie will have 1-3 visible faces, inclusive.
    [key in Face]?: Color;
}

// A sub-cube of the Rubik's Cube is called a Cubie
// Possible Cubies: center (of a face), edge, corner
// The center of the Cube itself is not a valid Cubie.
export class Cubie {
    // The offset position from the centre of the cube [0, 0, 0]
    // Green is forward, White is up.
    // Note: consider position = [x (left/right), y (back/front), z (down/up)]
    public position: Vec3;

    // TODO: Replace with rotation matrix field.
    // The orientation from the solved position [0, 0, 0] of each Cubie.
    public orientation: Vec3;

    // The colors of the faces of the Cubie in solved (i.e. relative/local) position.
    public faceColors: FaceColors;

    public constructor(position: Vec3, orientation: Vec3, faceColors: FaceColors) {
        this.position = position;
        this.orientation = orientation;
        this.faceColors = faceColors;
    }
    
}