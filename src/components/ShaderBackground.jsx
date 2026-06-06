import { useEffect, useRef } from 'react'

// ── GLSL ─────────────────────────────────────────────────────────────────────
const VERT_SRC = `
attribute vec2 a_pos;
varying vec2 vUv;
void main() {
  vUv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

// Dark liquid-glass waves + thin drifting amber data-stream lines.
const FRAG_SRC = `
precision mediump float;
uniform float u_time;
varying vec2 vUv;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = dot(hash2(i),             f);
  float b = dot(hash2(i + vec2(1,0)), f - vec2(1,0));
  float c = dot(hash2(i + vec2(0,1)), f - vec2(0,1));
  float d = dot(hash2(i + vec2(1,1)), f - vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0; float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    v += amp * vnoise(p);
    p  = p * 2.1 + vec2(0.3, 0.7);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t  = u_time * 0.18;

  vec2 flow     = vec2(fbm(uv * 2.0 + t), fbm(uv * 2.0 + t + 5.2));
  vec2 distorted = uv + flow * 0.12;

  float wave = fbm(distorted * 3.0 + t * 0.6);
  vec3  base = mix(vec3(0.0), vec3(0.02, 0.04, 0.08), smoothstep(-0.3, 0.5, wave));

  float s1   = abs(fbm(vec2(uv.x * 0.8 + t * 0.3, uv.y * 4.0)) - 0.05);
  float s2   = abs(fbm(vec2(uv.x * 1.2 - t * 0.2, uv.y * 6.0 + 2.3)) - 0.05);
  float amb  = smoothstep(0.06, 0.0, s1) * 0.22 + smoothstep(0.06, 0.0, s2) * 0.14;
  vec3  amberCol = vec3(0.91, 0.627, 0.125);

  vec3  color = base + amberCol * amb;
  float dist  = length(uv - 0.5) * 1.6;
  color *= 1.0 - smoothstep(0.5, 1.0, dist) * 0.8;

  gl_FragColor = vec4(color, 1.0);
}
`

function compileShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[ShaderBackground]', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

function buildProgram(gl) {
  const vs = compileShader(gl, gl.VERTEX_SHADER,   VERT_SRC)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!vs || !fs) return null
  const prog = gl.createProgram()
  gl.attachShader(prog, vs); gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[ShaderBackground]', gl.getProgramInfoLog(prog))
    return null
  }
  return prog
}

// ── CSS gradient fallback ─────────────────────────────────────────────────────
function Fallback() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0,
      background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #050a14 0%, #000 65%)',
    }} />
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShaderBackground() {
  const canvasRef  = useRef(null)
  const failedRef  = useRef(false)
  const raf        = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Attempt WebGL context
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) { failedRef.current = true; canvas.style.display = 'none'; return }

    const prog = buildProgram(gl)
    if (!prog) { failedRef.current = true; canvas.style.display = 'none'; return }

    gl.useProgram(prog)

    // Full-screen quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const start = performance.now()
    function tick() {
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf.current)
      ro.disconnect()
    }
  }, [])

  return (
    <>
      {/* Always render the fallback underneath; canvas covers it when WebGL works */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #050a14 0%, #000 65%)',
      }} />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          width: '100%', height: '100%', display: 'block',
        }}
      />
    </>
  )
}
