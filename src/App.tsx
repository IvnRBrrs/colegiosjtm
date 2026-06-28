import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ThreeBackground from './components/ThreeBackground'

const About = lazy(() => import('./components/About'))
const Features = lazy(() => import('./components/Features'))
const Portfolio = lazy(() => import('./components/Portfolio'))
const Testimonials = lazy(() => import('./components/Testimonials'))
const FAQ = lazy(() => import('./components/FAQ'))
const Contact = lazy(() => import('./components/Contact'))
const MapSection = lazy(() => import('./components/MapSection'))
const Footer = lazy(() => import('./components/Footer'))

function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 0',
      color: 'var(--text-light)',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.85rem',
    }}>
      Carregando...
    </div>
  )
}

export default function App() {
  return (
    <>
      <ThreeBackground />
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <Suspense fallback={<Loading />}>
          <About />
          <Features />
          <Portfolio />
          <Testimonials />
          <FAQ />
          <Contact />
          <MapSection />
          <Footer />
        </Suspense>
      </main>
    </>
  )
}
