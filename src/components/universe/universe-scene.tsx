"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Stars, Billboard } from "@react-three/drei"
import * as THREE from "three"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface Journal {
  id: string
  name: string
  paperCount: number
  description?: string | null
  totalPopularity: number
  combatPower: number
}

interface UniverseSceneProps {
  journals: Journal[]
  currentSeason: {
    id: string
    name: string
  }
}

// Utility to create text texture
function createTextTexture(text: string) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const fontSize = 64
  const padding = 20
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`
  const textWidth = ctx.measureText(text).width
  
  canvas.width = textWidth + padding * 2
  canvas.height = fontSize + padding * 2

  ctx.fillStyle = 'rgba(0, 0, 0, 0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 3

  ctx.fillStyle = 'white'
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  
  const aspect = canvas.width / canvas.height
  return { texture, aspect }
}

function JournalLabel({ text, size }: { text: string, size: number }) {
  const { texture, aspect } = useMemo(() => {
    return createTextTexture(text) || { texture: null, aspect: 1 }
  }, [text])

  if (!texture) return null

  // Adjust label size relative to planet
  const scaleY = Math.max(0.6, size * 0.4)
  const scaleX = scaleY * aspect

  return (
    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
      <mesh position={[0, 0, size + 0.1]}>
        <planeGeometry args={[scaleX, scaleY]} />
        <meshBasicMaterial 
          map={texture} 
          transparent 
          depthTest={false} 
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Billboard>
  )
}

function JournalPlanet({ 
  journal, 
  targetPosition, // Changed from static position to target
  size,
  maxPopularity,
  onSelect
}: { 
  journal: Journal
  targetPosition: THREE.Vector3
  size: number 
  maxPopularity: number
  onSelect: (journal: Journal) => void
}) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Current position state for smooth lerping
  const currentPos = useRef(targetPosition.clone())
  
  // Create noise texture for displacement to make planet bumpy
  const displacementMap = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const imageData = ctx.createImageData(128, 128)
      for (let i = 0; i < imageData.data.length; i += 4) {
        const val = Math.random() * 255
        imageData.data[i] = val
        imageData.data[i + 1] = val
        imageData.data[i + 2] = val
        imageData.data[i + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])
  
  const color = useMemo(() => {
    let hash = 0
    for (let i = 0; i < journal.name.length; i++) {
      hash = journal.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase()
    return "#" + "00000".substring(0, 6 - c.length) + c
  }, [journal.name])

  const emissiveIntensity = useMemo(() => {
    const base = 0.2
    if (maxPopularity === 0) return base
    const ratio = journal.totalPopularity / maxPopularity
    const intensity = base + ratio * 2.5 
    return hovered ? intensity + 0.8 : intensity
  }, [journal.totalPopularity, maxPopularity, hovered])

  // Random rotation speed and axis
  const rotationAxis = useMemo(() => new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), [])
  const rotationSpeed = useMemo(() => 0.1 + Math.random() * 0.2, [])
  
  // Random phase for floating animation
  const floatPhase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state, delta) => {
    if (meshRef.current && groupRef.current) {
      // 1. Smooth movement to target position (Lerp)
      // Lerp factor controls the "lag" or "weight" of the movement
      // Heavier (larger) planets could move slower? For now, constant speed.
      currentPos.current.lerp(targetPosition, delta * 2) 
      groupRef.current.position.copy(currentPos.current)

      // 2. Add gentle floating motion (manually instead of Float component)
      // This fixes the "jumping" issue on hover because it's additive to the base position
      const time = state.clock.getElapsedTime()
      const floatY = Math.sin(time + floatPhase) * 0.2 // Small vertical float
      groupRef.current.position.y += floatY

      // 3. Self rotation
      meshRef.current.rotateOnAxis(rotationAxis, rotationSpeed * delta)
      
      // 4. Hover scaling effect
      const targetScale = hovered ? 1.2 : 1.0
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10)
    }
  })

  return (
    <group ref={groupRef} position={targetPosition}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(journal)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'default'
          setHovered(false)
        }}
      >
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.6}
          metalness={0.4}
          displacementMap={displacementMap}
          displacementScale={0.15}
          bumpMap={displacementMap}
          bumpScale={0.1}
        />
      </mesh>
      
      <JournalLabel text={journal.name} size={size} />
    </group>
  )
}

function SceneContent({ journals, onSelect }: { journals: Journal[], onSelect: (j: Journal) => void }) {
  const [positions, setPositions] = useState<{id: string, pos: THREE.Vector3, size: number}[]>([])
  
  const maxPopularity = useMemo(() => {
    return Math.max(...journals.map(j => j.totalPopularity), 1)
  }, [journals])

  // Initialize positions based on constrained random walk
  // Only re-run if journal IDs change (structure changes), not when properties like combatPower change
  const journalIdsHash = journals.map(j => j.id).join(',')
  
  useEffect(() => {
    const newPositions: {id: string, pos: THREE.Vector3, size: number}[] = []
    
    // Starting position (center of the universe)
    // Randomize start position slightly to avoid always starting exactly at 0,0,0
    let currentPos = new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50
    )
    const maxRadius = 150 // Boundary radius
    const stepSizeBase = 20 // Increased distance between related journals to spread them out more

    journals.forEach((journal) => {
      const size = 1.2 + Math.log10(Math.max(1, journal.paperCount)) * 1.5
      
      // Generate a random direction vector
      // Bias slightly towards keeping the current general direction to create "streams"
      const randomDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize()

      // Calculate next position
      // Add randomness to step size
      const stepSize = stepSizeBase + (Math.random() - 0.5) * 10
      let nextPos = currentPos.clone().add(randomDir.multiplyScalar(stepSize))

      // Check boundary: if too far, pull back towards center
      if (nextPos.length() > maxRadius) {
        const directionToCenter = new THREE.Vector3(0, 0, 0).sub(currentPos).normalize()
        // Mix the random direction with the direction to center
        // Stronger pull back
        const correctedDir = randomDir.add(directionToCenter.multiplyScalar(2.0)).normalize()
        nextPos = currentPos.clone().add(correctedDir.multiplyScalar(stepSize))
      }

      // Apply some local jitter so they aren't perfectly on a line
      // Reduced jitter relative to step size to keep the "chain" more visible but still organic
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      )
      
      const finalPos = nextPos.clone().add(jitter)

      newPositions.push({
        id: journal.id,
        pos: finalPos,
        size
      })

      // Update currentPos for the next iteration
      // We use nextPos (without jitter) as the anchor for the next point to maintain the "backbone"
      currentPos = nextPos
    })

    setPositions(newPositions)
  }, [journalIdsHash]) // Only depend on IDs hash to prevent re-calc on combat power update

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffaa00" distance={100} decay={2} />
      <pointLight position={[50, 50, 50]} intensity={1} color="#ffffff" />
      <pointLight position={[-50, -50, -50]} intensity={0.5} color="#4444ff" />
      
      <Stars radius={300} depth={100} count={10000} factor={6} saturation={0.5} fade speed={0.5} />
      
      {journals.map((journal) => {
        const posData = positions.find(p => p.id === journal.id)
        if (!posData) return null
        
        return (
          <JournalPlanet 
            key={journal.id} 
            journal={journal} 
            targetPosition={posData.pos} 
            size={posData.size} 
            maxPopularity={maxPopularity}
            onSelect={onSelect}
          />
        )
      })}
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true} 
        autoRotate={false}
        minDistance={5}
        maxDistance={500}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.DOLLY
        }}
      />
    </>
  )
}

import { UniverseHUD } from "./hud/universe-hud"

export default function UniverseScene({ journals, currentSeason }: UniverseSceneProps) {
  const router = useRouter()
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null)
  const [localJournals, setLocalJournals] = useState(journals)

  // Handle scrollbar hiding
  useEffect(() => {
    // Add no-scroll class to body and html
    document.body.classList.add('no-scroll')
    document.documentElement.classList.add('no-scroll')
    
    return () => {
      document.body.classList.remove('no-scroll')
      document.documentElement.classList.remove('no-scroll')
    }
  }, [])

  useEffect(() => {
    setLocalJournals(journals)
  }, [journals])

  // Callback to update local state when combat power changes
  const handleCombatUpdate = (journalId: string, newPower: number) => {
    setLocalJournals(prev => prev.map(j => 
      j.id === journalId ? { ...j, combatPower: newPower } : j
    ))
    // Also update selected journal if it matches
    if (selectedJournal?.id === journalId) {
      setSelectedJournal(prev => prev ? { ...prev, combatPower: newPower } : null)
    }
  }

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 20, 100], fov: 60 }}>
        <SceneContent 
          journals={localJournals} 
          onSelect={setSelectedJournal} 
        />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => router.back()} 
            className="pointer-events-auto p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
            aria-label="返回"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white opacity-80 tracking-widest drop-shadow-md">
              {currentSeason.name}
            </h1>
            <p className="text-white/60 mt-2 text-sm max-w-md">
              探索期刊星系。滚轮缩放，左键旋转，中键平移。
            </p>
          </div>
        </div>
      </div>

      <UniverseHUD 
        currentJournal={selectedJournal} 
        currentSeason={currentSeason}
        onLeave={() => setSelectedJournal(null)} 
        onCombatUpdate={handleCombatUpdate}
      />
    </div>
  )
}
