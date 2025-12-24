import * as THREE from 'three';
import type { Vec3 } from '../cubie';
import type { CubeMove } from '../move';
import { findMove } from '../move';

// Result of interpreting a drag gesture
export interface DragResult {
    axis: 0 | 1 | 2;            // Rotation axis (0=X, 1=Y, 2=Z) in logical coords
    layer: -1 | 0 | 1;          // Which layer on that axis
    clockwise: boolean;         // Rotation direction
    move: CubeMove;             // The equivalent cube move
}

// Logical axis vectors (in our Z-up coordinate system)
const LOGICAL_AXES: Vec3[] = [
    [1, 0, 0],  // X axis (left/right)
    [0, 1, 0],  // Y axis (back/front)
    [0, 0, 1],  // Z axis (down/up)
];

// Convert a logical axis vector to ThreeJS global space
// Our system: [x, y, z] = [right, front, up]
// ThreeJS:   [x, y, z] = [right, up, front]
function logicalToThreeAxis(logical: Vec3): THREE.Vector3 {
    return new THREE.Vector3(logical[0], logical[2], logical[1]);
}

// Check if a permutation of axes (0, 1, 2) is right-handed (even permutation)
// Right-handed permutations: [0,1,2], [1,2,0], [2,0,1]
// Left-handed permutations: [0,2,1], [1,0,2], [2,1,0]
function isRightHandedPermutation(axes: number[]): boolean {
    const [a, b, c] = axes;
    // Even permutations of (0,1,2)
    return (a === 0 && b === 1 && c === 2) ||
           (a === 1 && b === 2 && c === 0) ||
           (a === 2 && b === 0 && c === 1);
}

// Convert global normal to logical coordinates
function worldNormalToLogical(worldNormal: THREE.Vector3, cubeGroup: THREE.Group): Vec3 {
    // Transform world normal to cube's local space (accounting for idle rotation)
    const cubeWorldMatrixInverse = cubeGroup.matrixWorld.clone().invert();
    const localNormal = worldNormal.clone().transformDirection(cubeWorldMatrixInverse);
    
    // Convert from ThreeJS coords back to logical coords
    // ThreeJS [x, y, z] -> Logical [x, z, y]
    return [localNormal.x, localNormal.z, localNormal.y];
}

// Find which logical axis a global normal is closest to
// Returns the axis index (0, 1, 2) and sign (-1 or 1)
function normalToLogicalAxis(worldNormal: THREE.Vector3, cubeGroup: THREE.Group): { axis: 0 | 1 | 2; sign: -1 | 1 } {
    const logicalNormal = worldNormalToLogical(worldNormal, cubeGroup);
    
    // Find which axis has the largest absolute component
    let maxAxis = 0;
    let maxVal = Math.abs(logicalNormal[0]);
    
    for (let i = 1; i < 3; i++) {
        const absVal = Math.abs(logicalNormal[i]);
        if (absVal > maxVal) {
            maxVal = absVal;
            maxAxis = i;
        }
    }
    
    const sign = logicalNormal[maxAxis] > 0 ? 1 : -1;
    return { axis: maxAxis as 0 | 1 | 2, sign: sign as -1 | 1 };
}

// Project a 3D axis to 2D screen space direction
function projectAxisToScreen(
    axis: Vec3,
    cubeGroup: THREE.Group,
    camera: THREE.Camera
): THREE.Vector2 {
    // Convert logical axis to ThreeJS space
    const threeAxis = logicalToThreeAxis(axis);
    
    // Apply cube's world transform (for idle rotation)
    const worldAxis = threeAxis.clone().transformDirection(cubeGroup.matrixWorld);
    
    // Create two points along the axis at the cube center
    const origin = new THREE.Vector3(0, 0, 0);
    const endpoint = worldAxis.clone();
    
    // Project both to screen space
    const screenOrigin = origin.clone().project(camera);
    const screenEnd = endpoint.clone().project(camera);
    
    // Get screen-space direction (ignore Z)
    const screenDir = new THREE.Vector2(
        screenEnd.x - screenOrigin.x,
        screenEnd.y - screenOrigin.y
    );
    
    // Normalize if not zero
    if (screenDir.length() > 0.0001) {
        screenDir.normalize();
    }
    
    return screenDir;
}

