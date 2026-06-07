// Skeleton shimmer shape — reuses the heroShimmer keyframe from index.css
function Sk({ w, h, r = 4, delay = 0, style }) {
  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      width: w,
      height: h,
      borderRadius: r,
      backgroundColor: 'rgba(255,255,255,0.07)',
      flexShrink: 0,
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
        animation: 'heroShimmer 1.8s linear infinite',
        animationDelay: `${delay}s`,
      }} />
    </div>
  )
}

// Glass skeleton card — matches the real dashboard card spec
function SkCard({ children, style }) {
  return (
    <div style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function DashboardSkeleton({ hidden }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: '#000000',
      display: 'flex',
      opacity: hidden ? 0 : 1,
      transition: 'opacity 300ms ease-out',
      pointerEvents: hidden ? 'none' : 'auto',
    }}>

      {/* Background blobs — same as hero */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-15%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, #3B0764 0%, transparent 70%)',
          opacity: 0.3, filter: 'blur(50px)',
          animation: 'heroBlobA 15s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-5%',
          width: 640, height: 640, borderRadius: '50%',
          background: 'radial-gradient(circle, #0C1A4E 0%, transparent 70%)',
          opacity: 0.3, filter: 'blur(50px)',
          animation: 'heroBlobB 15s ease-in-out infinite',
        }} />
      </div>

      {/* ── Sidebar skeleton ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 240, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 12px',
      }}>
        {/* Logo area */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 8px 20px', marginBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Sk w={120} h={20} r={10} delay={0} />
          <Sk w={28} h={28} r={6} delay={0.05} />
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, paddingTop: 4 }}>
          {[80, 72, 88, 76, 80].map((pct, i) => (
            <div key={i} style={{ padding: '8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sk w={14} h={14} r={4} delay={i * 0.15} style={{ flexShrink: 0 }} />
              <Sk w={`${pct}%`} h={12} r={6} delay={i * 0.15 + 0.05} />
            </div>
          ))}
        </div>

        {/* Bottom: restaurant name + email */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 8px 0' }}>
          <Sk w="65%" h={12} r={6} delay={0.8} style={{ marginBottom: 8 }} />
          <Sk w="45%" h={10} r={5} delay={0.9} />
        </div>
      </div>

      {/* ── Main content skeleton ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, padding: '32px', overflow: 'hidden' }}>

        {/* Status bar */}
        <SkCard style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 32, borderRadius: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(74,222,128,0.25)', flexShrink: 0 }} />
          <Sk w={130} h={12} r={6} delay={0.05} />
          <Sk w={90} h={12} r={6} delay={0.12} />
        </SkCard>

        {/* Greeting */}
        <Sk w={220} h={28} r={8} delay={0.05} style={{ marginBottom: 10 }} />
        <Sk w={140} h={14} r={4} delay={0.12} style={{ marginBottom: 32 }} />

        {/* Stat cards — 3-column glass grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[0, 1, 2].map(i => (
            <SkCard key={i} style={{ padding: '20px', position: 'relative' }}>
              <Sk w="45%" h={10} r={5} delay={i * 0.1} style={{ marginBottom: 14 }} />
              <Sk w="60%" h={28} r={5} delay={i * 0.1 + 0.1} style={{ marginBottom: 10 }} />
              <Sk w="22%" h={10} r={5} delay={i * 0.1 + 0.18} />
              {/* Full-card shimmer sweep */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                animation: 'heroShimmer 1.8s linear infinite',
                animationDelay: `${i * 0.15}s`,
              }} />
            </SkCard>
          ))}
        </div>

        {/* Activity feed label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Sk w={120} h={14} r={4} delay={0.4} />
          <Sk w={36} h={12} r={6} delay={0.45} />
        </div>

        {/* Activity feed rows */}
        <SkCard>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
              borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <Sk w={24} h={24} r={6} delay={i * 0.12 + 0.1} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Sk w={`${[55, 65, 50, 60, 55][i]}%`} h={13} r={4} delay={i * 0.12 + 0.12} />
                <Sk w={`${[40, 35, 45, 38, 42][i]}%`} h={10} r={4} delay={i * 0.12 + 0.15} />
              </div>
              <Sk w={55} h={10} r={4} delay={i * 0.12 + 0.17} />
            </div>
          ))}
        </SkCard>

      </div>
    </div>
  )
}
