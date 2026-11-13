import { useEffect, useRef, useState } from 'react'
import type { Dados, MarcoProjeto, SimboloProjeto } from '../types'
import { dataISOValida, hojeISO } from '../lib/datas'

interface Props {
  inline?: boolean
  dados: Dados
  inicial: Partial<MarcoProjeto>
  onSalvar: (marco: MarcoProjeto) => void
  onExcluir: (id: string) => void
  onCancelar: () => void
}

export function FormMarco({ dados, inicial, onSalvar, onExcluir, onCancelar, inline = false }: Props) {
  const [escolaId, setEscolaId] = useState(inicial.escolaId ?? '')
  const [data, setData] = useState(inicial.data ?? hojeISO())
  const [titulo, setTitulo] = useState(inicial.titulo ?? '')
  const [simbolo, setSimbolo] = useState<SimboloProjeto>(inicial.simbolo ?? 'losango')
  const [observacao, setObservacao] = useState(inicial.observacao ?? '')
  const edicao = Boolean(inicial.id)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const valores = JSON.stringify({ escolaId, data, titulo, observacao, simbolo })
  const referencia = useRef(valores)
  useEffect(() => {
    const dialogo = dialogoRef.current
    if (!inline) dialogo?.showModal()
    return () => { if (!inline && dialogo?.open) dialogo.close() }
  }, [])
  const cancelar = () => {
    if (valores !== referencia.current && !confirm('Descartar as alterações deste marco?')) return
    onCancelar()
  }
  const erro = !dados.escolas.some((p) => p.id === escolaId) ? 'Selecione o projeto.'
    : !titulo.trim() ? 'Informe o nome do marco.'
    : simbolo === 'generico' && !observacao.trim() ? 'Informe a descrição do marco genérico.'
    : !dataISOValida(data) ? 'Informe uma data válida.'
    : data > hojeISO() ? 'A data do marco não pode ser futura.'
    : ''

  const salvar = () => {
    if (erro) return
    onSalvar({ id: inicial.id ?? crypto.randomUUID(), escolaId, data, titulo: titulo.trim(), observacao: observacao.trim(), simbolo })
  }

  return (
    <dialog ref={dialogoRef} open={inline || undefined} className={inline ? 'central-formulario' : 'modal-fundo dialogo-nativo'} aria-labelledby="marco-titulo"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar() } }}
      onCancel={(e) => { e.preventDefault(); cancelar() }} onClick={(e) => { if (e.target === e.currentTarget) cancelar() }}>
      <form className="modal" onSubmit={(e) => { e.preventDefault(); salvar() }}>
        <div className="modal-cabecalho"><h2 id="marco-titulo">{edicao ? 'Editar marco' : 'Novo marco'}</h2><button type="button" className="fechar-modal" onClick={cancelar} aria-label="Fechar marco">×</button></div>
        <label>Projeto
          <select required autoFocus={!escolaId} value={escolaId} onChange={(e) => setEscolaId(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.escolas.map((p) => <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>)}
          </select>
        </label>
        <label>Nome do marco
          <input required autoFocus={Boolean(escolaId)} type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Projeto executivo concluído" />
        </label>
        <label>Data do marco
          <input required type="date" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <fieldset className="opcoes-simbolo"><legend>Símbolo no Gantt</legend><label><input type="radio" name="simbolo-projeto" value="losango" checked={simbolo === 'losango'} onChange={() => setSimbolo('losango')} /> <span aria-hidden="true">◆</span> Entrega</label><label><input type="radio" name="simbolo-projeto" value="circulo" checked={simbolo === 'circulo'} onChange={() => setSimbolo('circulo')} /> <span aria-hidden="true">●</span> Revisão</label><label><input type="radio" name="simbolo-projeto" value="generico" checked={simbolo === 'generico'} onChange={() => setSimbolo('generico')} /> <span aria-hidden="true">■</span> Genérico</label></fieldset>
        <label>{simbolo === 'generico' ? 'Descrição' : 'Observações (opcional)'}
          <textarea rows={3} required={simbolo === 'generico'} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: aguardando aprovação ou informação para continuar" />
        </label>
        {erro && <p className="orientacao" aria-live="polite">{erro}</p>}
        <div className="acoes">
          {edicao && <button type="button" className="perigo" onClick={() => { if (confirm('Remover este marco do projeto?')) onExcluir(inicial.id!) }}>Remover marco</button>}
          <span style={{ flex: 1 }} />
          <button type="button" onClick={cancelar}>Cancelar</button>
          <button type="submit" className="primario" disabled={Boolean(erro)}>Salvar marco</button>
        </div>
      </form>
    </dialog>
  )
}
