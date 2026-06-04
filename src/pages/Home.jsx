import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import Waitlist from '../components/Waitlist'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen" style={{ color: '#F0EEE9' }}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Waitlist />
      </main>
      <Footer />
    </div>
  )
}
