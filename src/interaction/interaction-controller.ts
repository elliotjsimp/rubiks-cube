import * as THREE from 'three';
import type { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import type { Cube } from '../cube';
import { doMove } from '../move';
import { raycastSticker, type StickerHit } from './raycaster';
import { interpretDrag, dragToAngle, type DragResult } from './drag-interpreter';
import { LayerAnimator, getLayerCubieGroups } from './layer-animator';

// Interaction configuration
// NOTE: These values still aren't perfect, could use some tuning.
const DRAG_THRESHOLD = 2;        // Pixels before committing to a rotation direction (low = responsive)
const DRAG_SENSITIVITY = 100;    // Pixels per 90 degrees (higher = less sensitive)
const FLICK_VELOCITY_THRESHOLD = 0.02; // Minimum velocity (radians/ms) to trigger flick
const FLICK_MOMENTUM_FACTOR = 7200;    // How much velocity affects final angle (ms)

// Orchestrates user interaction with the Rubik's Cube
// Handles pointer events, raycasting, and coordinates between drag interpretation and animation
export class InteractionController {
    private camera: THREE.Camera;
    private canvas: HTMLCanvasElement;
    private cubeGroup: THREE.Group;
    private cube: Cube;
    private controls: TrackballControls;
    private animator: LayerAnimator;
    
    // Interaction state
    private isDragging: boolean = false;
    private currentHit: StickerHit | null = null;
    private dragStart: THREE.Vector2 = new THREE.Vector2();
    private currentDragResult: DragResult | null = null;
    private hasLockedDirection: boolean = false;
    
    // Velocity tracking for flick gesture
    private lastAngle: number = 0;
    private lastMoveTime: number = 0;
    private velocity: number = 0;
    
    // Bound event handlers (for cleanup)
    private boundPointerDown: (e: PointerEvent) => void;
    private boundPointerMove: (e: PointerEvent) => void;
    private boundPointerUp: (e: PointerEvent) => void;
    
    constructor(
        camera: THREE.Camera,
        canvas: HTMLCanvasElement,
        cubeGroup: THREE.Group,
        cube: Cube,
        controls: TrackballControls
    ) {
        this.camera = camera;
        this.canvas = canvas;
        this.cubeGroup = cubeGroup;
        this.cube = cube;
        this.controls = controls;
        this.animator = new LayerAnimator(cubeGroup);
        
        // Bind event handlers
        this.boundPointerDown = this.onPointerDown.bind(this);
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);
        
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        // Use capture phase so our handlers fire BEFORE TrackballControls' handlers
        // This allows us to stop propagation and prevent TrackballControls from seeing events
        this.canvas.addEventListener('pointerdown', this.boundPointerDown, { capture: true });
        this.canvas.addEventListener('pointermove', this.boundPointerMove, { capture: true });
        this.canvas.addEventListener('pointerup', this.boundPointerUp, { capture: true });
        this.canvas.addEventListener('pointerleave', this.boundPointerUp, { capture: true });
    }
    
    private onPointerDown(event: PointerEvent): void {
        // Try to hit a sticker
        const hit = raycastSticker(
            event.clientX,
            event.clientY,
            this.camera,
            this.cubeGroup,
            this.cube
        );
        
        if (hit) {
            // Stop event from reaching TrackballControls
            event.stopPropagation();
            
            // We hit a sticker - disable orbit controls and start tracking drag
            this.controls.enabled = false;
            this.isDragging = true;
            this.currentHit = hit;
            this.dragStart.set(event.clientX, event.clientY);
            this.hasLockedDirection = false;
            this.currentDragResult = null;
            
            // Reset velocity tracking
            this.lastAngle = 0;
            this.lastMoveTime = performance.now();
            this.velocity = 0;
            
            // Capture pointer for reliable tracking
            this.canvas.setPointerCapture(event.pointerId);
        }
        // If no hit, event propagates normally to TrackballControls
    }
    
    private onPointerMove(event: PointerEvent): void {
        if (!this.isDragging || !this.currentHit) return;
        
        // Stop event from reaching TrackballControls while we're dragging
        event.stopPropagation();
        
        const dragDelta = new THREE.Vector2(
            event.clientX - this.dragStart.x,
            event.clientY - this.dragStart.y
        );
        
        const dragDistance = dragDelta.length();
        
        // Once past threshold, lock in the rotation direction
        if (!this.hasLockedDirection && dragDistance > DRAG_THRESHOLD) {
            const result = interpretDrag(
                this.currentHit.faceNormal,
                this.currentHit.logicalPosition,
                dragDelta,
                this.camera,
                this.cubeGroup
            );
            
            if (result) {
                this.currentDragResult = result;
                this.hasLockedDirection = true;
                
                // Get the cubies in this layer and start animation
                const layerCubies = getLayerCubieGroups(
                    this.cubeGroup,
                    this.cube,
                    result.axis,
                    result.layer
                );
                
                this.animator.beginLayerRotation(layerCubies, result.axis);
            }
        }
        
        // Update rotation angle based on drag distance
        if (this.hasLockedDirection && this.currentDragResult) {
            // Calculate signed distance along the drag direction
            // We need to project current drag onto the initial drag direction
            const initialDir = dragDelta.clone().normalize();
            const signedDistance = dragDelta.dot(initialDir);
            
            // Determine sign based on drag result
            const sign = this.currentDragResult.clockwise ? 1 : -1;
            const angle = dragToAngle(signedDistance, DRAG_SENSITIVITY) * sign;
            
            // Track velocity for flick gesture
            const now = performance.now();
            const dt = now - this.lastMoveTime;
            if (dt > 0 && dt < 100) { // Ignore stale updates
                // Smooth velocity with exponential moving average (very responsive)
                const instantVelocity = (angle - this.lastAngle) / dt;
                this.velocity = this.velocity * 0.3 + instantVelocity * 0.7;
            }
            this.lastAngle = angle;
            this.lastMoveTime = now;
            
            this.animator.setRotationAngle(angle);
        }
    }
    
    private async onPointerUp(event: PointerEvent): Promise<void> {
        if (!this.isDragging) return;
        
        // Stop event from reaching TrackballControls
        event.stopPropagation();
        
        // Release pointer capture
        this.canvas.releasePointerCapture(event.pointerId);
        
        if (this.hasLockedDirection && this.currentDragResult && this.animator.active) {
            // Calculate projected angle including momentum (but don't jump to it)
            const currentAngle = this.animator.getCurrentAngle();
            let projectedAngle = currentAngle;
            
            // If velocity is above threshold, project forward
            if (Math.abs(this.velocity) > FLICK_VELOCITY_THRESHOLD) {
                projectedAngle = currentAngle + this.velocity * FLICK_MOMENTUM_FACTOR;
            }
            
            // Snap to nearest 90° based on projected angle (animates smoothly from current)
            const quarterTurns = await this.animator.snapToNearest90(projectedAngle);
            
            // Commit the move to logical state if rotation != 0
            // The move was determined based on the initial drag direction (clockwise flag)
            // The angle sign was also based on clockwise, so quarterTurns sign matches clockwise
            // Therefore: always use the determined move (the visual matched the move)
            const absQuarterTurns = Math.abs(quarterTurns);
            if (absQuarterTurns > 0) {
                const move = this.currentDragResult.move;
                for (let i = 0; i < absQuarterTurns; i++) {
                    doMove(this.cube, move);
                }
            }
            
            // Finalize animation (reparent cubies, sync visuals)
            this.animator.finalize(this.cube);
        } else if (this.animator.active) {
            // Drag didn't commit to a direction - cancel
            this.animator.cancel();
        }
        
        // Reset state
        this.isDragging = false;
        this.currentHit = null;
        this.currentDragResult = null;
        this.hasLockedDirection = false;
        
        // Re-enable orbit controls
        this.controls.enabled = true;
    }
    
    // Clean up event listeners
    dispose(): void {
        this.canvas.removeEventListener('pointerdown', this.boundPointerDown, { capture: true });
        this.canvas.removeEventListener('pointermove', this.boundPointerMove, { capture: true });
        this.canvas.removeEventListener('pointerup', this.boundPointerUp, { capture: true });
        this.canvas.removeEventListener('pointerleave', this.boundPointerUp, { capture: true });
    }
}

