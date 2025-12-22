import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Cubie, Face, Color } from './cubie';
import { COLOR_HEX_MAP, CUBIE_SIZE, CUBIE_RADIUS, CUBIE_SEGMENTS, 
    STICKER_SIZE, STICKER_RADIUS, STICKER_OFFSET, CUBIE_SPACING } from './constants';

export function createCubieMesh(cubie: Cubie): THREE.Group {
    const group = new THREE.Group();

    // Black Cubie core (rounded)
    const coreGeo = new RoundedBoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, CUBIE_SEGMENTS, CUBIE_RADIUS);
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
    const geometry = createRoundedRectGeometry(STICKER_SIZE, STICKER_SIZE, STICKER_RADIUS);
    const material = new THREE.MeshBasicMaterial({
        color: COLOR_HEX_MAP[color] as number,
        side: THREE.DoubleSide
    });
    const sticker = new THREE.Mesh(geometry, material);

    positionAndRotateSticker(sticker, face);

    return sticker;
}

// Creates a rounded rectangle geometry using THREE.Shape
function createRoundedRectGeometry(width: number, height: number, radius: number): THREE.ShapeGeometry {
    const shape = new THREE.Shape();
    
    const halfW = width / 2;
    const halfH = height / 2;
    
    // Clamp radius to avoid invalid shapes
    const r = Math.min(radius, halfW, halfH);
    
    // Start at bottom-left corner (after the radius)
    shape.moveTo(-halfW + r, -halfH);
    
    // Bottom edge
    shape.lineTo(halfW - r, -halfH);
    // Bottom-right corner
    shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
    
    // Right edge
    shape.lineTo(halfW, halfH - r);
    // Top-right corner
    shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
    
    // Top edge
    shape.lineTo(-halfW + r, halfH);
    // Top-left corner
    shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
    
    // Left edge
    shape.lineTo(-halfW, -halfH + r);
    // Bottom-left corner
    shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
    
    return new THREE.ShapeGeometry(shape);
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