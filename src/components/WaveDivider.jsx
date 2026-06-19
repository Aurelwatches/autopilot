/* ─── Flowing wave divider ──────────────────────────────────────────────────── */
/* Two translucent cyan wave layers drift in opposite directions at different     */
/* speeds, with a soft vertical bob + a glowing crest line, so the hero melts      */
/* fluidly into the content below. Decorative only (aria-hidden, no pointer).      */

export default function WaveDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 220,
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Back layer — large, slow, drifts left */}
      <svg
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '200%', height: 200,
          animation: 'apWaveDriftL 22s linear infinite, apWaveBob 9s ease-in-out infinite',
        }}
      >
        <defs>
          <linearGradient id="apWaveA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(34,211,238,0.12)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0 110 C360 50 1080 170 1440 110 C1800 50 2520 170 2880 110 L2880 200 L0 200 Z"
          fill="url(#apWaveA)"
        />
      </svg>

      {/* Front layer — tighter, faster, drifts right */}
      <svg
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '200%', height: 160,
          animation: 'apWaveDriftR 14s linear infinite, apWaveBob 7s ease-in-out infinite',
        }}
      >
        <defs>
          <linearGradient id="apWaveB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(34,211,238,0.18)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0 90 C480 150 960 30 1440 90 C1920 150 2400 30 2880 90 L2880 200 L0 200 Z"
          fill="url(#apWaveB)"
        />
        {/* Glowing crest line riding the front wave */}
        <path
          d="M0 90 C480 150 960 30 1440 90 C1920 150 2400 30 2880 90"
          fill="none"
          stroke="rgba(34,211,238,0.45)"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.50))' }}
        />
      </svg>
    </div>
  )
}
