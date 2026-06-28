import { useEffect, useState } from 'react'
import { fetchContent } from '../cms/api'
import FooterSection from '../sections/Footer/index'

export default function GlobalFooter() {
  const [content, setContent] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchContent().then((data) => {
      const filtered: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('footer_') || k.startsWith('social_') || k.startsWith('link')) {
          filtered[k] = v
        }
      })
      setContent(filtered)
    }).catch(() => {})
  }, [])

  return <FooterSection content={content} />
}
