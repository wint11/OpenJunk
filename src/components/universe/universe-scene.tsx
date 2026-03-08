"use client"

import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Billboard } from "@react-three/drei"
import * as THREE from "three"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createNoise3D } from "simplex-noise"

// 柏林噪声生成器实例
const noise3D = createNoise3D()

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

// 分层布朗噪声 (fBm) - 叠加多层噪声创建更自然的纹理
function fbm3D(x: number, y: number, z: number, octaves: number = 4, persistence: number = 0.5, lacunarity: number = 2.0): number {
  let total = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0
  
  for (let i = 0; i < octaves; i++) {
    total += noise3D(x * frequency, y * frequency, z * frequency) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }
  
  return total / maxValue
}

// 生成星球纹理数据
interface PlanetTextureData {
  colorMap: THREE.DataTexture
  displacementMap: THREE.DataTexture
  bumpMap: THREE.DataTexture
  roughnessMap: THREE.DataTexture
}

function generatePlanetTextures(
  seed: string, 
  popularityRatio: number, 
  resolution: number = 512
): PlanetTextureData {
  const size = resolution * resolution
  const colorData = new Uint8Array(size * 4)
  const displacementData = new Uint8Array(size * 4)
  const bumpData = new Uint8Array(size * 4)
  const roughnessData = new Uint8Array(size * 4)
  
  // 基于种子创建独特的噪声偏移
  let seedHash = 0
  for (let i = 0; i < seed.length; i++) {
    seedHash = seed.charCodeAt(i) + ((seedHash << 5) - seedHash)
  }
  const offsetX = (seedHash % 1000) / 100
  const offsetY = ((seedHash >> 8) % 1000) / 100
  const offsetZ = ((seedHash >> 16) % 1000) / 100
  
  // 生成基础颜色（基于种子）
  const baseHue = Math.abs(seedHash % 360) / 360
  
  // 根据热度计算饱和度倍数（热度越高，饱和度越高）
  // 基础饱和度 0.4（较暗淡），最高可达 1.8 倍（非常鲜艳）
  const saturationMultiplier = 0.4 + popularityRatio * 1.4
  
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const idx = (y * resolution + x) * 4
      
      // 将球面纹理坐标转换为3D球面坐标
      const u = x / resolution
      const v = y / resolution
      
      const theta = u * Math.PI * 2
      const phi = v * Math.PI
      
      const px = Math.sin(phi) * Math.cos(theta)
      const py = Math.cos(phi)
      const pz = Math.sin(phi) * Math.sin(theta)
      
      // 使用fBm生成分层噪声
      const noise1 = fbm3D(px + offsetX, py + offsetY, pz + offsetZ, 6, 0.5, 2.0)
      const noise2 = fbm3D(px * 2 + offsetX, py * 2 + offsetY, pz * 2 + offsetZ, 4, 0.5, 2.0)
      const noise3 = fbm3D(px * 4 + offsetX, py * 4 + offsetY, pz * 4 + offsetZ, 3, 0.5, 2.0)
      
      // 组合噪声（大尺度地形 + 中尺度细节 + 小尺度粗糙度）
      const combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2
      
      // 将噪声映射到0-1范围
      const height = (combinedNoise + 1) / 2
      
      // 生成地形颜色（基于高度）- 使用更协调的配色方案
      let r: number, g: number, b: number
      
      if (height < 0.35) {
        // 深海 - 深邃的紫蓝色
        const t = height / 0.35
        r = 25 + t * 35
        g = 20 + t * 50
        b = 80 + t * 120
      } else if (height < 0.45) {
        // 浅海 - 清澈的青色
        const t = (height - 0.35) / 0.1
        r = 60 + t * 70
        g = 120 + t * 100
        b = 180 + t * 40
      } else if (height < 0.5) {
        // 沙滩 - 温暖的沙色
        const t = (height - 0.35) / 0.15
        r = 210 + t * 30
        g = 180 + t * 20
        b = 140 + t * 20
      } else if (height < 0.7) {
        // 草地/平原 - 清新的薄荷绿到森林绿
        const t = (height - 0.5) / 0.2
        r = 80 + t * 60
        g = 160 + t * 40
        b = 100 - t * 30
      } else if (height < 0.85) {
        // 山地 - 岩石的灰褐色到深灰
        const t = (height - 0.7) / 0.15
        r = 120 + t * 60
        g = 110 + t * 50
        b = 100 + t * 50
      } else {
        // 雪顶 - 纯净的白色带微蓝
        const t = (height - 0.85) / 0.15
        r = 240 + t * 15
        g = 245 + t * 10
        b = 250 + t * 5
      }
      
      // 添加一些颜色变化（基于基础色调）
      const hueShift = baseHue * 60 - 30
      let shiftedColor = shiftHue(r, g, b, hueShift)
      
      // 根据热度调整饱和度（热度越高，颜色越鲜艳）
      shiftedColor = adjustSaturation(shiftedColor.r, shiftedColor.g, shiftedColor.b, saturationMultiplier)
      
      // 颜色贴图
      colorData[idx] = shiftedColor.r
      colorData[idx + 1] = shiftedColor.g
      colorData[idx + 2] = shiftedColor.b
      colorData[idx + 3] = 255
      
      // 位移贴图（高度图）
      const displacementValue = Math.floor(height * 255)
      displacementData[idx] = displacementValue
      displacementData[idx + 1] = displacementValue
      displacementData[idx + 2] = displacementValue
      displacementData[idx + 3] = 255
      
      // 凹凸贴图
      const bumpValue = Math.floor(noise3 * 127 + 128)
      bumpData[idx] = bumpValue
      bumpData[idx + 1] = bumpValue
      bumpData[idx + 2] = bumpValue
      bumpData[idx + 3] = 255
      
      // 粗糙度贴图（水面光滑，山地粗糙）
      const roughness = height < 0.45 ? 0.1 : 0.3 + height * 0.5
      const roughnessValue = Math.floor(roughness * 255)
      roughnessData[idx] = roughnessValue
      roughnessData[idx + 1] = roughnessValue
      roughnessData[idx + 2] = roughnessValue
      roughnessData[idx + 3] = 255
    }
  }
  
  // 创建纹理
  const colorMap = new THREE.DataTexture(colorData, resolution, resolution, THREE.RGBAFormat)
  const displacementMap = new THREE.DataTexture(displacementData, resolution, resolution, THREE.RGBAFormat)
  const bumpMap = new THREE.DataTexture(bumpData, resolution, resolution, THREE.RGBAFormat)
  const roughnessMap = new THREE.DataTexture(roughnessData, resolution, resolution, THREE.RGBAFormat)
  
  // 设置纹理参数
  colorMap.needsUpdate = true
  displacementMap.needsUpdate = true
  bumpMap.needsUpdate = true
  roughnessMap.needsUpdate = true
  
  colorMap.colorSpace = THREE.SRGBColorSpace
  
  return { colorMap, displacementMap, bumpMap, roughnessMap }
}

