import type { Face, Color, Vec3 } from './cubie';

// A map that describes the relationship from
// axis to position to FaceColors for a Cubie on a solved Cube.
export const FACE_COLOR_SOLVED_MAP: { [key: number]: { [key: string]: { face: Face, color: Color } } } = {
    0: { // x-axis
      "-1": { face: 'left',  color: 'orange' },
       "1": { face: 'right', color: 'red'    }
    },
    1: { // y-axis
      "-1": { face: 'back',  color: 'blue'   },
       "1": { face: 'front', color: 'green'  }
    },
    2: { // z-axis
      "-1": { face: 'down',  color: 'yellow' },
       "1": { face: 'up',    color: 'white'  }
    }
  };

// Map from Face to unit vector
export const FACE_UNITVEC_MAP: Record<Face, Vec3>  = {
    up:    [0,0,1],
    down:  [0,0,-1],
    left:  [-1,0,0],
    right: [1,0,0],
    back:  [0,-1,0],
    front: [0,1,0]
}

// Map from Face to axis (indices in cubie.position)
export const FACE_AXIS_INDEX_MAP: Readonly<Record<Face, 0 | 1 | 2>> = {
    left: 0,   // x
    right: 0,  // x
    back: 1,   // y
    front: 1,  // y
    down: 2,   // z
    up: 2      // z
};

// Map from 2D unwrapped position on a face to 3D position
export const FACE_POSITION_MAP: Record<Face, (row: number, col: number) => Vec3> = {
    up:    (r, c) => [c - 1, r - 1, 1],
    down:  (r, c) => [c - 1, -(r - 1), -1],
    left:  (r, c) => [-1, c - 1, -(r - 1)],
    right: (r, c) => [1, -(c - 1), -(r - 1)],
    front: (r, c) => [c - 1, 1, -(r - 1)],
    back:  (r, c) => [-(c - 1), -1, -(r - 1)],
};