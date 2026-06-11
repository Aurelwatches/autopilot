import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Services from '../components/Services'
import WhyChooseUs from '../components/WhyChooseUs'
import FAQ from '../components/FAQ'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'
import { FloatingOrbs } from '../components/motion'

export default function Home() {
  return (
    <div
      className="min-h-screen ap-animated-gradient"
      style={{ position: 'relative', color: '#EAF2FF', overflow: 'hidden' }}
    >
      {/* Page ambient background — drifting orbs + subtle grid, behind everything */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <FloatingOrbs orbs={[
          {
            size: 600,
            position: { top: '120vh', left: '-8%' },
            background: 'radial-gradient(circle at 40% 40%, #0A2E54 0%, transparent 68%)',
            opacity: 0.22, blur: 80, duration: 34,
            x: [0, 50, -20, 0], y: [0, -40, 30, 0],
          },
          {
            size: 560,
            position: { top: '180vh', right: '-6%' },
            background: 'radial-gradient(circle at 55% 45%, #063844 0%, transparent 68%)',
            opacity: 0.2, blur: 80, duration: 40,
            x: [0, -50, 20, 0], y: [0, 40, -25, 0],
          },
        ]} />
        <div className="ap-grid-overlay" />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Services />
          <WhyChooseUs />
          <FAQ />
          <Pricing />
        </main>
        <Footer />
      </div>
    </div>
  )
}
