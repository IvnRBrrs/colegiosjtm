import { useEffect, useState } from 'react'
import { fetchContent } from '../cms/api'
import NavbarSection from '../sections/Navbar/index'

export default function GlobalNavbar() {
  const [content, setContent] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchContent().then((data) => {
      const filtered: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('nav_') || k.startsWith('_nav_')) {
          filtered[k] = v
        }
      })
      setContent(filtered)
    }).catch(() => {})
  }, [])

  return <NavbarSection content={content} />
}
