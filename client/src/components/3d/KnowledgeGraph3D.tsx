import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Scene3D } from './Scene3D'

interface GraphNode {
  id: string
  label: string
  type: 'idea' | 'project' | 'knowledge' | 'lead' | 'goal'
  importance: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

interface GraphEdge {
  source: string
  target: string
}

interface KnowledgeGraph3DProps {
  ideas?: Array<{ id: string; title: string; status: string }>
  projects?: Array<{ id: string; name: string; status: string }>
  knowledge?: Array<{ id: string; title: string; type: string }>
  leads?: Array<{ id: string; name: string; company: string }>
  goals?: Array<{ id: string; title: string; completed: boolean }>
  onNodeClick?: (node: GraphNode) => void
}

const TYPE_COLORS: Record<string, string> = {
  idea: '#f59e0b',
  project: '#10b981',
  knowledge: '#8b5cf6',
  lead: '#06b6d4',
  goal: '#f43f5e',
}

const TYPE_LABELS: Record<string, string> = {
  idea: 'Ideas',
  project: 'Projects',
  knowledge: 'Knowledge',
  lead: 'Leads',
  goal: 'Goals',
}

/**
 * Build graph nodes and edges from API data.
 */
function buildGraph(props: KnowledgeGraph3DProps): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Add nodes
  props.ideas?.slice(0, 8).forEach((idea, i) => {
    const angle = (i / 8) * Math.PI * 2
    nodes.push({
      id: `idea-${idea.id}`,
      label: idea.title.slice(0, 30),
      type: 'idea',
      importance: idea.status === 'launched' ? 9 : idea.status === 'building' ? 7 : 5,
      x: Math.cos(angle) * 1.5,
      y: Math.sin(angle) * 1.5,
      z: (Math.random() - 0.5) * 0.5,
      vx: 0, vy: 0, vz: 0,
    })
  })

  props.projects?.slice(0, 6).forEach((proj, i) => {
    const angle = (i / 6) * Math.PI * 2 + 0.5
    nodes.push({
      id: `proj-${proj.id}`,
      label: proj.name.slice(0, 25),
      type: 'project',
      importance: proj.status === 'active' ? 8 : 5,
      x: Math.cos(angle) * 2,
      y: Math.sin(angle) * 2,
      z: (Math.random() - 0.5) * 0.5,
      vx: 0, vy: 0, vz: 0,
    })
  })

  props.knowledge?.slice(0, 6).forEach((kb, i) => {
    const angle = (i / 6) * Math.PI * 2 + 1
    nodes.push({
      id: `kb-${kb.id}`,
      label: kb.title.slice(0, 25),
      type: 'knowledge',
      importance: 6,
      x: Math.cos(angle) * 1.8,
      y: Math.sin(angle) * 1.8,
      z: (Math.random() - 0.5) * 0.5,
      vx: 0, vy: 0, vz: 0,
    })
  })

  props.leads?.slice(0, 5).forEach((lead, i) => {
    const angle = (i / 5) * Math.PI * 2 + 1.5
    nodes.push({
      id: `lead-${lead.id}`,
      label: lead.name.slice(0, 20),
      type: 'lead',
      importance: 5,
      x: Math.cos(angle) * 2.2,
      y: Math.sin(angle) * 2.2,
      z: (Math.random() - 0.5) * 0.5,
      vx: 0, vy: 0, vz: 0,
    })
  })

  props.goals?.slice(0, 4).forEach((goal, i) => {
    const angle = (i / 4) * Math.PI * 2 + 2
    nodes.push({
      id: `goal-${goal.id}`,
      label: goal.title.slice(0, 25),
      type: 'goal',
      importance: goal.completed ? 4 : 9,
      x: Math.cos(angle) * 1.2,
      y: Math.sin(angle) * 1.2,
      z: (Math.random() - 0.5) * 0.5,
      vx: 0, vy: 0, vz: 0,
    })
  })

