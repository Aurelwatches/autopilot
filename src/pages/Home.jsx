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
      style={{ position: 'relative', color: '#0A0A0A', overflow: 'hidden', background: '#FFFFFF' }}
    >
      {/* Page ambient — subtle grid only */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
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
