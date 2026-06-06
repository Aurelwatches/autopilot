import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ── Canvas helpers ────────────────────────────────────────────────────────────
function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x,     y + h, x,       y + h - r, r)
  ctx.lineTo(x,     y + r)
  ctx.arcTo(x,     y,     x + r,   y,         r)
  ctx.closePath()
}

function makeCardTexture(dotColor, line1, line2) {
  const W = 480, H = 100
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')

  // Background
  rrPath(ctx, 3, 3, W - 6, H - 6, 16)
  ctx.fillStyle = 'rgba(16,16,16,0.92)'
  ctx.fill()

  // Border
  rrPath(ctx, 3, 3, W - 6, H - 6, 16)
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Coloured dot
  ctx.fillStyle = dotColor
  ctx.beginPath()
  ctx.arc(40, line2 ? 35 : H / 2, 10, 0, Math.PI * 2)
  ctx.fill()

  // Primary text
  ctx.fillStyle = '#f5f5f7'
  ctx.font = 'bold 27px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(line1, 62, line2 ? 35 : H / 2)

  // Secondary text
  if (line2) {
    ctx.fillStyle = '#6e6e73'
    ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(line2, 62, 68)
  }

  return new THREE.CanvasTexture(cv)
}

// ── Airplane geometry ─────────────────────────────────────────────────────────
// Coordinate convention: nose faces +Z, wings along ±X, top is +Y
function buildAirplane() {
  const g = new THREE.Group()

  const silver = new THREE.MeshStandardMaterial({ color: 0xccd1d6, roughness: 0.2,  metalness: 0.82 })
  const cockpit = new THREE.MeshStandardMaterial({ color: 0x091428, roughness: 0.06, metalness: 0.75, transparent: true, opacity: 0.94 })
  const engine  = new THREE.MeshStandardMaterial({ color: 0x6d7480, roughness: 0.36, metalness: 0.9  })
  const inlet   = new THREE.MeshStandardMaterial({ color: 0x080a0c })

  function mesh(geo, mat, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(px, py, pz)
    m.rotation.set(rx, ry, rz)
    g.add(m); return m
  }

  // ── Fuselage ──
  // CylinderGeometry(radiusTop, radiusBottom, height) — top/bottom are ±Y
  // Rotate -90° around X so +Y (narrow nose end) becomes +Z
  const fusGeo = new THREE.CylinderGeometry(0.115, 0.158, 3.7, 18)
  fusGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2))
  mesh(fusGeo, silver)

  // Nose cone — ConeGeometry tip at +Y; rotate so tip is at +Z
  const noseGeo = new THREE.ConeGeometry(0.115, 0.92, 14)
  noseGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2))
  mesh(noseGeo, silver, 0, 0, 2.31)   // base at z≈1.85, tip at z≈2.77

  // Tail taper — tip at -Z
  const tailGeo = new THREE.ConeGeometry(0.082, 0.52, 12)
  tailGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  mesh(tailGeo, silver, 0, 0, -2.11)

  // Cockpit windows (dark glass, slightly raised on fuselage top-front)
  mesh(new THREE.BoxGeometry(0.19, 0.075, 0.36), cockpit, 0, 0.163, 1.55, 0.27, 0, 0)

  // ── Wings (swept back ~12°, slight dihedral) ──
  const wg = new THREE.BoxGeometry(1.92, 0.052, 0.44)
  mesh(wg, silver,  -0.96, -0.06, -0.07, 0, -0.21, 0.03)  // left
  mesh(wg, silver,   0.96, -0.06, -0.07, 0,  0.21, -0.03) // right (mirror dihedral)

  // Wing root fairings
  mesh(new THREE.BoxGeometry(0.28, 0.1, 0.52), silver, -0.14, -0.09, -0.08)
  mesh(new THREE.BoxGeometry(0.28, 0.1, 0.52), silver,  0.14, -0.09, -0.08)

  // ── Tail ──
  // Vertical stabiliser
  mesh(new THREE.BoxGeometry(0.052, 0.7, 0.5), silver, 0, 0.42, -1.9)

  // Horizontal stabilisers (slight sweep)
  const hs = new THREE.BoxGeometry(0.86, 0.04, 0.28)
  mesh(hs, silver,  0, 0.08, -1.9, 0,  0.1, 0)

  // ── Engines (2 pods under wings) ──
  const eGeo = new THREE.CylinderGeometry(0.1, 0.094, 0.82, 16)
  eGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2))

  mesh(eGeo, engine, -0.85, -0.245,  0.1)
  mesh(eGeo, engine,  0.85, -0.245,  0.1)

  // Engine pylons (connecting fuselage to engine)
  mesh(new THREE.BoxGeometry(0.065, 0.11, 0.68), engine, -0.85, -0.145, 0.06)
  mesh(new THREE.BoxGeometry(0.065, 0.11, 0.68), engine,  0.85, -0.145, 0.06)

  // Engine inlets (dark circles at front)
  const iGeo = new THREE.CircleGeometry(0.093, 14)
  for (const ex of [-0.85, 0.85]) {
    const m = new THREE.Mesh(iGeo, inlet)
    m.position.set(ex, -0.245, 0.52); m.rotation.y = Math.PI; g.add(m)
  }

  // Engine exhaust (slightly narrower nozzle ring at rear)
  const nzGeo = new THREE.CylinderGeometry(0.082, 0.074, 0.18, 14)
  nzGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2))
  mesh(nzGeo, engine, -0.85, -0.245, -0.52)
  mesh(nzGeo, engine,  0.85, -0.245, -0.52)

  // ── Navigation lights ──
  const dotGeo = new THREE.SphereGeometry(0.038, 8, 8)
  const ltDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xff3030 }))
  ltDot.position.set(-1.93, -0.06, 0); g.add(ltDot)

  const rtDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x30ff60 }))
  rtDot.position.set( 1.93, -0.06, 0); g.add(rtDot)

  const ltLight = new THREE.PointLight(0xff3030, 0, 2.2)
  ltLight.position.set(-1.93, -0.06, 0); g.add(ltLight)

  const rtLight = new THREE.PointLight(0x30ff60, 0, 2.2)
  rtLight.position.set( 1.93, -0.06, 0); g.add(rtLight)

  // Tail strobe
  const strobe = new THREE.PointLight(0xffffff, 0, 3)
  strobe.position.set(0, 0, -2.45); g.add(strobe)

  // Landing light (faint forward glow from nose)
  const land = new THREE.PointLight(0xddeeff, 0.5, 7)
  land.position.set(0, 0, 3.1); g.add(land)

  g.userData = { ltLight, rtLight, strobe, ltDot, rtDot }
  return g
}

