import { useState, useEffect } from 'react'
import { fetchContentCached } from '../cms/contentCache'
import { getModularSection, getAllSectionTitles } from '../cms/registry'
import { ROLES } from '../cms/auth'

interface AdminDashboardProps {
  onNavigate: (view: string, section?: string) => void
  unreadMessages: number
  role: string | null
}

export default function AdminDashboard({ onNavigate, unreadMessages, role }: AdminDashboardProps) {
  const [previewContent, setPreviewContent] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchContentCached().then(({ data }) => setPreviewContent(data)).catch(() => { })
  }, [])

  const sectionTitles = getAllSectionTitles()

  const frontendSectionTitles = [
    'Hero', 'Sobre', 'Segmentos', 'Galeria', 'Depoimentos',
    'FAQ', 'Contato', 'Mapa', 'Blog', 'Footer', 'Navbar',
  ]

  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const isEditorAdmin = role === ROLES.EDITOR_ADMIN
  const isEditorBlog = role === ROLES.EDITOR_BLOG
  const isGestorAdmin = role === ROLES.GESTOR_ADMIN

  const visibleSections = sectionTitles.filter((title) => {
    if (isSuperAdmin) return true
    if (isEditorAdmin) return frontendSectionTitles.includes(title)
    if (isEditorBlog) return title === 'Blog'
    if (isGestorAdmin) return false
    return false
  })

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h2>Painel de Controle</h2>
        <p>Bem-vindo ao Colégio São Judas Tadeu.</p>
      </div>

      <div className="admin-cards">
        {(isSuperAdmin || isEditorAdmin) && (
          <div className="admin-card" onClick={() => onNavigate('pages')}>
            <div className="admin-card-icon">📄</div>
            <div className="admin-card-info">
              <h3>Páginas</h3>
              <p>Gerenciar páginas e suas seções</p>
            </div>
          </div>
        )}

        {(isSuperAdmin || isEditorAdmin) && (
          <div className="admin-card" onClick={() => onNavigate('images')}>
            <div className="admin-card-icon">🖼️</div>
            <div className="admin-card-info">
              <h3>Biblioteca de Imagens</h3>
              <p>Gerenciar imagens enviadas</p>
            </div>
          </div>
        )}

        {(isSuperAdmin || isEditorAdmin) && (
          <div className="admin-card" onClick={() => onNavigate('messages')}>
            <div className="admin-card-icon">✉️</div>
            <div className="admin-card-info">
              <h3>Mensagens {unreadMessages > 0 && <span className="admin-badge">{unreadMessages}</span>}</h3>
              <p>Visualizar mensagens do formulário de contato</p>
            </div>
          </div>
        )}

        {(isSuperAdmin || isGestorAdmin) && (
          <div className="admin-card" onClick={() => onNavigate('historico_alunos')}>
            <div className="admin-card-icon">📋</div>
            <div className="admin-card-info">
              <h3>Cadastro de Alunos</h3>
              <p>Gerenciar registros de alunos</p>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <>
            <div className="admin-card" onClick={() => onNavigate('backups')}>
              <div className="admin-card-icon">💾</div>
              <div className="admin-card-info">
                <h3>Backups</h3>
                <p>Gerenciar backups do conteúdo</p>
              </div>
            </div>
            <div className="admin-card" onClick={() => onNavigate('users')}>
              <div className="admin-card-icon">👥</div>
              <div className="admin-card-info">
                <h3>Gerenciar Usuários</h3>
                <p>Criar e gerenciar usuários do sistema</p>
              </div>
            </div>
            <div className="admin-card" onClick={() => onNavigate('setup')}>
              <div className="admin-card-icon">⚙️</div>
              <div className="admin-card-info">
                <h3>Configuração Inicial</h3>
                <p>Criar usuário admin (primeiro acesso)</p>
              </div>
            </div>
          </>
        )}
      </div>

      {visibleSections.length > 0 && (
        <div className="admin-section-list">
          <h3>Seções do Site</h3>
          <div className="admin-section-grid">
            {visibleSections.map((title) => {
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
      )}
    </div>
  )
}
