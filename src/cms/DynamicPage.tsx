import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCachedPageContent, fetchPageContentCached } from './contentCache'
import PageBuilder from './PageBuilder'
import DynamicStyles from './DynamicStyles'

function PageSkeleton() {
  return (
    <div className="page-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="page-skeleton-block">
          <div className="page-skeleton-line w-60" />
          <div className="page-skeleton-line w-80" />
          <div className="page-skeleton-line w-40" />
        </div>
      ))}
      <style>{`
        .page-skeleton { padding: 60px 20px; max-width: 1100px; margin: 0 auto; }
        .page-skeleton-block { margin-bottom: 48px; }
        .page-skeleton-line { height: 20px; border-radius: 8px; background: #e0e0e0; margin-bottom: 12px; animation: skeletonPulse 1.5s ease-in-out infinite; }
        @keyframes skeletonPulse { 0%,100% { opacity: 0.3 } 50% { opacity: 0.7 } }
        @keyframes plmSpin { to { transform: rotate(360deg) } }
        @keyframes plmPulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        @keyframes plmDot { 0%,20% { opacity: 0 } 50% { opacity: 1 } 80%,100% { opacity: 0 } }
        .w-60 { width: 60%; } .w-80 { width: 80%; } .w-40 { width: 40%; }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'relative', zIndex: 1, marginTop: '-15vh',
          width: '50vw', height: '50vh',
          maxWidth: 800, maxHeight: 600,
          borderRadius: 24,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/stj/assets/BANNER-1920x793-CSJT-2048x846.png)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.4,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(6,36,74,0.8) 0%, rgba(9,52,106,0.6) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'left', padding: '40px 32px' }}>
            <div style={{
              width: 40, height: 40, margin: '0 auto 20px',
              border: '2px solid rgba(244,240,132,0.25)',
              borderTopColor: '#F4F084',
              borderRadius: '50%',
              animation: 'plmSpin 0.9s linear infinite',
            }} />

            <div style={{
              display: 'inline-block',
              fontFamily: "'Open Sans', sans-serif",
              fontSize: '0.75rem', fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#F4F084',
              marginBottom: 16,
              padding: '5px 14px',
              border: '1px solid rgba(244,240,132,0.3)',
              borderRadius: 100,
              background: 'rgba(244,240,132,0.08)',
            }}>
              Tradição desde 1989
            </div>

            <h1 style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 800, lineHeight: 1.15,
              color: '#fff', margin: '0 0 12px',
              letterSpacing: '-0.02em', textAlign: 'left',
            }}>
              Educação que<br />
              <span style={{ color: '#F4F084' }}>transforma futuros</span>
            </h1>

            <p style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6, margin: 0,
              maxWidth: 420,
            }}>
              Há mais de três décadas formando cidadãos críticos, autônomos e preparados para os desafios do amanhã.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DynamicPage() {
  const { slug } = useParams()
  const pageSlug = slug || 'home'

  const [content, setContent] = useState<Record<string, string>>(() => {
    const cached = getCachedPageContent(pageSlug)
    return cached || {}
  })
  const [contentLoading, setContentLoading] = useState(() => {
    return !getCachedPageContent(pageSlug)
  })
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const cached = getCachedPageContent(pageSlug)
    if (cached) { setContent(cached); setContentLoading(false) }
    else { setContent({}); setContentLoading(true) }
    setNotFound(false)

    let cancelled = false
    fetchPageContentCached(pageSlug).then(({ data }) => {
      if (cancelled) return
      setContent(data)
      setContentLoading(false)
    }).catch((err: any) => {
      if (cancelled) return
      if (err?.response?.status === 404) {
        setNotFound(true)
        setContentLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [pageSlug])

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

  let sectionsOrder: { title: string; instanceId?: string }[] = []
  try { if (content._sections) sectionsOrder = JSON.parse(content._sections) } catch { }

  const sections = sectionsOrder.map((s) => ({ title: s.title, instanceId: s.instanceId, content }))

  return (
    <>
      <DynamicStyles content={content} />
      {contentLoading && sections.length === 0 ? <PageSkeleton /> : <PageBuilder sections={sections} />}
    </>
  )
}
