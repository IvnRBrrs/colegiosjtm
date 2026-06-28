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
      try {
        const data = await fetchPageContent(pageSlug)
        setContent(data)
      } catch {
        setContent({})
      } finally {
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

  let sectionsOrder: { title: string; instanceId?: string }[]
  try {
    sectionsOrder = content._sections ? JSON.parse(content._sections) : DEFAULT_SECTIONS
  } catch {
    sectionsOrder = DEFAULT_SECTIONS
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
