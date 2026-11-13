import { useEffect, useRef, useState } from 'react'
import type { Atividade, Dados } from '../types'
import { dataISOValida, diasCorridos, formatarBR, hojeISO, sobrepoe } from '../lib/datas'

interface Props {
  inline?: boolean
  dados: Dados
  inicial: Partial<Atividade>
  onSalvar: (atividade: Atividade, continuar?: boolean) => void
  onExcluir: (id: string) => void
  onCancelar: () => void
}

export function FormAtividade({ dados, inicial, onSalvar, onExcluir, onCancelar, inline = false }: Props) {
  const [escolaId, setEscolaId] = useState(inicial.escolaId ?? '')
  const [equipeId, setEquipeId] = useState(inicial.equipeId ?? '')
  const [inicio, setInicio] = useState(inicial.inicio ?? hojeISO())
  const [fim, setFim] = useState(inicial.fim ?? inicial.inicio ?? hojeISO())
  const [titulo, setTitulo] = useState(inicial.titulo ?? '')
  const [descricao, setDescricao] = useState(inicial.descricao ?? '')
  const [salvo, setSalvo] = useState(false)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const tituloRef = useRef<HTMLInputElement>(null)
  const edicao = Boolean(inicial.id)
  const valores = JSON.stringify({ escolaId, equipeId, inicio, fim, titulo, descricao })
  const referencia = useRef(valores)

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (!inline) dialogo?.showModal()
    return () => { if (!inline && dialogo?.open) dialogo.close() }
  }, [])

  const cancelar = () => {
    if (valores !== referencia.current && !confirm('Descartar as alterações desta atividade?')) return
    onCancelar()
  }
  const erro = !dados.escolas.some((p) => p.id === escolaId) ? 'Selecione um projeto.'
    : !dados.equipes.some((e) => e.id === equipeId) ? 'Selecione uma equipe.'
    : !dataISOValida(inicio) || !dataISOValida(fim) ? 'Informe datas válidas de início e fim.'
    : fim < inicio ? 'A data final não pode ser anterior à inicial.'
    : ''
  const conflitos = erro ? [] : dados.atividades.filter((a) =>
    a.id !== inicial.id && a.equipeId === equipeId && sobrepoe(a, { inicio, fim }),
  )
  const equipe = dados.equipes.find((e) => e.id === equipeId)
  const disciplina = dados.disciplinas.find((d) => d.id === equipe?.disciplinaId)

  const salvar = (continuar = false) => {
    if (erro || salvo) return
    onSalvar({ id: inicial.id ?? crypto.randomUUID(), escolaId, equipeId, inicio, fim,
      titulo: titulo.trim(), descricao: descricao.trim() }, continuar)
    if (continuar) {
      setTitulo('')
      setDescricao('')
      setSalvo(true)
      referencia.current = JSON.stringify({ escolaId, equipeId, inicio, fim, titulo: '', descricao: '' })
      tituloRef.current?.focus()
    }
  }

  return (
    <dialog ref={dialogoRef} open={inline || undefined} className={inline ? 'central-formulario' : 'modal-fundo dialogo-nativo'} aria-labelledby="atividade-titulo"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar() } }}
      onCancel={(e) => { e.preventDefault(); cancelar() }}
      onClick={(e) => { if (e.target === e.currentTarget) cancelar() }}>
      <form className="modal" onSubmit={(e) => { e.preventDefault(); salvar() }} onChange={() => setSalvo(false)}>
        <div className="modal-cabecalho"><div>
          <h2 id="atividade-titulo">{edicao ? 'Editar atividade' : 'Nova atividade'}</h2>
          <p className="texto-suave">Projeto, equipe e período definem a atividade. Os demais campos são opcionais.</p>
        </div><button type="button" className="fechar-modal" onClick={cancelar} aria-label="Fechar atividade">×</button></div>
        <div className="duas-colunas">
          <label>Projeto
            <select required autoFocus={!escolaId} value={escolaId} onChange={(e) => setEscolaId(e.target.value)}>
              <option value="">Selecione…</option>
              {dados.escolas.map((p) => <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>)}
            </select>
          </label>
          <label>Equipe
            <select required autoFocus={Boolean(escolaId) && !equipeId} value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
              <option value="">Selecione…</option>
              {dados.equipes.map((q) => <option key={q.id} value={q.id}>{q.nome}</option>)}
            </select>
          </label>
        </div>
        {disciplina && <p className="texto-suave">Disciplina da equipe: <strong>{disciplina.sigla}</strong></p>}
        <label>Etapa / atividade (opcional)
          <input ref={tituloRef} autoFocus={Boolean(escolaId && equipeId)} type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Compatibilização" />
        </label>
        <div className="duas-colunas">
          <label>Início
            <input required type="date" value={inicio} onChange={(e) => { setInicio(e.target.value); if (!fim || fim < e.target.value) setFim(e.target.value) }} />
          </label>
          <label>Fim
            <input required type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} />
          </label>
        </div>
        {!erro && <p className="texto-suave">Duração: <strong>{diasCorridos(inicio, fim)} dia(s) corrido(s)</strong>. A composição da equipe é consultada automaticamente pelo período.</p>}
        <label>Descrição (opcional)
          <textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </label>
        {erro && <p className="orientacao" aria-live="polite">{erro}</p>}
        {conflitos.length > 0 && <p className="aviso">Há {conflitos.length} atividade(s) sobreposta(s) nesta equipe. Você pode salvar mesmo assim: {conflitos.map((a) => `${dados.escolas.find((p) => p.id === a.escolaId)?.codigo} (${formatarBR(a.inicio)}–${formatarBR(a.fim)})`).join(', ')}</p>}
        {salvo && <p className="sucesso" role="status">Atividade salva. Projeto, equipe e datas foram mantidos para o próximo registro.</p>}
        <div className="acoes">
          {edicao && <button type="button" className="perigo" onClick={() => { if (confirm('Excluir esta atividade?')) onExcluir(inicial.id!) }}>Excluir</button>}
          <span style={{ flex: 1 }} />
          <button type="button" onClick={cancelar}>{salvo ? 'Concluir' : 'Cancelar'}</button>
          {!edicao && <button type="button" disabled={Boolean(erro) || salvo} onClick={() => salvar(true)}>Salvar e criar outra</button>}
          <button type="submit" className="primario" disabled={Boolean(erro) || salvo}>Salvar atividade</button>
        </div>
      </form>
    </dialog>
  )
}
