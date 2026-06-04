import { smoothScrollTo } from '../utils/smoothScroll'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 pt-14 overflow-hidden">

      {/* ── Animated gradient mesh ──────────────────────────────────────────── */}
      <div className="hero-blob" style={{
        width: '700px', height: '700px',
        background: 'radial-gradient(circle, #0d1b55 0%, transparent 70%)',
        top: '-180px', left: '-160px',
        opacity: 0.5,
        animation: 'blobFloat1 16s ease-in-out infinite',
      }} />
      <div className="hero-blob" style={{
        width: '560px', height: '560px',
        background: 'radial-gradient(circle, #1a0a3c 0%, transparent 70%)',
        top: '5%', right: '-120px',
        opacity: 0.45,
        animation: 'blobFloat2 21s ease-in-out infinite',
      }} />
      <div className="hero-blob" style={{
        width: '800px', height: '800px',
        background: 'radial-gradient(circle, #0a1f42 0%, transparent 70%)',
        bottom: '-260px', left: '15%',
        opacity: 0.4,
        animation: 'blobFloat3 13s ease-in-out infinite',
      }} />
      <div className="hero-blob" style={{
        width: '420px', height: '420px',
        background: 'radial-gradient(circle, #1e0847 0%, transparent 70%)',
        top: '30%', left: '42%',
        opacity: 0.35,
        animation: 'blobFloat1 19s ease-in-out infinite reverse',
      }} />

      {/* ── Perspective grid overlay ─────────────────────────────────────────── */}
      <div className="hero-grid" />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full py-28 md:py-36 relative z-10">
        <p
          className="text-xs font-medium uppercase tracking-widest mb-10"
          style={{ color: '#888780' }}
        >
          Restaurant automation
        </p>

        <h1
          className="text-[52px] sm:text-[68px] md:text-[84px] lg:text-[100px] font-bold leading-[0.92] tracking-[-0.04em] mb-8"
          style={{ maxWidth: '820px', color: '#F0EEE9' }}
        >
          Your restaurant
          <br />
          runs itself.
        </h1>

        <p
          className="text-base md:text-lg leading-relaxed mb-12"
          style={{ maxWidth: '480px', color: '#888780' }}
        >
          AutoPilot handles Google reviews, social posts, and customer
          follow-ups — automatically. So you can run the kitchen, not the
          inbox.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <a
            href="#waitlist"
            className="text-sm font-semibold px-5 py-2.5 rounded transition-colors"
            style={{ backgroundColor: '#F0EEE9', color: '#0A0A0A' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('waitlist') }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e4e2dd'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0EEE9'}
          >
            Start free trial
          </a>
          <a
            href="#features"
            className="text-sm px-5 py-2.5 rounded border transition-colors"
            style={{ borderColor: '#F0EEE9', color: '#F0EEE9' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('features') }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(240,238,233,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  )
}
