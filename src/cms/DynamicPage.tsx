import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPageContent } from './api'
import PageBuilder from './PageBuilder'
import DynamicStyles from './DynamicStyles'

const DEFAULT_SECTIONS = [
  { title: 'Hero', instanceId: 'hero', content: {} },
  { title: 'Sobre', instanceId: 'sobre', content: {} },
  { title: 'Segmentos', instanceId: 'segmentos', content: {} },
  { title: 'Galeria', instanceId: 'galeria', content: {} },
  { title: 'Depoimentos', instanceId: 'depoimentos', content: {} },
  { title: 'FAQ', instanceId: 'faq', content: {} },
  { title: 'Contato', instanceId: 'contato', content: {} },
  { title: 'Mapa', instanceId: 'mapa', content: {} },
]

export default function DynamicPage() {
  const { slug } = useParams()
  const [content, setContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const pageSlug = slug || 'home'

  useEffect(() => {
    async function load() {
      console.log('[DynamicPage] Loading page slug:', pageSlug)
      try {
        const data = await fetchPageContent(pageSlug)
        console.log('[DynamicPage] Content received, keys:', Object.keys(data))
        console.log('[DynamicPage] _sections raw:', data._sections)
        setContent(data)
      } catch (err) {
        console.error('[DynamicPage] Failed to load content:', err)
        setContent({})
      } finally {
        console.log('[DynamicPage] Loading complete')
        setLoading(false)
      }
    }
    load()
  }, [pageSlug])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: 'var(--text-light)', fontFamily: 'var(--font-sans)',
      }}>
        Carregando...
      </div>
    )
  }

  let sectionsOrder: { title: string; instanceId?: string }[] = []
  try {
    if (content._sections) {
      sectionsOrder = JSON.parse(content._sections)
      console.log('[DynamicPage] Parsed sectionsOrder:', sectionsOrder.length, 'items')
    } else {
      console.warn('[DynamicPage] No _sections in content, keys:', Object.keys(content))
    }
  } catch (e) {
    console.error('[DynamicPage] Failed to parse _sections:', content._sections, e)
  }

  const sections = sectionsOrder.map((s) => ({
    title: s.title,
    instanceId: s.instanceId,
    content,
  }))

  return (
    <>
      <DynamicStyles content={content} />
      <PageBuilder sections={sections} />
    </>
  )
}
