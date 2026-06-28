import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DynamicPage from './cms/DynamicPage'
import GlobalNavbar from './components/GlobalNavbar'
import GlobalFooter from './components/GlobalFooter'
import ThreeBackground from './components/ThreeBackground'
import WhatsAppButton from './components/WhatsAppButton'

const AdminApp = lazy(() => import('./admin/AdminApp'))

function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: 'var(--text-light)',
      fontFamily: 'var(--font-sans)',
    }}>
      Carregando...
    </div>
  )
}

function SiteLayout() {
  return (
    <>
      <ThreeBackground />
      <GlobalNavbar />
      <WhatsAppButton />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <DynamicPage />
      </main>
      <GlobalFooter />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={
          <Suspense fallback={<Loading />}>
            <AdminApp />
          </Suspense>
        } />
        <Route path="/:slug" element={<SiteLayout />} />
        <Route path="/" element={<SiteLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
