import * as THREE from 'three';
import type { Cube } from '../cube';
import type { Cubie, Vec3 } from '../cubie';

// Result of raycasting onto a sticker
export interface StickerHit {
    cubieGroup: THREE.Group;           // The cubie's mesh group
    cubieIndex: number;                // Index in cube.cubies array
    cubie: Cubie;                      // Reference to the logical cubie
    faceNormal: THREE.Vector3;         // Global normal of clicked face
    hitPoint: THREE.Vector3;           // Global hit location
    logicalPosition: Vec3;             // Cubie's logical position
}

// Raycast from mouse position to find clicked sticker
// Returns null if no sticker was hit (e.g., clicked on empty space or black core)
export function raycastSticker(
    mouseX: number,
    mouseY: number,
    camera: THREE.Camera,
    cubeGroup: THREE.Group,
    cube: Cube
): StickerHit | null {
    // Convert mouse position to normalized device coordinates (-1 to 1)
    const mouse = new THREE.Vector2(
        (mouseX / window.innerWidth) * 2 - 1,
        -(mouseY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Intersect with all cubie meshes (recursive to get stickers inside groups)
    const intersects = raycaster.intersectObjects(cubeGroup.children, true);

    for (const hit of intersects) {
        const mesh = hit.object as THREE.Mesh;
        
        // Skip non-sticker meshes (the black core)
        if (mesh.name !== 'sticker') {
            continue;
        }

        // Get the cubie group (parent of the sticker mesh)
        const cubieGroup = mesh.parent as THREE.Group;
        if (!cubieGroup || cubieGroup.userData.cubieIndex === undefined) {
            continue;
        }

        const cubieIndex = cubieGroup.userData.cubieIndex as number;
        const cubie = cube.cubies[cubieIndex];

        // Get face normal in global space
        // The hit.face.normal is in the mesh's local space
        // We need to transform it to global space
        const localNormal = hit.face!.normal.clone();
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
        const worldNormal = localNormal.applyMatrix3(normalMatrix).normalize();

        // Skip back-facing stickers (rays that passed through gaps to hit the back of the cube)
        // Front-facing: normal points toward camera, opposite to ray direction → dot < 0
        // Back-facing: normal points away from camera, same as ray direction → dot > 0
        if (worldNormal.dot(raycaster.ray.direction) > 0) {
            continue;
        }

        return {
            cubieGroup,
            cubieIndex,
            cubie,
            faceNormal: worldNormal,
            hitPoint: hit.point.clone(),
            logicalPosition: [...cubie.position] as Vec3,
        };
    }

    return null;
}