// 调整饱和度辅助函数
function adjustSaturation(r: number, g: number, b: number, multiplier: number): { r: number, g: number, b: number } {
  // 转换为HSL
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r / 255: h = ((g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0)) / 6; break
      case g / 255: h = ((b / 255 - r / 255) / d + 2) / 6; break
      case b / 255: h = ((r / 255 - g / 255) / d + 4) / 6; break
    }
  }
  
  // 调整饱和度
  s = Math.min(1, s * multiplier)
  
  // 转换回RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  }
}

// HSL颜色辅助函数
function shiftHue(r: number, g: number, b: number, shift: number): { r: number, g: number, b: number } {
  // 转换为HSL
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  let h = 0, s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r / 255: h = ((g / 255 - b / 255) / d + (g / 255 < b / 255 ? 6 : 0)) / 6; break
      case g / 255: h = ((b / 255 - r / 255) / d + 2) / 6; break
      case b / 255: h = ((r / 255 - g / 255) / d + 4) / 6; break
    }
  }
  
  // 偏移色相
  h = (h + shift / 360) % 1
  if (h < 0) h += 1
  
  // 转换回RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
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
  targetPosition,
  size,
  maxPopularity,
  onSelect,
  onLoad
}: { 
  journal: Journal
  targetPosition: THREE.Vector3
  size: number 
  maxPopularity: number
  onSelect: (journal: Journal) => void
  onLoad?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [planetTextures, setPlanetTextures] = useState<PlanetTextureData | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Current position state for smooth lerping
  const currentPos = useRef(targetPosition.clone())
  
  // 计算热度比例
  const popularityRatio = useMemo(() => {
    if (maxPopularity === 0) return 0
    return journal.totalPopularity / maxPopularity
  }, [journal.totalPopularity, maxPopularity])
  
  // 异步生成星球纹理，避免阻塞渲染
  useEffect(() => {
    let isCancelled = false
    
    const generateTextures = async () => {
      // 使用较长的延迟确保 UI 有机会更新
      // 索引越靠后的星球延迟越长，实现分批加载效果
      const index = parseInt(journal.id, 36) % 100
      await new Promise(resolve => setTimeout(resolve, 50 + index * 20))
      
      if (isCancelled) return
      
      const textures = generatePlanetTextures(journal.name, popularityRatio, 256)
      
      if (!isCancelled) {
        setPlanetTextures(textures)
        onLoad?.()
      }
    }
    
    generateTextures()
    
    return () => {
      isCancelled = true
    }
  }, [journal.name, popularityRatio, onLoad, journal.id])
  
  // 移除发光效果，只保留放大逻辑
  const emissiveIntensity = 0

  // Random rotation speed and axis (使用种子确保一致性)
  const rotationAxis = useMemo(() => {
    const seed = journal.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const rnd = () => {
      const x = Math.sin(seed * 12.9898) * 43758.5453
      return x - Math.floor(x)
    }
    return new THREE.Vector3(rnd(), rnd(), rnd()).normalize()
  }, [journal.name])
  
  const rotationSpeed = useMemo(() => {
    const seed = journal.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const rnd = Math.sin(seed * 78.233) * 43758.5453
    return 0.05 + (rnd - Math.floor(rnd)) * 0.1
  }, [journal.name])
  
  // Random phase for floating animation (使用种子确保一致性)
  const floatPhase = useMemo(() => {
    const seed = journal.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const rnd = Math.sin(seed * 45.123) * 43758.5453
    return (rnd - Math.floor(rnd)) * Math.PI * 2
  }, [journal.name])

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

  // 如果纹理还未生成完成，显示一个占位球体
  if (!planetTextures) {
    return (
      <group ref={groupRef} position={targetPosition}>
        <mesh>
          <sphereGeometry args={[size, 32, 32]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
      </group>
    )
  }

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
        <sphereGeometry args={[size, 128, 128]} />
        <meshStandardMaterial 
          map={planetTextures.colorMap}
          emissive={new THREE.Color(0xffffff)}
          emissiveIntensity={emissiveIntensity}
          roughnessMap={planetTextures.roughnessMap}
          roughness={0.8}
          metalness={0.1}
          displacementMap={planetTextures.displacementMap}
          displacementScale={size * 0.15}
          bumpMap={planetTextures.bumpMap}
          bumpScale={0.05}
        />
      </mesh>
      
      <JournalLabel text={journal.name} size={size} />
    </group>
  )
}

