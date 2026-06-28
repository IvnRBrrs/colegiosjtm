import { useEffect, useState } from 'react'
import { fetchContent, fetchPages } from '../cms/api'
import NavbarSection from '../sections/Navbar/index'

export default function GlobalNavbar() {
  const [content, setContent] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([fetchContent(), fetchPages()]).then(([contentData, pages]) => {
      const filtered: Record<string, string> = {}
      Object.entries(contentData).forEach(([k, v]) => {
        if (k.startsWith('nav_') || k.startsWith('_nav_')) {
          filtered[k] = v
        }
      })

      if (filtered._nav_items) {
        try {
          let items: Record<string, any>[] = JSON.parse(filtered._nav_items)

          items.forEach((item) => {
            if (item.label === 'Home') item.href = '/'
          })

          const visiblePages = (pages as any[]).filter(
            (p: any) => p.show_in_menu && p.slug !== 'home'
          )

          if (visiblePages.length > 0) {
            const dropdownItem = items.find(
              (item: any) =>
                item.label === 'O Colégio' ||
                (item.is_dropdown === 'true' && item.dropdown_items)
            )

            if (dropdownItem) {
              let subItems: { label: string; href: string }[] = []
              try {
                if (dropdownItem.dropdown_items)
                  subItems = JSON.parse(dropdownItem.dropdown_items)
              } catch {}

              visiblePages.forEach((p: any) => {
                const slug = p.slug.replace(/^\/+|\/+$/g, '')
                const exists = subItems.some(
                  (d: any) => d.href === '/' + slug
                )
                if (!exists) {
                  subItems.push({ label: p.title, href: '/' + slug })
                }
              })

              dropdownItem.dropdown_items = JSON.stringify(subItems)
            }
          }

          filtered._nav_items = JSON.stringify(items)
        } catch {}
      }

      setContent(filtered)
    }).catch(() => {})
  }, [])

  return <NavbarSection content={content} />
}
