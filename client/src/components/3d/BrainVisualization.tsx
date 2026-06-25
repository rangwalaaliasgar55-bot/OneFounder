import { useState, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Scene3D } from './Scene3D'
import { BrainNode } from './BrainNode'

interface BrainNodeData {
  id: string
  label: string
  category: 'memory' | 'knowledge' | 'project' | 'goal'
  importance: number
  description?: string
}

interface BrainVisualizationProps {
  memories?: Array<{ id: string; content: string; importance: number; type: string }>
  knowledge?: Array<{ id: string; title: string; type: string }>
  projects?: Array<{ id: string; name: string; status: string }>
  goals?: Array<{ id: string; title: string; completed: boolean }>
  onNodeClick?: (node: BrainNodeData) => void
}

const CATEGORY_COLORS = {
  memory: '#6366f1',    // brand indigo
  knowledge: '#8b5cf6', // violet
  project: '#10b981',   // emerald
  goal: '#f59e0b',      // amber
}

const CATEGORY_LABELS = {
  memory: 'Memories',
  knowledge: 'Knowledge',
  project: 'Projects',
  goal: 'Goals',
}

/**
 * Convert API data to brain nodes with positions.
 */
function buildNodes(props: BrainVisualizationProps): BrainNodeData[] {
  const nodes: BrainNodeData[] = []

  props.memories?.slice(0, 8).forEach((m) => {
    nodes.push({
      id: `mem-${m.id}`,
      label: m.content.slice(0, 40) + (m.content.length > 40 ? '...' : ''),
      category: 'memory',
      importance: m.importance,
      description: m.content,
    })
  })

  props.knowledge?.slice(0, 6).forEach((k) => {
    nodes.push({
      id: `kb-${k.id}`,
      label: k.title.slice(0, 40),
      category: 'knowledge',
      importance: 6,
      description: k.title,
    })
  })

  props.projects?.slice(0, 4).forEach((p) => {
    nodes.push({
      id: `proj-${p.id}`,
      label: p.name.slice(0, 30),
      category: 'project',
      importance: p.status === 'active' ? 8 : 5,
      description: p.name,
    })
  })

  props.goals?.slice(0, 4).forEach((g) => {
    nodes.push({
      id: `goal-${g.id}`,
      label: g.title.slice(0, 30),
      category: 'goal',
      importance: g.completed ? 4 : 9,
      description: g.title,
    })
  })

  return nodes
}

/**
 * Arrange nodes in clusters around a central point.
 */
function arrangeNodes(nodes: BrainNodeData[]): Array<BrainNodeData & { position: [number, number, number] }> {
  const categories = ['memory', 'knowledge', 'project', 'goal'] as const
  const clusterOffsets: Record<string, [number, number, number]> = {
    memory: [-1.5, 0.8, 0],
    knowledge: [1.5, 0.8, 0],
    project: [-1.5, -0.8, 0],
    goal: [1.5, -0.8, 0],
  }

  const result: Array<BrainNodeData & { position: [number, number, number] }> = []

  categories.forEach((cat) => {
    const catNodes = nodes.filter((n) => n.category === cat)
    const offset = clusterOffsets[cat]

    catNodes.forEach((node, i) => {
      const angle = (i / Math.max(catNodes.length, 1)) * Math.PI * 2
      const radius = 0.4 + (i % 3) * 0.2
      const x = offset[0] + Math.cos(angle) * radius
      const y = offset[1] + Math.sin(angle) * radius
      const z = offset[2] + (Math.random() - 0.5) * 0.3
      result.push({ ...node, position: [x, y, z] })
    })
  })

  return result
}

/**
 * Core brain sphere with pulsing glow.
 */
function BrainCore() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    const scale = 0.3 + Math.sin(t * 1.5) * 0.02
    meshRef.current.scale.set(scale, scale, scale)
    meshRef.current.rotation.y = t * 0.2
  })

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.3}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
    </Float>
  )
}

import { useRef } from 'react'

