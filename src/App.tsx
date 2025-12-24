import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { Cube } from './cube';
import { createCubieMesh } from './create-cubie-mesh';
import { InteractionController } from './interaction/interaction-controller';

function App() {
    const containerRef = useRef<HTMLDivElement>(null)
    
    // Refs to store cube state and ThreeJS objects
    const cubeRef = useRef<Cube | null>(null);
    const cubeGroupRef = useRef<THREE.Group | null>(null);

    // ThreeJS setup
    useEffect(() => {
        if (!containerRef.current) return

        // Create scene
        const scene = new THREE.Scene()
        const fov = 55;
        const aspect = 2;
        const near = 0.1; // Clipping bounds
        const far = 100;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        // Store default camera position and target
        const defaultCameraPosition = new THREE.Vector3(3, 3, 7);
        const defaultTarget = new THREE.Vector3(0, 0, 0);

        // Camera position/angle
        camera.position.set(defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z);

        // Create renderer and append to container
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setClearColor(0xdddddd) // Background: Light gray
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        const canvas = renderer.domElement;
        containerRef.current.appendChild(canvas)

        // Create Rubik's Cube
        const rubiksCube = new Cube();
        cubeRef.current = rubiksCube;
        
        // Create a parent group for the entire cube
        const cubeGroup = new THREE.Group();
        cubeGroupRef.current = cubeGroup;
        scene.add(cubeGroup);

        // Create mesh groups for all 26 cubies
        rubiksCube.cubies.forEach((cubie, index) => {
            const cubieGroup = createCubieMesh(cubie, index);
            cubeGroup.add(cubieGroup);
        });

        // Add trackball controls (allows free rotation in any direction)
        const controls = new TrackballControls(camera, canvas);
        controls.target.set(defaultTarget.x, defaultTarget.y, defaultTarget.z);
        controls.rotateSpeed = 3.0;
        controls.noZoom = false;
        controls.noPan = true; // Keep focus on the cube
        
        // Track idle animation; plays at start, stops permanently on first interaction
        let isIdleAnimating = true;
       
        // Stop idle animation permanently when user starts interacting
        const onControlsStart = () => {
            isIdleAnimating = false;
        };
        
        controls.addEventListener('start', onControlsStart);
        
        // Set up interaction controller for direct cube manipulation
        const interactionController = new InteractionController(
            camera,
            canvas,
            cubeGroup,
            rubiksCube,
            controls
        );
        
        // Animation loop
        function animate() {
            controls.update(); // TrackballControls requires update() in animation loop
            
            if (isIdleAnimating) {
                // Rotate the entire cube group
                cubeGroup.rotation.y += 0.0035;
            }
            
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate)
        
        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setPixelRatio(window.devicePixelRatio)
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', handleResize)
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)
            controls.removeEventListener('start', onControlsStart);
            interactionController.dispose();
            controls.dispose();
            renderer.setAnimationLoop(null)
            if (containerRef.current && canvas.parentNode) {
               canvas.parentNode.removeChild(canvas)
            }
            renderer.dispose()
        }
    }, [])

    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%', margin: 0, padding: 0 }} />
        </div>
    )
}

export default App
