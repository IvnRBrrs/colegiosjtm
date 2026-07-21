import { useState, useEffect } from 'react'
import api from '../cms/api'
import { AdminLogin, AdminDashboard, SectionEditor, PageManager, ImageLibrary, StyleEditor, BackupRestore, UserManager, HistoricoAlunos } from './index'
import { getRoleFromToken, getUsernameFromToken, ROLES } from '../cms/auth'
import { fetchAdminPreload } from '../cms/api'
import { seedCache, getCachedMessagesSync, getCachedPreEnrollmentsSync } from '../cms/contentCache'
import ChangePasswordModal from './ChangePasswordModal'

export default function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('cms_token'))
  const [role, setRole] = useState(() => getRoleFromToken())
  const [view, setView] = useState('dashboard')
  const [sectionTitle, setSectionTitle] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadPreEnrollments, setUnreadPreEnrollments] = useState(0)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const hydratePreload = (data: any) => {
    if (data.content) seedCache('global_content', data.content)
    if (data.pages) seedCache('pages', data.pages)
    if (data.blogPosts) seedCache('blog_posts', data.blogPosts)
    if (data.tags) seedCache('blog_tags', data.tags)
    if (data.messages) seedCache('messages', data.messages)
    if (data.preEnrollments) seedCache('pre_enrollments', data.preEnrollments)
    if (data.images) seedCache('images', data.images)
    const unread = (data.messages || []).filter((m: any) => !m.read && !m.archived).length
    setUnreadMessages(unread)
    const preUnread = (data.preEnrollments || []).filter((m: any) => !m.read && !m.archived).length
    setUnreadPreEnrollments(preUnread)
  }

  useEffect(() => {
    if (token) {
      fetchAdminPreload().then(hydratePreload).catch(() => { })
    }
  }, [token])

  const handleLogin = (newToken: string, needChangePassword?: boolean) => {
    setToken(newToken)
    setRole(getRoleFromToken())
    setMustChangePassword(!!needChangePassword)
    setView('dashboard')
  }

  const handlePasswordChanged = (newToken: string) => {
    localStorage.setItem('cms_token', newToken)
    setToken(newToken)
    setRole(getRoleFromToken())
    setMustChangePassword(false)
    setView('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('cms_token')
    setToken(null)
    setRole(null)
    setMustChangePassword(false)
    setView('dashboard')
  }

  const handleNavigate = (v: string, section?: string) => {
    if (v === 'section' && section) {
      setSectionTitle(section)
      setView('section')
    } else {
      setView(v)
    }
  }

  if (!token) {
    return (
      <div className="admin-wrapper">
        <AdminLogin onLogin={handleLogin} />
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <AdminDashboard onNavigate={handleNavigate} unreadMessages={unreadMessages} role={role} />
      case 'section':
        return <SectionEditor sectionTitle={sectionTitle} onBack={() => setView('dashboard')} />
      case 'pages':
        return <PageManager />
      case 'images':
        return <ImageLibrary />
      case 'messages':
        return <MessagesList onUnreadChange={setUnreadMessages} />
      case 'pre_enrollments':
        return <PreEnrollmentsList onUnreadChange={setUnreadPreEnrollments} />
      case 'backups':
        return <BackupRestore />
      case 'setup':
        return <SetupForm />
      case 'users':
        return <UserManager currentUsername={getUsernameFromToken() || ''} />
      case 'historico_alunos':
        return <HistoricoAlunos />
      default:
        return <AdminDashboard onNavigate={handleNavigate} unreadMessages={unreadMessages} role={role} />
    }
  }

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <h2>Olá {getUsernameFromToken() || 'Usuário'}</h2>
        <nav>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          {role === ROLES.SUPER_ADMIN || role === ROLES.EDITOR_ADMIN ? (
            <button className={view === 'pages' ? 'active' : ''} onClick={() => setView('pages')}>Páginas</button>
          ) : null}
          {role === ROLES.SUPER_ADMIN || role === ROLES.EDITOR_ADMIN || role === ROLES.EDITOR_BLOG || role === ROLES.GESTOR_ADMIN ? (
            <button className={view === 'section' && sectionTitle === 'Blog' ? 'active' : ''} onClick={() => handleNavigate('section', 'Blog')}>Blog</button>
          ) : null}
          {role === ROLES.SUPER_ADMIN || role === ROLES.EDITOR_ADMIN || role === ROLES.GESTOR_ADMIN ? (
            <button className={view === 'images' ? 'active' : ''} onClick={() => setView('images')}>Imagens</button>
          ) : null}
          {role === ROLES.SUPER_ADMIN || role === ROLES.GESTOR_ADMIN ? (
            <button className={view === 'messages' ? 'active' : ''} onClick={() => setView('messages')}>
              <span className="sidebar-btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadMessages > 0 && <span className="sidebar-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>}
              </span>
              Mensagens
            </button>
          ) : null}
          {role === ROLES.SUPER_ADMIN || role === ROLES.GESTOR_ADMIN ? (
            <button className={view === 'pre_enrollments' ? 'active' : ''} onClick={() => setView('pre_enrollments')}>
              <span className="sidebar-btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadPreEnrollments > 0 && <span className="sidebar-badge">{unreadPreEnrollments > 99 ? '99+' : unreadPreEnrollments}</span>}
              </span>
              Pré-Matrícula
            </button>
          ) : null}
          {role === ROLES.SUPER_ADMIN ? (
            <button className={view === 'historico_alunos' ? 'active' : ''} onClick={() => setView('historico_alunos')}>Cadastro de Alunos</button>
          ) : null}
          <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>Usuários</button>
          {role === ROLES.SUPER_ADMIN ? (
            <>
              <button className={view === 'backups' ? 'active' : ''} onClick={() => setView('backups')}>Backups</button>
              <button className={view === 'setup' ? 'active' : ''} onClick={() => setView('setup')}>Setup</button>
            </>
          ) : null}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">Ver Site</a>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </aside>
      <main className="admin-main">
        {renderView()}
      </main>

      {mustChangePassword && (
        <ChangePasswordModal
          onSuccess={handlePasswordChanged}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

function MessagesList({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const [messages, setMessages] = useState<any[]>(() => {
    const cached = getCachedMessagesSync()
    return cached || []
  })
  const [tab, setTab] = useState<'inbox' | 'archived'>('inbox')
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)

  useEffect(() => {
    api.get('/messages').then(({ data }) => {
      setMessages(data)
      const unread = data.filter((m: any) => !m.read && !m.archived).length
      onUnreadChange?.(unread)
    }).catch(() => { })
  }, [])

  const updateUnread = (msgs: any[]) => {
    const unread = msgs.filter((m) => !m.read && !m.archived).length
    onUnreadChange?.(unread)
  }

  const markRead = async (id: number) => {
    await api.put(`/messages/${id}/read`)
    setMessages((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, read: 1 } : m)
      updateUnread(next)
      return next
    })
    if (selectedMessage?.id === id) setSelectedMessage((prev: any) => prev ? { ...prev, read: 1 } : null)
  }

  const archiveMessage = async (id: number) => {
    await api.put(`/messages/${id}/archive`)
    setMessages((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, archived: 1 } : m)
      updateUnread(next)
      return next
    })
    setSelectedMessage(null)
  }

  const deleteMessage = async (id: number) => {
    if (!confirm('Excluir mensagem?')) return
    await api.delete(`/messages/${id}`)
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== id)
      updateUnread(next)
      return next
    })
    setSelectedMessage(null)
  }

  const openMessage = (m: any) => {
    if (!m.read && !m.archived) {
      setSelectedMessage({ ...m, read: 1 })
      setMessages((prev) => {
        const next = prev.map((msg) => msg.id === m.id ? { ...msg, read: 1 } : msg)
        updateUnread(next)
        return next
      })
      api.put(`/messages/${m.id}/read`).catch(() => { })
    } else {
      setSelectedMessage(m)
    }
  }

  const filtered = messages.filter((m) => tab === 'inbox' ? !m.archived : m.archived)

  return (
    <div className="admin-messages">
      <div className="admin-messages-header">
        <h2>Mensagens</h2>
        <div className="admin-messages-tabs">
          <button className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}>Caixa de Entrada</button>
          <button className={tab === 'archived' ? 'active' : ''} onClick={() => setTab('archived')}>Arquivadas</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="admin-empty">{tab === 'inbox' ? 'Nenhuma mensagem na caixa de entrada.' : 'Nenhuma mensagem arquivada.'}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Mensagem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className={`${!m.read && !m.archived ? 'unread' : ''} msg-row`} onClick={() => openMessage(m)}>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td>
                  {!m.read && !m.archived && <span className="unread-dot" title="Não lida" />}
                  {m.name}
                </td>
                <td>{m.email}</td>
                <td>{m.phone || '-'}</td>
                <td>{m.message}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {tab === 'inbox' && <button className="btn btn-sm" onClick={() => archiveMessage(m.id)}>Arquivar</button>}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteMessage(m.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedMessage && (
        <div className="admin-modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="admin-message-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedMessage(null)}>&times;</button>
            <h3>{selectedMessage.name}</h3>
            <div className="msg-modal-details">
              <div className="msg-modal-row">
                <span className="msg-modal-label">Email</span>
                <span>{selectedMessage.email}</span>
              </div>
              {selectedMessage.phone && (
                <div className="msg-modal-row">
                  <span className="msg-modal-label">Telefone</span>
                  <span>{selectedMessage.phone}</span>
                </div>
              )}
              <div className="msg-modal-row">
                <span className="msg-modal-label">Data</span>
                <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
              </div>
              <div className="msg-modal-row">
                <span className="msg-modal-label">Status</span>
                <span>{selectedMessage.archived ? 'Arquivada' : selectedMessage.read ? 'Lida' : 'Não lida'}</span>
              </div>
            </div>
            <div className="msg-modal-message">
              <span className="msg-modal-label">Mensagem</span>
              <p>{selectedMessage.message}</p>
            </div>
            <div className="msg-modal-actions">
              {!selectedMessage.read && !selectedMessage.archived && (
                <button className="btn btn-sm" onClick={() => markRead(selectedMessage.id)}>Marcar como lida</button>
              )}
              {!selectedMessage.archived && (
                <button className="btn btn-sm" onClick={() => archiveMessage(selectedMessage.id)}>Arquivar</button>
              )}
              <button className="btn btn-sm btn-danger" onClick={() => deleteMessage(selectedMessage.id)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PreEnrollmentsList({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const [items, setItems] = useState<any[]>(() => {
    const cached = getCachedPreEnrollmentsSync()
    return cached || []
  })
  const [tab, setTab] = useState<'inbox' | 'archived'>('inbox')
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    api.get('/pre-enrollments').then(({ data }) => {
      setItems(data)
      const unread = data.filter((m: any) => !m.read && !m.archived).length
      onUnreadChange?.(unread)
    }).catch(() => { })
  }, [])

  const updateUnread = (items: any[]) => {
    const unread = items.filter((m) => !m.read && !m.archived).length
    onUnreadChange?.(unread)
  }

  const markRead = async (id: number) => {
    await api.put(`/pre-enrollments/${id}/read`)
    setItems((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, read: 1 } : m)
      updateUnread(next)
      return next
    })
    if (selected?.id === id) setSelected((prev: any) => prev ? { ...prev, read: 1 } : null)
  }

  const archiveItem = async (id: number) => {
    await api.put(`/pre-enrollments/${id}/archive`)
    setItems((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, archived: 1 } : m)
      updateUnread(next)
      return next
    })
    setSelected(null)
  }

  const deleteItem = async (id: number) => {
    if (!confirm('Excluir pré-matrícula?')) return
    await api.delete(`/pre-enrollments/${id}`)
    setItems((prev) => {
      const next = prev.filter((m) => m.id !== id)
      updateUnread(next)
      return next
    })
    setSelected(null)
  }

  const openItem = (m: any) => {
    if (!m.read && !m.archived) {
      setSelected({ ...m, read: 1 })
      setItems((prev) => {
        const next = prev.map((msg) => msg.id === m.id ? { ...msg, read: 1 } : msg)
        updateUnread(next)
        return next
      })
      api.put(`/pre-enrollments/${m.id}/read`).catch(() => { })
    } else {
      setSelected(m)
    }
  }

  const filtered = items.filter((m) => tab === 'inbox' ? !m.archived : m.archived)

  return (
    <div className="admin-messages">
      <div className="admin-messages-header">
        <h2>Pré-Matrícula</h2>
        <div className="admin-messages-tabs">
          <button className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}>Caixa de Entrada</button>
          <button className={tab === 'archived' ? 'active' : ''} onClick={() => setTab('archived')}>Arquivadas</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="admin-empty">{tab === 'inbox' ? 'Nenhuma pré-matrícula recebida.' : 'Nenhuma pré-matrícula arquivada.'}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Responsável</th>
              <th>Aluno</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className={`${!m.read && !m.archived ? 'unread' : ''} msg-row`} onClick={() => openItem(m)}>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td>
                  {!m.read && !m.archived && <span className="unread-dot" title="Não lida" />}
                  {m.responsavel}
                </td>
                <td>{m.nome_aluno}</td>
                <td>{m.email}</td>
                <td>{m.whatsapp || '-'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {tab === 'inbox' && <button className="btn btn-sm" onClick={() => archiveItem(m.id)}>Arquivar</button>}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteItem(m.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-message-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelected(null)}>&times;</button>
            <h3>{selected.responsavel}</h3>
            <div className="msg-modal-details">
              <div className="msg-modal-row">
                <span className="msg-modal-label">Aluno</span>
                <span>{selected.nome_aluno}</span>
              </div>
              {selected.idade && (
                <div className="msg-modal-row">
                  <span className="msg-modal-label">Idade</span>
                  <span>{selected.idade}</span>
                </div>
              )}
              {selected.ano_letivo_atual && (
                <div className="msg-modal-row">
                  <span className="msg-modal-label">Ano Letivo</span>
                  <span>{selected.ano_letivo_atual}</span>
                </div>
              )}
              <div className="msg-modal-row">
                <span className="msg-modal-label">Email</span>
                <span>{selected.email}</span>
              </div>
              {selected.telefone && (
                <div className="msg-modal-row">
                  <span className="msg-modal-label">Telefone</span>
                  <span>{selected.telefone}</span>
                </div>
              )}
              {selected.whatsapp && (
                <div className="msg-modal-row">
                  <span className="msg-modal-label">WhatsApp</span>
                  <span>{selected.whatsapp}</span>
                </div>
              )}
              <div className="msg-modal-row">
                <span className="msg-modal-label">Data</span>
                <span>{new Date(selected.created_at).toLocaleString()}</span>
              </div>
              <div className="msg-modal-row">
                <span className="msg-modal-label">Status</span>
                <span>{selected.archived ? 'Arquivada' : selected.read ? 'Lida' : 'Não lida'}</span>
              </div>
            </div>
            {selected.mensagem && (
              <div className="msg-modal-message">
                <span className="msg-modal-label">Mensagem</span>
                <p>{selected.mensagem}</p>
              </div>
            )}
            <div className="msg-modal-actions">
              {!selected.read && !selected.archived && (
                <button className="btn btn-sm" onClick={() => markRead(selected.id)}>Marcar como lida</button>
              )}
              {!selected.archived && (
                <button className="btn btn-sm" onClick={() => archiveItem(selected.id)}>Arquivar</button>
              )}
              <button className="btn btn-sm btn-danger" onClick={() => deleteItem(selected.id)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SetupForm() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleSetup = async () => {
    if (!password) return
    setStatus('Criando...')
    try {
      await api.post('/auth/setup', { username, password })
      setStatus('Usuário criado com sucesso!')
    } catch (err: any) {
      setStatus(err.response?.data?.error || 'Erro ao criar usuário')
    }
  }

  return (
    <div className="admin-setup">
      <h2>Configuração Inicial</h2>
      <p>Crie o usuário administrador (apenas no primeiro acesso).</p>
      <div className="admin-field">
        <label>Usuário</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="admin-field">
        <label>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={handleSetup}>Criar Usuário</button>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  )
}
