import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface BrainNodeProps {
  position: [number, number, number]
  color: string
  label: string
  size?: number
  importance?: number
  onClick?: () => void
}

/**
 * Individual 3D node for the brain visualization.
 * A glowing sphere with text label, hover highlight, click handler.
 */
export function BrainNode({
  position,
  color,
  label,
  size = 0.15,
  importance = 5,
  onClick,
}: BrainNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Pulsing animation
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Gentle float
    meshRef.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.02

    // Pulse scale based on importance
    const baseScale = 0.8 + (importance / 10) * 0.4
    const pulseScale = baseScale + Math.sin(t * 2) * 0.03
    const targetScale = hovered ? baseScale * 1.3 : pulseScale
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    )

    // Glow pulse
    if (glowRef.current) {
      const glowScale = targetScale * 1.8
      glowRef.current.scale.lerp(
        new THREE.Vector3(glowScale, glowScale, glowScale),
        0.1
      )
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = hovered ? 0.2 : 0.08 + Math.sin(t * 1.5) * 0.04
    }
  })

  return (
    <group position={position}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.3}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html
          center
          distanceFactor={6}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            className="px-2 py-1 rounded-md text-xs font-medium text-white"
            style={{
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}
