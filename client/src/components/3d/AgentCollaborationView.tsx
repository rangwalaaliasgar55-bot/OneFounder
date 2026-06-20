import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Scene3D } from './Scene3D'
import { SPECIALIST_AGENTS, type AgentDef } from '../../lib/agents'

interface AgentCollaborationViewProps {
  activeAgents?: string[]
  completedAgents?: string[]
  onAgentClick?: (agentId: string) => void
}

/**
 * Arrange agents in a circle around the center.
 */
function getAgentPosition(index: number, total: number, radius = 2): [number, number, number] {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    0,
  ]
}

/**
 * Individual agent node — glowing orb with icon.
 */
function AgentNode({
  agent,
  position,
  isActive,
  isCompleted,
  onClick,
}: {
  agent: AgentDef
  position: [number, number, number]
  isActive: boolean
  isCompleted: boolean
  onClick?: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Gentle float
    meshRef.current.position.y = position[1] + Math.sin(t * 1.2 + position[0] * 2) * 0.03

    // Scale pulse when active
    const baseScale = isActive ? 0.9 : 0.7
    const pulse = isActive ? Math.sin(t * 3) * 0.1 : 0
    const s = baseScale + pulse
    meshRef.current.scale.set(s, s, s)

    // Glow
    if (glowRef.current) {
      const gs = isActive ? 1.8 : isCompleted ? 1.4 : 1.2
      glowRef.current.scale.set(gs, gs, gs)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isActive ? 0.25 : isCompleted ? 0.12 : 0.06
    }
  })

  return (
    <group position={position}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color={agent.hex}
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Main orb */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color={agent.hex}
          emissive={agent.hex}
          emissiveIntensity={isActive ? 0.8 : isCompleted ? 0.4 : 0.2}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Label on hover */}
      <Html center distanceFactor={5} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="text-lg">{agent.icon}</span>
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: agent.hex,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {agent.name}
          </span>
        </div>
      </Html>
    </group>
  )
}

/**
 * Center task node — represents the current task/query.
 */
function CenterNode() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const s = 0.25 + Math.sin(t * 2) * 0.02
    ref.current.scale.set(s, s, s)
    ref.current.rotation.y = t * 0.3
    ref.current.rotation.z = t * 0.1
  })

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={0.5}
        metalness={0.6}
        roughness={0.2}
        wireframe
      />
    </mesh>
  )
}

/**
 * Beams connecting active agents to the center.
 */
function AgentBeams({
  agents,
  activeIds,
  completedIds,
}: {
  agents: AgentDef[]
  activeIds: string[]
  completedIds: string[]
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const t = state.clock.getElapsedTime()
        child.material.opacity = 0.1 + Math.sin(t * 2 + i) * 0.05
      }
    })
  })

  return (
    <group ref={ref}>
      {agents.map((agent, i) => {
        const isActive = activeIds.includes(agent.id)
        const isCompleted = completedIds.includes(agent.id)
        if (!isActive && !isCompleted) return null

        const pos = getAgentPosition(i, agents.length)
        return (
          <Line
            key={agent.id}
            points={[[0, 0, 0], pos]}
            color={agent.hex}
            lineWidth={isActive ? 2 : 1}
            transparent
            opacity={isActive ? 0.4 : 0.15}
          />
        )
      })}
    </group>
  )
}

/**
 * 3D Agent Collaboration View — shows all 16 agents as nodes
 * with animated connections to the center task node.
 */
export default function AgentCollaborationView({
  activeAgents = [],
  completedAgents = [],
  onAgentClick,
}: AgentCollaborationViewProps) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Scene3D cameraPosition={[0, 0, 5]}>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={8}
          autoRotate
          autoRotateSpeed={0.2}
        />

        <CenterNode />
        <AgentBeams
          agents={SPECIALIST_AGENTS}
          activeIds={activeAgents}
          completedIds={completedAgents}
        />

        {SPECIALIST_AGENTS.map((agent, i) => (
          <AgentNode
            key={agent.id}
            agent={agent}
            position={getAgentPosition(i, SPECIALIST_AGENTS.length)}
            isActive={activeAgents.includes(agent.id)}
            isCompleted={completedAgents.includes(agent.id)}
            onClick={() => onAgentClick?.(agent.id)}
          />
        ))}
      </Scene3D>
    </div>
  )
}