// 伪随机数生成器（基于种子）
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 12.9898 + 78.233) * 43758.5453
    return s - Math.floor(s)
  }
}

function SceneContent({ 
  journals, 
  onSelect, 
  onPlanetLoad 
}: { 
  journals: Journal[], 
  onSelect: (j: Journal) => void
  onPlanetLoad?: () => void
}) {
  const maxPopularity = useMemo(() => {
    return Math.max(...journals.map(j => j.totalPopularity), 1)
  }, [journals])

  // 使用 useMemo 计算位置，避免 useEffect + setState 的级联渲染问题
  const positions = useMemo(() => {
    const newPositions: {id: string, pos: THREE.Vector3, size: number}[] = []
    
    // 基于期刊列表生成确定性种子
    const seed = journals.map(j => j.id).join('').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const rnd = seededRandom(seed)
    
    // Starting position (center of the universe)
    let currentPos = new THREE.Vector3(
      (rnd() - 0.5) * 50,
      (rnd() - 0.5) * 50,
      (rnd() - 0.5) * 50
    )
    const maxRadius = 150
    const stepSizeBase = 20

    journals.forEach((journal) => {
      const size = 1.2 + Math.log10(Math.max(1, journal.paperCount)) * 1.5
      
      const randomDir = new THREE.Vector3(
        (rnd() - 0.5) * 2,
        (rnd() - 0.5) * 2,
        (rnd() - 0.5) * 2
      ).normalize()

      const stepSize = stepSizeBase + (rnd() - 0.5) * 10
      let nextPos = currentPos.clone().add(randomDir.multiplyScalar(stepSize))

      if (nextPos.length() > maxRadius) {
        const directionToCenter = new THREE.Vector3(0, 0, 0).sub(currentPos).normalize()
        const correctedDir = randomDir.add(directionToCenter.multiplyScalar(2.0)).normalize()
        nextPos = currentPos.clone().add(correctedDir.multiplyScalar(stepSize))
      }

      const jitter = new THREE.Vector3(
        (rnd() - 0.5) * 15,
        (rnd() - 0.5) * 15,
        (rnd() - 0.5) * 15
      )
      
      const finalPos = nextPos.clone().add(jitter)

      newPositions.push({
        id: journal.id,
        pos: finalPos,
        size
      })

      currentPos = nextPos
    })

    return newPositions
  }, [journals])

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
            onLoad={onPlanetLoad}
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
import { X, Gamepad2, Target, Zap, Trophy } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { gameGuideConfig, type GuideSection } from "./game-guide-config"

// 图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  Zap,
  Trophy
}

