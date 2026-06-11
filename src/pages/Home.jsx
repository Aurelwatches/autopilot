import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0A09', color: '#F5F1E8' }}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
