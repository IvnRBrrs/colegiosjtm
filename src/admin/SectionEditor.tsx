import { useState, useEffect } from 'react'
import { fetchContent, bulkUpdateContent } from '../cms/api'
import { getModularSection } from '../cms/registry'
import { AdminProps } from '../cms/types'
import ImagePickerModal from './ImagePickerModal'

interface SectionEditorProps {
  sectionTitle: string
  onBack: () => void
}

export default function SectionEditor({ sectionTitle, onBack }: SectionEditorProps) {
  const mod = getModularSection(sectionTitle)
  const [content, setContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [imagePickerField, setImagePickerField] = useState<string | null>(null)

  useEffect(() => {
    fetchContent().then((data) => {
      setContent(data)
    }).catch(() => {})
  }, [sectionTitle])

  const handleUpdate = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  const handleUpdateListItem = (listKey: string, itemId: string, field: string, value: string) => {
    setContent((prev) => {
      const raw = prev[listKey]
      if (!raw) return prev
      try {
        const items = JSON.parse(raw)
        const updated = items.map((item: any) =>
          item._id === itemId ? { ...item, [field]: value } : item
        )
        return { ...prev, [listKey]: JSON.stringify(updated) }
      } catch { return prev }
    })
  }

  const handleAddListItem = (listKey: string) => {
    const raw = content[listKey]
    const items = raw ? JSON.parse(raw) : []
    const newItem: Record<string, string> = { _id: crypto.randomUUID() }
    if (mod?.schema.listFields) {
      mod.schema.listFields.forEach((f) => {
        newItem[f.key] = f.default || ''
      })
    }
    items.push(newItem)
    setContent((prev) => ({ ...prev, [listKey]: JSON.stringify(items) }))
    setEditingItemId(newItem._id!)
  }

  const handleRemoveListItem = (listKey: string, itemId: string) => {
    setContent((prev) => {
      const raw = prev[listKey]
      if (!raw) return prev
      try {
        const items = JSON.parse(raw).filter((item: any) => item._id !== itemId)
        return { ...prev, [listKey]: JSON.stringify(items) }
      } catch { return prev }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const sectionKeys: Record<string, string> = {}
      if (mod) {
        mod.schema.keys.forEach((k) => {
          if (content[k.key] !== undefined) sectionKeys[k.key] = content[k.key]
        })
        if (mod.schema.listKey && content[mod.schema.listKey] !== undefined) {
          sectionKeys[mod.schema.listKey] = content[mod.schema.listKey]
        }
      }
      await bulkUpdateContent(sectionKeys)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const openImageLibrary = (field: string, _componentType: string, ..._args: any[]) => {
    setImagePickerField(field)
  }

  const handleImageSelect = (url: string, filename?: string) => {
    if (!imagePickerField) return
    const listKey = mod?.schema.listKey
    if (listKey && imagePickerField.startsWith(listKey + '_')) {
      const rest = imagePickerField.slice(listKey.length + 1)
      const underscoreIndex = rest.indexOf('_')
      if (underscoreIndex > 0) {
        const itemId = rest.slice(0, underscoreIndex)
        const field = rest.slice(underscoreIndex + 1)
        handleUpdateListItem(listKey, itemId, field, url)
        if (filename) {
          handleUpdateListItem(listKey, itemId, 'filename', filename)
        }
        setImagePickerField(null)
        return
      }
    }
    handleUpdate(imagePickerField, url)
    setImagePickerField(null)
  }

  const adminProps: AdminProps = {
    content,
    onUpdate: handleUpdate,
    onUpdateListItem: handleUpdateListItem,
    onAddListItem: handleAddListItem,
    onRemoveListItem: handleRemoveListItem,
    openImageLibrary,
    editingItemId,
    setEditingItemId,
  }

  if (!mod) {
    return (
      <div className="admin-editor">
        <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: 24 }}>← Voltar</button>
        <p>Seção "{sectionTitle}" não encontrada.</p>
      </div>
    )
  }

  const AdminComponent = mod.Admin

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <button className="btn btn-outline" onClick={onBack}>← Voltar</button>
        <h2>Editando: {mod.schema.title}</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>
      <div className="admin-editor-content">
        <AdminComponent {...adminProps} />
      </div>

      {imagePickerField && (
        <ImagePickerModal
          onSelect={handleImageSelect}
          onClose={() => setImagePickerField(null)}
        />
      )}
    </div>
  )
}
