import { useState, useEffect } from 'react'
import { fetchContent } from '../cms/api'
import { getModularSection, getAllSectionTitles } from '../cms/registry'

interface AdminDashboardProps {
  onNavigate: (view: string, section?: string) => void
  unreadMessages: number
}

export default function AdminDashboard({ onNavigate, unreadMessages }: AdminDashboardProps) {
  const [previewContent, setPreviewContent] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchContent().then(setPreviewContent).catch(() => { })
  }, [])

  const sectionTitles = getAllSectionTitles()

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h2>Painel de Controle</h2>
        <p>Bem-vindo ao Colégio São Judas Tadeu.</p>
      </div>

      <div className="admin-cards">
        <div className="admin-card" onClick={() => onNavigate('content')}>
          <div className="admin-card-icon">📝</div>
          <div className="admin-card-info">
            <h3>Conteúdo Global</h3>
            <p>Editar textos, cores e configurações gerais</p>
          </div>
        </div>

        <div className="admin-card" onClick={() => onNavigate('pages')}>
          <div className="admin-card-icon">📄</div>
          <div className="admin-card-info">
            <h3>Páginas</h3>
            <p>Gerenciar páginas e suas seções</p>
          </div>
        </div>

        <div className="admin-card" onClick={() => onNavigate('images')}>
          <div className="admin-card-icon">🖼️</div>
          <div className="admin-card-info">
            <h3>Biblioteca de Imagens</h3>
            <p>Gerenciar imagens enviadas</p>
          </div>
        </div>

        <div className="admin-card" onClick={() => onNavigate('messages')}>
          <div className="admin-card-icon">✉️</div>
          <div className="admin-card-info">
            <h3>Mensagens {unreadMessages > 0 && <span className="admin-badge">{unreadMessages}</span>}</h3>
            <p>Visualizar mensagens do formulário de contato</p>
          </div>
        </div>

        <div className="admin-card" onClick={() => onNavigate('backups')}>
          <div className="admin-card-icon">💾</div>
          <div className="admin-card-info">
            <h3>Backups</h3>
            <p>Gerenciar backups do conteúdo</p>
          </div>
        </div>

        <div className="admin-card" onClick={() => onNavigate('setup')}>
          <div className="admin-card-icon">⚙️</div>
          <div className="admin-card-info">
            <h3>Configuração Inicial</h3>
            <p>Criar usuário admin (primeiro acesso)</p>
          </div>
        </div>
      </div>

      <div className="admin-section-list">
        <h3>Seções do Site</h3>
        <div className="admin-section-grid">
          {sectionTitles.map((title) => {
            const section = getModularSection(title)
            if (!section) return null
            return (
              <div key={title} className="admin-section-card" onClick={() => onNavigate('section', title)}>
                <h4>{section.schema.title}</h4>
                <p>{section.schema.keys.length} campos</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