/**
 * Connections between related nodes.
 */
function NodeConnections({ nodes }: { nodes: Array<BrainNodeData & { position: [number, number, number] }> }) {
  const connections: Array<{ start: [number, number, number]; end: [number, number, number]; color: string }> = []

  // Connect nodes within the same category
  const categories = ['memory', 'knowledge', 'project', 'goal'] as const
  categories.forEach((cat) => {
    const catNodes = nodes.filter((n) => n.category === cat)
    for (let i = 0; i < catNodes.length - 1; i++) {
      connections.push({
        start: catNodes[i].position,
        end: catNodes[i + 1].position,
        color: CATEGORY_COLORS[cat],
      })
    }
  })

  // Connect a few cross-category nodes (memory → knowledge, project → goal)
  const memNodes = nodes.filter((n) => n.category === 'memory')
  const kbNodes = nodes.filter((n) => n.category === 'knowledge')
  if (memNodes.length > 0 && kbNodes.length > 0) {
    connections.push({
      start: memNodes[0].position,
      end: kbNodes[0].position,
      color: '#818cf8',
    })
  }

  const projNodes = nodes.filter((n) => n.category === 'project')
  const goalNodes = nodes.filter((n) => n.category === 'goal')
  if (projNodes.length > 0 && goalNodes.length > 0) {
    connections.push({
      start: projNodes[0].position,
      end: goalNodes[0].position,
      color: '#fbbf24',
    })
  }

  return (
    <>
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={[conn.start, conn.end]}
          color={conn.color}
          lineWidth={0.5}
          transparent
          opacity={0.15}
        />
      ))}
    </>
  )
}

/**
 * Particles floating around the brain.
 */
function BrainParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 100

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 4
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.02
    ref.current.rotation.x = state.clock.getElapsedTime() * 0.01
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#6366f1"
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

/**
 * Main brain visualization scene (inside Canvas).
 */
function BrainScene({
  nodes,
  onNodeClick,
}: {
  nodes: Array<BrainNodeData & { position: [number, number, number] }>
  onNodeClick?: (node: BrainNodeData) => void
}) {
  return (
    <>
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />

      <BrainCore />
      <BrainParticles />
      <NodeConnections nodes={nodes} />

      {nodes.map((node) => (
        <BrainNode
          key={node.id}
          position={node.position}
          color={CATEGORY_COLORS[node.category]}
          label={node.label}
          importance={node.importance}
          onClick={() => onNodeClick?.(node)}
        />
      ))}
    </>
  )
}

/**
 * AI Brain Visualization — flagship 3D experience.
 * Shows memories, knowledge, projects, and goals as interactive nodes
 * orbiting a central brain core.
 */
export default function BrainVisualization(props: BrainVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<BrainNodeData | null>(null)

  const nodes = useMemo(() => {
    const raw = buildNodes(props)
    return arrangeNodes(raw)
  }, [props.memories, props.knowledge, props.projects, props.goals])

  const handleNodeClick = useCallback((node: BrainNodeData) => {
    setSelectedNode(node)
  }, [])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <Scene3D cameraPosition={[0, 0, 4]}>
        <BrainScene nodes={nodes} onNodeClick={handleNodeClick} />
      </Scene3D>

      {/* Category legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-slate-400">{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}</span>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div
          className="absolute top-4 right-4 w-64 rounded-xl p-4 animate-slide-in"
          style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(8,13,26,0.98) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: CATEGORY_COLORS[selectedNode.category] }}
              />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                {CATEGORY_LABELS[selectedNode.category]}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
            >
              ✕
            </button>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{selectedNode.label}</h3>
          {selectedNode.description && (
            <p className="text-xs text-slate-400 leading-relaxed">{selectedNode.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Importance</span>
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${selectedNode.importance * 10}%`,
                  background: CATEGORY_COLORS[selectedNode.category],
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400">{selectedNode.importance}/10</span>
          </div>
        </div>
      )}
    </div>
  )
}
