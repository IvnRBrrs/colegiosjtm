import { useEffect, useState } from 'react'
import { fetchContentCached } from '../cms/contentCache'
import FooterSection from '../sections/Footer/index'

function buildFooterContent(data: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {}
  Object.entries(data).forEach(([k, v]) => {
    if (k.startsWith('footer_') || k.startsWith('social_') || k.startsWith('link')) filtered[k] = v
  })
  return filtered
}

export default function GlobalFooter() {
  const [content, setContent] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchContentCached().then(({ data }) => setContent(buildFooterContent(data))).catch(() => {})

    const handler = (e: CustomEvent) => {
      if (e.detail.key === 'global_content') {
        fetchContentCached().then(({ data }) => setContent(buildFooterContent(data))).catch(() => {})
      }
    }
    window.addEventListener('cms-cache-update', handler as EventListener)
    return () => window.removeEventListener('cms-cache-update', handler as EventListener)
  }, [])

  return <FooterSection content={content} />
}