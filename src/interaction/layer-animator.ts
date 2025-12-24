import * as THREE from 'three';
import type { Cube } from '../cube';
import { CUBIE_SPACING } from '../constants';

// Easing functions for smooth snap animation
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// Handles the visual animation of rotating a layer of cubies
export class LayerAnimator {
    private pivot: THREE.Group;
    private cubeGroup: THREE.Group;
    private activeCubieGroups: THREE.Group[] = [];
    private rotationAxis: THREE.Vector3 = new THREE.Vector3();
    private isActive: boolean = false;
    private currentAngle: number = 0;  // Track angle directly to avoid Euler wraparound issues
    
    // Reusable quaternion to avoid GC stutters
    private tempQuaternion: THREE.Quaternion = new THREE.Quaternion();
    
    constructor(cubeGroup: THREE.Group) {
        this.cubeGroup = cubeGroup;
        this.pivot = new THREE.Group();
        this.pivot.name = 'rotationPivot';
    }
    
    /**
     * Begin rotating a layer - reparent cubies to pivot
     * @param cubieGroups - The 8 or 9 cubie mesh groups in the layer
     * @param axis - Rotation axis in logical coordinates (0=X, 1=Y, 2=Z)
     */
    beginLayerRotation(cubieGroups: THREE.Group[], axis: 0 | 1 | 2): void {
        if (this.isActive) {
            console.warn('LayerAnimator: Already animating a layer');
            return;
        }
        
        this.isActive = true;
        this.activeCubieGroups = cubieGroups;
        this.currentAngle = 0;  // Reset angle for new rotation
        
        // Convert logical axis to ThreeJS axis
        // Logical [x, y, z] = [right, front, up]
        // ThreeJS [x, y, z] = [right, up, front]
        const threeAxisMap: Record<number, THREE.Vector3> = {
            0: new THREE.Vector3(1, 0, 0),  // X stays X
            1: new THREE.Vector3(0, 0, 1),  // Y (front) becomes Z
            2: new THREE.Vector3(0, 1, 0),  // Z (up) becomes Y
        };
        this.rotationAxis = threeAxisMap[axis];
        
        // Reset pivot
        this.pivot.position.set(0, 0, 0);
        this.pivot.rotation.set(0, 0, 0);
        this.pivot.updateMatrixWorld(true);
        
        // Add pivot to the cube group (so it inherits cube's world rotation)
        this.cubeGroup.add(this.pivot);
        
        // Reparent each cubie to the pivot, preserving world position
        for (const cubieGroup of cubieGroups) {
            // Store original parent reference
            cubieGroup.userData.originalParent = cubieGroup.parent;
            
            // Get world position before reparenting
            const worldPos = new THREE.Vector3();
            cubieGroup.getWorldPosition(worldPos);
            
            // Reparent to pivot
            this.pivot.attach(cubieGroup);
        }
    }
    
    /**
     * Update the rotation angle during drag
     * @param radians - Current rotation angle
     */
    setRotationAngle(radians: number): void {
        if (!this.isActive) return;
        
        // Store the angle directly (avoids Euler wraparound issues for angles > 180°)
        this.currentAngle = radians;
        
        // Apply rotation around the axis (reuse quaternion to avoid GC)
        this.tempQuaternion.setFromAxisAngle(this.rotationAxis, radians);
        this.pivot.quaternion.copy(this.tempQuaternion);
    }
    
    // Get current rotation angle
    getCurrentAngle(): number {
        return this.currentAngle;
    }
    
