import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

function App() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Create scene
        const scene = new THREE.Scene()
        const fov = 45;
        const aspect = 2;
        const near = 0.1; // Clipping bounds
        const far = 100;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        // Store default camera position and target
        const defaultCameraPosition = new THREE.Vector3(3, 2, 5);
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

        // Create cube
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 })
        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)

        // Add orbital controls
        const controls = new OrbitControls(camera, canvas);
        controls.target.set(defaultTarget.x, defaultTarget.y, defaultTarget.z); 
        controls.update();

        // Track idle animation and return camera to default state flags
        let isIdleAnimating = true;
        let isReturningToDefault = false;
        let idleTimeout: number | null = null;
       
        // Stop idle animation when user starts interacting
        const onControlsStart = () => {
            isIdleAnimating = false;
            isReturningToDefault = false;
            if (idleTimeout) {
                clearTimeout(idleTimeout);
                idleTimeout = null;
            }
        };
            
        // Resume idle animation after 3 seconds of inactivity
        const onControlsEnd = () => {
            if (idleTimeout) clearTimeout(idleTimeout);
            idleTimeout = window.setTimeout(() => {
                isIdleAnimating = true;
                isReturningToDefault = true;
            }, 3000); // 3 seconds
        };
        
        // Listen for OrbitControls events
        controls.addEventListener('start', onControlsStart);
        controls.addEventListener('end', onControlsEnd);
        
        // Animation loop
        function animate() {
            // Smoothly return camera to default position
            // NOTE: This is kind of bad... maybe should make it only when user clicks Reset Orientation or something?
            if (isReturningToDefault) {
                camera.position.lerp(defaultCameraPosition, 0.005);
                controls.target.lerp(defaultTarget, 0.005);
                controls.update();

                // Stop returning once BOTH are close enough
                const cameraClose = camera.position.distanceTo(defaultCameraPosition) < 0.01;
                const targetClose = controls.target.distanceTo(defaultTarget) < 0.01;
                
                if (cameraClose && targetClose) {
                    isReturningToDefault = false;
                    // Snap to exact position to avoid drift
                    camera.position.copy(defaultCameraPosition);
                    controls.target.copy(defaultTarget);
                    controls.update();
                }
            }
            if (isIdleAnimating) {
                cube.rotation.y += 0.004;
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
            controls.removeEventListener('end', onControlsEnd);
            if (idleTimeout) clearTimeout(idleTimeout);
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