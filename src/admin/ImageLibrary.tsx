import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchImages, fetchImageData, uploadImage, updateImageThumbnail } from '../cms/api'
import { getCachedImagesSync, fetchImagesCached, invalidateCache } from '../cms/contentCache'
import { createThumbnail } from '../cms/thumbnail'

interface ImageMeta {
  id: string
  filename: string
  type: string
  component_type: string | null
  thumbnail: string | null
  created_at: string
}

interface ImageLibraryProps {
  onSelect?: (url: string) => void
}

export default function ImageLibrary({ onSelect }: ImageLibraryProps) {
  const [images, setImages] = useState<ImageMeta[]>(() => getCachedImagesSync() || [])
  const [uploading, setUploading] = useState(false)
  const [componentType, setComponentType] = useState('general')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [generatingCount, setGeneratingCount] = useState(0)
  const generatingRef = useRef(false)

  useEffect(() => {
    fetchImagesCached().then(({ data }) => {
      setImages(data as ImageMeta[])
      const missingThumb = (data as ImageMeta[]).filter((img) => !img.thumbnail)
      if (missingThumb.length > 0 && !generatingRef.current) {
        generateMissingThumbnails(missingThumb)
      }
    }).catch(() => {})
  }, [])

  async function generateMissingThumbnails(missing: ImageMeta[]) {
    generatingRef.current = true
    setGeneratingCount(missing.length)
    for (const img of missing) {
      try {
        const imgData = await fetchImageData(img.id)
        const thumb = await createThumbnail(imgData.data, imgData.type)
        await updateImageThumbnail(img.id, thumb)
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, thumbnail: thumb } : i))
        )
      } catch (err) {
        console.error('[ImageLibrary] failed to generate thumbnail for', img.filename, err)
      } finally {
        setGeneratingCount((c) => c - 1)
      }
    }
    generatingRef.current = false
    setGeneratingCount(0)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const data = base64.split(',')[1]
        const thumbnail = await createThumbnail(data, file.type)
        await uploadImage(file.name, data, file.type, componentType, thumbnail)
        invalidateCache('images')
        invalidateCache('images_data')
        const { data: updated } = await fetchImagesCached()
        setImages(updated as ImageMeta[])
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const openPreview = useCallback(async (id: string) => {
    setPreviewId(id)
    setLoadingPreview(true)
    try {
      const imgData = await fetchImageData(id)
      setPreviewData(`data:${imgData.type};base64,${imgData.data}`)
    } catch {
      setPreviewData(null)
    } finally {
      setLoadingPreview(false)
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewId(null)
    setPreviewData(null)
  }, [])

  const handleUse = useCallback(async (img: ImageMeta) => {
    try {
      const imgData = await fetchImageData(img.id)
      const url = `data:${imgData.type};base64,${imgData.data}`
      onSelect?.(url)
    } catch (err) {
      console.error(err)
    }
  }, [onSelect])

  return (
    <div className="admin-image-library">
      <h2>Biblioteca de Imagens</h2>

      {generatingCount > 0 && (
        <div className="admin-alert">Gerando thumbnails para {generatingCount} imagem(ns) existente(s)...</div>
      )}

      <div className="admin-upload">
        <div className="admin-row">
          <div className="admin-field">
            <label>Tipo de Componente</label>
            <input value={componentType} onChange={(e) => setComponentType(e.target.value)} placeholder="ex: Hero, Galeria" />
          </div>
          <div className="admin-field" style={{ justifyContent: 'flex-end' }}>
            <label style={{ visibility: 'hidden' }}>Upload</label>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {uploading ? 'Enviando...' : 'Enviar Imagem'}
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>

      <div className="admin-image-grid">
        {images.map((img) => (
          <div key={img.id} className="admin-image-item" onClick={() => openPreview(img.id)}>
            {img.thumbnail ? (
              <img src={`data:${img.type};base64,${img.thumbnail}`} alt={img.filename} />
            ) : (
              <div className="admin-image-placeholder admin-image-generating">
                <span>...</span>
              </div>
            )}
            <div className="admin-image-item-info">
              <span>{img.filename}</span>
              {onSelect && (
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleUse(img) }}>Usar</button>
              )}
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="admin-empty">Nenhuma imagem enviada ainda.</p>}
      </div>

      {previewId && (
        <div className="admin-image-preview-overlay" onClick={closePreview}>
          <div className="admin-image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-image-preview-close" onClick={closePreview}>&times;</button>
            {loadingPreview && <p>Carregando...</p>}
            {previewData && <img src={previewData} alt="preview" />}
          </div>
        </div>
      )}
    </div>
  )
}
