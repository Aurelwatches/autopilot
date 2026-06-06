import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ── Rounded-rect extrude helper ───────────────────────────────────────────────
// Gives us proper rounded corners without any extra deps.
function roundedBoxGeometry(w, h, d, r) {
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2 + r, -h / 2)
  shape.lineTo( w / 2 - r, -h / 2)
  shape.quadraticCurveTo( w / 2, -h / 2,  w / 2, -h / 2 + r)
  shape.lineTo( w / 2,  h / 2 - r)
  shape.quadraticCurveTo( w / 2,  h / 2,  w / 2 - r,  h / 2)
  shape.lineTo(-w / 2 + r,  h / 2)
  shape.quadraticCurveTo(-w / 2,  h / 2, -w / 2,  h / 2 - r)
  shape.lineTo(-w / 2, -h / 2 + r)
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize:      0.035,
    bevelSegments:  6,
  })
  geo.center()
  return geo
}

// ── Screen canvas texture ──────────────────────────────────────────────────────
function makeScreenTexture() {
  const W = 512, H = 896
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  // Subtle top-status-bar line
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, W, 60)

  // Logo mark (the arrow icon from the app)
  const cx = W / 2, cy = H / 2 - 60
  ctx.save()
  ctx.strokeStyle = '#f5f5f7'
  ctx.lineWidth = 14
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // Draw the AutoPilot arrow icon: 16 2 → 9.5 8.5 → 16 2 → 11 16 → 9.5 8.5 → 16 2 → 2 6.5
  // Scaled from viewBox="0 0 18 18" to fit
  const scale = 9, ox = cx - 9, oy = cy - 80
  const path = new Path2D()
  path.moveTo(ox + 16 * scale / 18, oy + 2 * scale / 18)
  path.lineTo(ox + 9.5 * scale / 18, oy + 8.5 * scale / 18)
  path.moveTo(ox + 16 * scale / 18, oy + 2 * scale / 18)
  path.lineTo(ox + 11 * scale / 18, oy + 16 * scale / 18)
  path.lineTo(ox + 9.5 * scale / 18, oy + 8.5 * scale / 18)
  path.moveTo(ox + 16 * scale / 18, oy + 2 * scale / 18)
  path.lineTo(ox + 2 * scale / 18,  oy + 6.5 * scale / 18)
  path.lineTo(ox + 9.5 * scale / 18, oy + 8.5 * scale / 18)
  ctx.stroke(path)
  ctx.restore()

  // Brand name
  ctx.fillStyle = '#f5f5f7'
  ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AutoPilot', cx, cy + 40)

  // Tagline
  ctx.fillStyle = '#6e6e73'
  ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('AI for restaurants', cx, cy + 90)

  // Bottom pill button hint
  const bx = cx, by = cy + 200, bw = 260, bh = 60, br = 30
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, br)
  ctx.fill()
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText('Get started', bx, by + 9)

  return new THREE.CanvasTexture(cv)
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ThreeBox() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let W = el.offsetWidth, H = el.offsetHeight

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000)
    el.appendChild(renderer.domElement)

    // ── Scene & camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100)
    camera.position.set(0, 0.6, 8)
    camera.lookAt(0, 0, 0)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))

    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(4, 6, 3)
    scene.add(key)

    const fill = new THREE.DirectionalLight(0x8899ff, 0.25)
    fill.position.set(-3, 2, 2)
    scene.add(fill)

    // ── Device body ───────────────────────────────────────────────────────────
    const bodyGeo = roundedBoxGeometry(2.2, 4.0, 0.18, 0.22)
    // ExtrudeGeometry groups: 0 = front, 1 = back, 2 = sides
    const screenTex = makeScreenTexture()
    const materials = [
      new THREE.MeshStandardMaterial({ map: screenTex, roughness: 0.08, metalness: 0.05 }),  // front face
      new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.3, metalness: 0.8 }),   // back face
      new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.25, metalness: 0.9, envMapIntensity: 1.2 }), // sides/bevel
    ]
    const device = new THREE.Mesh(bodyGeo, materials)
    device.rotation.x = -0.22  // tilt to see top
    scene.add(device)

    // ── Subtle reflection plane (floor) ───────────────────────────────────────
    const mirrorGeo = new THREE.PlaneGeometry(6, 6)
    const mirrorMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.03,
    })
    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat)
    mirror.rotation.x = -Math.PI / 2
    mirror.position.y = -2.6
    scene.add(mirror)

    // ── Animation loop ────────────────────────────────────────────────────────
    let raf
    const clock = new THREE.Clock()
    function tick() {
      raf = requestAnimationFrame(tick)
      device.rotation.y = clock.getElapsedTime() * 0.4
      renderer.render(scene, camera)
    }
    tick()

    // ── Resize ────────────────────────────────────────────────────────────────
    function onResize() {
      W = el.offsetWidth; H = el.offsetHeight
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', minHeight: 500 }}
    />
  )
}
