import { ModularSection } from './types'

const schemas = import.meta.glob('../sections/*/schema.ts', { eager: true })
const components = import.meta.glob('../sections/*/index.tsx', { eager: true })
const admins = import.meta.glob('../sections/*/admin.tsx', { eager: true })

export const modularSections: Record<string, ModularSection> = {}

Object.keys(schemas).forEach((path) => {
  const schemaModule = schemas[path] as any
  const schema = Object.values(schemaModule)[0] as any

  const componentPath = path.replace('schema.ts', 'index.tsx')
  const adminPath = path.replace('schema.ts', 'admin.tsx')

  const Component = (components[componentPath] as any)?.default
  const Admin = (admins[adminPath] as any)?.default

  if (schema && Component && Admin) {
    modularSections[schema.title] = {
      schema,
      Component,
      Admin,
    }
  }
})

export function getModularSection(title: string): ModularSection | undefined {
  const baseTitle = title.split('#')[0]
  return modularSections[baseTitle]
}

export function getAllSectionTitles(): string[] {
  return Object.keys(modularSections)
}