// Markdown 组件样式配置
const markdownComponents = {
  strong: ({ children }: { children?: React.ReactNode }) => (
    <span className="font-semibold text-zinc-100">{children}</span>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-1 mt-2 text-zinc-400">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm">{children}</li>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>
  )
}

// 玩法介绍模态框组件 - 使用项目统一的 zinc 风格
function GameGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  
  const config = gameGuideConfig
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* 头部 */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 border-2 border-blue-400/50 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]"></div>
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 z-10">
                <Gamepad2 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{config.title}</h2>
              <p className="text-zinc-400 text-sm mt-0.5">{config.subtitle}</p>
            </div>
          </div>
        </div>
        
        {/* 内容 - 可滚动 */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid gap-3">
            {config.sections.map((section: GuideSection, index: number) => {
              const IconComponent = iconMap[section.icon]
              return (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="p-2 rounded-lg bg-zinc-700/50 shrink-0">
                    {IconComponent && <IconComponent className="w-4 h-4 text-zinc-300" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-200 text-sm">{section.title}</h3>
                    <div className="mt-1.5 prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown components={markdownComponents}>
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="pt-3 border-t border-white/5">
            <p className="text-xs text-zinc-500 text-center">
              {config.footer}
            </p>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="p-6 pt-0 shrink-0">
          <Button 
            onClick={onClose}
            className="w-full"
          >
            {config.buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function UniverseScene({ journals, currentSeason }: UniverseSceneProps) {
  const router = useRouter()
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null)
  
  // 星球加载状态
  const [loadedCount, setLoadedCount] = useState(0)
  const totalPlanets = journals.length
  const isAllLoaded = loadedCount >= totalPlanets
  
  // 玩法介绍模态框状态
  const [showGuide, setShowGuide] = useState(false)
  const hasShownGuideRef = useRef(false)

  // 加载完成后自动显示玩法介绍
  useEffect(() => {
    if (isAllLoaded && !hasShownGuideRef.current) {
      hasShownGuideRef.current = true
      // 延迟一点显示，让用户看到加载完成的瞬间
      const timer = setTimeout(() => {
        setShowGuide(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isAllLoaded])

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

  // Callback to update local state when combat power changes
  const handleCombatUpdate = (journalId: string, newPower: number) => {
    // Also update selected journal if it matches
    if (selectedJournal?.id === journalId) {
      setSelectedJournal(prev => prev ? { ...prev, combatPower: newPower } : null)
    }
  }
  
  // 处理星球加载完成
  const handlePlanetLoad = useCallback(() => {
    setLoadedCount(prev => prev + 1)
  }, [])

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 20, 100], fov: 60 }}>
        <SceneContent 
          journals={journals} 
          onSelect={setSelectedJournal}
          onPlanetLoad={handlePlanetLoad}
        />
      </Canvas>
      
      {/* 星球渲染加载提示 - 放在Canvas外部 */}
      {!isAllLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-blue-400"></div>
              <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full border-4 border-transparent border-t-purple-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white">正在生成星球表面...</p>
              <p className="text-sm text-white/60 mt-1">
                {loadedCount} / {totalPlanets} 个星球已就绪
              </p>
              <div className="w-48 h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300"
                  style={{ width: `${totalPlanets > 0 ? (loadedCount / totalPlanets) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
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
      
      {/* 玩法介绍模态框 */}
      <GameGuideModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
      />
    </div>
  )
}