/**
 * Interpret a drag gesture to determine which layer to rotate and in which direction
 * 
 * @param faceNormal - Global normal of the clicked face
 * @param cubiePosition - Logical position of the clicked cubie
 * @param dragDelta - Screen-space drag vector (in pixels, Y+ is down)
 * @param camera - The camera
 * @param cubeGroup - The cube's ThreeJS group (for global transform)
 */
export function interpretDrag(
    faceNormal: THREE.Vector3,
    cubiePosition: Vec3,
    dragDelta: THREE.Vector2,
    camera: THREE.Camera,
    cubeGroup: THREE.Group
): DragResult | null {
    // Normalize drag delta (flip Y because screen Y is inverted)
    const normalizedDrag = new THREE.Vector2(dragDelta.x, -dragDelta.y);
    if (normalizedDrag.length() < 0.001) {
        return null;
    }
    normalizedDrag.normalize();
    
    // Find which logical axis the face normal corresponds to (this axis is NOT available for rotation)
    const { axis: faceAxis, sign: faceSign } = normalToLogicalAxis(faceNormal, cubeGroup);
    
    // The two axes we CAN rotate around
    const availableAxes: (0 | 1 | 2)[] = ([0, 1, 2] as const).filter(a => a !== faceAxis) as (0 | 1 | 2)[];
    
    // Project each available axis to screen space and see which one aligns with the drag
    let bestAxis: 0 | 1 | 2 = availableAxes[0];
    let bestDot = 0;
    let bestScreenDir = new THREE.Vector2();
    
    for (const axis of availableAxes) {
        const screenDir = projectAxisToScreen(LOGICAL_AXES[axis], cubeGroup, camera);
        const dot = Math.abs(normalizedDrag.dot(screenDir));
        
        if (dot > bestDot) {
            bestDot = dot;
            bestAxis = axis;
            bestScreenDir = screenDir;
        }
    }
    
    // The rotation axis is the OTHER available axis (perpendicular to drag direction)
    // When you drag along axis A, you rotate around the axis perpendicular to both A and the face normal
    const rotationAxis = availableAxes.find(a => a !== bestAxis)!;
    
    // Determine layer from cubie position along rotation axis
    const layer = cubiePosition[rotationAxis] as -1 | 0 | 1;
    
    // Determine rotation direction using cross product logic
    // The direction depends on: drag direction, which axis we're dragging along, and which face we clicked
    const signedDot = normalizedDrag.dot(bestScreenDir);
    
    // The relationship between drag direction and clockwise/counterclockwise depends on:
    // 1. The drag direction (signedDot > 0 or < 0)
    // 2. The face normal sign (are we on the positive or negative side of this face axis?)
    // 3. The relative orientation of the drag axis vs rotation axis
    // 
    // Using right-hand rule: if you curl fingers from drag axis to face normal, 
    // thumb points in rotation direction for positive drag
    // We need to flip the sign based on which side of the face we're on
    let clockwise = signedDot > 0;
    
    // Flip direction based on face normal sign (clicking from opposite sides inverts direction)
    if (faceSign < 0) {
        clockwise = !clockwise;
    }
    
    // Also need to account for the handedness of the axis arrangement
    // If (bestAxis, faceAxis, rotationAxis) is not a right-handed arrangement, flip
    // Check if we need to flip based on axis ordering
    const axisOrder = [bestAxis, faceAxis, rotationAxis];
    const isRightHanded = isRightHandedPermutation(axisOrder);
    if (!isRightHanded) {
        clockwise = !clockwise;
    }
    
    // Find the corresponding CubeMove
    // NOTE: We invert clockwise here because there's a sign convention mismatch:
    // - Visual (ThreeJS): positive angle = CCW when viewed from positive axis
    // - Logical (cube notation): F = CW when viewed from front = negative angle by right-hand rule
    // So visual "clockwise" maps to logical moves with negative theta (the "prime" moves)
    const move = findMove(rotationAxis, layer, !clockwise);
    
    return {
        axis: rotationAxis,
        layer,
        clockwise,
        move,
    };
}

/**
 * Convert a drag distance to a rotation angle
 * @param dragDistance - Magnitude of drag in pixels
 * @param sensitivity - Pixels per 90 degrees (default: 100)
 */
export function dragToAngle(dragDistance: number, sensitivity: number = 100): number {
    return (dragDistance / sensitivity) * (Math.PI / 2);
}

