import { useState, useEffect } from 'react'
import api from '../cms/api'
import { AdminLogin, AdminDashboard, SectionEditor, PageManager, ImageLibrary, StyleEditor, BackupRestore, UserManager, HistoricoAlunos } from './index'
import { getRoleFromToken, getUsernameFromToken, ROLES } from '../cms/auth'
import { fetchAdminPreload } from '../cms/api'
import { seedCache, getCachedMessagesSync } from '../cms/contentCache'
import ChangePasswordModal from './ChangePasswordModal'

export default function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('cms_token'))
  const [role, setRole] = useState(() => getRoleFromToken())
  const [view, setView] = useState('dashboard')
  const [sectionTitle, setSectionTitle] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const hydratePreload = (data: any) => {
    if (data.content) seedCache('global_content', data.content)
    if (data.pages) seedCache('pages', data.pages)
    if (data.blogPosts) seedCache('blog_posts', data.blogPosts)
    if (data.tags) seedCache('blog_tags', data.tags)
    if (data.messages) seedCache('messages', data.messages)
    if (data.images) seedCache('images', data.images)
    const unread = (data.messages || []).filter((m: any) => !m.read).length
    setUnreadMessages(unread)
  }

  useEffect(() => {
    if (token) {
      fetchAdminPreload().then(hydratePreload).catch(() => {})
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
        return <MessagesList />
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
          {role === ROLES.SUPER_ADMIN || role === ROLES.EDITOR_ADMIN || role === ROLES.EDITOR_BLOG ? (
            <button className={view === 'section' && sectionTitle === 'Blog' ? 'active' : ''} onClick={() => handleNavigate('section', 'Blog')}>Blog</button>
          ) : null}
          {role === ROLES.SUPER_ADMIN || role === ROLES.EDITOR_ADMIN ? (
            <button className={view === 'images' ? 'active' : ''} onClick={() => setView('images')}>Imagens</button>
          ) : null}
          {role === ROLES.SUPER_ADMIN || role === ROLES.EDITOR_ADMIN ? (
            <button className={view === 'messages' ? 'active' : ''} onClick={() => setView('messages')}>Mensagens {unreadMessages > 0 && `(${unreadMessages})`}</button>
          ) : null}
          {role === ROLES.SUPER_ADMIN || role === ROLES.GESTOR_ADMIN ? (
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

function MessagesList() {
  const [messages, setMessages] = useState<any[]>(() => {
    const cached = getCachedMessagesSync()
    return cached || []
  })

  useEffect(() => {
    api.get('/messages').then(({ data }) => setMessages(data)).catch(() => { })
  }, [])

  const markRead = async (id: number) => {
    await api.put(`/messages/${id}/read`)
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: 1 } : m))
  }

  const deleteMessage = async (id: number) => {
    if (!confirm('Excluir mensagem?')) return
    await api.delete(`/messages/${id}`)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="admin-messages">
      <h2>Mensagens Recebidas</h2>
      {messages.length === 0 ? (
        <p className="admin-empty">Nenhuma mensagem recebida.</p>
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
            {messages.map((m) => (
              <tr key={m.id} className={!m.read ? 'unread' : ''}>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.phone || '-'}</td>
                <td>{m.message}</td>
                <td>
                  {!m.read && <button className="btn btn-sm" onClick={() => markRead(m.id)}>Marcar lida</button>}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteMessage(m.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