  // Create edges: connect ideas to projects, projects to knowledge, etc.
  const ideaNodes = nodes.filter(n => n.type === 'idea')
  const projNodes = nodes.filter(n => n.type === 'project')
  const kbNodes = nodes.filter(n => n.type === 'knowledge')
  const goalNodes = nodes.filter(n => n.type === 'goal')

  // Idea → Project connections
  ideaNodes.forEach((idea, i) => {
    if (projNodes[i]) {
      edges.push({ source: idea.id, target: projNodes[i].id })
    }
  })

  // Project → Knowledge connections
  projNodes.forEach((proj, i) => {
    if (kbNodes[i % kbNodes.length]) {
      edges.push({ source: proj.id, target: kbNodes[i % kbNodes.length].id })
    }
  })

  // Goal → Idea connections
  goalNodes.forEach((goal, i) => {
    if (ideaNodes[i]) {
      edges.push({ source: goal.id, target: ideaNodes[i].id })
    }
  })

  return { nodes, edges }
}

/**
 * Simple force simulation in useFrame.
 */
function ForceSimulation({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  useFrame(() => {
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dz = nodes[j].z - nodes[i].z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
        const force = 0.001 / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const fz = (dz / dist) * force
        nodes[i].vx -= fx
        nodes[i].vy -= fy
        nodes[i].vz -= fz
        nodes[j].vx += fx
        nodes[j].vy += fy
        nodes[j].vz += fz
      }
    }

    // Spring force along edges
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) return
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dz = target.z - source.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
      const targetDist = 1.5
      const force = (dist - targetDist) * 0.005
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      const fz = (dz / dist) * force
      source.vx += fx
      source.vy += fy
      source.vz += fz
      target.vx -= fx
      target.vy -= fy
      target.vz -= fz
    })

    // Center gravity
    nodes.forEach(node => {
      node.vx -= node.x * 0.001
      node.vy -= node.y * 0.001
      node.vz -= node.z * 0.001

      // Apply velocity with damping
      node.x += node.vx
      node.y += node.vy
      node.z += node.vz
      node.vx *= 0.95
      node.vy *= 0.95
      node.vz *= 0.95
    })
  })

  return null
}

/**
 * Renderable graph node.
 */
function GraphNodeMesh({
  node,
  onClick,
}: {
  node: GraphNode
  onClick?: () => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const color = TYPE_COLORS[node.type] || '#6366f1'

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(node.x, node.y, node.z)
    const s = hovered ? 0.12 : 0.06 + (node.importance / 10) * 0.04
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1)
  })

  return (
    <mesh
      ref={ref}
      onClick={onClick}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.6 : 0.3}
        metalness={0.3}
        roughness={0.4}
      />
      {hovered && (
        <Html center distanceFactor={5} style={{ pointerEvents: 'none' }}>
          <div
            className="px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
            style={{
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {node.label}
          </div>
        </Html>
      )}
    </mesh>
  )
}

/**
 * Render edges as lines.
 */
function GraphEdges({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <>
      {edges.map((edge, i) => {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        if (!source || !target) return null
        return (
          <Line
            key={i}
            points={[
              [source.x, source.y, source.z],
              [target.x, target.y, target.z],
            ]}
            color="#6366f1"
            lineWidth={0.5}
            transparent
            opacity={0.1}
          />
        )
      })}
    </>
  )
}

/**
 * 3D Knowledge Graph — force-directed visualization of all entities.
 */
export default function KnowledgeGraph3D(props: KnowledgeGraph3DProps) {
  const { nodes, edges } = useMemo(() => buildGraph(props), [
    props.ideas, props.projects, props.knowledge, props.leads, props.goals,
  ])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <Scene3D cameraPosition={[0, 0, 5]}>
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.15}
        />

        <ForceSimulation nodes={nodes} edges={edges} />
        <GraphEdges nodes={nodes} edges={edges} />

        {nodes.map((node) => (
          <GraphNodeMesh
            key={node.id}
            node={node}
            onClick={() => props.onNodeClick?.(node)}
          />
        ))}
      </Scene3D>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-slate-400">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
