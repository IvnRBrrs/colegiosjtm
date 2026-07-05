import { useState, useEffect } from 'react'
import api from '../cms/api'

interface Aluno {
  id: string
  aluno_nome: string
  data: string
  created_at: string
}

export default function HistoricoAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAlunos() }, [])

  const loadAlunos = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/historico-alunos')
      setAlunos(data)
    } catch { setAlunos([]) }
    finally { setLoading(false) }
  }

  const createAluno = async () => {
    if (!nome.trim()) return
    try {
      await api.post('/historico-alunos', { aluno_nome: nome })
      setNome('')
      loadAlunos()
    } catch (err) { console.error(err) }
  }

  const deleteAluno = async (id: string) => {
    if (!confirm('Excluir este registro?')) return
    try {
      await api.delete(`/historico-alunos/${id}`)
      loadAlunos()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="admin-historico-alunos">
      <h2>Histórico de Alunos</h2>

      <div className="admin-row" style={{ gap: 12, marginBottom: 24 }}>
        <div className="admin-field" style={{ flex: 1 }}>
          <label>Nome do Aluno</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite o nome do aluno" />
        </div>
        <button className="btn btn-primary" onClick={createAluno} style={{ alignSelf: 'flex-end' }}>Adicionar</button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : alunos.length === 0 ? (
        <p className="admin-empty">Nenhum registro encontrado.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id}>
                <td>{a.aluno_nome}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteAluno(a.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