    /**
     * Animate snap to nearest 90 degrees
     * @param projectedAngle - Optional angle to use for determining snap target (includes momentum)
     * @returns Promise that resolves with the number of 90° turns (negative for CCW)
     */
    async snapToNearest90(projectedAngle?: number): Promise<number> {
        if (!this.isActive) return 0;
        
        const currentAngle = this.getCurrentAngle();
        
        // Use projected angle for snap target calculation (momentum), but animate from current
        const angleForSnap = projectedAngle !== undefined ? projectedAngle : currentAngle;
        
        // Find nearest 90° increment based on projected position
        const quarterTurns = Math.round(angleForSnap / (Math.PI / 2));
        const targetAngle = quarterTurns * (Math.PI / 2);
        
        // If we're already very close, skip animation
        const angleDiff = Math.abs(currentAngle - targetAngle);
        if (angleDiff < 0.01) {
            this.setRotationAngle(targetAngle);
            return quarterTurns;
        }
        
        // Scale duration based on angle distance (250ms per 90°, min 150ms, max 500ms)
        const baseDuration = (angleDiff / (Math.PI / 2)) * 250;
        const duration = Math.max(150, Math.min(500, baseDuration));
        
        // Animate smoothly from current to target
        const startAngle = currentAngle;
        const startTime = performance.now();
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutCubic(progress);
                
                const angle = startAngle + (targetAngle - startAngle) * easedProgress;
                this.setRotationAngle(angle);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure we land exactly on target
                    this.setRotationAngle(targetAngle);
                    resolve(quarterTurns);
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    // Finalize the rotation - reparent cubies back and sync positions
    finalize(cube: Cube): void {
        if (!this.isActive) return;
        
        // Update pivot's world matrix
        this.pivot.updateMatrixWorld(true);
        
        // Reparent each cubie back to the cube group
        for (const cubieGroup of this.activeCubieGroups) {
            // Attach back to cubeGroup (preserves world transform)
            this.cubeGroup.attach(cubieGroup);
        }
        
        // Remove pivot from scene
        this.cubeGroup.remove(this.pivot);
        
        // Sync visual positions to logical state (prevents floating point drift)
        this.syncVisualsToLogicalState(cube);
        
        // Reset state
        this.activeCubieGroups = [];
        this.currentAngle = 0;
        this.isActive = false;
    }
    
    // Cancel the rotation without committing
    cancel(): void {
        if (!this.isActive) return;
        
        // Animate back to 0
        this.setRotationAngle(0);
        
        // Reparent back without syncing (no logical change happened)
        for (const cubieGroup of this.activeCubieGroups) {
            this.cubeGroup.attach(cubieGroup);
        }
        
        this.cubeGroup.remove(this.pivot);
        this.activeCubieGroups = [];
        this.currentAngle = 0;
        this.isActive = false;
    }
    
    // Check if animation is in progress
    get active(): boolean {
        return this.isActive;
    }
    
    // Sync all cubie mesh positions to match logical cube state
    // This prevents floating point drift after multiple rotations
    private syncVisualsToLogicalState(cube: Cube): void {
        for (const child of this.cubeGroup.children) {
            if (!(child instanceof THREE.Group) || child.userData.cubieIndex === undefined) {
                continue;
            }
            
            const cubieGroup = child as THREE.Group;
            const cubieIndex = cubieGroup.userData.cubieIndex as number;
            const cubie = cube.cubies[cubieIndex];
            
            // Update position (convert logical to ThreeJS coords)
            cubieGroup.position.set(
                cubie.position[0] * CUBIE_SPACING,  // X -> X
                cubie.position[2] * CUBIE_SPACING,  // Z (up) -> Y
                cubie.position[1] * CUBIE_SPACING   // Y (front) -> Z
            );
            
            // Update rotation from cubie's rotation matrix
            const rotArray = cubie.rotation.toArray() as number[][];
            const threeMatrix = new THREE.Matrix4();
            
            // Convert rotation matrix with coordinate system swap
            threeMatrix.set(
                rotArray[0][0], rotArray[0][2], rotArray[0][1], 0,
                rotArray[2][0], rotArray[2][2], rotArray[2][1], 0,
                rotArray[1][0], rotArray[1][2], rotArray[1][1], 0,
                0, 0, 0, 1
            );
            
            cubieGroup.setRotationFromMatrix(threeMatrix);
        }
    }
}

/**
 * Get the cubie mesh groups that belong to a specific layer
 * @param cubeGroup - The parent ThreeJS group containing all cubies
 * @param cube - The logical cube
 * @param axis - Rotation axis (0=X, 1=Y, 2=Z) in logical coordinates
 * @param layer - Layer position (-1, 0, or 1)
 */
export function getLayerCubieGroups(
    cubeGroup: THREE.Group,
    cube: Cube,
    axis: 0 | 1 | 2,
    layer: -1 | 0 | 1
): THREE.Group[] {
    const groups: THREE.Group[] = [];
    
    for (const child of cubeGroup.children) {
        if (!(child instanceof THREE.Group) || child.userData.cubieIndex === undefined) {
            continue;
        }
        
        const cubieIndex = child.userData.cubieIndex as number;
        const cubie = cube.cubies[cubieIndex];
        
        // Check if this cubie is in the requested layer
        if (cubie.position[axis] === layer) {
            groups.push(child as THREE.Group);
        }
    }
    
    return groups;
}

