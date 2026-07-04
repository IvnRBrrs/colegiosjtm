import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCachedPageContent, fetchPageContentCached } from './contentCache'
import PageBuilder from './PageBuilder'
import DynamicStyles from './DynamicStyles'
import LoadingScreen from '../components/LoadingScreen'

export default function DynamicPage() {
  const { slug } = useParams()
  const pageSlug = slug || 'home'

  const [content, setContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const cached = getCachedPageContent(pageSlug)
    setContent(cached || {})
    setLoading(!cached)
    setFetchFailed(false)
    setNotFound(false)

    let cancelled = false
    fetchPageContentCached(pageSlug).then(({ data, cached: fromCache }) => {
      if (cancelled) return
      setContent(data)
      if (!fromCache) setLoading(false)
    }).catch((err: any) => {
      if (cancelled) return
      if (err?.response?.status === 404) {
        setNotFound(true)
        setLoading(false)
      } else {
        setFetchFailed(true)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [pageSlug])

  useEffect(() => {
    if (!fetchFailed) return
    const timer = setTimeout(() => {
      setFetchFailed(false)
      setLoading(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [fetchFailed])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const key = 'page_' + pageSlug
      if (e.detail.key === key) setContent(e.detail.data)
    }
    window.addEventListener('cms-cache-update', handler as EventListener)
    return () => window.removeEventListener('cms-cache-update', handler as EventListener)
  }, [pageSlug])

  if (loading) {
    return <LoadingScreen />
  }

  if (notFound) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 800, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>404</h1>
        <h2 style={{ color: 'var(--primary-dark)', margin: '16px 0 8px' }}>Ops, a página não existe</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 32, maxWidth: 400 }}>
          A página que você está procurando pode ter sido removida ou o endereço está incorreto.
        </p>
        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 32px', background: 'var(--primary)', color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontWeight: 600,
          fontSize: '1rem', transition: 'background 0.3s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-dark)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary)')}
        >
          Voltar para Home
        </a>
      </div>
    )
  }

  if (fetchFailed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary-dark)', marginBottom: 12 }}>Falha ao carregar</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>N\u00e3o foi poss\u00edvel carregar o conte\u00fado. Tentando novamente...</p>
      </div>
    )
  }

  let sectionsOrder: { title: string; instanceId?: string }[] = []
  try { if (content._sections) sectionsOrder = JSON.parse(content._sections) } catch {}

  const sections = sectionsOrder.map((s) => ({ title: s.title, instanceId: s.instanceId, content }))

  return (
    <>
      <DynamicStyles content={content} />
      <PageBuilder sections={sections} />
    </>
  )
}
