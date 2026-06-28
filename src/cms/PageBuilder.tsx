import { useMemo } from 'react'
import { getModularSection } from './registry'

function createContentProxy(
  rawContent: Record<string, string>,
  instanceId?: string
): Record<string, string> {
  return new Proxy(rawContent, {
    get(target, prop) {
      if (typeof prop !== 'string') return (target as any)[prop]
      const prefixedKey = instanceId ? `${instanceId}_${prop}` : prop
      return target[prefixedKey] !== undefined ? target[prefixedKey] : target[prop]
    },
  })
}

interface PageBuilderProps {
  sections: { title: string; instanceId?: string; content: Record<string, string> }[]
}

export default function PageBuilder({ sections }: PageBuilderProps) {
  return (
    <>
      {sections.map((section, i) => {
        const mod = getModularSection(section.title)
        if (!mod) return null

        const SectionComponent = mod.Component
        const content = useMemo(
          () => createContentProxy(section.content, section.instanceId),
          [section.content, section.instanceId]
        )

        return <SectionComponent key={section.instanceId || section.title + i} content={content} instanceId={section.instanceId} />
      })}
    </>
  )
}
