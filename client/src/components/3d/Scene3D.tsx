import { type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { useState } from 'react'

interface Scene3DProps {
  children: ReactNode
  className?: string
  cameraPosition?: [number, number, number]
  enableOrbit?: boolean
}

/**
 * Shared R3F Canvas wrapper with performance monitoring.
 * Automatically reduces quality on low-end devices.
 */
export function Scene3D({
  children,
  className = '',
  cameraPosition = [0, 0, 5],
}: Scene3DProps) {
  const [dpr, setDpr] = useState(1.5)

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 100 }}
        dpr={Math.min(dpr, 2)}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(1.5)}
          bounds={(refreshrate) => [refreshrate / 2, refreshrate]}
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <pointLight position={[-5, -5, 5]} intensity={0.3} color="#6366f1" />

          {/* Environment for reflections */}
          <Environment preset="night" />

          {children}
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