// ── Star field ────────────────────────────────────────────────────────────────
function makeStarfield() {
  const N = 300
  const pos = new Float32Array(N * 3)
  for (let i = 0; i < N * 3; i += 3) {
    pos[i]     = (Math.random() - 0.5) * 80
    pos[i + 1] = (Math.random() - 0.5) * 50
    pos[i + 2] = (Math.random() - 0.5) * 35 - 10
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return new THREE.Points(geo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.78 })
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ThreeAirplane() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let W = el.offsetWidth, H = el.offsetHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    // Camera — slightly below and to the side, looking up at the plane
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200)
    camera.position.set(1.5, -2.8, 12)
    camera.lookAt(0, 0.8, -1)

    // Lighting — moonlight feel
    scene.add(new THREE.AmbientLight(0x2a3854, 0.55))

    const moon = new THREE.DirectionalLight(0xaabdee, 1.7)
    moon.position.set(5, 9, 4)
    scene.add(moon)

    const rim = new THREE.DirectionalLight(0x1a2a44, 0.35)
    rim.position.set(-6, -3, 2)
    scene.add(rim)

    // Stars + airplane
    const stars = makeStarfield()
    scene.add(stars)

    const plane = buildAirplane()
    scene.add(plane)

    // Flight path: enters bottom-left, arcs up and to the right, exits upper-right
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-24, -5.5,  2.0),
      new THREE.Vector3(-13, -2.2, -0.5),
      new THREE.Vector3( -4,  0.8, -2.5),
      new THREE.Vector3(  4,  2.8, -3.8),
      new THREE.Vector3( 13,  2.0, -4.2),
      new THREE.Vector3( 24, -0.8, -3.0),
    ])

    // Notification cards — flat PlaneGeometry with CanvasTexture
    const CARDS = [
      { dot: '#30d158', l1: 'Review replied',       l2: '· 2s ago'   },
      { dot: '#E8A020', l1: '4.9 ★ avg rating',     l2: 'this month' },
      { dot: '#30d158', l1: 'AutoPilot is running',  l2: null         },
    ]
    const OFFSETS = [0.045, 0.085, 0.13]

    const cards = CARDS.map((d, i) => {
      const mat = new THREE.MeshBasicMaterial({
        map: makeCardTexture(d.dot, d.l1, d.l2),
        transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 0.64), mat)
      scene.add(mesh)
      return { mesh, offset: OFFSETS[i] }
    })

    // Scratch vectors (reused every frame to avoid allocations)
    const _pos  = new THREE.Vector3()
    const _tang = new THREE.Vector3()
    const _ptg  = new THREE.Vector3()
    const _r    = new THREE.Vector3()
    const _up   = new THREE.Vector3()
    const _wup  = new THREE.Vector3(0, 1, 0)
    const _m4   = new THREE.Matrix4()

    const LOOP = 24 // seconds
    let raf
    const clock = new THREE.Clock()

    function tick() {
      raf = requestAnimationFrame(tick)
      const elapsed = clock.getElapsedTime()
      const t = (elapsed % LOOP) / LOOP

      // ── Plane position & orientation ──
      curve.getPointAt(t, _pos)
      curve.getTangentAt(t, _tang).normalize()
      curve.getTangentAt(Math.max(0, t - 0.004), _ptg).normalize()

      plane.position.copy(_pos)

      // Build basis: right = worldUp × tangent, planeUp = tangent × right
      _r.crossVectors(_wup, _tang)
      if (_r.length() < 0.001) _r.set(1, 0, 0)
      _r.normalize()
      _up.crossVectors(_tang, _r).normalize()
      _m4.makeBasis(_r, _up, _tang)
      plane.quaternion.setFromRotationMatrix(_m4)

      // Bank angle: how much the horizontal direction changed
      let dθ = Math.atan2(_tang.x, _tang.z) - Math.atan2(_ptg.x, _ptg.z)
      if (dθ >  Math.PI) dθ -= 2 * Math.PI
      if (dθ < -Math.PI) dθ += 2 * Math.PI
      const bank = Math.max(-0.52, Math.min(0.52, dθ * 85))
      plane.rotateZ(bank)

      // ── Navigation light blink (~1.2 Hz) ──
      const blink = Math.floor(elapsed * 1.2) % 2 === 0
      const ud = plane.userData
      ud.ltLight.intensity = blink ? 0.58 : 0
      ud.rtLight.intensity = blink ? 0.58 : 0
      ud.ltDot.material.color.setHex(blink ? 0xff3030 : 0x1a0000)
      ud.rtDot.material.color.setHex(blink ? 0x30ff60 : 0x001a00)

      // Tail strobe (quick bright flash every 2 s)
      ud.strobe.intensity = (elapsed % 2.0) < 0.055 ? 2.2 : 0

      // ── Trailing notification cards ──
      // Fade envelope: ramp in 0.05→0.15, hold, ramp out 0.85→0.95
      const fade = Math.min(1, (t - 0.08) * 10) * Math.min(1, (0.9 - t) * 10)

      cards.forEach(({ mesh, offset }, i) => {
        const ct = Math.max(0.001, t - offset)
        curve.getPointAt(ct, _pos)

        // Gentle drift in wake turbulence
        _pos.y += Math.sin(elapsed * 0.55 + i * 2.1) * 0.2
        _pos.x += Math.cos(elapsed * 0.38 + i * 1.65) * 0.14

        mesh.position.copy(_pos)
        mesh.lookAt(camera.position)

        const ripple = 0.6 + 0.4 * Math.sin(elapsed * 0.75 + i * 1.3)
        mesh.material.opacity = Math.max(0, fade * ripple)
      })

      // ── Stars slow rotation ──
      stars.rotation.y = elapsed * 0.0022

      renderer.render(scene, camera)
    }
    tick()

    // Resize
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
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach(m => { m.map?.dispose(); m.dispose() })
        }
      })
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: 500 }} />
}
