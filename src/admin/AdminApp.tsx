import { useState, useEffect } from 'react'
import api from '../cms/api'
import { AdminLogin, AdminDashboard, SectionEditor, PageManager, ImageLibrary, StyleEditor, BackupRestore } from './index'

export default function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('cms_token'))
  const [view, setView] = useState('dashboard')
  const [sectionTitle, setSectionTitle] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (token) {
      api.get('/messages').then(({ data }) => {
        const unread = data.filter((m: any) => !m.read).length
        setUnreadMessages(unread)
      }).catch(() => { })
    }
  }, [token])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    setView('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('cms_token')
    setToken(null)
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
        return <AdminDashboard onNavigate={handleNavigate} unreadMessages={unreadMessages} />
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
      default:
        return <AdminDashboard onNavigate={handleNavigate} unreadMessages={unreadMessages} />
    }
  }

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <h2>Administrativo</h2>
        <nav>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'pages' ? 'active' : ''} onClick={() => setView('pages')}>Páginas</button>
          <button className={view === 'section' && sectionTitle === 'Blog' ? 'active' : ''} onClick={() => handleNavigate('section', 'Blog')}>Blog</button>
          <button className={view === 'images' ? 'active' : ''} onClick={() => setView('images')}>Imagens</button>
          <button className={view === 'messages' ? 'active' : ''} onClick={() => setView('messages')}>Mensagens {unreadMessages > 0 && `(${unreadMessages})`}</button>
          <button className={view === 'backups' ? 'active' : ''} onClick={() => setView('backups')}>Backups</button>
          <button className={view === 'setup' ? 'active' : ''} onClick={() => setView('setup')}>Setup</button>
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">Ver Site</a>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </aside>
      <main className="admin-main">
        {renderView()}
      </main>
    </div>
  )
}

function MessagesList() {
  const [messages, setMessages] = useState<any[]>([])

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
