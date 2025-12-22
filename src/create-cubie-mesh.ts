import * as THREE from 'three';
import type { Cubie, Face, Color } from './cubie';
import { COLOR_HEX_MAP, CUBIE_SIZE, STICKER_SIZE, STICKER_OFFSET, CUBIE_SPACING } from './constants';

export function createCubieMesh(cubie: Cubie): THREE.Group {
    const group = new THREE.Group();

    // Black Cubie core
    const coreGeo = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Add colored stickers for each visible Face
    for (const [faceName, color] of Object.entries(cubie.faceColors)) {
        const sticker = createSticker(faceName as Face, color as Color);
        group.add(sticker);
    }

    // Position the group with coordinate system conversion:
    // My [x, y, z] = [right, front, up]
    // ThreeJS needs [x, y, z] = [right, up, front]
    group.position.set(
        cubie.position[0] * CUBIE_SPACING,  // X: my right --> ThreeJS right
        cubie.position[2] * CUBIE_SPACING,  // Y: my up (Z) --> ThreeJS Y
        cubie.position[1] * CUBIE_SPACING   // Z: my front (Y) --> ThreeJS Z
    );

    // Apply the rotation matrix
    // Convert mathjs 3x3 rotation matrix to ThreeJS 4x4 matrix
    const rotArray = cubie.rotation.toArray() as number[][];
    const threeMatrix = new THREE.Matrix4();
    
    // Build the 4x4 matrix with coordinate system conversion
    // My rotation is in Z-up space, need to convert to Y-up
    threeMatrix.set(
        rotArray[0][0], rotArray[0][2], rotArray[0][1], 0,
        rotArray[2][0], rotArray[2][2], rotArray[2][1], 0,
        rotArray[1][0], rotArray[1][2], rotArray[1][1], 0,
        0, 0, 0, 1
    );
    
    group.setRotationFromMatrix(threeMatrix);

    return group;
}

function createSticker(face: Face, color: Color): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
    const material = new THREE.MeshBasicMaterial({
        color: COLOR_HEX_MAP[color] as number,
        side: THREE.DoubleSide
    });
    const sticker = new THREE.Mesh(geometry, material);

    positionAndRotateSticker(sticker, face);

    return sticker;
}

// Position stickers directly in ThreeJS coordinate system
// My system: right=+X, front=+Y, up=+Z
// ThreeJS:   right=+X, up=+Y, front=+Z
function positionAndRotateSticker(sticker: THREE.Mesh, face: Face): void {
    switch (face) {
        case 'right': // My +X --> ThreeJS +X
            sticker.position.set(STICKER_OFFSET, 0, 0);
            sticker.rotation.y = Math.PI / 2;
            break;

        case 'left': // My -X --> ThreeJS -X
            sticker.position.set(-STICKER_OFFSET, 0, 0);
            sticker.rotation.y = -Math.PI / 2;
            break;

        case 'up': // My +Z --> ThreeJS +Y
            sticker.position.set(0, STICKER_OFFSET, 0);
            sticker.rotation.x = -Math.PI / 2;
            break;

        case 'down': // My -Z --> ThreeJS -Y
            sticker.position.set(0, -STICKER_OFFSET, 0);
            sticker.rotation.x = Math.PI / 2;
            break;

        case 'front': // My +Y --> ThreeJS +Z
            sticker.position.set(0, 0, STICKER_OFFSET);
            // Default plane faces +Z, no rotation needed
            break;

        case 'back': // My -Y --> ThreeJS -Z
            sticker.position.set(0, 0, -STICKER_OFFSET);
            sticker.rotation.y = Math.PI;
            break;
    }
}