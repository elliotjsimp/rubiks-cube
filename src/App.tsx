import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function App() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Create scene
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

        // Create renderer and append to container
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setClearColor(0xdddddd) // Background: Light gray
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        containerRef.current.appendChild(renderer.domElement)

        // Create cube
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 })
        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)

        camera.position.z = 3.5
        camera.position.y = 1.25 
        camera.lookAt(cube.position)

        // Animation loop, this will basically be idle animation
        function animate() {
            cube.rotation.y += 0.004
            renderer.render(scene, camera)
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
            renderer.setAnimationLoop(null)
            if (containerRef.current && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement)
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