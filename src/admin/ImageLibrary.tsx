import { useState, useEffect } from 'react'
import { fetchImages, uploadImage } from '../cms/api'

interface ImageRecord {
  id: string
  filename: string
  data: string
  type: string
  component_type: string | null
  created_at: string
}

interface ImageLibraryProps {
  onSelect?: (url: string) => void
}

export default function ImageLibrary({ onSelect }: ImageLibraryProps) {
  const [images, setImages] = useState<ImageRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [componentType, setComponentType] = useState('general')

  useEffect(() => {
    fetchImages().then(setImages).catch(() => {})
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const data = base64.split(',')[1]
        await uploadImage(file.name, data, file.type, componentType)
        const updated = await fetchImages()
        setImages(updated)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-image-library">
      <h2>Biblioteca de Imagens</h2>

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
        {images.map((img) => {
          const url = `data:${img.type};base64,${img.data}`
          return (
            <div key={img.id} className="admin-image-item">
              <img src={url} alt={img.filename} />
              <div className="admin-image-item-info">
                <span>{img.filename}</span>
                {onSelect && (
                  <button className="btn btn-sm" onClick={() => onSelect(url)}>Usar</button>
                )}
              </div>
            </div>
          )
        })}
        {images.length === 0 && <p className="admin-empty">Nenhuma imagem enviada ainda.</p>}
      </div>
    </div>
  )
}
