import { useState } from 'react'
import { PDFPreview, HistoricoData } from './PDFPreview'

const disciplinaFields: { key: string; label: string }[] = [
  { key: 'nome', label: 'Disciplina' },
  { key: 'n1', label: 'N1' }, { key: 'n2', label: 'N2' }, { key: 'n3', label: 'N3' },
  { key: 'n4', label: 'N4' }, { key: 'n5', label: 'N5' }, { key: 'n6', label: 'N6' },
  { key: 'n7', label: 'N7' }, { key: 'n8', label: 'N8' }, { key: 'n9', label: 'N9' },
  { key: 'm1', label: 'M1' }, { key: 'm2', label: 'M2' }, { key: 'm3', label: 'M3' },
  { key: 'ano', label: 'Ano' }, { key: 'serie', label: 'Série' }, { key: 'escola', label: 'Escola' },
  { key: 'cidade', label: 'Cidade' }, { key: 'sit', label: 'Sit.' },
]

function emptyDisciplina() {
  return {
    nome: '', n1: '', n2: '', n3: '', n4: '', n5: '', n6: '', n7: '', n8: '', n9: '',
    m1: '', m2: '', m3: '', ano: '', serie: '', escola: '', cidade: '', sit: '',
  }
}

const defaultDisciplinas = [
  { nome: 'LÍNGUA PORTUGUESA', n1: '-', n2: 'A', n3: '9,5', n4: '-', n5: '9,0', n6: '10,0/200', n7: '9,0/200', n8: '7,5/200', n9: '7,5/200', m1: '9,3/100', m2: '', m3: '', ano: '2015', serie: '1º ANO', escola: 'ESCOLA DE ENS. FUND.\nNIKOLAS PANOS', cidade: 'MACEIÓ/AL', sit: 'APC' },
  { nome: 'MATEMÁTICA', n1: '-', n2: '-', n3: '6,5', n4: '-', n5: '8,0', n6: '9,0/200', n7: '9,0/200', n8: '7,5/200', n9: '6,0/200', m1: '6,9/100', m2: '', m3: '', ano: '2016', serie: '1º/2º', escola: 'ESCOLA DE ENS. FUND.\nNIKOLAS PANOS', cidade: 'MACEIÓ/AL', sit: 'APC' },
  { nome: 'HISTÓRIA', n1: '-', n2: '-', n3: '9,5', n4: '-', n5: '9,0', n6: '8,0/80', n7: '8,5/80', n8: '8,0/80', n9: '9,0/80', m1: '8,9/66,4', m2: '', m3: '', ano: '2017', serie: '2º/3º', escola: 'ESCOLA TIA HELENA', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
  { nome: 'GEOGRAFIA', n1: '-', n2: '-', n3: '9,5', n4: '-', n5: '9,0', n6: '9,5/80', n7: '9,5/80', n8: '8,0/80', n9: '9,5/80', m1: '9,0/66,4', m2: '', m3: '', ano: '2018', serie: '3º/4º', escola: 'ESCOLA TIA HELENA', cidade: 'MACEIÓ/AL', sit: 'APC' },
  { nome: 'CIÊNCIAS', n1: 'A', n2: 'A', n3: '10,0', n4: 'A', n5: '9,0', n6: '10,0/80', n7: '8,0/80', n8: '7,0/80', n9: '7,5/80', m1: '', m2: '', m3: '', ano: '2019', serie: '4º/5º', escola: 'ESCOLA DE ED. BÁSICA\nDIANTE DO TRONO', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
  { nome: 'ARTES', n1: '-', n2: '-', n3: '9,5', n4: 'P', n5: '10,0', n6: '10,0/40', n7: '8,5/40', n8: '9,0/50', n9: '8,5/50', m1: '8,6/33,2', m2: '', m3: '', ano: '2020', serie: '5º/6º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
  { nome: 'L.E.M. INGLÊS', n1: '-', n2: 'A', n3: '10,0', n4: 'C', n5: '9,0', n6: '8,5/80', n7: '9,0/80', n8: '9,0/80', n9: '8,0/80', m1: '8,9/33,2', m2: '', m3: '', ano: '2021', serie: '6º/7º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
  { nome: 'CIDADANIA', n1: '-', n2: 'P', n3: '-', n4: 'P', n5: '-', n6: '10,0/40', n7: '10,0/40', n8: '9,5/50', n9: '-', m1: '', m2: '', m3: '', ano: '2022', serie: '7º/8º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
  { nome: 'EDUCAÇÃO FÍSICA', n1: '-', n2: 'C', n3: '10,0', n4: 'C', n5: '10,0', n6: '9,0/40', n7: '10,0/40', n8: '8,0/50', n9: '8,0/50', m1: '10,0/33,2', m2: '', m3: '', ano: '2023', serie: '8º/9º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
  { nome: 'FILOSOFIA', n1: '-', n2: '-', n3: '-', n4: '-', n5: '-', n6: '-', n7: '-', n8: '8,0/40', n9: '9,0/50', m1: '8,0/50', m2: '', m3: '', ano: '2025', serie: '1º SÉRIE', escola: 'COLÉGIO SÃO JUDAS\nTADEU', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
]

function HistoricoEditor() {
  const [aluno, setAluno] = useState('NICOLAS ARAUJO ROCHA')
  const [nascimento, setNascimento] = useState('16 DE DEZEMBRO DE 2001')
  const [pai, setPai] = useState('EDNALDO SANTOS ROCHA')
  const [mae, setMae] = useState('NYDIA DE PAULA ARAUJO DE SEIXAS')
  const [naturalidade, setNaturalidade] = useState('MACEIÓ/AL')
  const [disciplinas, setDisciplinas] = useState<any[]>(defaultDisciplinas.map((d) => ({ ...d })))
  const [showEditor, setShowEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const updateDisciplina = (idx: number, key: string, value: string) => {
    setDisciplinas((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: value }
      return next
    })
  }

  const addRow = () => {
    setDisciplinas((prev) => [...prev, emptyDisciplina()])
  }

  const removeRow = (idx: number) => {
    if (disciplinas.length <= 1) return
    setDisciplinas((prev) => prev.filter((_, i) => i !== idx))
  }

  const data: HistoricoData = {
    aluno, nascimento, pai, mae, naturalidade,
    disciplinas: disciplinas.filter((d) => d.nome),
  }

  const handlePrint = () => {
    window.print()
  }

  const fillSample = () => {
    setDisciplinas(defaultDisciplinas.map((d) => ({ ...d })))
  }

  return (
    <div className="historico-editor">
      <div className="historico-editor-print-area">
        <div className="history-editor-header">
          <h2>Editor de Histórico Escolar</h2>
          <div className="historico-editor-actions">
            <button className="btn btn-sm btn-primary" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? 'Ocultar Preview' : 'Pré-visualizar'}
            </button>
            <button className="btn btn-sm btn-outline" onClick={handlePrint}>Imprimir (A4)</button>
          </div>
        </div>

        <div className="historico-student-form">
          <div className="historico-form-row">
            <div className="admin-field">
              <label>Aluno</label>
              <input value={aluno} onChange={(e) => setAluno(e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Nascimento</label>
              <input value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
            </div>
          </div>
          <div className="historico-form-row">
            <div className="admin-field">
              <label>Pai</label>
              <input value={pai} onChange={(e) => setPai(e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Mãe</label>
              <input value={mae} onChange={(e) => setMae(e.target.value)} />
            </div>
          </div>
          <div className="historico-form-row">
            <div className="admin-field">
              <label>Naturalidade</label>
              <input value={naturalidade} onChange={(e) => setNaturalidade(e.target.value)} />
            </div>
            <div className="admin-field" style={{ justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-outline" onClick={() => setShowEditor(!showEditor)}>
                  {showEditor ? 'Fechar Disciplinas' : 'Editar Disciplinas'}
                </button>
                <button className="btn btn-sm btn-outline" onClick={fillSample}>Carregar Exemplo</button>
              </div>
            </div>
          </div>
        </div>

        {showEditor && (
          <div className="historico-disciplinas-editor">
            <h3>Disciplinas ({disciplinas.length})</h3>
            <div className="historico-disciplinas-grid">
              {/* <div className="flex gap-2 text-[14px] ml-7 mb-3 " style={{ justifyContent: 'space-between', outline: '1px solid #ccc', outlineOffset: '-1px' }}> */}
              <div className="historico-disciplina-row ml-7 mb-3 font-bold">
                <span className="historico-cell-input">DISCIPLINAS</span>
                <span className="historico-cell-input">1° ANO </span>
                <span className="historico-cell-input">1°/2° </span>
                <span className="historico-cell-input">2°/3°</span>
                <span className="historico-cell-input">3°/4° </span>
                <span className="historico-cell-input">4°/5° </span>
                <span className="historico-cell-input">5°/6°/CH </span>
                <span className="historico-cell-input">6°/7°/CH </span>
                <span className="historico-cell-input">7°/8°/CH </span>
                <span className="historico-cell-input">8°/9°/CH </span>
                <span className="historico-cell-input">1ª SÉRIE </span>
                <span className="historico-cell-input">2ª SÉRIE </span>
                <span className="historico-cell-input">3ª SÉRIE </span>
                <span className="historico-cell-input">ANO </span>
                <span className="historico-cell-input">SÉRIE </span>
                <span className="historico-cell-input">ESCOLA </span>
                <span className="historico-cell-input">CID/UF </span>
                <span className="historico-cell-input">SIT</span>
              </div>
            </div>

            <div className="historico-disciplinas-grid">
              {disciplinas.map((d, idx) => (
                <div key={idx} className="historico-disciplina-row">
                  <span className="historico-row-number">{idx + 1}.</span>
                  {disciplinaFields.map((f) => (
                    <input
                      key={f.key}
                      className="historico-cell-input"
                      placeholder={f.label}
                      value={d[f.key] || ''}
                      onChange={(e) => updateDisciplina(idx, f.key, e.target.value)}
                      title={f.label}
                    />
                  ))}
                  <button className="btn btn-sm btn-danger" onClick={() => removeRow(idx)} disabled={disciplinas.length <= 1}>×</button>
                </div>
              ))}
            </div>
            <button className="btn btn-sm btn-primary" onClick={addRow} style={{ marginTop: 8 }}>+ Adicionar Disciplina</button>
          </div>
        )}

        {showPreview && (
          <div className="historico-preview" id="historico-preview-content">
            <PDFPreview data={data} />
          </div>
        )}

        <style>{`
          .historico-editor {
            padding: 16px;
          }
          .history-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 8px;
          }
          .history-editor-header h2 {
            margin: 0;
          }
          .historico-editor-actions {
            display: flex;
            gap: 8px;
          }
          .historico-student-form {
            background: white;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          }
          .historico-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .historico-form-row:last-child {
            margin-bottom: 0;
          }
          .historico-disciplinas-editor {
            background: white;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            max-height: 600px;
            overflow-y: auto;
          }
          .historico-disciplinas-editor h3 {
            margin: 0 0 12px;
            font-size: 0.95rem;
          }
          .historico-disciplinas-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .historico-disciplina-row {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-wrap: nowrap;
          }
          .historico-row-number {
            font-size: 0.75rem;
            color: #888;
            width: 24px;
            flex-shrink: 0;
            text-align: right;
            padding-right: 4px;
          }
          .historico-cell-input {
            padding: 4px 6px;
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 0.75rem;
            width: 70px;
            flex-shrink: 0;
            color: var(--text);
            background: var(--bg);
          }
          .historico-cell-input:first-of-type {
            width: 130px;
          }
          .historico-cell-input:focus {
            outline: none;
            border-color: var(--primary);
          }
          .historico-preview {
            background: white;
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: auto;
          }

          @media print {
            body * {
              visibility: hidden !important;
              max-height: 0 !important;
              overflow: hidden !important;
            }
            #historico-preview-content,
            #historico-preview-content * {
              visibility: visible !important;
              max-height: none !important;
              overflow: visible !important;
            }
            #historico-preview-content {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              background: white !important;
              z-index: 999999 !important;
            }
            @page {
              size: A4 landscape;
              margin: 0;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default HistoricoEditor
